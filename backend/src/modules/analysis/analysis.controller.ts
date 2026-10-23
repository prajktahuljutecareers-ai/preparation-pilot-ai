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
import { AnalysisService } from './analysis.service.js';
import { UpdateAssessmentDto } from './dto/update-assessment.dto.js';

@Controller('interviews/:id')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  analyzeInterview(@Param('id') id: string) {
    return this.analysisService.analyzeInterview(id);
  }

  @Get('assessments')
  getAssessments(@Param('id') id: string) {
    return this.analysisService.getAssessments(id);
  }

  @Patch('assessments/:assessmentId')
  updateAssessment(
    @Param('id') id: string,
    @Param('assessmentId') assessmentId: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.analysisService.updateAssessment(id, assessmentId, dto);
  }
}

