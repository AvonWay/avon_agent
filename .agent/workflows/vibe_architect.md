---
description: The "Vibe Architect" Protocol. A 10-step process for turning vague vibes into production-hardened software.
---

# Vibe Coding Agent Protocol

## 1. Requirement Parsing (The Vibe Check)

- **Goal**: Turn vague "vibes" into explicit requirements.
- **Actions**:
  - Parse prompt into: Goals, Users, Core Features, Non-functional Reqs.
  - Infer defaults: Safe Stack (Next.js/Supabase), Dark Mode (unless specified), Mobile-First.
  - Define Scope v1: separating "Must Haves" from "Nice to Haves".

## 2. Architecture & Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS v4, Lucide React.
- **Backend**: Supabase (Auth/DB) + Next.js Server Actions / Route Handlers.
- **State**: React Server Components (RSC) for fetching, Client Hooks for interactivity.

## 3. Scaffolding

- **Action**: Initialize project structure (if not exists).
- **Structure**: `src/app`, `src/components`, `src/lib` (Supabase client, utils).

## 4. Vertical Slices Plan

- **Philosophy**: Break features into end-to-end slices (UI + API + DB).
- **Order**: Auth -> CRUD -> Advanced Features.

## 5. Backend Implementation (First)

- **Step**: Define Database Schema (SQL).
- **Step**: Create Migration/Setup scripts.
- **Step**: Implement API endpoints / Server Actions with Zod validation.
- **Constraint**: NEVER build UI before Data Model is clear.

## 6. Frontend Implementation

- **Step**: Build responsive Components (Tailwind).
- **Step**: Wire fetchers/mutations to Backend.
- **Step**: Handle Loading/Error states.

## 7. Iteration Loop

- **Action**: Run -> Observe -> Patch.
- **Feedback**: Start dev server, check console/UI, fix immediately.

## 8. Production Hardening

- **Security**: RLS Policies, Input Sanitzation.
- **Performance**: Image Optimization, Caching.

## 9. Deployment

- **Target**: Vercel (Frontend), Supabase (Backend).
- **Config**: Check Env Vars (`SUPABASE_URL`, `SUPABASE_KEY`).

## 10. Evolution

- **Mode**: Conversational Refactoring.
- **Action**: Propose migration plans for major changes.
