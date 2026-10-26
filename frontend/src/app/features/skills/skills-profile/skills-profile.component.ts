import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { CreateSkillDto, UserSkill } from '../../../core/models/models';

@Component({
  selector: 'app-skills-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skills-profile.component.html',
  styleUrl: './skills-profile.component.css',
})
export class SkillsProfileComponent implements OnInit {
  private api = inject(ApiService);

  skills = signal<UserSkill[]>([]);
  loading = signal<boolean>(false);
  showModal = signal<boolean>(false);

  newSkill: CreateSkillDto = {
    name: '',
    category: '',
    proficiencyLevel: 'INTERMEDIATE',
    evidenceNotes: '',
  };

  ngOnInit() {
    this.loadSkills();
  }

  loadSkills() {
    this.loading.set(true);
    this.api.getSkills().subscribe({
      next: (data) => {
        this.skills.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load skills', err);
        this.loading.set(false);
      },
    });
  }

  toggleNewModal() {
    this.showModal.update((v) => !v);
  }

  submitSkill() {
    if (!this.newSkill.name || !this.newSkill.category || !this.newSkill.evidenceNotes) {
      alert('Skill Name, Category, and Evidence Notes are required.');
      return;
    }

    this.loading.set(true);
    this.api.createSkill(this.newSkill).subscribe({
      next: () => {
        this.showModal.set(false);
        this.newSkill = {
          name: '',
          category: '',
          proficiencyLevel: 'INTERMEDIATE',
          evidenceNotes: '',
        };
        this.loadSkills();
      },
      error: (err) => {
        alert('Failed to create skill: ' + (err.error?.message || err.message));
        this.loading.set(false);
      },
    });
  }

  deleteSkill(id: string) {
    if (!confirm('Are you sure you want to remove this skill?')) return;

    this.api.deleteSkill(id).subscribe({
      next: () => this.loadSkills(),
      error: (err) => alert('Failed to delete skill: ' + err.message),
    });
  }
}
