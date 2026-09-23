# Student 360 — Decisions

## Locked (do not reverse without the owner)
- **D1 — No success rate.** We show eligibility matching (met / not met / unknown per requirement), not acceptance probability. Programmes rarely publish applicant data; a number would be invented and would mislead students. Real outcome stats come in V2 from our own users' reported results.
- **D2 — AI on our key, capped.** Students do not bring API keys (non-technical users will not). We pay for a cheap model with a daily per-user cap. Provider is swappable through the AI SDK.
- **D3 — Official links only.** Aggregators are for discovery. Every published opportunity links to the organisation's own page.
- **D4 — Summaries, not copies.** Our own short summaries plus a link. No republished posts or articles.
- **D5 — Rwanda university students only.** Every feature and source is chosen for them.
- **D6 — Hosted services, no Docker.** The owner's machine has 4 GB RAM. Supabase hosted, jobs in GitHub Actions, heavy checks in CI.
- **D7 — Progress is a main tab.** It drives return visits; hiding it in Settings would bury it.
- **D8 — Cohorts are opt-out, text-only, no DMs.** Safety and moderation load stay manageable for one owner.
- **D9 — Advisor scope is career and study life.** Not therapy, medical, legal, or investment advice. Distress is redirected to people and 112.
- **D10 — Mobile-first, light pages.** Students are on Android phones and mobile data.
- **D11 — Design system in `DESIGN.md`.** Based on the owner's "concise design" palette (ink, teal, amber, red on warm neutrals). No gradients, no purple/pink, no decorative UI.
- **D12 — English only in V1.** The advisor answers in the student's language if they write in Kinyarwanda or French.

## Owner actions outside the build
- Register with NCSA as a personal data controller before public launch.
- Enable Gemini API billing before real CVs are processed.
- Vercel Hobby plan is for non-commercial use; move to Pro (or another host) before monetising.

## Made during build
- 2026-09-23 — AI models configured — Selected `gemini-2.5-flash-lite` for `AI_MODEL_FAST` (fast, economical for extraction and parsing) and `gemini-2.5-flash` for `AI_MODEL_SMART` (high quality for advisor and reviews), verified against live Google AI API.

