# ADR-003: Client-Side Lesson Progress Tracking

## FPF Metadata

| Attribute | Value |
|-----------|-------|
| **F (Formality)** | F2 - Lightweight structured rationale |
| **G (Scope)** | {Expert-Builder, progress tracking, UI feedback} |
| **R (Reliability)** | 0.75 - Based on current product constraints and implementation |
| **Bounded Context** | Learning Progress UX |
| **Holon Level** | Feature within frontend subsystem |

## Status

Accepted (2025-12-12)

## Context

We needed a visible progress indicator and a per‑lesson completion view to support the “concept → code → validation → advance” loop.

Current constraints:

- No authentication or user accounts.
- Server storage is static lesson content only.
- We want instant feedback after a successful Submit.
- Progress should not require any backend deployment or data migrations.

### Requirements

- Persist completion across reloads on the same device.
- Update UI optimistically right after a passing submission.
- Keep the decision reversible if/when we add accounts.
- Maintain conceptual clarity and traceable rationale (FPF E.9).

## Decision

Track lesson completion **client-side in localStorage**, surfaced through TanStack Query:

- `client/src/lib/progress.ts` defines a small `{[lessonId]: { completed, completedAt }}` store.
- On successful Submit, we mark the lesson completed and update Query cache (`lesson-progress`) so the header/progress modal updates immediately.
- `Header` reads progress via a Suspense query and shows:
  - compact count + bar
  - modal list with Done/Not‑done badges and quick lesson jump

This respects FPF’s **Design–Run separation** (progress is run‑time evidence, not design‑time lesson content) and keeps the change small and auditable.

## Alternatives Considered

1. **Server-side progress endpoint**
   - Pros: multi-device, durable.
   - Cons: requires auth/identity; adds backend and data model work we don’t have yet.

2. **In-memory only**
   - Pros: simplest.
   - Cons: lost on reload; undermines learner loop.

3. **Cookie-based progress**
   - Pros: could be shared to server later.
   - Cons: size limits; less ergonomic for structured data.

## Consequences

### Positive

- Zero backend work; deploy-safe.
- Works offline and in local dev.
- Immediate UX update after passing tests.

### Negative / Risks

- Per-device only; progress resets if storage is cleared.
- No cross‑browser or cross‑device sync.

### Future Path

When user accounts are added, introduce `/api/progress` with the same schema and:

- prefer server progress when available
- fall back to localStorage for guests/offline
- migrate local progress into the account once on sign‑in

## Implementation Notes

- `client/src/lib/progress.ts` + `client/src/lib/progress.test.ts`
- `client/src/components/lesson-page.tsx` marks completion after passing Submit.
- `client/src/components/header.tsx` renders progress UI + modal list.

## References

- FPF-Spec: **Design–Run separation (A.4)**, **Auditability**, **DRR method (E.9)**.

