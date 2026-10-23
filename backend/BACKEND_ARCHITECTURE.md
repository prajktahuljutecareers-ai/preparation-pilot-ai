# Preparation Pilot — Backend Architecture & Design Document

> **Service**: `backend` (NestJS 12 + TypeScript + Prisma 6 + PostgreSQL)  
> **Last Updated**: 23 October 2026  
> **Target Frontend**: Angular 18+ (Standalone Components, Signals)  
> **AI Engine**: Google Gemini API (Structured JSON Schema)

---

## 1. Architectural Principles & Philosophy

The backend of **Preparation Pilot** follows four core engineering principles:

1. **Evidence-First Domain Model**:
   * Instead of arbitrary numeric ratings (e.g., "React: 4/5"), skills store concrete `evidenceNotes` (e.g., production architectural experience vs. tutorial projects).
2. **Deterministic Business Metrics**:
   * The LLM is **never** asked to calculate readiness percentages or scores. Numeric readiness is calculated deterministically by backend code based on verified items.
3. **Structured & Type-Safe AI Contracts**:
   * AI prompts enforce strict JSON output schemas. The backend receives strongly-typed responses rather than unstructured markdown or freeform text.
4. **Relational Normalization over Blobs**:
   * Relational data (interviews, assessments, questions, checklists) is stored across normalized PostgreSQL tables with foreign key constraints, enabling clean updates and overrides.

---

## 2. High-Level System Architecture

```
                    +--------------------------------+
                    |        Angular Frontend        |
                    |   (http://localhost:4200)      |
                    +---------------+----------------+
                                    |
                            HTTP / REST API
                          (Prefix: /api/*)
                                    |
                    +---------------v----------------+
                    |         NestJS Backend         |
                    |    (http://localhost:3000)     |
                    +---------------+----------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
+-----------v-----------+                       +-----------v-----------+
|      Prisma ORM      |                       |       AI Service      |
|   (@prisma/client)    |                       |   (@google/genai)     |
+-----------+-----------+                       +-----------+-----------+
            |                                               |
+-----------v-----------+                       +-----------v-----------+
| PostgreSQL (Native)   |                       |   Gemini 1.5 / 2.0    |
|   (Port 5432)         |                       | Structured JSON Mode  |
+-----------------------+                       +-----------------------+
```

---

## 3. NestJS Modular Structure

The backend is organized into decoupled, single-responsibility modules:

```text
backend/src/
├── app.module.ts                   # Root application orchestrator
├── main.ts                         # Bootstrap, global prefix (/api), CORS configuration
│
├── prisma/                         # Data Access Layer (Global)
│   ├── prisma.service.ts           # PrismaClient lifecycle hook ($connect, $disconnect)
│   └── prisma.module.ts            # Exported as @Global() for easy injection
│
├── modules/
│   ├── skills/                     # Skills Profile Slice
│   │   ├── dto/                    # create-skill.dto.ts, update-skill.dto.ts
│   │   ├── skills.controller.ts    # REST endpoints for user skills & evidence
│   │   ├── skills.service.ts       # Database CRUD via Prisma
│   │   └── skills.module.ts
│   │
│   ├── interviews/                 # Confirmed Interview Management Slice
│   │   ├── dto/                    # create-interview.dto.ts, update-interview.dto.ts
│   │   ├── interviews.controller.ts# Interview scheduling & JD intake
│   │   ├── interviews.service.ts
│   │   └── interviews.module.ts
│   │
│   ├── ai/                         # LLM Gateway Slice
│   │   ├── ai.service.ts           # Gemini API client & schema validator
│   │   ├── prompts/                # Dedicated prompt templates for JD analysis & questions
│   │   └── ai.module.ts
│   │
│   ├── analysis/                   # Skill Gap Engine Slice
│   │   ├── analysis.controller.ts  # Endpoints: trigger JD analysis, manual override
│   │   ├── analysis.service.ts     # Compares JD vs. UserSkill evidence via AI
│   │   └── analysis.module.ts
│   │
│   ├── questions/                  # Practice & Readiness Slice
│   │   ├── questions.controller.ts # Question status updates, checklist toggling
│   │   ├── questions.service.ts    # Question generator & answer notes
│   │   ├── readiness.service.ts    # Deterministic readiness calculation algorithm
│   │   └── questions.module.ts
```

---

## 4. Database Relational Model (PostgreSQL)

```mermaid
erDiagram
    UserSkill {
        string id PK
        string name UK
        string category
        enum proficiencyLevel "BEGINNER | INTERMEDIATE | ADVANCED"
        text evidenceNotes
        float yearsExperience
        datetime createdAt
        datetime updatedAt
    }

    Interview {
        string id PK
        string company
        string role
        enum roundType "SCREENING | TECHNICAL | SYSTEM_DESIGN | BEHAVIORAL | OTHER"
        enum status "UPCOMING | COMPLETED | ARCHIVED"
        datetime scheduledAt
        text jobDescriptionText
        text notes
        int readinessScore
        datetime createdAt
        datetime updatedAt
    }

    InterviewSkillAssessment {
        string id PK
        string interviewId FK
        string skillName
        text jdRequirementText
        text aiRationale
        enum suggestedLevel "STRENGTH | MINOR_GAP | CRITICAL_GAP"
        enum verifiedLevel "STRENGTH | MINOR_GAP | CRITICAL_GAP"
        text userNotes
        datetime createdAt
    }

    PracticeQuestion {
        string id PK
        string interviewId FK
        text questionText
        string targetedSkill
        string[] sampleTalkingPoints
        enum status "UNPREPARED | DRAFTED | MASTERED"
        text candidateNotes
        datetime createdAt
    }

    ChecklistItem {
        string id PK
        string interviewId FK
        string label
        boolean isCompleted
        datetime createdAt
    }

    Interview ||--o{ InterviewSkillAssessment : "has assessments"
    Interview ||--o{ PracticeQuestion : "has questions"
    Interview ||--o{ ChecklistItem : "has checklist items"
```

