import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

export interface SkillGapItem {
  skillName: string;
  jdRequirementText: string;
  aiRationale: string;
  suggestedLevel: 'STRENGTH' | 'MINOR_GAP' | 'CRITICAL_GAP';
}

@Injectable()
export class AiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn(
        '⚠️ GEMINI_API_KEY is not defined in environment variables. AI calls will fail until set.',
      );
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
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

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
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
      });

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
}

