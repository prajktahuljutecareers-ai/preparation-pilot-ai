import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSkillDto) {
    const existing = await this.prisma.userSkill.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Skill "${dto.name}" already exists in your profile. Update it instead.`,
      );
    }

    return this.prisma.userSkill.create({
      data: {
        name: dto.name,
        category: dto.category,
        proficiencyLevel: dto.proficiencyLevel,
        evidenceNotes: dto.evidenceNotes,
        yearsExperience: dto.yearsExperience,
      },
    });
  }

  async findAll(category?: string) {
    return this.prisma.userSkill.findMany({
      where: category ? { category: { equals: category, mode: 'insensitive' } } : undefined,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const skill = await this.prisma.userSkill.findUnique({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException(`Skill with ID "${id}" was not found.`);
    }

    return skill;
  }

  async update(id: string, dto: UpdateSkillDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.userSkill.findUnique({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Another skill with the name "${dto.name}" already exists.`,
        );
      }
    }

    return this.prisma.userSkill.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.userSkill.delete({
      where: { id },
    });
  }
}

