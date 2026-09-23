# PROGRESS

Current phase: P3 — Opportunities (Completed) -> P4 — AI Advisor
Status: in progress
Next action: P4.1 — AI Advisor chat UI, streaming responses, context assembly, and tools

## Phases
| Phase | Name | Status |
|---|---|---|
| P0 | Bootstrap | done |
| P1 | Foundation: design system, shell, auth, onboarding | done |
| P2 | Data model and ingestion pipeline | done |
| P3 | Opportunities: feed, detail, eligibility, Plan ahead | done |
| P4 | AI Advisor | in_progress |
| P5 | Cohorts | todo |
| P6 | News | todo |
| P7 | Progress tracker and notifications | todo |
| P8 | Hardening, landing, legal, launch, REVIEW.md | todo |

## Blockers (owner action needed)
1. **Vercel token** in `.env.local`: `VERCEL_TOKEN`. Needed to deploy site to Vercel via CLI. (Local production build is green).
2. **Supabase credentials** in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`. Needed for hosted remote migrations, auth, and storage. (Offline mock/local persistence layers active).
3. **Resend API key** (optional): `RESEND_API_KEY`. Email will be gracefully skipped until provided.

## Evidence & Verification
- P0: Repo `techris101/student-360` live on GitHub; CI green (run 35804744376).
- P1: Design tokens, UI primitives, app shell, auth, onboarding, profile, settings, account export/delete all complete.
- P2: Migrations (17 tables), RLS tests, 55 sources, polite pipeline engine with dedupe/filters/AI extraction, scheduled workflow, 62 verified opportunities, 22 news, admin portal.
- P3.1: Pure eligibility engine in `src/lib/eligibility/evaluate.ts` with 30 unit tests covering nationality, degree levels, year of study, fields, linear GPA scale conversions, age limits with `age_on`, gender restrictions, language tests, work experience, and manual check items.
- P3.2: Deterministic ranking engine in `src/lib/ranking/rank.ts` with 10 unit tests scoring opportunities on eligibility ratio (0.5), field overlap (0.3), and deadline proximity (0.2).
- P3.3: Opportunities feed at `/opportunities` (`src/app/(app)/opportunities/page.tsx`) with row list matching DESIGN.md (no card grids), deadline urgency styling (amber under 7 days, red under 48 hours), eligibility badges, URL-synced interactive filters (type, funding, location, plan ahead, show not eligible, sort), and 20-per-page pagination.
- P3.4: Opportunity detail page at `/opportunities/[id]` (`src/app/(app)/opportunities/[id]/page.tsx`) with signature 3px left-bordered Requirement Check panel, summary (max 80 words), definition list of key facts, official application link, Plan Ahead preparation checklist, last checked date with source attribution, and cohort applicant link.
- P3.5: Application status changes via Server Action `updateApplicationStatus` in `src/app/actions/opportunities.ts` writing immutable event logs to `application_events` and auto-joining cohorts upon marking "Applying" or "Submitted" per PRODUCT F3.
- P3.6: Desktop Right Rail in `src/components/opportunities/right-rail.tsx` featuring "Due this week" deadlines and actionable "Profile gaps" recommendations.
- P3.7: Automated end-to-end verification tests in `src/lib/opportunities.verify.test.ts`.
- Verification: `pnpm run typecheck`, `pnpm run lint` (0 errors, 0 warnings), `pnpm run test` (8 test suites, 81 passing tests), and Next.js production build (`pnpm run build`) all pass with exit code 0.

## Session log (newest first, one line per old session)
- 2026-09-23: P3 completed (Eligibility engine 30 tests, ranking 10 tests, feed with URL-synced filters & pagination, detail page with signature requirement panel, plan ahead, applications action, right rail). Next: P4.
- 2026-09-23: P2 completed (Data model, RLS, 55 sources, pipeline modules, dedupe & filters, pipeline workflow, 62 verified opportunities, 22 news, admin portal). Next: P3.
- 2026-09-23: P1 completed (Design system, UI primitives, app shell, auth, onboarding, profile, settings, account export/delete). Next: P2.
- 2026-09-23: P0 completed (scaffold, tooling, vitest, env validation, Gemini models, CI workflow).
