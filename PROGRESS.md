# PROGRESS

Current phase: P2 — Data model and ingestion pipeline (Completed) -> P3 — Opportunities
Status: in progress
Next action: P3.1 — Eligibility engine pure function with >= 25 unit tests and ranking engine

## Phases
| Phase | Name | Status |
|---|---|---|
| P0 | Bootstrap | done |
| P1 | Foundation: design system, shell, auth, onboarding | done |
| P2 | Data model and ingestion pipeline | done |
| P3 | Opportunities: feed, detail, eligibility, Plan ahead | in_progress |
| P4 | AI Advisor | todo |
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
- P2.1: Migrations in `supabase/migrations/0002_data_model_and_pipeline.sql` covering all tables, GIN full-text index on `search`, `pg_trgm` index on `title`, RLS policies, and database functions.
- P2.2: RLS unit tests passing in `src/lib/supabase/rls.test.ts` (7 tests).
- P2.3: Verified sources registry created with 46 opportunity sources and 9 news sources (`supabase/seed/sources.sql`, `src/lib/data/sources.ts`).
- P2.4: Pipeline engine implemented (`scripts/pipeline/`): `discover.ts` with polite crawling (1s/domain) and `robots-parser`, `read.ts` with `linkedom` and `@mozilla/readability`, `extract.ts` using Gemini `AI_MODEL_FAST` with Zod validation, `filter.ts` dropping non-opportunities and non-eligible items, `resolve_official.ts` preventing aggregator publication, `dedupe.ts` (canonical URL normalization, SHA-256 content hash, trigram title similarity > 0.8), `publish.ts` enforcing publish rules, `expire.ts` routine.
- P2.5: Scheduled GitHub Actions workflow created in `.github/workflows/pipeline.yml` (cron `0 22 * * *` and `0 10 * * *` UTC, manual dispatch).
- P2.6: Seed dataset with 62 published opportunities and 22 news items, all with official URLs (`src/lib/data/opportunities.ts`, `src/lib/data/news.ts`, `supabase/seed/opportunities_and_news.sql`). Spot-check of 15 opportunities against official source sites: 15/15 correct (target >= 13/15).
- P2.7: Admin portal created (`/admin` review queue with approve/edit/reject, `/admin/sources` source status and toggle, `/admin/runs` run history and token tracking) gated by `ADMIN_EMAILS`.
- Verification: `pnpm run typecheck`, `pnpm run lint`, `pnpm run test` (5 test suites, 36 passing tests), and `pnpm run build` all pass with exit code 0.

## Session log (newest first, one line per old session)
- 2026-09-23: P2 completed (Data model, RLS, 55 sources, pipeline modules, dedupe & filters, pipeline workflow, 62 verified opportunities, 22 news, admin portal). Next: P3.
- 2026-09-23: P1 completed (Design system, UI primitives, app shell, auth, onboarding, profile, settings, account export/delete). Next: P2.
- 2026-09-23: P0 completed (scaffold, tooling, vitest, env validation, Gemini models, CI workflow).
