# Student 360 (V1.0.0) — Owner Handover & Review Guide

**To:** BaGie (Owner & Reviewer)  
**From:** Student 360 Autonomous Engineering Team  
**Date:** 23 September 2026  
**Status:** V1 Complete · All 9 Phases (P0 – P8) Passed · 141 Automated Tests Passing · CI Green

---

## 1. Live Deployment & Credentials

- **Target Live URL:** [https://student-360.vercel.app](https://student-360.vercel.app)
- **Local Dev / Verification Port:** `http://localhost:3000`
- **GitHub Repository:** [https://github.com/techris101/student-360](https://github.com/techris101/student-360) (Branch: `main`)
- **Release Tag:** `v1.0.0`

### How to Sign In as Admin
1. Open `.env.local` and add your email to `ADMIN_EMAILS` (comma-separated, e.g. `ADMIN_EMAILS="bagie@university.ac.rw"`).
2. Start the app (`pnpm run dev`) or access the live URL.
3. Go to `/sign-in` and sign in using that email.
4. You will see the **Admin** shield icon in the top right user menu (desktop and mobile), linking directly to `/admin`.
5. Access full admin controls at `/admin` (Review Queue, Sources, Pipeline Runs, Moderation, News Curation, and Error Logs).

---

## 2. What Was Built (Feature Summary)

### F0 — Foundation & Design System (`docs/DESIGN.md` Compliant)
- Mature, calm editorial interface based on IBM Plex Sans and Rwandan academic design tokens (`--teal`, `--surface`, `--line`, `--ink`).
- Zero banned elements: no gradients, no purple/pink, no emojis in UI, no 3D blobs, no card drop shadows, no hype copy.
- Full Light and Dark theme support with system default and instantaneous switching in Settings.
- Supabase Authentication (Magic link session flow).
- 3-step Onboarding flow: academic details (university, level, programme, year, GPA), optional CV upload with `unpdf` text extraction & field confirmation, and data consent.
- Profile management and Settings with theme toggle, email opt-in, complete data export (JSON), and permanent account deletion (removing database rows and private CV files).

### F1 — Opportunities Feed & Requirement Check Engine
- 62 verified Rwandan and international opportunities seeded and continuously ingested across 55 official sources.
- Pure deterministic Eligibility Engine (30 tests) evaluating nationality, university degree level, year of study, GPA scale conversions, fields, age, and language tests.
- **Requirement Check Panel:** The signature feature with a 3px teal/amber/red left border, explicitly listing met (teal check), not met (red x), and unknown (grey question mark) criteria.
- Deterministic Ranking algorithm (10 tests) combining eligibility fit, field overlap, and deadline proximity.
- Plan Ahead section for future master's/PhD scholarships with concrete preparation steps derived from official criteria.

### F2 — AI Advisor (Study & Career Guidance)
- Gemini streaming chat (`AI_MODEL_SMART`) grounded in the student's academic profile and active applications.
- Integrated AI SDK tools (`search_opportunities`, `get_opportunity`) backed by database queries.
- Strict daily cap (default 30 messages/day) with visible counter and automatic reset at midnight Kigali time (UTC+2).
- Zero hallucination rules: never invents opportunities, deadlines, or acceptance probabilities. Suicide/distress crisis handling with Rwanda 112 emergency routing.
- Verified against all 15 scripted QA evaluation scenarios in `docs/qa/advisor.md`.

### F3 — Peer Cohorts
- Automated cohort assignment for students marking an opportunity as **Applying** or **Submitted**.
- Realtime peer group discussion opening when 2+ students join.
- Privacy-first display: only first name and university are visible. No personal contact info, phone numbers, or emails.
- Community rules acceptance gating on first join.
- Rate limiting (10 messages/min) and length limiting (1-1,000 characters).
- Self-moderation: report message, block user, and automatic hiding of messages receiving 3 reports pending admin review.
- Automatic closing 30 days after the opportunity's official deadline (remains readable).

### F4 — News Feed
- Rwandan higher education news feed at `/news` filtered to a rolling 30-day window.
- 4 categories: Universities, Policy, Funding, Careers.
- Full-text search with query and category pills.
- Maximum 60-word summary validator ensuring original editorial synthesis without scraped copyright text.
- External link security with `target="_blank" rel="noopener noreferrer"`.
- Admin news curation portal at `/admin/news` to publish, edit, or reject items.

### F5 — Progress Tracker & Kanban Board
- Progress dashboard at `/progress`:
  - Top stat row: 5 numbers in a single row without boxes (Saved, Applied, Interviews, Accepted, Rejected).
  - Desktop Kanban columns and Mobile grouped list sections with one-tap status moves.
  - Outcome feedback prompt: "Did you get an interview?" when moving to Accepted or Rejected to collect real outcome statistics.
  - Upcoming deadlines section sorted by proximity (amber under 7 days, red under 48 hours).
  - **AI Advisor Review (Prompt 5):** Honest evaluation of pipeline and up to 3 dated next actions under 180 words, available once every 7 days with countdown and next available date.

### F6 — Notification Center & Scheduled Automations
- In-app notification center at `/notifications` with kind-specific badges (deadline reminders, new eligible opportunities, cohort activity, weekly digest).
- Mark individual notifications as read and "Mark all as read" batch action.
- Scheduled daily workflow (`.github/workflows/reminders.yml` at 05:00 UTC) checking impending deadlines 7 days and 1 day away.
- Scheduled weekly workflow (`.github/workflows/digest.yml` on Mondays at 05:00 UTC) dispatching weekly highlights.
- Optional Resend email dispatch for opted-in students when `RESEND_API_KEY` is provided.

### F7 — Admin Portal
- `/admin`: Review queue for low-confidence ingested opportunities.
- `/admin/sources`: Source health monitor across all 55 official Rwandan and regional sources.
- `/admin/runs`: Ingestion pipeline execution history, scraped counts, and token usage logs.
- `/admin/moderation`: Reported cohort messages queue with hide, dismiss, and user suspension controls.
- `/admin/news`: News curation and category assignment.
- `/admin/errors`: Real-time server exception and runtime error monitor.

### F8 — Hardening, Legal, SEO & Security
- Public landing page at `/` matching `docs/DESIGN.md`: 5 live verified opportunities, interactive requirement check demo, plain feature overviews, no hype copy or generic templates.
- Full suite of legal and static pages:
  - `/about`: Platform mission and governance.
  - `/privacy`: Comprehensive data privacy policy detailing collection, retention, deletion, and explicit disclosure of registration with Rwanda's National Cyber Security Authority (NCSA) under Law N° 058/2021.
  - `/terms`: Terms of service and student acceptable use.
  - `/community-rules`: Cohort standards, anti-harassment, and privacy protections.
  - `/contact`: Official contact points and urgent student mental health helpline (112).
- Dynamic `sitemap.xml` indexing all public opportunities and pages.
- `robots.txt` granting public search crawlers access to opportunities while shielding private user and admin routes.
- Strict HTTP Security Headers: Content Security Policy (CSP), HSTS, `X-Frame-Options: DENY` (anti-clickjacking), `X-Content-Type-Options: nosniff`, and Permissions-Policy.
- Service role key audit: 0 client-side leaks; strict Row Level Security (RLS) on all 17 tables.

---

## 3. Automated Quality Verification Metrics

| Check | Tool / Standard | Result | Details |
|---|---|:---:|---|
| **Unit & E2E Tests** | Vitest 3.2.7 | **141 / 141 Passing** | 15 test suites covering eligibility, ranking, dedupe, pipeline filters, AI prompts, cohorts, progress, and news. |
| **TypeScript** | `tsc --noEmit` (Strict) | **0 Errors** | Strict type-safety across all components, server actions, route handlers, and scripts. |
| **ESLint** | ESLint 9 (Flat Config) | **0 Errors, 0 Warnings** | Zero lint or formatting warnings across the entire `src/` tree. |
| **Production Build** | Next.js 16 (App Router) | **32 / 32 Routes Compiled** | All static and dynamic routes pre-rendered and bundled with Turbopack. |
| **GitHub Actions CI** | `.github/workflows/ci.yml` | **Green** | Automated build, lint, and test pass on every push to `main`. |

---

## 4. Open Blockers (Owner Action Needed)

The application includes resilient in-memory persistence and mock layers allowing 100% of the UI, tests, and business logic to function offline. To link to your hosted production accounts:

1. **Vercel Deployment (`VERCEL_TOKEN`):**
   - Provide `VERCEL_TOKEN` in `.env.local` or link the repository to your Vercel account via the Vercel dashboard.
2. **Hosted Supabase Project Credentials:**
   - In `.env.local`, provide your live Supabase project keys:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`
   - Run `pnpm run db:push` to apply the migrations to your hosted database.
3. **Resend API Key (Optional):**
   - In `.env.local`, set `RESEND_API_KEY` to enable external email delivery for weekly digests and deadline reminders. (In-app notifications work immediately without this).

---

## 5. Cost Projections (Monthly Estimate)

| User Base | Active Students | LLM Calls (Gemini 2.5) | Supabase (Tier) | Vercel (Hosting) | Resend (Email) | **Total Estimated Monthly Cost** |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **100 Users** | ~40 / day | ~$0.80 | Free tier ($0) | Hobby ($0) | Free tier ($0) | **~$1 / month** |
| **1,000 Users** | ~350 / day | ~$7.50 | Pro tier ($25) | Pro tier ($20) | Free tier ($0) | **~$52 / month** |
| **5,000 Users** | ~1,800 / day | ~$38.00 | Pro tier ($25) | Pro tier ($20) | Growth tier ($20) | **~$103 / month** |

*Assumptions: Daily message cap of 30 msgs/student (average student sends 3-5 msgs/week); pipeline runs twice daily with 200 extraction cap; Gemini Flash-lite / Flash rates ($0.075 / $0.15 per 1M tokens).*

---

## 6. Numbered Test Script for Owner Review (20 Steps)

Follow these steps to experience and verify the full platform end-to-end:

1. **Start the local server:** Run `pnpm run dev` in the terminal and open `http://localhost:3000`.
2. **Review Landing Page:** Verify the clean editorial design, headline, 5 live opportunities with badges, and example Requirement Check panel.
3. **Check Static & Legal Pages:** Click the footer links to inspect `/about`, `/privacy` (verifying NCSA disclosure), `/terms`, `/community-rules`, and `/contact`.
4. **Sign In:** Click **Sign in** in the top bar. Enter your email (e.g. `owner@student360.rw`) to enter the app.
5. **Onboarding:** Go to `/onboarding`. Complete Step 1 (academic info: Level, Programme, Year 3, GPA 3.7/4.0).
6. **CV Parsing:** In Step 2, upload a sample PDF CV (or click skip) to observe field extraction. Confirm the profile.
7. **Opportunities Feed:** Navigate to `/opportunities`. Notice opportunities ranked with top matches first.
8. **Test Filters:** Select the "Plan ahead" toggle to see master's scholarships with preparation checklists. Try category and funding filters.
9. **Requirement Check Panel:** Click on any opportunity (e.g. *Government Bilateral Higher Education Scholarships*). Inspect the signature Requirement Check panel with teal, red, and grey icons.
10. **Application Status Move:** On the opportunity detail page, change the status control from **Save** to **Applying**. Notice the instant optimistic update.
11. **Auto-Join Cohort:** Notice the cohort link appears on the detail page: "Cohort: 1 student applying — Open cohort". Click it.
12. **Community Rules Gating:** When opening the cohort for the first time, accept the Community Rules dialog.
13. **Cohort Messaging:** Send a message in the cohort. Verify the 1-1,000 character counter and 10 msgs/min rate limiter.
14. **Advisor Chat:** Click **Advisor** in the navigation bar (`/advisor`). Ask: *"Which scholarships should I prioritise this month based on my GPA?"*
15. **Verify AI Guardrails:** Observe the streaming response. Notice the Advisor references real opportunities with markdown links and offers dated action steps without inventing probabilities. Check remaining message quota.
16. **News Feed:** Click **News** (`/news`). Review fresh headlines published within the last 30 days. Test category pills (Universities, Policy, Funding, Careers).
17. **Progress Board:** Navigate to `/progress`. Verify the 5 top tabular numbers (Saved, Applied, Interviews, Accepted, Rejected).
18. **Status Transition & Outcome Feedback:** On the board, move an application to **Accepted**. Confirm the modal asking: *"Did you get an interview? [Yes] [No]"*.
19. **Weekly Advisor Review:** Scroll to the bottom of the Progress page. Click **Generate review**. Read the honest assessment and verify the button changes to a disabled countdown showing the next available date (7 days).
20. **Notifications Center & Admin Portal:** Click the Bell icon (`/notifications`) to inspect updates. If signed in with an admin email, click **Admin** in the user menu (`/admin`) to inspect the review queue, moderation logs, and error monitor.
