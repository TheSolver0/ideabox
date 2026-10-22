import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryEntry } from './entities/history-entry.entity';
import { HistoryService } from './history.service';

@Module({
  imports: [TypeOrmModule.forFeature([HistoryEntry])],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
