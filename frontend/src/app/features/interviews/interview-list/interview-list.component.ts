import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CreateInterviewDto, Interview } from '../../../core/models/models';

@Component({
  selector: 'app-interview-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './interview-list.component.html',
  styleUrl: './interview-list.component.css',
})
export class InterviewListComponent implements OnInit {
  private api = inject(ApiService);

  interviews = signal<Interview[]>([]);
  loading = signal<boolean>(false);
  showModal = signal<boolean>(false);

  newInterview: CreateInterviewDto = {
    company: '',
    role: '',
    roundType: 'SYSTEM_DESIGN',
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    jobDescriptionText: '',
    notes: '',
  };

  ngOnInit() {
    this.loadInterviews();
  }

  loadInterviews() {
    this.loading.set(true);
    this.api.getInterviews().subscribe({
      next: (data) => {
        this.interviews.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load interviews', err);
        this.loading.set(false);
      },
    });
  }

  toggleNewModal() {
    this.showModal.update((v) => !v);
  }

  submitInterview() {
    if (!this.newInterview.company || !this.newInterview.role || !this.newInterview.jobDescriptionText) {
      alert('Please fill out all required fields.');
      return;
    }

    this.loading.set(true);
    const payload = {
      ...this.newInterview,
      scheduledAt: new Date(this.newInterview.scheduledAt).toISOString(),
    };

    this.api.createInterview(payload).subscribe({
      next: () => {
        this.showModal.set(false);
        this.newInterview = {
          company: '',
          role: '',
          roundType: 'SYSTEM_DESIGN',
          scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          jobDescriptionText: '',
          notes: '',
        };
        this.loadInterviews();
      },
      error: (err) => {
        alert('Failed to create interview: ' + (err.error?.message || err.message));
        this.loading.set(false);
      },
    });
  }

  deleteInterview(id: string, event: Event) {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this interview and all its questions/assessments?')) {
      return;
    }

    this.api.deleteInterview(id).subscribe({
      next: () => this.loadInterviews(),
      error: (err) => alert('Failed to delete interview: ' + err.message),
    });
  }
}
