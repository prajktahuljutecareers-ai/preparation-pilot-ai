import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { AnalysisController } from './analysis.controller.js';
import { AnalysisService } from './analysis.service.js';

@Module({
  imports: [AiModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}

