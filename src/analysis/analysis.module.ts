import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { Analysis } from './entities/analysis.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Analysis]), AuthModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
