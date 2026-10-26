1. Project Overview

Project: Preparation Pilot
Goal: Build an AI-powered interview preparation application for confirmed interviews.

Technology stack: Angular, NestJS, PostgreSQL (Prisma ORM)
AI coding tools: Google Antigravity, Gemini, GitHub Copilot

---

## Session 1 — Requirements and Planning

**Date**: 22 October 2026  
**Objective**: Define the MVP scope, architecture, and engineering principles before writing code.

### Key Architectural & Product Decisions:
1. **Evidence-First Skills Profile**:
   * Rejecting arbitrary 1–5 or beginner/advanced ratings alone.
   * Every skill stores concrete `evidenceNotes` (e.g., production architectural experience vs. tutorial knowledge) to ground the AI.
2. **Evidence-Backed Skill-Gap Detection**:
   * AI parses raw Job Descriptions and must cite the exact JD excerpt that justifies a detected gap.
   * Human-in-the-loop override: Candidate can adjust the AI's proposed gap classification (*Strength*, *Minor Gap*, *Critical Gap*).
3. **Deterministic Readiness Calculation**:
   * Readiness scores are computed by a deterministic backend formula based on question mastery and prep checklist completion. The LLM is never used to fabricate numeric percentages.
4. **Relational Database Design**:
   * Replaced unstructured nested JSON blobs with normalized relational tables via Prisma (`UserSkill`, `Interview`, `InterviewSkillAssessment`, `PracticeQuestion`, `ChecklistItem`).
5. **Project Structure**:
   * Lightweight monorepo containing `backend/` (NestJS), `frontend/` (Angular), and root `docker-compose.yml` (PostgreSQL 16).
6. **Git & Portfolio Discipline**:
   * Incremental, clean commits at logical milestones with clear documentation to build a strong GitHub profile.

---

## Session 2 — Backend Foundation & Relational Schema Setup

**Date**: 23 October 2026  
**Objective**: Scaffold the NestJS backend, configure PostgreSQL, run initial migration, and establish architecture blueprint.

### Achievements:
1. **NestJS 12 Service Scaffolded**: Clean modular structure in `backend/` with global prefix `/api` and Angular CORS support.
2. **PostgreSQL Configuration**: Native PostgreSQL configured (`preparation_pilot_db`), connection credentials URL-encoded safely.
3. **Prisma 6 Setup & Migration**:
   * Defined relational models in `backend/prisma/schema.prisma`.
   * Created and applied initial migration (`init`).
   * Generated type-safe `@prisma/client`.
4. **Prisma Module**: Created `@Global()` `PrismaService` and `PrismaModule` for dependency injection.
5. **Architecture Documentation**: Authored comprehensive [`backend/BACKEND_ARCHITECTURE.md`](./backend/BACKEND_ARCHITECTURE.md) covering ER diagrams, request lifecycles, and complete REST API specifications.

---

## Session 3 — Skills Profile Module Implementation

**Date**: 23 October 2026  
**Objective**: Build the evidence-first Skills Profile vertical slice in NestJS.

### Achievements:
1. **DTOs & Strict Validation**:
   * `CreateSkillDto`: Enforces `name`, `category`, and **mandatory `evidenceNotes`** to prevent groundless proficiency claims.
   * `UpdateSkillDto`: Allows incremental updates to skills and evidence notes.
2. **Business Logic & Error Handling**:
   * `SkillsService`: Implemented full CRUD with uniqueness checks (`ConflictException`) and not-found guards (`NotFoundException`).
3. **RESTful Controller**:
   * `SkillsController` exposed at `/api/skills` (`POST`, `GET`, `GET :id`, `PUT :id`, `DELETE :id`).
4. **Global Validation Pipe**:
   * Enabled whitelist stripping and automatic transformation in `main.ts`.
5. **Prisma Seed Script**:
   * Created `prisma/seed.ts` containing realistic evidence notes for NestJS, PostgreSQL, Angular, and Docker.

---

## Session 4 — Confirmed Interview Management Module

**Date**: 23 October 2026  
**Objective**: Build the confirmed interview management workspace slice in NestJS.

### Achievements:
1. **DTOs & Round Typing**:
   * `CreateInterviewDto`: Validates `company`, `role`, typed `roundType` (`SCREENING`, `TECHNICAL`, `SYSTEM_DESIGN`, `BEHAVIORAL`, `OTHER`), ISO 8601 `scheduledAt`, and mandatory `jobDescriptionText`.
   * `UpdateInterviewDto`: Supports updating schedule, notes, or interview details.
2. **Business Logic with Auto-Checklist**:
   * `InterviewsService`: Creates new interviews with automatic prep tasks pre-populated (`ChecklistItem` table).
   * Eager loading: `findOne(id)` retrieves the interview workspace including all assessments, questions, and checklist items.
