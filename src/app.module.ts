import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisModule } from './analysis/analysis.module';
import { PersonalWorkflow1760918400000 } from './database/migrations/1760918400000-PersonalWorkflow';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HistoryModule } from './history/history.module';
import { IdeasModule } from './ideas/ideas.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqlite' as const,
        database: process.env.IDEABOX_DB_PATH || 'db/db.sqlite',
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
        migrations: [PersonalWorkflow1760918400000],
      }),
    }),
    AuthModule,
    HistoryModule,
    IdeasModule,
    AnalysisModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
