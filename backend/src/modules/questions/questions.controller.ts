import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { QuestionsService } from './questions.service.js';
import { UpdateQuestionDto } from './dto/update-question.dto.js';
import { UpdateChecklistDto } from './dto/update-checklist.dto.js';

@Controller('interviews/:id')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('generate-questions')
  @HttpCode(HttpStatus.OK)
  generateQuestions(@Param('id') id: string) {
    return this.questionsService.generateQuestionsForInterview(id);
  }

  @Get('questions')
  getQuestions(@Param('id') id: string) {
    return this.questionsService.getQuestions(id);
  }

  @Patch('questions/:questionId')
  updateQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.updateQuestion(id, questionId, dto);
  }

  @Patch('checklist/:itemId')
  toggleChecklistItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistDto,
  ) {
    return this.questionsService.toggleChecklistItem(id, itemId, dto);
  }

  @Get('readiness')
  getReadiness(@Param('id') id: string) {
    return this.questionsService.getReadiness(id);
  }
}

