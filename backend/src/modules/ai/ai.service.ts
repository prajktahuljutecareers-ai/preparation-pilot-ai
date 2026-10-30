import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

export interface SkillGapItem {
  skillName: string;
  jdRequirementText: string;
  aiRationale: string;
  suggestedLevel: 'STRENGTH' | 'MINOR_GAP' | 'CRITICAL_GAP';
}

export interface GeneratedQuestionItem {
  questionText: string;
  targetedSkill: string;
  sampleTalkingPoints: string[];
}

export interface ExtractedResumeSkill {
  name: string;
  category: string;
  proficiencyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  yearsExperience?: number;
  evidenceNotes: string;
}

@Injectable()
export class AiService {
  private ai: GoogleGenAI;
  // Primary model with fallback for temporary 503 capacity spikes
  // Note: Only use models confirmed available on your API key tier
  private readonly models = [
    'gemini-3.8-flash',
    'gemini-3.8-pro',
  ];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn(
        '⚠️ GEMINI_API_KEY is not defined in environment variables. AI calls will fail until set.',
      );
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  /**
   * Resilient execution wrapper with retry and model fallback for 503 / 429 errors.
   */
  private async executeWithFallback(
    fn: (modelName: string) => Promise<any>,
  ): Promise<any> {
    let lastError: any = null;

    for (const modelName of this.models) {
      // Try up to 2 attempts per model with a short backoff
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          return await fn(modelName);
        } catch (error: any) {
          lastError = error;
          const status = error?.status || error?.code || error?.error?.code;
          const message = error?.message || '';

          const isTransient =
            status === 503 ||
            status === 429 ||
            message.includes('high demand') ||
            message.includes('Resource has been exhausted');

          if (isTransient) {
            console.warn(
              `⚠️ [Gemini ${modelName}] attempt ${attempt} returned transient error (${message}). Retrying...`,
            );
            // Brief backoff before retry (1.5 seconds)
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }

          // If non-transient model error (e.g. 404 model not found), switch to next model immediately
          break;
        }
      }
    }

    throw lastError;
  }

  async analyzeSkillGaps(
    jobDescription: string,
    candidateSkills: Array<{
      name: string;
      category: string;
      proficiencyLevel: string;
      evidenceNotes: string;
    }>,
  ): Promise<SkillGapItem[]> {
    try {
      const prompt = `
You are an expert technical interviewer and career coach.
Analyze the following Job Description (JD) and compare it against the Candidate's verified Skills Profile.

CRITICAL INSTRUCTIONS:
1. Do NOT evaluate gaps based solely on proficiency labels (e.g. "Beginner" or "Advanced"). You MUST analyze the candidate's actual "evidenceNotes" to differentiate between real production experience and mere theoretical/tutorial knowledge.
2. For EVERY requirement or technical topic extracted from the JD:
   - Identify the specific skill or technical expectation.
   - Quote the EXACT or closely paraphrased excerpt from the JD in "jdRequirementText".
   - Compare the JD requirement with the candidate's evidence notes.
   - Provide a clear, actionable explanation in "aiRationale" explaining WHY this is a strength or gap based on their concrete evidence.
   - Categorize into:
     * "STRENGTH": Candidate has documented production evidence meeting or exceeding the requirement.
     * "MINOR_GAP": Candidate has related foundational experience, but lacks depth or specific nuance required by the JD.
     * "CRITICAL_GAP": JD explicitly requires this skill/technology, but the candidate either has zero mention or only superficial/tutorial knowledge.

---
CANDIDATE SKILLS PROFILE:
${JSON.stringify(candidateSkills, null, 2)}

---
JOB DESCRIPTION:
${jobDescription}
`;

      const response = await this.executeWithFallback((model) =>
        this.ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              description: 'List of skill gap assessments',
              items: {
                type: Type.OBJECT,
                properties: {
                  skillName: {
                    type: Type.STRING,
                    description: 'Name of the skill or technical competency',
                  },
                  jdRequirementText: {
                    type: Type.STRING,
                    description:
                      'Direct quote or requirement excerpt from the Job Description',
                  },
                  aiRationale: {
                    type: Type.STRING,
                    description:
                      'Detailed reasoning contrasting the candidate evidence notes with the JD need',
                  },
                  suggestedLevel: {
                    type: Type.STRING,
                    enum: ['STRENGTH', 'MINOR_GAP', 'CRITICAL_GAP'],
                    description: 'Proposed gap categorization',
                  },
                },
                required: [
                  'skillName',
                  'jdRequirementText',
                  'aiRationale',
                  'suggestedLevel',
                ],
              },
            },
          },
        }),
      );

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini API.');
      }

      const assessments: SkillGapItem[] = JSON.parse(responseText);
      return assessments;
    } catch (error: any) {
      console.error('Gemini skill-gap analysis failed:', error);
      throw new InternalServerErrorException(
        `AI Analysis failed: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  async generatePracticeQuestions(
    company: string,
    role: string,
    roundType: string,
    gaps: Array<{ skillName: string; jdRequirementText: string; aiRationale: string }>,
    strengths: Array<{ skillName: string }>,
  ): Promise<GeneratedQuestionItem[]> {
    try {
      const prompt = `
You are a Principal Engineering Interviewer conducting a confirmed interview for:
- Company: ${company}
- Role: ${role}
- Round Type: ${roundType}

GOAL:
Generate 5 to 7 high-yield, realistic interview questions specifically targeted to this round format and the candidate's verified skill gaps.

CRITICAL INSTRUCTIONS:
1. Heavily prioritize questions addressing the identified SKILL GAPS (${gaps.map((g) => g.skillName).join(', ')}). Formulate questions that test whether the candidate understands the core principles and practical trade-offs despite their reported gap.
2. The style of questions must strictly match the ROUND TYPE:
   - SYSTEM_DESIGN: Focus on scalability, distributed systems, partition strategies, failure modes, data consistency, caching.
   - TECHNICAL: Focus on API design, concurrency, database query optimization, implementation trade-offs, language internals.
   - BEHAVIORAL: Focus on leadership, technical disagreements, handling outages, prioritizing tech debt (STAR format).
   - SCREENING: Broad architectural overview, key accomplishments, technical communication.
3. For each question, provide 3 to 4 actionable "sampleTalkingPoints" that guide the candidate on how to structure a winning answer.

---
IDENTIFIED SKILL GAPS:
${JSON.stringify(gaps, null, 2)}

---
CANDIDATE STRENGTHS (to optionally weave into questions):
${JSON.stringify(strengths, null, 2)}
`;

      const response = await this.executeWithFallback((model) =>
        this.ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              description: 'List of targeted practice interview questions',
              items: {
                type: Type.OBJECT,
                properties: {
                  questionText: {
                    type: Type.STRING,
                    description: 'The exact interview question',
                  },
                  targetedSkill: {
                    type: Type.STRING,
                    description: 'The skill or domain gap being tested',
                  },
                  sampleTalkingPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '3-4 concise bullet points for a high-scoring answer',
                  },
                },
                required: [
                  'questionText',
                  'targetedSkill',
                  'sampleTalkingPoints',
                ],
              },
            },
          },
        }),
      );

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini API.');
      }

      const questions: GeneratedQuestionItem[] = JSON.parse(responseText);
      return questions;
    } catch (error: any) {
      console.error('Gemini question generation failed:', error);
      throw new InternalServerErrorException(
        `AI Question Generation failed: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  async extractSkillsFromResume(resumeText: string): Promise<ExtractedResumeSkill[]> {
    try {
      const prompt = `
You are an expert technical recruiter and resume analyzer.
Analyze the following candidate Resume / CV text and extract the key technical skills along with verified evidence of use.

CRITICAL INSTRUCTIONS:
1. For each distinct technical skill (e.g. Languages, Frameworks, Databases, Cloud & DevOps, Architecture, Messaging, APIs):
   - Extract the standard skill name (e.g. "PostgreSQL", "NestJS", "Kubernetes", "TypeScript", "Redis", "Docker").
   - Categorize it (e.g., "Backend", "Database", "Cloud", "Frontend", "DevOps", "Architecture").
   - Determine the proficiency level based on real usage in the resume:
     * "ADVANCED": Used as core technology in primary roles for multiple years with architecture, scaling, or team leadership impact.
     * "INTERMEDIATE": Used regularly in production to build features, APIs, or database queries.
     * "BEGINNER": Mentioned only in coursework, personal projects, or listed passively in skills list without work history evidence.
   - Estimate years of experience if ascertainable from role dates (or leave null).
   - MANDATORY "evidenceNotes": Synthesize concrete evidence directly from what the candidate achieved in their work history or project bullets (e.g. "Architected distributed payment ingestion pipeline; implemented custom interceptors and Prisma ORM integration"). Do NOT write vague generic sentences; ground it directly in the resume text.
2. Return between 6 and 20 high-yield technical skills that truly represent the candidate's capabilities.

---
CANDIDATE RESUME:
${resumeText}
`;

      const response = await this.executeWithFallback((model) =>
        this.ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              description: 'List of extracted technical skills from the resume',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: 'Technical skill name (e.g. NestJS, PostgreSQL)',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Category (e.g. Backend, Frontend, Cloud, Database, DevOps)',
                  },
                  proficiencyLevel: {
                    type: Type.STRING,
                    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
                    description: 'Assessed proficiency based on resume usage depth',
                  },
                  evidenceNotes: {
                    type: Type.STRING,
                    description:
                      'Synthesized production evidence based directly on resume work history bullets',
                  },
                },
                required: [
                  'name',
                  'category',
                  'proficiencyLevel',
                  'evidenceNotes',
                ],
              },
            },
          },
        }),
      );

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini API.');
      }

      const skills: ExtractedResumeSkill[] = JSON.parse(responseText);
      return skills;
    } catch (error: any) {
      console.error('Gemini resume skill extraction failed:', error);
      throw new InternalServerErrorException(
        `Resume Skill Extraction failed: ${error?.message || 'Unknown error'}`,
      );
    }
  }
}
