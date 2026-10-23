import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProficiencyLevel } from '@prisma/client';

export class UpdateSkillDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(ProficiencyLevel, {
    message: 'Proficiency level must be BEGINNER, INTERMEDIATE, or ADVANCED',
  })
  @IsOptional()
  proficiencyLevel?: ProficiencyLevel;

  @IsString()
  @IsOptional()
  evidenceNotes?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  yearsExperience?: number;
}

