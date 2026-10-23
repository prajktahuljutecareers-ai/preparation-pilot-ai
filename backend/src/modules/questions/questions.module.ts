import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { QuestionsController } from './questions.controller.js';
import { QuestionsService } from './questions.service.js';
import { ReadinessService } from './readiness.service.js';

@Module({
  imports: [AiModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, ReadinessService],
  exports: [QuestionsService, ReadinessService],
})
export class QuestionsModule {}

