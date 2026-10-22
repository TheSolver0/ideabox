import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import {
  HistoryAction,
  HistoryEntityType,
} from '../history/entities/history-entry.entity';
import { buildChanges, recordHistory } from '../history/history.utils';
import { Idea } from '../ideas/entities/idea.entity';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { UpdateAnalysisDto } from './dto/update-analysis.dto';
import { Analysis } from './entities/analysis.entity';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(Analysis) private readonly notes: Repository<Analysis>,
    private readonly dataSource: DataSource,
  ) {}

  async create(ownerId: number, dto: CreateAnalysisDto): Promise<Analysis> {
    return this.dataSource.transaction(async (manager) => {
      const idea = await manager
        .getRepository(Idea)
        .findOneBy({ id: dto.ideaId, ownerId });
      if (!idea) throw new NotFoundException(`Idée #${dto.ideaId} non trouvée`);
      const note = await manager.getRepository(Analysis).save(
        manager.getRepository(Analysis).create({
          ownerId,
          ideaId: dto.ideaId,
          title: dto.title.trim(),
          content: dto.content,
          archivedAt: null,
        }),
      );
      await recordHistory(manager, {
        ownerId,
        entityType: HistoryEntityType.NOTE,
        entityId: note.id,
        ideaId: note.ideaId,
        action: HistoryAction.CREATED,
        changes: {
          note: {
            old: null,
            new: { title: note.title, content: note.content },
          },
        },
      });
      return note;
    });
  }

  findAllByIdeaId(
    ownerId: number,
    ideaId: number,
    includeArchived = false,
  ): Promise<Analysis[]> {
    return this.notes.find({
      where: {
        ownerId,
        ideaId,
        ...(includeArchived ? {} : { archivedAt: IsNull() }),
      },
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    ownerId: number,
    id: number,
    dto: UpdateAnalysisDto,
  ): Promise<Analysis> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Analysis);
      const note = await repo.findOneBy({ id, ownerId });
      if (!note) throw new NotFoundException(`Note #${id} non trouvée`);
      const updates: Partial<Analysis> = { ...dto };
      if (dto.title !== undefined) updates.title = dto.title.trim();
      const changes = buildChanges(note, updates);
      if (Object.keys(changes).length === 0) return note;
      Object.assign(note, updates);
      const saved = await repo.save(note);
      await recordHistory(manager, {
        ownerId,
        entityType: HistoryEntityType.NOTE,
        entityId: id,
        ideaId: note.ideaId,
        action: HistoryAction.UPDATED,
        changes,
      });
      return saved;
    });
  }

  async archive(ownerId: number, id: number): Promise<Analysis> {
    return this.setArchived(ownerId, id, true);
  }

  async restore(ownerId: number, id: number): Promise<Analysis> {
    return this.setArchived(ownerId, id, false);
  }

  private async setArchived(
    ownerId: number,
    id: number,
    archived: boolean,
  ): Promise<Analysis> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Analysis);
      const note = await repo.findOneBy({ id, ownerId });
      if (!note) throw new NotFoundException(`Note #${id} non trouvée`);
      const old = note.archivedAt;
      note.archivedAt = archived ? new Date() : null;
      const saved = await repo.save(note);
      await recordHistory(manager, {
        ownerId,
        entityType: HistoryEntityType.NOTE,
        entityId: id,
        ideaId: note.ideaId,
        action: archived ? HistoryAction.ARCHIVED : HistoryAction.RESTORED,
        changes: { archivedAt: { old, new: note.archivedAt } },
      });
      return saved;
    });
  }
}
