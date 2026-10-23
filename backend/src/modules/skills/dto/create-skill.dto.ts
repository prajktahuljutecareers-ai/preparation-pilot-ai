import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProficiencyLevel } from '@prisma/client';

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty({ message: 'Skill name is required (e.g. NestJS, PostgreSQL)' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Category is required (e.g. Backend, Database, Cloud)' })
  category: string;

  @IsEnum(ProficiencyLevel, {
    message: 'Proficiency level must be BEGINNER, INTERMEDIATE, or ADVANCED',
  })
  @IsOptional()
  proficiencyLevel?: ProficiencyLevel;

  @IsString()
  @IsNotEmpty({
    message:
      'Evidence notes are required. Provide concrete examples of production use vs tutorial knowledge.',
  })
  evidenceNotes: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  yearsExperience?: number;
}

