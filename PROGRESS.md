# PROGRESS

Current phase: P1 — Foundation (Completed) -> P2 — Data model & Ingestion Pipeline
Status: in progress
Next action: P2.1 — Data model migrations for all remaining tables (sources, opportunities, news, cohorts, messages, etc.), RLS, indexes, and full-text search

## Phases
| Phase | Name | Status |
|---|---|---|
| P0 | Bootstrap | done |
| P1 | Foundation: design system, shell, auth, onboarding | done |
| P2 | Data model and ingestion pipeline | in_progress |
| P3 | Opportunities: feed, detail, eligibility, Plan ahead | todo |
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
- P1.1: Design tokens mapped into CSS variables & Tailwind v4 theme in `globals.css`; IBM Plex Sans applied via `next/font/google`; light/dark theme toggle implemented with `next-themes`.
- P1.2: Restyled UI primitives in `src/components/ui/` (button, input, select, textarea, dialog, sheet, dropdown-menu, tabs, toast, skeleton, chip); `/dev/ui` verification page live and tested.
- P1.3: Responsive AppShell created (`src/components/shell/app-shell.tsx`): 232px sidebar on desktop, 64px icon rail on tablet, 56px top bar & 5-tab bottom navigation on mobile, right rail slot.
- P1.4: Supabase architecture in `src/lib/supabase/` (client, server, service, middleware, types).
- P1.5: Auth flow in `src/app/(auth)/sign-in/page.tsx` (magic link + Google sign-in), `src/app/auth/callback/route.ts`, and `src/app/auth/sign-out/route.ts`.
- P1.6: Migrations in `supabase/migrations/0001_initial_schema.sql` and `supabase/seed/universities.sql` (16 Rwandan institutions).
- P1.7: 3-step onboarding flow in `src/app/(app)/onboarding/page.tsx` with privacy consent screen, PDF text extraction via `unpdf` and AI structured parsing via `AI_MODEL_FAST` (`/api/cv/parse`).
- P1.8: Profile page (`/profile`), Settings page (`/settings`) with theme switch, email reminder toggle, data export (JSON), and delete account with confirmation dialog. Server actions in `src/app/actions/account.ts`.
- Tests & build: `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, and `pnpm run build` all pass with exit code 0.

## Session log (newest first, one line per old session)
- 2026-09-23: P1 completed (Design system, UI primitives, app shell, auth, onboarding, profile, settings, account export/delete). Next: P2 data model & ingestion pipeline.
- 2026-09-23: P0 completed (scaffold, tooling, vitest, env validation, Gemini models, CI workflow).
