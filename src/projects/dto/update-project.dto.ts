import { IsEnum } from 'class-validator';
import { ProjectStatus } from '../entities/project.entity';

export class UpdateProjectDto {
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}