import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SkillAssessmentLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { ReadinessService } from './readiness.service.js';
import { UpdateQuestionDto } from './dto/update-question.dto.js';
import { UpdateChecklistDto } from './dto/update-checklist.dto.js';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly readinessService: ReadinessService,
  ) {}

  async generateQuestionsForInterview(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: { assessments: true },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID "${interviewId}" was not found.`);
    }

    // Extract verified gaps and strengths
    const verifiedGaps = interview.assessments.filter(
      (a) =>
        a.verifiedLevel === SkillAssessmentLevel.CRITICAL_GAP ||
        a.verifiedLevel === SkillAssessmentLevel.MINOR_GAP,
    );

    const verifiedStrengths = interview.assessments.filter(
      (a) => a.verifiedLevel === SkillAssessmentLevel.STRENGTH,
    );

    if (interview.assessments.length === 0) {
      throw new BadRequestException(
        'Please run skill-gap analysis before generating targeted questions.',
      );
    }

    // Call Gemini with round type & verified gaps
    const generated = await this.aiService.generatePracticeQuestions(
      interview.company,
      interview.role,
      interview.roundType,
      verifiedGaps.map((g) => ({
        skillName: g.skillName,
        jdRequirementText: g.jdRequirementText,
        aiRationale: g.aiRationale,
      })),
      verifiedStrengths.map((s) => ({
        skillName: s.skillName,
      })),
    );

    // Clear old questions on fresh generation
    await this.prisma.practiceQuestion.deleteMany({
      where: { interviewId },
    });

    // Save generated questions
    const createdQuestions = await Promise.all(
      generated.map((q) =>
        this.prisma.practiceQuestion.create({
          data: {
            interviewId,
            questionText: q.questionText,
            targetedSkill: q.targetedSkill,
            sampleTalkingPoints: q.sampleTalkingPoints,
          },
        }),
      ),
    );

    // Recompute readiness deterministically
    const readiness = await this.readinessService.calculateAndSync(interviewId);

    return {
      questions: createdQuestions,
      readiness,
    };
  }

  async getQuestions(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID "${interviewId}" was not found.`);
    }

    return this.prisma.practiceQuestion.findMany({
      where: { interviewId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateQuestion(
    interviewId: string,
    questionId: string,
    dto: UpdateQuestionDto,
  ) {
    const question = await this.prisma.practiceQuestion.findFirst({
      where: { id: questionId, interviewId },
    });

    if (!question) {
      throw new NotFoundException(
        `Question with ID "${questionId}" was not found for this interview.`,
      );
    }

    const updated = await this.prisma.practiceQuestion.update({
      where: { id: questionId },
      data: dto,
    });

    // Recompute readiness score deterministically
    const readiness = await this.readinessService.calculateAndSync(interviewId);

    return {
      question: updated,
      readiness,
    };
  }

  async toggleChecklistItem(
    interviewId: string,
    itemId: string,
    dto: UpdateChecklistDto,
  ) {
    const item = await this.prisma.checklistItem.findFirst({
      where: { id: itemId, interviewId },
    });

    if (!item) {
      throw new NotFoundException(
        `Checklist item with ID "${itemId}" was not found for this interview.`,
      );
    }

    const updated = await this.prisma.checklistItem.update({
      where: { id: itemId },
      data: dto,
    });

    // Recompute readiness score deterministically
    const readiness = await this.readinessService.calculateAndSync(interviewId);

    return {
      checklistItem: updated,
      readiness,
    };
  }

  async getReadiness(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID "${interviewId}" was not found.`);
    }

    return this.readinessService.calculateAndSync(interviewId);
  }
}

