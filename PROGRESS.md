# PROGRESS

Current phase: P4 — AI Advisor (Completed) -> P5 — Cohorts
Status: in progress
Next action: P5.1 — Cohort chat UI with Realtime, rules acceptance, pagination, auto-join, and moderation

## Phases
| Phase | Name | Status |
|---|---|---|
| P0 | Bootstrap | done |
| P1 | Foundation: design system, shell, auth, onboarding | done |
| P2 | Data model and ingestion pipeline | done |
| P3 | Opportunities: feed, detail, eligibility, Plan ahead | done |
| P4 | AI Advisor | done |
| P5 | Cohorts | in_progress |
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
- P3: Pure eligibility engine (30 tests), deterministic ranking (10 tests), opportunities feed with filters/pagination, detail page with signature Requirement Check panel, Plan Ahead, applications action with event logging, and right rail.
- P4.1: Context assembly in `src/lib/ai/advisor-context.ts` (compact profile under 600 tokens with gaps, application statuses, top 15 matched opportunities with eligibility lines, full variable substitution).
- P4.2: Pure tool handlers and AI SDK v7 tool definitions in `src/lib/ai/advisor-tools.ts` (`search_opportunities`, `get_opportunity` with live eligibility evaluations).
- P4.3: Per-user daily message cap and rate limiter in `src/lib/ai/rate-limit.ts` enforcing `AI_DAILY_MESSAGE_CAP` (default 30), atomic incrementing, and midnight Kigali time (CAT, UTC+2) resets.
- P4.4: Streaming chat endpoint at `/api/advisor/chat` supporting thread persistence, message histories, HTTP 429 enforcement, custom header metadata (`X-Advisor-Thread-Id`, `X-Advisor-Remaining`), and AI SDK streaming.
- P4.5: Advisor UI at `/advisor` matching `DESIGN.md` (no bubble chat, left-bordered chips, messages-left indicator in muted text, thread drawer, starter prompts, full AppShell integration).
- P4.6: 15/15 scripted evaluation test scripts passed against live Gemini API (`scripts/test_advisor.ts`, full report & transcripts in `docs/qa/advisor.md`).
- Verification: `pnpm run typecheck`, `pnpm run lint` (0 errors, 0 warnings), `pnpm run test` (9 test suites, 91 passing tests), and Next.js production build (`pnpm run build`) all pass with exit code 0.

## Session log (newest first, one line per old session)
- 2026-09-23: P4 completed (AI Advisor chat UI, streaming route, context assembly, tools, rate limit 30 msgs/day, 15/15 scripted QA tests in docs/qa/advisor.md). Next: P5.
- 2026-09-23: P3 completed (Eligibility engine 30 tests, ranking 10 tests, feed with URL-synced filters & pagination, detail page with signature requirement panel, plan ahead, applications action, right rail). Next: P4.
- 2026-09-23: P2 completed (Data model, RLS, 55 sources, pipeline modules, dedupe & filters, pipeline workflow, 62 verified opportunities, 22 news, admin portal). Next: P3.
- 2026-09-23: P1 completed (Design system, UI primitives, app shell, auth, onboarding, profile, settings, account export/delete). Next: P2.
- 2026-09-23: P0 completed (scaffold, tooling, vitest, env validation, Gemini models, CI workflow).
