import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateIdeaDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  description: string;
}