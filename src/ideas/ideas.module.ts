import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { HistoryModule } from '../history/history.module';
import { Idea } from './entities/idea.entity';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Idea]), AuthModule, HistoryModule],
  controllers: [IdeasController],
  providers: [IdeasService],
  exports: [TypeOrmModule],
})
export class IdeasModule {}
