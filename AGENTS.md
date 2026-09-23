# Student 360 — Agent Operating Rules

You are the sole engineering team building Student 360 end to end. The owner (BaGie) is a reviewer, not a developer. He approves payments and reviews the finished V1. Everything else is yours.

## Read order (every session, no exceptions)
1. `PROGRESS.md` — where the build stands and the next action.
2. This file.
3. `docs/BUILD_PLAN.md` — the current phase and its acceptance criteria.
4. Other docs when the task touches them:
   - `docs/PRODUCT.md` — what we build and why. Feature behaviour lives here.
   - `docs/ARCHITECTURE.md` — stack, schema, pipeline, security.
   - `docs/DESIGN.md` — visual system. Read before touching any UI.
   - `docs/AI_ADVISOR.md` — every LLM prompt and the AI rules.
   - `docs/SOURCES.md` — seed list of opportunity and news sources.
   - `docs/DECISIONS.md` — locked decisions. Do not reverse them.

## Autonomy
- Build every phase in `docs/BUILD_PLAN.md` in order, P0 to P8, without stopping to ask questions.
- When the docs do not answer something, choose the simplest option consistent with them, log it in `docs/DECISIONS.md` under "Made during build", and keep going.
- Only stop for a true blocker: a missing secret, an account the owner must create, or anything that costs money. Log it under "Blockers" in `PROGRESS.md` with the exact thing needed, then continue with every task that does not depend on it (use feature flags or mocks). Stop only when no unblocked work remains.
- Never ask the owner for design or product opinions during V1. The docs are the opinion.
- At the end of P8, write `REVIEW.md` for the owner and stop.

## Resume protocol (context limits and quota pauses will happen)
- Update `PROGRESS.md` after every completed task: phase, task, what changed, next action. Keep it under 150 lines; compress old session logs into one line each.
- Commit and push after every completed task. Work that is not pushed does not exist.
- On a new session: read `PROGRESS.md`, run `git status` and `git log -5 --oneline`, then continue from "Next action". Never restart a phase that is marked done.

## Machine constraints (owner's PC: Celeron N4120, 4 GB RAM, no Docker)
- Never run Docker or `supabase start`. Use the hosted Supabase project only.
- Never run `next dev` and `next build` at the same time. Stop the dev server when you finish checking something.
- Set `NODE_OPTIONS=--max-old-space-size=1536` for builds.
- Run Playwright and Lighthouse in GitHub Actions, not locally.
- Use the browser for visual checks sparingly: one screenshot at 390px and one at 1280px per page, per change.
- The OS may be Windows. Keep `package.json` scripts cross-platform (Node/tsx scripts, no bash-only syntax).

## Locked stack (details in `docs/ARCHITECTURE.md`)
Next.js (App Router, latest stable) + TypeScript strict · Tailwind CSS + shadcn/ui primitives restyled to `docs/DESIGN.md` · Supabase (Postgres, Auth, Storage, Realtime, RLS) · Vercel AI SDK with Google Gemini (model names from env) · GitHub Actions for scheduled pipelines and CI · Vercel hosting · Resend for email (optional) · pnpm.
Do not add a new framework, database, auth provider, state library, or UI kit. Small utility packages are fine if they are maintained and justify their size.

## Code standards
- TypeScript strict. No `any`. Validate every external input (forms, LLM output, scraped data, env) with zod.
- Server Components by default. Client components only for interactivity.
- Mutations through Server Actions or route handlers that check the session and rely on RLS.
- Every list and page has loading, empty, and error states, with copy that says what to do next.
- Pure logic (eligibility engine, dedupe, ranking, rate limits) lives in `src/lib/` with Vitest unit tests.
- Name things by what users understand. The UI says "Applications", not "user_opportunity_rows".

## Design non-negotiables (full system in `docs/DESIGN.md`)
Mature, calm, information-first. Think a well-run career office, not a startup landing page.
Banned everywhere: gradients, purple, pink, violet, neon, glassmorphism, emoji in the UI, blob or 3D illustrations, stock hero photos, confetti, animated counters, drop shadows on cards, identical card grids for lists, ALL-CAPS eyebrow labels, arrows appended to button text, "Unlock / Empower / Elevate / Journey" copy.
If a screen could appear in a generic AI template, redo it.

## Security and privacy
- RLS enabled on every table from its first migration. Service-role key only in server code and pipeline scripts, never in client bundles.
- Never print secrets in logs, commits, or chat. `.env.local` is gitignored before the first commit.
- CVs go to a private Storage bucket. Signed URLs only, short expiry.
- Account deletion removes the user's rows and files. Data export returns the user's data as JSON.

## Git
- `main` is always deployable. Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Never force-push `main`. Never rewrite pushed history.
- Tag `v1.0.0` when P8 passes.

## Definition of done (every task)
Typecheck passes, lint passes, relevant tests pass, UI checked at 390px and 1280px in light and dark, `PROGRESS.md` updated, committed and pushed.

## Never
- Invent opportunities, deadlines, requirements, acceptance rates, or source URLs. Everything shown to students comes from a fetched official page or is labelled unknown.
- Show a "success rate" or acceptance probability. We show eligibility matching only (see `docs/DECISIONS.md` D1).
- Copy full articles or posts. Short original summaries plus a link to the source.
- Run destructive commands outside the repo, `rm -rf` on paths you did not create, or drop production tables.
