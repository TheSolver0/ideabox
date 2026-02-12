import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { Analysis } from './entities/analysis.entity';
import { IdeasModule } from '../ideas/ideas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Analysis]),
    IdeasModule
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}