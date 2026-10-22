import { IsInt, IsString, MinLength } from 'class-validator';

export class CreateAnalysisDto {
  @IsInt() ideaId: number;
  @IsString() @MinLength(1) title: string;
  @IsString() @MinLength(1) content: string;
}
