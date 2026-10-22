import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { IdeaPriority, IdeaStatus } from '../entities/idea.entity';

export class CreateIdeaDto {
  @IsString()
  @MinLength(3)
  title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() problem?: string;
  @IsOptional() @IsString() targetAudience?: string;
  @IsOptional() @IsEnum(IdeaStatus) status?: IdeaStatus;
  @IsOptional() @IsEnum(IdeaPriority) priority?: IdeaPriority;
  @IsOptional() @IsBoolean() focus?: boolean;
  @IsOptional() @IsString() nextAction?: string;
}
