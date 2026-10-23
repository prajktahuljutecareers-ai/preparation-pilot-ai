-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('SCREENING', 'TECHNICAL', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'OTHER');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('UPCOMING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SkillAssessmentLevel" AS ENUM ('STRENGTH', 'MINOR_GAP', 'CRITICAL_GAP');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('UNPREPARED', 'DRAFTED', 'MASTERED');

-- CreateTable
CREATE TABLE "user_skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "proficiencyLevel" "ProficiencyLevel" NOT NULL DEFAULT 'INTERMEDIATE',
    "evidenceNotes" TEXT NOT NULL,
    "yearsExperience" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "roundType" "RoundType" NOT NULL DEFAULT 'TECHNICAL',
    "status" "InterviewStatus" NOT NULL DEFAULT 'UPCOMING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "jobDescriptionText" TEXT NOT NULL,
    "notes" TEXT,
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_skill_assessments" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "jdRequirementText" TEXT NOT NULL,
    "aiRationale" TEXT NOT NULL,
    "suggestedLevel" "SkillAssessmentLevel" NOT NULL,
    "verifiedLevel" "SkillAssessmentLevel" NOT NULL,
    "userNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_skill_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_questions" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "targetedSkill" TEXT,
    "sampleTalkingPoints" TEXT[],
    "status" "QuestionStatus" NOT NULL DEFAULT 'UNPREPARED',
    "candidateNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_name_key" ON "user_skills"("name");

-- CreateIndex
CREATE INDEX "interview_skill_assessments_interviewId_idx" ON "interview_skill_assessments"("interviewId");

-- CreateIndex
CREATE INDEX "practice_questions_interviewId_idx" ON "practice_questions"("interviewId");

-- CreateIndex
CREATE INDEX "checklist_items_interviewId_idx" ON "checklist_items"("interviewId");

-- AddForeignKey
ALTER TABLE "interview_skill_assessments" ADD CONSTRAINT "interview_skill_assessments_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
