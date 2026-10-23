import { Injectable, NotFoundException } from '@nestjs/common';
import { InterviewStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateInterviewDto } from './dto/create-interview.dto.js';
import { UpdateInterviewDto } from './dto/update-interview.dto.js';

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInterviewDto) {
    const interview = await this.prisma.interview.create({
      data: {
        company: dto.company,
        role: dto.role,
        roundType: dto.roundType,
        status: dto.status,
        scheduledAt: new Date(dto.scheduledAt),
        jobDescriptionText: dto.jobDescriptionText,
        notes: dto.notes,
        // Pre-populate core preparation checklist items for every new interview
        checklistItems: {
          create: [
            { label: 'Research company background, product, and tech blog' },
            { label: 'Prepare 3–5 reverse questions for the interviewer' },
            { label: 'Review past projects using STAR method (Situation, Task, Action, Result)' },
            { label: 'Review identified skill gaps and practice sample questions' },
          ],
        },
      },
      include: {
        checklistItems: true,
      },
    });

    return interview;
  }

  async findAll(status?: InterviewStatus) {
    return this.prisma.interview.findMany({
      where: status ? { status } : undefined,
      orderBy: { scheduledAt: 'asc' },
      include: {
        _count: {
          select: {
            assessments: true,
            questions: true,
            checklistItems: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: {
        assessments: {
          orderBy: { createdAt: 'asc' },
        },
        questions: {
          orderBy: { createdAt: 'asc' },
        },
        checklistItems: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID "${id}" was not found.`);
    }

    return interview;
  }

  async update(id: string, dto: UpdateInterviewDto) {
    await this.findOne(id);

    return this.prisma.interview.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.interview.delete({
      where: { id },
    });
  }
}

