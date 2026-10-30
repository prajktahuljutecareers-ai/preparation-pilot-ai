import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SkillsService } from './skills.service.js';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { ExtractResumeDto } from './dto/extract-resume.dto.js';
import { BulkCreateSkillsDto } from './dto/bulk-create-skills.dto.js';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post('extract-from-resume')
  @HttpCode(HttpStatus.OK)
  extractFromResume(@Body() dto: ExtractResumeDto) {
    return this.skillsService.extractFromResume(dto.resumeText);
  }

  @Post('bulk-import')
  @HttpCode(HttpStatus.CREATED)
  bulkImport(@Body() dto: BulkCreateSkillsDto) {
    return this.skillsService.bulkImport(dto.skills);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSkillDto) {
    return this.skillsService.create(dto);
  }

  @Get()
  findAll(@Query('category') category?: string) {
    return this.skillsService.findAll(category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skillsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.skillsService.remove(id);
  }
}
