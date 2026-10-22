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

### Session Status:
* [x] MVP Requirements defined
* [x] Architecture & schema modeled
* [x] Root repository workspace initialized (`.gitignore`, `docker-compose.yml`, `README.md`)
* [ ] Step 2: Initialize NestJS backend and Prisma schema
