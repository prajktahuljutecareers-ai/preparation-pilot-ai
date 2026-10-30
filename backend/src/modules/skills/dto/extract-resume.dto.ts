import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ExtractResumeDto {
  @IsString()
  @IsNotEmpty({ message: 'Resume text is required' })
  @MinLength(50, {
    message: 'Resume text must be at least 50 characters to perform analysis.',
  })
  resumeText: string;
}

