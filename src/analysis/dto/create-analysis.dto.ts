import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAnalysisDto {
  @IsNotEmpty()
  @IsNumber()
  ideaId: number;

  @IsOptional()
  @IsString()
  problem?: string;

  @IsOptional()
  @IsString()
  solution?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  feasibility?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  viabilityScore?: number;
}