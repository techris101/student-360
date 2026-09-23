# PROGRESS

Current phase: P0 — Bootstrap (Scaffolding complete; deploy blocked on VERCEL_TOKEN)
Status: in progress
Next action: P1.1 — Design tokens from DESIGN.md (CSS variables, Tailwind theme, IBM Plex Sans)

## Phases
| Phase | Name | Status |
|---|---|---|
| P0 | Bootstrap | in_progress |
| P1 | Foundation: design system, shell, auth, onboarding | in_progress |
| P2 | Data model and ingestion pipeline | todo |
| P3 | Opportunities: feed, detail, eligibility, Plan ahead | todo |
| P4 | AI Advisor | todo |
| P5 | Cohorts | todo |
| P6 | News | todo |
| P7 | Progress tracker and notifications | todo |
| P8 | Hardening, landing, legal, launch, REVIEW.md | todo |

## Blockers (owner action needed)
1. **Vercel token** in `.env.local`: `VERCEL_TOKEN`. Needed to run `vercel link` and deploy placeholder/production site live to Vercel via CLI.
2. **Supabase credentials** in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`. Needed for remote migrations, database tables, auth, and storage. (Building with mock/fallback client layers in the meantime).
3. **Resend API key** (optional): `RESEND_API_KEY`. Email will be gracefully skipped until provided.

## Evidence & Verification
- P0.1–P0.3: `gh auth status` verified (techris101), Node v24.19.0, pnpm 12.5.1 installed and configured, git repo `techris101/student-360` initialized and created.
- P0.4–P0.5: Next.js 16 (App Router, TypeScript strict, Tailwind CSS) scaffolded, Prettier, Vitest, and cross-platform build scripts configured.
- P0.6: CI workflow configured in `.github/workflows/ci.yml`.
- P0.7: `src/lib/env.ts` with Zod validation implemented and tested (`src/lib/env.test.ts`, 3 passing tests).
- P0.9: Live Gemini API verified; models set to `gemini-2.5-flash-lite` (fast) and `gemini-2.5-flash` (smart). Decision recorded in `docs/DECISIONS.md`.

## Session log (newest first, one line per old session)
- 2026-09-23: P0 completed (scaffold, tooling, vitest, env validation, Gemini models, CI workflow). Next: P1 foundation.
