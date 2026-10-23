import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { InterviewStatus, RoundType } from '@prisma/client';

export class CreateInterviewDto {
  @IsString()
  @IsNotEmpty({ message: 'Company name is required (e.g. Stripe, Google)' })
  company: string;

  @IsString()
  @IsNotEmpty({ message: 'Role title is required (e.g. Senior Backend Engineer)' })
  role: string;

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
  scheduledAt: string;

  @IsString()
  @IsNotEmpty({
    message:
      'Job description text is required so the AI can analyze role expectations.',
  })
  jobDescriptionText: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

