# ADR-002: Modern React 19 Client-Only Frontend Patterns

## FPF Metadata

| Attribute | Value |
|-----------|-------|
| **F (Formality)** | F2–F3 - Narrative with structured constraints |
| **G (Scope)** | {Expert-Builder, frontend, React 19, async UI, performance} |
| **R (Reliability)** | 0.8 - Based on React 19.2 docs + working implementation |
| **Bounded Context** | Frontend UI Layer |
| **Holon Level** | Subsystem (client app) |

## Status

Accepted (2025-12-12)

## Context

Expert Builder’s client app started as a React 18 SPA with:

- explicit `isLoading` branches for data
- manual pending flags for mutations (Run/Submit)
- pervasive `useCallback/useMemo` for perceived performance
- Effects that re-subscribed on incidental state changes

We upgraded to **React 19.2** (still client-only; no RSC framework). The React 19 platform shifts the default mental model toward **async-first UI**, **Actions for mutations**, and **compiler‑driven memoization**.

### Requirements

- Remain a client-only SPA (Rsbuild + Wouter + TanStack Query)
- Improve UX consistency for async loading and mutations
- Reduce manual performance work that tends to drift and calcify
- Keep the codebase evolvable with clear rationale (FPF E.9 DRR/ADR discipline)

## Decision

Adopt modern React 19 **client-only** patterns across the UI:

1. **Async-first data flow with Suspense**
   - Use TanStack Query `useSuspenseQuery` for lesson list and future data reads.
   - Route-level `<Suspense fallback>` handles loading UI.

2. **Mutations as Actions**
   - Model Run/Submit as async Actions via `useActionState`.
   - Wrap action invocations in `startTransition` for scheduler-friendly updates.

3. **Effect hygiene**
   - Use `useEffectEvent` for stable event/listener subscriptions (sidebar hotkey, system theme listener).
   - Keep Effects dependent only on effectful inputs.

4. **Performance via React Compiler**
   - Enable React Compiler in Rsbuild using a Babel transform.
   - Remove redundant manual memoization; keep only imperative-API constraints (Monaco, Radix refs).

This aligns with FPF’s preference for **generalizable compute-backed mechanisms over hand-tuned rules** (“Bitter Lesson” stance) and preserves **Evolvability + Auditability** by recording the rationale here.

## Alternatives Considered

1. **Stay on React 18 patterns**
   - Pros: zero change risk.
   - Cons: diverges from platform defaults; manual async/pending logic remains brittle.

2. **Manual memoization as policy**
   - Pros: familiar.
   - Cons: violates Bitter Lesson principle; adds cognitive overhead and subtle bugs.

3. **Suspense only for a few screens**
   - Pros: incremental.
   - Cons: inconsistent UX and duplicated loading states.

4. **Skip React Compiler**
   - Pros: avoids bundler wiring.
   - Cons: keeps performance work manual; harder to maintain.

## Consequences

### Positive

- Consistent async UX: loading and mutation states are modeled the “React 19 way”.
- Less surface area for state bugs: fewer bespoke pending flags and edge races.
- Performance work becomes mostly automatic and auditable.
- Cleaner code: fewer boilerplate callbacks and memo blocks.

### Negative / Risks

- **Bundler coupling:** React Compiler relies on a Babel transform; future Rsbuild changes could require re‑wiring.
- **Compiler edge cases:** If a file miscompiles, opt-out locally with `"use no memo"` until fixed.
- **Testing shift:** Suspense requires async‑first tests (await `act`, `findBy*`).

## Implementation Notes

Key changes:

- `client/src/pages/home.tsx` → `useSuspenseQuery` + shared `HomeSkeleton`.
- `client/src/App.tsx` → route-level `<Suspense>` + small error boundary.
- `client/src/components/lesson-page.tsx` → Run/Submit Actions.
- `client/src/components/ui/sidebar.tsx`, `client/src/components/theme-provider.tsx` → `useEffectEvent` listeners.
- `rsbuild.config.ts` → React Compiler enabled via `@rsbuild/plugin-babel`.

## References

- React 19.2 “modern React” docs (Suspense, `useActionState`, `useEffectEvent`, Compiler).
- TanStack Query v5 Suspense helpers.
- FPF-Spec: **Bitter Lesson trajectory**, **Open‑Ended Evolution (P‑10)**, **DRR method (E.9)**, **Auditability/Evolvability characteristics**.

