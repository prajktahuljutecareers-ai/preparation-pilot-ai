import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SkillsModule } from './modules/skills/skills.module.js';
import { InterviewsModule } from './modules/interviews/interviews.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { AnalysisModule } from './modules/analysis/analysis.module.js';
import { QuestionsModule } from './modules/questions/questions.module.js';

@Module({
  imports: [
    PrismaModule,
    SkillsModule,
    InterviewsModule,
    AiModule,
    AnalysisModule,
    QuestionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
