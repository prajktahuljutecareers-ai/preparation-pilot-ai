import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import {
  Interview,
  InterviewSkillAssessment,
  PracticeQuestion,
  QuestionStatus,
  SkillAssessmentLevel,
} from '../../core/models/models';

@Component({
  selector: 'app-prep-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './prep-room.component.html',
  styleUrl: './prep-room.component.css',
})
export class PrepRoomComponent implements OnInit {
  @Input() id!: string;

  private api = inject(ApiService);

  interview = signal<Interview | null>(null);
  assessments = signal<InterviewSkillAssessment[]>([]);
  questions = signal<PracticeQuestion[]>([]);
  checklist = signal<any[]>([]);

  activeTab = signal<'gaps' | 'questions' | 'checklist'>('gaps');
  analyzing = signal<boolean>(false);
  generating = signal<boolean>(false);

  ngOnInit() {
    if (this.id) {
      this.loadInterviewData();
    }
  }

  loadInterviewData() {
    this.api.getInterview(this.id).subscribe({
      next: (data) => {
        this.interview.set(data);
        this.assessments.set(data.assessments || []);
        this.questions.set(data.questions || []);
        this.checklist.set(data.checklistItems || []);
      },
      error: (err) => console.error('Failed to load interview', err),
    });
  }

  runAnalysis() {
    this.analyzing.set(true);
    this.api.analyzeInterview(this.id).subscribe({
      next: (data) => {
        this.assessments.set(data);
        this.analyzing.set(false);
      },
      error: (err) => {
        alert('Analysis error: ' + (err.error?.message || err.message));
        this.analyzing.set(false);
      },
    });
  }

  onOverrideLevel(item: InterviewSkillAssessment, newLevel: SkillAssessmentLevel) {
    this.api.updateAssessment(this.id, item.id, { verifiedLevel: newLevel }).subscribe({
      next: (updated) => {
        this.assessments.update((list) =>
          list.map((a) => (a.id === updated.id ? updated : a)),
        );
      },
      error: (err) => alert('Failed to update assessment: ' + err.message),
    });
  }

  generateQuestions() {
    this.generating.set(true);
    this.api.generateQuestions(this.id).subscribe({
      next: (res) => {
        this.questions.set(res.questions);
        if (this.interview()) {
          this.interview.update((i) => i ? { ...i, readinessScore: res.readiness.readinessScore } : null);
        }
        this.generating.set(false);
      },
      error: (err) => {
        alert('Question generation error: ' + (err.error?.message || err.message));
        this.generating.set(false);
      },
    });
  }

  updateQuestionStatus(question: PracticeQuestion, status: QuestionStatus) {
    this.api.updateQuestion(this.id, question.id, { status }).subscribe({
      next: (res) => {
        this.questions.update((list) =>
          list.map((q) => (q.id === res.question.id ? res.question : q)),
        );
        if (this.interview()) {
          this.interview.update((i) => i ? { ...i, readinessScore: res.readiness.readinessScore } : null);
        }
      },
      error: (err) => alert('Failed to update question: ' + err.message),
    });
  }

  saveQuestionNotes(question: PracticeQuestion) {
    this.api.updateQuestion(this.id, question.id, { candidateNotes: question.candidateNotes }).subscribe({
      error: (err) => console.error('Failed to save notes', err),
    });
  }

  toggleChecklist(item: any) {
    const nextState = !item.isCompleted;
    this.api.toggleChecklistItem(this.id, item.id, nextState).subscribe({
      next: (res) => {
        this.checklist.update((list) =>
          list.map((c) => (c.id === res.checklistItem.id ? res.checklistItem : c)),
        );
        if (this.interview()) {
          this.interview.update((i) => i ? { ...i, readinessScore: res.readiness.readinessScore } : null);
        }
      },
      error: (err) => alert('Failed to toggle checklist: ' + err.message),
    });
  }

  masteredCount() {
    return this.questions().filter((q) => q.status === 'MASTERED').length;
  }

  completedTasksCount() {
    return this.checklist().filter((c) => c.isCompleted).length;
  }

  getLevelColor(level: SkillAssessmentLevel) {
    switch (level) {
      case 'CRITICAL_GAP':
        return 'var(--danger)';
      case 'MINOR_GAP':
        return 'var(--warning)';
      case 'STRENGTH':
        return 'var(--success)';
      default:
        return 'var(--border-color)';
    }
  }
}
