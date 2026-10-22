import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  HistoryAction,
  HistoryEntityType,
} from '../history/entities/history-entry.entity';
import { buildChanges, recordHistory } from '../history/history.utils';
import { Idea } from '../ideas/entities/idea.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectStatus } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    private readonly dataSource: DataSource,
  ) {}

  async create(ownerId: number, dto: CreateProjectDto): Promise<Project> {
    const id = await this.dataSource.transaction(async (manager) => {
      const ideaIds = [...new Set(dto.ideaIds ?? [])];
      const ideas = ideaIds.length
        ? await manager.getRepository(Idea).findBy({ id: In(ideaIds), ownerId })
        : [];
      if (ideas.length !== ideaIds.length)
        throw new NotFoundException('Une ou plusieurs idées sont introuvables');
      if (ideas.some((idea) => idea.projectId !== null)) {
        throw new ConflictException(
          'Une idée sélectionnée est déjà associée à un projet',
        );
      }
      const project = await manager.getRepository(Project).save(
        manager.getRepository(Project).create({
          ownerId,
          title: dto.title.trim(),
          description: dto.description ?? '',
          status: dto.status ?? ProjectStatus.PREVU,
          nextAction: dto.nextAction ?? '',
          isCommercialized: dto.isCommercialized ?? false,
        }),
      );
      await recordHistory(manager, {
        ownerId,
        entityType: HistoryEntityType.PROJECT,
        entityId: project.id,
        projectId: project.id,
        action: HistoryAction.CREATED,
        changes: { project: { old: null, new: this.snapshot(project) } },
      });
      for (const idea of ideas) {
        idea.projectId = project.id;
        await manager.save(idea);
        await recordHistory(manager, {
          ownerId,
          entityType: HistoryEntityType.IDEA,
          entityId: idea.id,
          ideaId: idea.id,
          projectId: project.id,
          action: HistoryAction.ASSOCIATED,
          changes: { projectId: { old: null, new: project.id } },
        });
      }
      return project.id;
    });
    return this.findOne(ownerId, id);
  }

  findAll(ownerId: number): Promise<Project[]> {
    return this.projects.find({
      where: { ownerId },
      relations: ['ideas'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(ownerId: number, id: number): Promise<Project> {
    const project = await this.projects.findOne({
      where: { id, ownerId },
      relations: ['ideas'],
    });
    if (!project) throw new NotFoundException(`Projet #${id} non trouvé`);
    return project;
  }

  async update(
    ownerId: number,
    id: number,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Project);
      const project = await repo.findOneBy({ id, ownerId });
      if (!project) throw new NotFoundException(`Projet #${id} non trouvé`);
      const updates: Partial<Project> = { ...dto };
      if (dto.title !== undefined) updates.title = dto.title.trim();
      const changes = buildChanges(project, updates);
      if (Object.keys(changes).length === 0) return;
      Object.assign(project, updates);
      await repo.save(project);
      await recordHistory(manager, {
        ownerId,
        entityType: HistoryEntityType.PROJECT,
        entityId: id,
        projectId: id,
        action: HistoryAction.UPDATED,
        changes,
      });
    });
    return this.findOne(ownerId, id);
  }

  abandon(ownerId: number, id: number) {
    return this.update(ownerId, id, { status: ProjectStatus.ABANDONNE });
  }

  private snapshot(project: Project) {
    return {
      title: project.title,
      description: project.description,
      status: project.status,
      nextAction: project.nextAction,
      isCommercialized: project.isCommercialized,
    };
  }
}
