import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateSkillDto,
  ExtractedResumeSkill,
  UserSkill,
} from '../../../core/models/models';

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

  // Resume extraction state
  showResumeModal = signal<boolean>(false);
  resumeText: string = '';
  isExtracting = signal<boolean>(false);
  extractedSkills = signal<ExtractedResumeSkill[]>([]);
  isImporting = signal<boolean>(false);

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

  toggleResumeModal() {
    this.showResumeModal.update((v) => !v);
    if (!this.showResumeModal()) {
      this.extractedSkills.set([]);
      this.resumeText = '';
    }
  }

  extractFromResume() {
    const text = this.resumeText.trim();
    if (text.length < 50) {
      alert('Please paste a substantial resume excerpt (at least 50 characters).');
      return;
    }

    this.isExtracting.set(true);
    this.api.extractSkillsFromResume(text).subscribe({
      next: (data) => {
        // Mark all extracted skills as selected by default
        const withSelection = data.map((item) => ({ ...item, selected: true }));
        this.extractedSkills.set(withSelection);
        this.isExtracting.set(false);
      },
      error: (err) => {
        alert('Resume extraction failed: ' + (err.error?.message || err.message));
        this.isExtracting.set(false);
      },
    });
  }

  toggleSkillSelection(skill: ExtractedResumeSkill) {
    skill.selected = !skill.selected;
  }

  toggleSelectAll(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.extractedSkills.update((list) =>
      list.map((s) => ({ ...s, selected: isChecked })),
    );
  }

  selectedCount() {
    return this.extractedSkills().filter((s) => s.selected).length;
  }

  importSelectedSkills() {
    const selected = this.extractedSkills()
      .filter((s) => s.selected)
      .map((s) => ({
        name: s.name,
        category: s.category,
        proficiencyLevel: s.proficiencyLevel,
        evidenceNotes: s.evidenceNotes,
        yearsExperience: s.yearsExperience,
      }));

    if (selected.length === 0) {
      alert('Please select at least one skill to import.');
      return;
    }

    this.isImporting.set(true);
    this.api.bulkImportSkills(selected).subscribe({
      next: (res) => {
        alert(`Successfully imported/updated ${res.importedCount} skills with evidence!`);
        this.isImporting.set(false);
        this.toggleResumeModal();
        this.loadSkills();
      },
      error: (err) => {
        alert('Bulk import failed: ' + (err.error?.message || err.message));
        this.isImporting.set(false);
      },
    });
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