---

## 5. End-to-End Request Lifecycles

### Flow A: Skill Profile Management
1. Candidate creates or updates a skill with `name`, `category`, `proficiencyLevel`, and **`evidenceNotes`**.
2. `class-validator` validates input (rejects empty evidence notes).
3. `SkillsService` persists to `user_skills` table.

### Flow B: JD Analysis & Skill Gap Detection
1. Candidate creates an `Interview` and inputs raw Job Description text.
2. Candidate clicks **"Analyze Job Description"** (`POST /api/interviews/:id/analyze`).
3. `AnalysisService` fetches all `UserSkill` records (with evidence notes) and the raw JD text.
4. `AiService` calls Gemini API with a structured JSON output schema:
   * Returns list of required skills.
   * Cites exact JD quote.
   * Compares with candidate's `evidenceNotes` to propose: `STRENGTH`, `MINOR_GAP`, or `CRITICAL_GAP`.
5. Backend writes rows to `interview_skill_assessments` with both `suggestedLevel` and `verifiedLevel` initialized.
6. **Candidate Override**: Candidate can call `PATCH /api/interviews/:id/assessments/:assessmentId` to adjust `verifiedLevel` if AI made an incorrect assessment.

### Flow C: Question Generation
1. Candidate triggers **"Generate Practice Questions"** (`POST /api/interviews/:id/generate-questions`).
2. `QuestionsService` queries verified gaps (`CRITICAL_GAP`, `MINOR_GAP`) and the `roundType` (*e.g., System Design*).
3. `AiService` generates 5–10 targeted questions with sample talking points directly addressing the gaps.
4. Saved in `practice_questions` with initial status `UNPREPARED`.

### Flow D: Deterministic Readiness Calculation
When a candidate marks a question as `MASTERED` or checks a `ChecklistItem`:
1. `ReadinessService` runs the deterministic calculation:
   $$\text{Readiness} = \left( 0.7 \times \frac{\text{Mastered Questions}}{\text{Total Questions}} \right) + \left( 0.3 \times \frac{\text{Completed Checklist Items}}{\text{Total Checklist Items}} \right)$$
2. Updates `Interview.readinessScore` (integer 0–100).
3. Returns updated score to frontend for live progress meter animation.

---

## 6. Complete REST API Endpoint Specification

### Skills (`/api/skills`)
| Verb | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/skills` | Create a new skill with mandatory evidence notes |
| `GET` | `/api/skills` | List all user skills (supports category filtering) |
| `GET` | `/api/skills/:id` | Get single skill details |
| `PUT` | `/api/skills/:id` | Update proficiency or evidence notes |
| `DELETE` | `/api/skills/:id` | Remove a skill |

### Interviews (`/api/interviews`)
| Verb | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/interviews` | Create scheduled interview with raw JD |
| `GET` | `/api/interviews` | List all interviews (with readiness scores) |
| `GET` | `/api/interviews/:id` | Full interview details with assessments, questions & checklist |
| `PUT` | `/api/interviews/:id` | Update company, role, date, or status |
| `DELETE` | `/api/interviews/:id` | Remove an interview (cascades to assessments/questions) |

### Analysis & Skill Gaps (`/api/interviews/:id/analysis`)
| Verb | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/interviews/:id/analyze` | Run Gemini JD extraction and gap assessment |
| `GET` | `/api/interviews/:id/assessments` | Get all skill gap assessments for this interview |
| `PATCH` | `/api/interviews/:id/assessments/:assessmentId` | Override AI assessment (`verifiedLevel`, `userNotes`) |

### Practice Questions & Prep (`/api/interviews/:id/prep`)
| Verb | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/interviews/:id/generate-questions` | Generate targeted questions based on gaps & round |
| `PATCH` | `/api/interviews/:id/questions/:questionId` | Update question status (`MASTERED`, `candidateNotes`) |
| `POST` | `/api/interviews/:id/checklist` | Add custom checklist item |
| `PATCH` | `/api/interviews/:id/checklist/:itemId` | Toggle checklist item completion |
| `GET` | `/api/interviews/:id/readiness` | Re-evaluate and return deterministic readiness score |

---

## 7. Security & Environment Configuration

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:Password%401234@localhost:5432/preparation_pilot_db?schema=public` |
| `GEMINI_API_KEY` | Google AI Studio API key | Obtained from https://aistudio.google.com/ |
| `PORT` | API server listen port | `3000` |

* **CORS**: Configured in `main.ts` to allow requests exclusively from `http://localhost:4200` with credentials enabled.
* **Global Validation Pipe**: Strips unknown properties (`whitelist: true`) and transforms incoming payloads to typed DTO classes.

