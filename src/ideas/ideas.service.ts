import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  HistoryAction,
  HistoryEntityType,
} from '../history/entities/history-entry.entity';
import { buildChanges, recordHistory } from '../history/history.utils';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { CreateProjectFromIdeaDto } from './dto/create-project-from-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { Idea, IdeaPriority, IdeaStatus } from './entities/idea.entity';

export interface IdeaFilters {
  search?: string;
  status?: IdeaStatus;
  priority?: IdeaPriority;
  focus?: boolean;
  includeArchived?: boolean;
}

@Injectable()
export class IdeasService {
  constructor(
    @InjectRepository(Idea) private readonly ideas: Repository<Idea>,
    private readonly dataSource: DataSource,
  ) {}

  async create(ownerId: number, dto: CreateIdeaDto): Promise<Idea> {
    const id = await this.dataSource.transaction(async (manager) => {
      if (dto.focus) await this.assertFocusAvailable(manager, ownerId);
      const idea = manager.getRepository(Idea).create({
        ownerId,
        title: dto.title.trim(),
        description: dto.description ?? '',
        problem: dto.problem ?? '',
        targetAudience: dto.targetAudience ?? '',
        status: dto.status ?? IdeaStatus.CAPTUREE,
        priority: dto.priority ?? IdeaPriority.MOYENNE,
        focus:
          dto.status === IdeaStatus.ARCHIVEE ? false : (dto.focus ?? false),
        nextAction: dto.nextAction ?? '',
        source: '',
        statusBeforeArchive:
          dto.status === IdeaStatus.ARCHIVEE ? IdeaStatus.CAPTUREE : null,
        projectId: null,
      });
      const saved = await manager.save(idea);
      await recordHistory(manager, {
        ownerId,
        entityType: HistoryEntityType.IDEA,
        entityId: saved.id,
        ideaId: saved.id,
        action: HistoryAction.CREATED,
        changes: { idea: { old: null, new: this.snapshot(saved) } },
      });
      return saved.id;
    });
    return this.findOne(ownerId, id);
  }

  async findAll(ownerId: number, filters: IdeaFilters = {}): Promise<Idea[]> {
    const query = this.ideas
      .createQueryBuilder('idea')
      .leftJoinAndSelect('idea.project', 'project')
      .where('idea.ownerId = :ownerId', { ownerId })
      .orderBy('idea.focus', 'DESC')
      .addOrderBy('idea.updatedAt', 'DESC');
    if (!filters.includeArchived)
      query.andWhere('idea.status != :archived', {
        archived: IdeaStatus.ARCHIVEE,
      });
    if (filters.status)
      query.andWhere('idea.status = :status', { status: filters.status });
    if (filters.priority)
      query.andWhere('idea.priority = :priority', {
        priority: filters.priority,
      });
    if (filters.focus !== undefined)
      query.andWhere('idea.focus = :focus', { focus: filters.focus });
    if (filters.search) {
      query.andWhere(
        '(LOWER(idea.title) LIKE :search OR LOWER(idea.description) LIKE :search)',
        {
          search: `%${filters.search.toLowerCase()}%`,
        },
      );
    }
    return query.getMany();
  }

  async findOne(ownerId: number, id: number): Promise<Idea> {
    const idea = await this.ideas
      .createQueryBuilder('idea')
      .leftJoinAndSelect('idea.project', 'project')
      .leftJoinAndSelect(
        'idea.analysis',
        'analysis',
        'analysis.archivedAt IS NULL',
      )
      .where('idea.id = :id AND idea.ownerId = :ownerId', { id, ownerId })
      .orderBy('analysis.createdAt', 'ASC')
      .getOne();
    if (!idea) throw new NotFoundException(`Idée #${id} non trouvée`);
    return idea;
  }

  async update(ownerId: number, id: number, dto: UpdateIdeaDto): Promise<Idea> {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Idea);
      const idea = await repo.findOneBy({ id, ownerId });
      if (!idea) throw new NotFoundException(`Idée #${id} non trouvée`);
      if (dto.projectId !== undefined && dto.projectId !== null) {
        const project = await manager
          .getRepository(Project)
          .findOneBy({ id: dto.projectId, ownerId });
        if (!project)
          throw new NotFoundException(`Projet #${dto.projectId} non trouvé`);
      }
      if (dto.focus === true && !idea.focus)
        await this.assertFocusAvailable(manager, ownerId);

