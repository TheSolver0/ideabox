import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IdeaStatus } from '../entities/idea.entity';

export class UpdateIdeaDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IdeaStatus)
  status?: IdeaStatus;
}