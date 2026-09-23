# Student 360 — Build Plan (V1)

Work phases in order. Each task: build, test, check UI (if any), update `PROGRESS.md`, commit, push. A phase is done only when every acceptance item is true. Record evidence (test names, screenshots taken, URLs) in `PROGRESS.md`.

## P0 — Bootstrap
1. **Prerequisites.** Check `gh auth status`, Node ≥ 20, pnpm (install via corepack if missing), `.env.local` exists. List missing env keys as blockers; continue with whatever does not need them.
2. **Git safety first.** Create `.gitignore` (Node, Next.js, `.env*` except `.env.example`, `.vercel`, `playwright-report`, `test-results`) before any commit.
3. **Repo.** `git init -b main`, commit the docs, `gh repo create student-360 --private --source=. --remote=origin --push`. If the repo already exists on the account, add it as origin and push instead.
4. **Scaffold.** `create-next-app` refuses non-empty folders: scaffold into `./_scaffold` (TypeScript, Tailwind, ESLint, App Router, `src/` dir, pnpm), move its contents to the root without overwriting docs, delete `_scaffold`.
5. **Tooling.** Prettier, strict tsconfig, Vitest, path aliases, `typecheck`/`lint`/`test`/`build` scripts, `NODE_OPTIONS` for build.
6. **CI.** `.github/workflows/ci.yml`: install, typecheck, lint, test, build.
7. **Env validation.** `src/lib/env.ts` with zod; server-only vars never imported in client code.
8. **Deploy.** Vercel CLI with `VERCEL_TOKEN`: link project, add env vars (production and preview), deploy, connect Git. Put the production URL in `PROGRESS.md` and `NEXT_PUBLIC_SITE_URL`.
9. **Models.** Look up current Gemini model names; set `AI_MODEL_FAST` and `AI_MODEL_SMART`.
**Accept:** repo `student-360` exists with docs; CI green; a placeholder page is live on Vercel.

## P1 — Foundation
1. Design tokens from `DESIGN.md` as CSS variables + Tailwind theme; IBM Plex Sans; light/dark with system default and a toggle in Settings.
2. Restyle shadcn/ui primitives: button, input, select, textarea, dialog, sheet, dropdown, tabs, toast, skeleton, chip. Build a hidden `/dev/ui` page showing all of them in both themes; screenshot and review against the banned list.
3. App shell: sidebar (desktop), icon rail (tablet), top bar + bottom tabs (mobile), right rail slot.
4. Supabase clients (server, browser, service), generated types, middleware for sessions.
5. Auth: magic link + Google (Google may be a blocker; ship magic link regardless). Sign-in page, callback, sign-out.
6. Migrations for `universities`, `profiles` with RLS; seed universities.
7. Onboarding (3 steps per PRODUCT F0), consent screen, CV upload to private bucket, CV parse via `unpdf` + prompt 4, field-by-field confirmation.
8. Profile page (edit everything), Settings (theme, email opt-in, data export JSON, delete account with confirmation).
**Accept:** a new user can sign in, finish onboarding with and without a CV, edit profile, export data, and delete the account (rows and file removed). UI passes the DESIGN quality floor.

## P2 — Data model and ingestion pipeline
1. Migrations: all remaining tables from ARCHITECTURE, RLS, indexes, `pg_trgm`, full-text column, Postgres functions (rate limit, AI usage increment).
2. RLS tests for profiles, applications, messages.
3. Verify and seed sources from `SOURCES.md` (≥ 40 opportunity, ≥ 8 news).
4. Pipeline scripts: discover, read, extract (prompt 2/3), filter, resolve official link, dedupe, publish rule, expire, re-check, log. Unit tests for dedupe and filters with fixtures.
5. `pipeline.yml` with both schedules and manual dispatch; secrets via `gh secret set`.
6. Run the pipeline manually until at least 60 published opportunities and 20 news items exist. Fix extraction quality issues by improving prompts or `crawl_hint`s, not by hand-writing data.
7. Admin: review queue (approve, edit, reject), sources page, runs log. Admin gate by `ADMIN_EMAILS`.
**Accept:** scheduled workflow succeeds twice in a row; ≥ 60 published opportunities, all with official URLs; spot-check 15 against their source pages and record results in `PROGRESS.md` (target ≥ 13 fully correct).

