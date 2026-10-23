import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SkillAssessmentLevel } from '@prisma/client';

export class UpdateAssessmentDto {
  @IsEnum(SkillAssessmentLevel, {
    message: 'verifiedLevel must be STRENGTH, MINOR_GAP, or CRITICAL_GAP',
  })
  @IsOptional()
  verifiedLevel?: SkillAssessmentLevel;

  @IsString()
  @IsOptional()
  userNotes?: string;
}

