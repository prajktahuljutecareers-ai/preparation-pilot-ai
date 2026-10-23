import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { InterviewStatus, RoundType } from '@prisma/client';

export class UpdateInterviewDto {
  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsEnum(RoundType, {
    message:
      'Round type must be SCREENING, TECHNICAL, SYSTEM_DESIGN, BEHAVIORAL, or OTHER',
  })
  @IsOptional()
  roundType?: RoundType;

  @IsEnum(InterviewStatus, {
    message: 'Status must be UPCOMING, COMPLETED, or ARCHIVED',
  })
  @IsOptional()
  status?: InterviewStatus;

  @IsDateString(
    {},
    {
      message:
        'scheduledAt must be a valid ISO 8601 date string (e.g. 2026-11-01T14:00:00Z)',
    },
  )
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  jobDescriptionText?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

