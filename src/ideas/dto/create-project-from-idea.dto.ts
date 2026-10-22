import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProjectFromIdeaDto {
  @IsOptional() @IsString() @MinLength(3) title?: string;
  @IsOptional() @IsString() description?: string;
}
