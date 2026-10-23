import { Injectable } from '@nestjs/common';
import { QuestionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface ReadinessScoreResult {
  readinessScore: number;
  totalQuestions: number;
  masteredQuestions: number;
  draftedQuestions: number;
  unpreparedQuestions: number;
  totalChecklistItems: number;
  completedChecklistItems: number;
}

@Injectable()
export class ReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateAndSync(interviewId: string): Promise<ReadinessScoreResult> {
    const questions = await this.prisma.practiceQuestion.findMany({
      where: { interviewId },
    });

    const checklistItems = await this.prisma.checklistItem.findMany({
      where: { interviewId },
    });

    const totalQuestions = questions.length;
    const masteredQuestions = questions.filter(
      (q) => q.status === QuestionStatus.MASTERED,
    ).length;
    const draftedQuestions = questions.filter(
      (q) => q.status === QuestionStatus.DRAFTED,
    ).length;
    const unpreparedQuestions = questions.filter(
      (q) => q.status === QuestionStatus.UNPREPARED,
    ).length;

    const totalChecklistItems = checklistItems.length;
    const completedChecklistItems = checklistItems.filter(
      (c) => c.isCompleted,
    ).length;

    // Deterministic calculation:
    // 70% weight for questions (Mastered = 100%, Drafted = 50% credit)
    // 30% weight for preparation checklist completion
    let score = 0;

    if (totalQuestions > 0 && totalChecklistItems > 0) {
      const questionProgress =
        (masteredQuestions * 1.0 + draftedQuestions * 0.5) / totalQuestions;
      const checklistProgress = completedChecklistItems / totalChecklistItems;
      score = Math.round(questionProgress * 70 + checklistProgress * 30);
    } else if (totalQuestions > 0) {
      const questionProgress =
        (masteredQuestions * 1.0 + draftedQuestions * 0.5) / totalQuestions;
      score = Math.round(questionProgress * 100);
    } else if (totalChecklistItems > 0) {
      const checklistProgress = completedChecklistItems / totalChecklistItems;
      score = Math.round(checklistProgress * 100);
    }

    const readinessScore = Math.min(100, Math.max(0, score));

    // Persist calculated score in Interview entity
    await this.prisma.interview.update({
      where: { id: interviewId },
      data: { readinessScore },
    });

    return {
      readinessScore,
      totalQuestions,
      masteredQuestions,
      draftedQuestions,
      unpreparedQuestions,
      totalChecklistItems,
      completedChecklistItems,
    };
  }
}

