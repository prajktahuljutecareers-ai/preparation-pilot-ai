import { IsEnum, IsOptional, IsString } from 'class-validator';
import { QuestionStatus } from '@prisma/client';

export class UpdateQuestionDto {
  @IsEnum(QuestionStatus, {
    message: 'status must be UNPREPARED, DRAFTED, or MASTERED',
  })
  @IsOptional()
  status?: QuestionStatus;

  @IsString()
  @IsOptional()
  candidateNotes?: string;
}

