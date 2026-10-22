import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ProjectStatus } from '../entities/project.entity';

export class CreateProjectDto {
  @IsString() @MinLength(3) title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @IsString() nextAction?: string;
  @IsOptional() @IsBoolean() isCommercialized?: boolean;
  @IsOptional() @IsArray() @IsInt({ each: true }) ideaIds?: number[];
}
