import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ChecklistItem,
  CreateInterviewDto,
  CreateSkillDto,
  Interview,
  InterviewSkillAssessment,
  PracticeQuestion,
  QuestionStatus,
  ReadinessScoreResult,
  SkillAssessmentLevel,
  UserSkill,
} from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api';

  // Skills
  getSkills(): Observable<UserSkill[]> {
    return this.http.get<UserSkill[]>(`${this.baseUrl}/skills`);
  }

  createSkill(dto: CreateSkillDto): Observable<UserSkill> {
    return this.http.post<UserSkill>(`${this.baseUrl}/skills`, dto);
  }

  deleteSkill(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/skills/${id}`);
  }

  // Interviews
  getInterviews(): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.baseUrl}/interviews`);
  }

  getInterview(id: string): Observable<Interview> {
    return this.http.get<Interview>(`${this.baseUrl}/interviews/${id}`);
  }

  createInterview(dto: CreateInterviewDto): Observable<Interview> {
    return this.http.post<Interview>(`${this.baseUrl}/interviews`, dto);
  }

  deleteInterview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/interviews/${id}`);
  }

  // AI Skill-Gap Analysis
  analyzeInterview(interviewId: string): Observable<InterviewSkillAssessment[]> {
    return this.http.post<InterviewSkillAssessment[]>(
      `${this.baseUrl}/interviews/${interviewId}/analyze`,
      {},
    );
  }

  updateAssessment(
    interviewId: string,
    assessmentId: string,
    dto: { verifiedLevel?: SkillAssessmentLevel; userNotes?: string },
  ): Observable<InterviewSkillAssessment> {
    return this.http.patch<InterviewSkillAssessment>(
      `${this.baseUrl}/interviews/${interviewId}/assessments/${assessmentId}`,
      dto,
    );
  }

  // Targeted Questions & Readiness
  generateQuestions(
    interviewId: string,
  ): Observable<{ questions: PracticeQuestion[]; readiness: ReadinessScoreResult }> {
    return this.http.post<{ questions: PracticeQuestion[]; readiness: ReadinessScoreResult }>(
      `${this.baseUrl}/interviews/${interviewId}/generate-questions`,
      {},
    );
  }

  updateQuestion(
    interviewId: string,
    questionId: string,
    dto: { status?: QuestionStatus; candidateNotes?: string },
  ): Observable<{ question: PracticeQuestion; readiness: ReadinessScoreResult }> {
    return this.http.patch<{ question: PracticeQuestion; readiness: ReadinessScoreResult }>(
      `${this.baseUrl}/interviews/${interviewId}/questions/${questionId}`,
      dto,
    );
  }

  toggleChecklistItem(
    interviewId: string,
    itemId: string,
    isCompleted: boolean,
  ): Observable<{ checklistItem: ChecklistItem; readiness: ReadinessScoreResult }> {
    return this.http.patch<{ checklistItem: ChecklistItem; readiness: ReadinessScoreResult }>(
      `${this.baseUrl}/interviews/${interviewId}/checklist/${itemId}`,
      { isCompleted },
    );
  }

  getReadiness(interviewId: string): Observable<ReadinessScoreResult> {
    return this.http.get<ReadinessScoreResult>(
      `${this.baseUrl}/interviews/${interviewId}/readiness`,
    );
  }
}

