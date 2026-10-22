import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoryEntry } from './entities/history-entry.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoryEntry)
    private readonly history: Repository<HistoryEntry>,
  ) {}

  findForIdea(ownerId: number, ideaId: number) {
    return this.history.find({
      where: { ownerId, ideaId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }
}
