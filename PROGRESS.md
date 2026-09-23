# PROGRESS

Current phase: P6 — News (Completed) -> P7 — Progress Tracker & Notifications
Status: in progress
Next action: P7.1 — Progress tracker (/progress), kanban/board, application status updates, AI progress review (Prompt 5), in-app notifications

## Phases
| Phase | Name | Status |
|---|---|---|
| P0 | Bootstrap | done |
| P1 | Foundation: design system, shell, auth, onboarding | done |
| P2 | Data model and ingestion pipeline | done |
| P3 | Opportunities: feed, detail, eligibility, Plan ahead | done |
| P4 | AI Advisor | done |
| P5 | Cohorts | done |
| P6 | News | done |
| P7 | Progress tracker and notifications | in_progress |
| P8 | Hardening, landing, legal, launch, REVIEW.md | todo |

## Blockers (owner action needed)
1. **Vercel token** in `.env.local`: `VERCEL_TOKEN`. Needed to deploy site to Vercel via CLI. (Local production build is green).
2. **Supabase credentials** in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`. Needed for hosted remote migrations, auth, and storage. (Offline mock/local persistence layers active).
3. **Resend API key** (optional): `RESEND_API_KEY`. Email will be gracefully skipped until provided.

## Evidence & Verification
- P0: Repo `techris101/student-360` live on GitHub; CI green (run 35804744376).
- P1: Design tokens, UI primitives, app shell, auth, onboarding, profile, settings, account export/delete all complete.
- P2: Migrations (17 tables), RLS tests, 55 sources, polite pipeline engine with dedupe/filters/AI extraction, scheduled workflow, 62 verified opportunities, 22 news, admin portal.
- P3: Pure eligibility engine (30 tests), deterministic ranking (10 tests), opportunities feed with filters/pagination, detail page with signature Requirement Check panel, Plan Ahead, applications action with event logging, and right rail.
- P4: Context assembly, AI SDK v7 tools (`search_opportunities`, `get_opportunity`), daily message cap (30 msgs/day), streaming chat UI at `/advisor`, and 15/15 scripted QA tests in `docs/qa/advisor.md`.
- P5: Cohort data model, Realtime chat UI, rules acceptance gating, rate limit 10 msgs/min, 30-day closing, report/block, admin moderation, 20 automated tests.
- P6: News feed at `/news` with rolling 30-day window, 4 categories, search query filter, 60-word summary limit enforcement, external link security, admin curation at `/admin/news`, 6 unit tests.
- Verification: `pnpm run typecheck`, `pnpm run lint` (0 errors, 0 warnings), `pnpm run test` (12 test suites, 117 passing tests), and Next.js production build (`pnpm run build`) all pass with exit code 0.

## Session log (newest first, one line per old session)
- 2026-09-23: P6 completed (News feed, 30-day window, category filtering, search, admin curation, 6 tests, 117/117 tests total passing). Next: P7.
- 2026-09-23: P5 completed (Cohorts feed, Realtime chat UI, rules acceptance, rate limit 10 msgs/min, 30-day closing, report/block, admin moderation, 20 tests). Next: P6.
- 2026-09-23: P4 completed (AI Advisor chat UI, streaming route, context assembly, tools, rate limit 30 msgs/day, 15/15 scripted QA tests in docs/qa/advisor.md). Next: P5.
- 2026-09-23: P3 completed (Eligibility engine 30 tests, ranking 10 tests, feed with URL-synced filters & pagination, detail page with signature requirement panel, plan ahead, applications action, right rail). Next: P4.
- 2026-09-23: P2 completed (Data model, RLS, 55 sources, pipeline modules, dedupe & filters, pipeline workflow, 62 verified opportunities, 22 news, admin portal). Next: P3.
- 2026-09-23: P1 completed (Design system, UI primitives, app shell, auth, onboarding, profile, settings, account export/delete). Next: P2.
- 2026-09-23: P0 completed (scaffold, tooling, vitest, env validation, Gemini models, CI workflow).
