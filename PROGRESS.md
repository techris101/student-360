# PROGRESS

Current phase: P0 — Bootstrap
Status: in progress
Next action: P0.4 — Scaffold Next.js app

## Phases
| Phase | Name | Status |
|---|---|---|
| P0 | Bootstrap | in_progress |
| P1 | Foundation: design system, shell, auth, onboarding | todo |
| P2 | Data model and ingestion pipeline | todo |
| P3 | Opportunities: feed, detail, eligibility, Plan ahead | todo |
| P4 | AI Advisor | todo |
| P5 | Cohorts | todo |
| P6 | News | todo |
| P7 | Progress tracker and notifications | todo |
| P8 | Hardening, landing, legal, launch, REVIEW.md | todo |

## Blockers (owner action needed)
1. **Supabase credentials** in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`. Needed for remote migrations, hosted database, auth, and storage. (Continuing with local mocking, schema definitions, and client layer in the meantime).
2. **Vercel token** in `.env.local`: `VERCEL_TOKEN`. Needed for Vercel CLI project linking and preview/production deployment. (Continuing with local Next.js build and testing).
3. **Resend API key** (optional): `RESEND_API_KEY`. Email will be gracefully skipped until provided.

## Session log (newest first, one line per old session)
- 2026-09-23: P0.1–P0.3: Verified Node v24, installed pnpm 12.5.1, configured .gitignore and .env.local, initialized git, documented blockers.