3. **RESTful Controller**:
   * `InterviewsController` exposed at `/api/interviews` (`POST`, `GET`, `GET :id`, `PUT :id`, `DELETE :id`).
4. **Registered Module**:
   * `InterviewsModule` wired into `AppModule`.

---

## Session 5 — AI Service & Skill-Gap Analysis Engine

**Date**: 23 October 2026  
**Objective**: Integrate Google Gemini API with structured JSON output schema and build the evidence-backed skill gap detection engine with candidate override.

### Achievements:
1. **Google GenAI SDK Integration**:
   * `AiService` utilizing `@google/genai` with `gemini-3.8-flash` model.
   * Strict JSON schema enforcement ensuring 100% reliable responses without regex or markdown extraction glitches.
2. **Evidence-Grounded Prompting**:
   * The AI cross-references JD requirements specifically against candidate `evidenceNotes` (not labels).
   * Generates exact JD citations (`jdRequirementText`) and detailed rationale (`aiRationale`) for each detected item.
3. **Persisted Gap Assessments**:
   * `AnalysisService`: Cleans previous assessments and saves fresh assessments into `interview_skill_assessments` table.
4. **Candidate Override (Human-in-the-Loop)**:
   * `PATCH /api/interviews/:id/assessments/:assessmentId` allows candidates to override `verifiedLevel` and add personal `userNotes`.

---

## Session 6 — Targeted Question Generator & Deterministic Readiness Engine

**Date**: 23 October 2026  
**Objective**: Generate round-specific, gap-targeted interview questions with sample talking points and calculate readiness deterministically.

### Achievements:
1. **Targeted Question Generation**:
   * `AiService.generatePracticeQuestions`: Crafts 5–7 questions focusing specifically on verified gaps (e.g. Kafka, distributed transactions) tailored to the round type (`SYSTEM_DESIGN`, `TECHNICAL`, `BEHAVIORAL`).
   * Includes 3–4 actionable `sampleTalkingPoints` per question.
2. **Practice & Mastery Tracking**:
   * `QuestionsService` & `QuestionsController`: Endpoints to update question status (`UNPREPARED` → `DRAFTED` → `MASTERED`) and store candidate notes.
   * Checklist item toggle (`isCompleted: true / false`).
3. **Deterministic Readiness Algorithm**:
   * `ReadinessService`: Computes readiness percentage mathematically without AI hallucination (70% question mastery + 30% checklist tasks).
   * Updates `Interview.readinessScore` in PostgreSQL on every state mutation.
4. **Resilient AI Gateway**:
   * Added retry backoff and model fallback (`gemini-3.8-flash` → `gemini-3.8-pro`) to gracefully handle transient 503 capacity spikes.

---

## Session 7 — Modern Angular Frontend (The Prep Room)

**Date**: 23 October 2026  
**Objective**: Build a clean, responsive single-page web app in Angular 18 connecting the full end-to-end preparation lifecycle.

### Achievements:
1. **Angular 18 Standalone Architecture**:
   * Single-page routing with `withComponentInputBinding()` and `provideHttpClient()`.
2. **Type-Safe API Service**:
   * `ApiService` handling all REST endpoints across skills, interviews, gap analysis, question flashcards, and checklists.
3. **Interactive Views**:
   * **Confirmed Interviews Dashboard** (`InterviewListComponent`): Displays scheduled rounds, company cards, and readiness progress bars with a quick-schedule modal.
   * **Skills Profile & Evidence** (`SkillsProfileComponent`): Form and cards highlighting real production evidence vs. tutorial claims.
   * **The Prep Room** (`PrepRoomComponent`):
     * Real-time deterministic readiness score badge and progress bar.
     * Tab 1: AI Gap Analysis with quoted JD excerpts, AI rationale, and one-click candidate override.
     * Tab 2: Question flashcards with expandable talking points, candidate note-taking, and status toggles (`Unprepared`, `Drafted`, `Mastered`).
     * Tab 3: Actionable preparation checklist.
4. **Modern Dark Theme & Design System**:
   * Professional UI with color-coded gap severities (Red for Critical, Amber for Minor, Emerald for Strengths).

---

### Progress Tracker:
* [x] Step 1: MVP Requirements defined & repository initialized
* [x] Step 2: Initialize NestJS backend, native PostgreSQL, and Prisma schema migration
* [x] Step 3: Architecture Blueprint Documented (`BACKEND_ARCHITECTURE.md`)
* [x] Step 4: Implement Skills Profile Module (CRUD with evidence notes)
* [x] Step 5: Implement Interview Management Module
* [x] Step 6: Implement AI Service & Skill-Gap Analysis Engine
* [x] Step 7: Implement Practice Questions & Readiness Score Engine
* [x] Step 8: Angular Frontend Setup & The Prep Room UI
