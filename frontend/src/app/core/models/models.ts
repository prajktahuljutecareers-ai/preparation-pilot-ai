export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type RoundType =
  | 'SCREENING'
  | 'TECHNICAL'
  | 'SYSTEM_DESIGN'
  | 'BEHAVIORAL'
  | 'OTHER';

export type InterviewStatus = 'UPCOMING' | 'COMPLETED' | 'ARCHIVED';

export type SkillAssessmentLevel = 'STRENGTH' | 'MINOR_GAP' | 'CRITICAL_GAP';

export type QuestionStatus = 'UNPREPARED' | 'DRAFTED' | 'MASTERED';

export interface UserSkill {
  id: string;
  name: string;
  category: string;
  proficiencyLevel: ProficiencyLevel;
  evidenceNotes: string;
  yearsExperience?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkillDto {
  name: string;
  category: string;
  proficiencyLevel?: ProficiencyLevel;
  evidenceNotes: string;
  yearsExperience?: number;
}

export interface InterviewSkillAssessment {
  id: string;
  interviewId: string;
  skillName: string;
  jdRequirementText: string;
  aiRationale: string;
  suggestedLevel: SkillAssessmentLevel;
  verifiedLevel: SkillAssessmentLevel;
  userNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeQuestion {
  id: string;
  interviewId: string;
  questionText: string;
  targetedSkill?: string;
  sampleTalkingPoints: string[];
  status: QuestionStatus;
  candidateNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  interviewId: string;
  label: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  company: string;
  role: string;
  roundType: RoundType;
  status: InterviewStatus;
  scheduledAt: string;
  jobDescriptionText: string;
  notes?: string;
  readinessScore: number;
  createdAt: string;
  updatedAt: string;
  assessments?: InterviewSkillAssessment[];
  questions?: PracticeQuestion[];
  checklistItems?: ChecklistItem[];
  _count?: {
    assessments: number;
    questions: number;
    checklistItems: number;
  };
}

export interface CreateInterviewDto {
  company: string;
  role: string;
  roundType: RoundType;
  scheduledAt: string;
  jobDescriptionText: string;
  notes?: string;
}

export interface ReadinessScoreResult {
  readinessScore: number;
  totalQuestions: number;
  masteredQuestions: number;
  draftedQuestions: number;
  unpreparedQuestions: number;
  totalChecklistItems: number;
  completedChecklistItems: number;
}

