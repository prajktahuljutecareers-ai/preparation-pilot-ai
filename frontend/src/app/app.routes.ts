import { Routes } from '@angular/router';
import { InterviewListComponent } from './features/interviews/interview-list/interview-list.component';
import { SkillsProfileComponent } from './features/skills/skills-profile/skills-profile.component';
import { PrepRoomComponent } from './features/prep-room/prep-room.component';

export const routes: Routes = [
  { path: '', redirectTo: 'interviews', pathMatch: 'full' },
  { path: 'interviews', component: InterviewListComponent },
  { path: 'interviews/:id', component: PrepRoomComponent },
  { path: 'skills', component: SkillsProfileComponent },
  { path: '**', redirectTo: 'interviews' },
];
