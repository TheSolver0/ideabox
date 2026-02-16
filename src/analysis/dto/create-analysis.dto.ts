import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAnalysisDto {
  @IsNotEmpty()
  @IsNumber()
  ideaId: number;

  @IsNotEmpty()
  @IsString()
  axisName: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  score?: number;
}