## P3 — Opportunities
1. Eligibility engine + ≥ 25 unit tests. Ranking + tests.
2. Feed: rows, eligibility status, filters, sorts, "show not eligible" toggle, pagination (20 per page), URL-synced filters.
3. Detail page: requirement check panel, summary, key facts, status control, last checked, source, cohort link.
4. Plan ahead filter and section with `prepare_now` lists.
5. Applications: status changes write `application_events`.
6. Right rail: due this week, profile gaps that would unlock the most checks.
**Accept:** for a test profile, feed ordering and every check state match the engine's tests; detail page matches the DESIGN wireframe at 390px and 1280px.

## P4 — Advisor
1. Threads list and chat UI, streaming responses.
2. Context assembly, system prompt 1, tools `search_opportunities` and `get_opportunity`.
3. Daily cap with visible remaining count and reset time.
4. Test script with 15 scripted questions (eligibility, prioritisation, essay help, off-topic, distress, invented-opportunity bait). Store transcripts in `docs/qa/advisor.md` and fix the prompt until all pass the rules.
**Accept:** all 15 pass; no invented opportunities or percentages; cap enforced.

## P5 — Cohorts
1. Auto-join on Applying/Submitted; leave; rules acceptance.
2. Cohort list and chat with Realtime, pagination, rate limit, length limit.
3. Report, block, auto-hide at 3 reports, admin moderation page, suspend user.
4. Closing 30 days after deadline.
**Accept:** two test users chat in real time; blocked user's messages disappear for the blocker; reports reach admin; suspended users cannot post.

## P6 — News
1. News tab with categories, published list, 30-day window.
2. Admin review for low-relevance items.
**Accept:** ≥ 20 relevant published items; no item shows copied article text.

## P7 — Progress and notifications
1. Progress tab: counts, by-status view, upcoming deadlines, advisor review (prompt 5, once per 7 days).
2. In-app notifications (bell, list, mark read) for new eligible opportunities, deadline reminders, cohort activity (batched).
3. `reminders.yml` and `digest.yml`; email via Resend only if configured and opted in.
**Accept:** a test user with applications sees correct counts, receives reminder notifications from a manual workflow run, and can generate one review then sees the next available date.

## P8 — Hardening and launch
1. Landing page per DESIGN (live opportunities), About, Privacy policy, Terms, community rules, contact. Privacy policy states what data we hold, why, retention, deletion, and that the owner is registering with Rwanda's data protection authority (NCSA).
2. SEO basics: metadata, Open Graph, sitemap for public opportunity pages, robots.txt.
3. Accessibility pass (keyboard, focus, contrast, zoom). Lighthouse CI thresholds from ARCHITECTURE.
4. Security pass: RLS review, service key audit (`grep` client bundles), rate limits, headers (CSP, frame-ancestors).
5. Playwright smoke tests in CI: sign-in (magic link test mode or seeded session), onboarding, feed, detail status change, advisor message, cohort message.
6. Error monitoring: log server errors to a `error_logs` table viewable in admin.
7. Full visual review of every page at 390px and 1280px, light and dark, against the DESIGN banned list.
8. Write `REVIEW.md` for the owner: live URL, how to sign in as admin, what was built per feature, known limitations, open blockers, cost per month at 100 / 1,000 / 5,000 users (estimate with stated assumptions), and a numbered test script for him (15–25 steps).
9. Tag `v1.0.0`, push, stop.
**Accept:** all previous phases done; CI green; Lighthouse thresholds met; `REVIEW.md` complete.