      const updates: Partial<Idea> = { ...dto };
      if (dto.title !== undefined) updates.title = dto.title.trim();
      if (
        dto.status === IdeaStatus.ARCHIVEE &&
        idea.status !== IdeaStatus.ARCHIVEE
      ) {
        updates.statusBeforeArchive = idea.status;
        updates.focus = false;
      }
      if (idea.status === IdeaStatus.ARCHIVEE && dto.focus === true) {
        throw new ConflictException(
          'Une idée archivée ne peut pas être en Focus',
        );
      }
      const changes = buildChanges(idea, updates);
      if (Object.keys(changes).length === 0) return;
      Object.assign(idea, updates);
      await repo.save(idea);
      await recordHistory(manager, {
        ownerId,
        entityType: HistoryEntityType.IDEA,
        entityId: id,
        ideaId: id,
        projectId: idea.projectId,
        action:
          dto.status === IdeaStatus.ARCHIVEE
            ? HistoryAction.ARCHIVED
            : HistoryAction.UPDATED,
        changes,
      });
      if (dto.projectId !== undefined && changes.projectId) {
        await recordHistory(manager, {
          ownerId,
          entityType: HistoryEntityType.IDEA,
          entityId: id,
          ideaId: id,
          projectId: dto.projectId,
          action:
            dto.projectId === null
              ? HistoryAction.DISSOCIATED
              : HistoryAction.ASSOCIATED,
          changes: { projectId: changes.projectId },
        });
      }
    });
    return this.findOne(ownerId, id);
  }

  archive(ownerId: number, id: number) {
    return this.update(ownerId, id, { status: IdeaStatus.ARCHIVEE });
  }

  async restore(ownerId: number, id: number): Promise<Idea> {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Idea);
      const idea = await repo.findOneBy({ id, ownerId });
      if (!idea) throw new NotFoundException(`Idée #${id} non trouvée`);
      if (idea.status !== IdeaStatus.ARCHIVEE) return;
      const restoredStatus = idea.statusBeforeArchive ?? IdeaStatus.CAPTUREE;
      const changes = {
        status: { old: idea.status, new: restoredStatus },
        statusBeforeArchive: { old: idea.statusBeforeArchive, new: null },
      };
      idea.status = restoredStatus;
      idea.statusBeforeArchive = null;
      await repo.save(idea);
      await recordHistory(manager, {
        ownerId,
        entityType: HistoryEntityType.IDEA,
        entityId: id,
        ideaId: id,
        action: HistoryAction.RESTORED,
        changes,
      });
    });
    return this.findOne(ownerId, id);
  }

  async createProject(
    ownerId: number,
    id: number,
    dto: CreateProjectFromIdeaDto,
  ): Promise<Project> {
    return this.dataSource.transaction(async (manager) => {
      const ideaRepo = manager.getRepository(Idea);
      const idea = await ideaRepo.findOneBy({ id, ownerId });
      if (!idea) throw new NotFoundException(`Idée #${id} non trouvée`);
      if (idea.projectId)
        throw new ConflictException('Cette idée est déjà associée à un projet');
      const project = await manager.getRepository(Project).save(
        manager.getRepository(Project).create({
          ownerId,
          title: (dto.title ?? idea.title).trim(),
          description: dto.description ?? idea.description,
          status: ProjectStatus.PREVU,
          nextAction: idea.nextAction,
          isCommercialized: false,
        }),
      );
      idea.projectId = project.id;
      await ideaRepo.save(idea);
      await recordHistory(manager, {
        ownerId,
        entityType: HistoryEntityType.PROJECT,
        entityId: project.id,
        ideaId: id,
        projectId: project.id,
        action: HistoryAction.CREATED,
        changes: {
          project: {
            old: null,
            new: { title: project.title, status: project.status },
          },
        },
      });
      await recordHistory(manager, {
        ownerId,
        entityType: HistoryEntityType.IDEA,
        entityId: id,
        ideaId: id,
        projectId: project.id,
        action: HistoryAction.ASSOCIATED,
        changes: { projectId: { old: null, new: project.id } },
      });
      return project;
    });
  }

  private async assertFocusAvailable(manager: EntityManager, ownerId: number) {
    const count = await manager
      .getRepository(Idea)
      .countBy({ ownerId, focus: true });
    if (count >= 3)
      throw new ConflictException('Le Focus est limité à 3 idées');
  }

  private snapshot(idea: Idea) {
    return {
      title: idea.title,
      description: idea.description,
      problem: idea.problem,
      targetAudience: idea.targetAudience,
      status: idea.status,
      priority: idea.priority,
      focus: idea.focus,
      nextAction: idea.nextAction,
      projectId: idea.projectId,
    };
  }
}
