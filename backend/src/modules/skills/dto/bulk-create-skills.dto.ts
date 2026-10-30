import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateSkillDto } from './create-skill.dto.js';

export class BulkCreateSkillsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one skill must be provided for import.' })
  @ValidateNested({ each: true })
  @Type(() => CreateSkillDto)
  skills: CreateSkillDto[];
}

