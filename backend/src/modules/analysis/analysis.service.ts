import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SkillAssessmentLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { UpdateAssessmentDto } from './dto/update-assessment.dto.js';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async analyzeInterview(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID "${interviewId}" was not found.`);
    }

    if (!interview.jobDescriptionText || interview.jobDescriptionText.trim().length === 0) {
      throw new BadRequestException(
        'Interview does not have Job Description text to analyze.',
      );
    }

    const candidateSkills = await this.prisma.userSkill.findMany({
      orderBy: { name: 'asc' },
    });

    // Run Gemini evidence-backed gap detection
    const aiResults = await this.aiService.analyzeSkillGaps(
      interview.jobDescriptionText,
      candidateSkills.map((s) => ({
        name: s.name,
        category: s.category,
        proficiencyLevel: s.proficiencyLevel,
        evidenceNotes: s.evidenceNotes,
      })),
    );

    // Delete existing assessments for this interview to avoid duplicates on re-analysis
    await this.prisma.interviewSkillAssessment.deleteMany({
      where: { interviewId },
    });

    // Persist new assessments with initial verifiedLevel = suggestedLevel
    const createdAssessments = await Promise.all(
      aiResults.map((item) =>
        this.prisma.interviewSkillAssessment.create({
          data: {
            interviewId,
            skillName: item.skillName,
            jdRequirementText: item.jdRequirementText,
            aiRationale: item.aiRationale,
            suggestedLevel: item.suggestedLevel as SkillAssessmentLevel,
            verifiedLevel: item.suggestedLevel as SkillAssessmentLevel,
          },
        }),
      ),
    );

    return createdAssessments;
  }

  async getAssessments(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID "${interviewId}" was not found.`);
    }

    return this.prisma.interviewSkillAssessment.findMany({
      where: { interviewId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateAssessment(
    interviewId: string,
    assessmentId: string,
    dto: UpdateAssessmentDto,
  ) {
    const assessment = await this.prisma.interviewSkillAssessment.findFirst({
      where: { id: assessmentId, interviewId },
    });

    if (!assessment) {
      throw new NotFoundException(
        `Assessment with ID "${assessmentId}" does not exist for interview "${interviewId}".`,
      );
    }

    return this.prisma.interviewSkillAssessment.update({
      where: { id: assessmentId },
      data: {
        verifiedLevel: dto.verifiedLevel,
        userNotes: dto.userNotes,
      },
    });
  }
}

