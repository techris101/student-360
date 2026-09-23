# Student 360 — Architecture (V1)

## Stack
| Layer | Choice | Notes |
|---|---|---|
| App | Next.js App Router, TypeScript strict | Server Components default |
| Styling | Tailwind CSS, shadcn/ui primitives | Restyled to `DESIGN.md` tokens. Delete shadcn defaults that conflict |
| Icons | lucide-react | 1.5 stroke |
| DB/Auth/Storage/Realtime | Supabase (hosted only) | RLS on every table |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/google`) | Models from env; provider swappable |
| Scraping | `fetch`, `rss-parser`, `cheerio`, `@mozilla/readability` + `linkedom`, `robots-parser` | Runs in GitHub Actions |
| PDF text | `unpdf` | Server side, CV parsing |
| Email | Resend (optional) | Disabled if no key |
| Tests | Vitest (unit), Playwright (smoke, in CI) | |
| Hosting | Vercel | Deploy via CLI with `VERCEL_TOKEN`, then connect Git for auto deploys |
| Jobs | GitHub Actions cron | Pipeline twice daily, reminders daily, digest weekly |
| Package manager | pnpm | |

## Repository layout
```
/AGENTS.md  /PROGRESS.md  /docs/*
/src/app/(marketing)/          landing, about, privacy, terms
/src/app/(auth)/               sign-in, callback
/src/app/(app)/opportunities/  feed, [id]
/src/app/(app)/advisor/
/src/app/(app)/cohorts/        list, [id]
/src/app/(app)/news/
/src/app/(app)/progress/
/src/app/(app)/profile/  /settings/  /onboarding/
/src/app/admin/                review queue, sources, moderation, runs
/src/app/api/                  advisor stream, cv parse, internal webhooks
/src/components/ui/            primitives (restyled)
/src/components/               feature components
/src/lib/eligibility/          engine + tests
/src/lib/ranking/  /src/lib/dedupe/  /src/lib/ai/  /src/lib/supabase/  /src/lib/validation/
/scripts/pipeline/             ingest, extract, dedupe, publish, expire
/scripts/jobs/                 reminders, digest
/supabase/migrations/          SQL migrations (source of truth for schema)
/supabase/seed/                universities, sources
/.github/workflows/            ci.yml, pipeline.yml, reminders.yml, digest.yml, lighthouse.yml
```

## Supabase usage
- Hosted project only. `supabase link --project-ref $SUPABASE_PROJECT_REF`, `supabase db push`, `supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > src/lib/supabase/types.ts`. No `supabase start`, no Docker.
- Auth: Google OAuth and email magic link. Redirect URLs for localhost and the Vercel domain. If Google OAuth needs owner setup in Google Cloud, log it as a blocker and ship magic link first.
- Storage bucket `cvs`: private, 5 MB limit, PDF only, path `{user_id}/cv.pdf`.
- Extensions: `pg_trgm` (dedupe similarity), `unaccent`. Full-text search on opportunities via a generated `tsvector` column.

## Data model (write as migrations; adjust names only if you log why)
```
universities(id, name, short_name, city, official_url, is_verified)

profiles(id uuid pk = auth.users.id, full_name, university_id, university_other,
  college, programme, level enum(diploma,bachelor,master,phd), year_of_study int,
  expected_graduation date, gpa numeric null, gpa_scale numeric null,
  nationality text default 'Rwandan', gender text null, date_of_birth date null,
  languages jsonb  -- [{language, level, test, score, date}]
  skills text[], fields text[], interests text[], goals text[], destinations text[],
  experience jsonb, leadership jsonb, cv_path text null, cv_parsed jsonb null,
  email_opt_in bool default false, onboarding_complete bool default false,
  role enum(user,admin) default 'user', suspended bool default false,
  created_at, updated_at)

sources(id, name, url, kind enum(rss,html,manual), category enum(opportunity,news),
  is_official bool, is_aggregator bool, active bool, crawl_hint jsonb,
  last_run_at, last_success_at, fail_count int)

opportunities(id, type enum(scholarship,fellowship,internship,course,competition,
  conference,grant,exchange,research), title, organisation, summary text,
  key_facts jsonb, official_url text unique, source_id, deadline date null,
  deadline_rolling bool, opens_at date null, starts_at date null,
  location_scope enum(rwanda,africa,abroad,online,mixed), location_text,
  funding enum(full,partial,none,unknown), levels text[], fields text[],
  eligibility jsonb, plan_ahead bool, prepare_now jsonb null,
  status enum(pending_review,published,rejected,expired), confidence numeric,
  content_hash text, search tsvector generated,
  first_seen_at, last_checked_at, published_at, created_at, updated_at)

news_items(id, title, summary, url unique, source_id, published_at,
  category enum(universities,policy,funding,careers), relevance numeric,
  status enum(pending_review,published,rejected), created_at)

applications(id, user_id, opportunity_id, status enum(saved,applying,submitted,
  interview,accepted,rejected,withdrawn), had_interview bool null, notes text,
  created_at, updated_at, unique(user_id, opportunity_id))

application_events(id, application_id, from_status, to_status, created_at)

cohorts(id, opportunity_id unique, closes_at, created_at)
cohort_members(cohort_id, user_id, joined_at, rules_accepted_at, left_at, pk(cohort_id,user_id))
messages(id, cohort_id, user_id, body text check (char_length(body) between 1 and 1000),
  hidden bool default false, created_at)
message_reports(id, message_id, reporter_id, reason, created_at, unique(message_id, reporter_id))
user_blocks(blocker_id, blocked_id, created_at, pk(blocker_id, blocked_id))

ai_threads(id, user_id, title, created_at)
ai_messages(id, thread_id, role enum(user,assistant), content, tokens_in, tokens_out, created_at)
ai_usage(user_id, day date, messages int, tokens int, pk(user_id, day))
progress_reviews(id, user_id, content, stats jsonb, created_at)

notifications(id, user_id, kind, title, body, link, read_at, created_at)
pipeline_runs(id, kind, started_at, finished_at, stats jsonb, errors jsonb)
seen_urls(url_hash pk, url, first_seen_at, outcome)
```

### RLS summary
- `profiles`: owner reads/writes own row. Cohort co-members may read `full_name` (first name shown), university, programme through a `cohort_member_profiles` view only.
- `opportunities`, `news_items`, `universities`: anyone reads `published`; admins read/write all.
- `applications`, `application_events`, `ai_*`, `progress_reviews`, `notifications`: owner only.
- `messages`: read if active member of the cohort and message not hidden and author not blocked by reader; insert if active member, not suspended, cohort open, rate limit OK (enforced in a Postgres function or server action).
- `message_reports`, `user_blocks`: owner inserts/reads own.
- Admin checks via `role = 'admin'`, set by a server action that compares the signed-in email to `ADMIN_EMAILS`.
- Write RLS tests (SQL or Vitest against the hosted DB with test users) for applications, messages, and profiles.

## Eligibility engine (`src/lib/eligibility`)
Pure function: `evaluate(profile, eligibility, today) -> { checks: Check[], met, notMet, unknown, total, hardFail }`.
`eligibility` JSON produced by extraction (validated by zod):
```
{ rwandans_eligible: true|false|null, nationalities: string[]|null, regions: string[]|null,
  levels: string[]|null, years_of_study: number[]|null, fields: string[]|null,
  min_gpa: {value, scale}|null, max_age: number|null, age_on: date|null,
  gender: 'female'|'male'|null, language_tests: [{test, min_score}]|null,
  work_experience_years: number|null, other: string[] }
```
- Each non-null rule becomes one Check: `met | not_met | unknown` plus plain-language label and a fix hint.
- Profile field missing → `unknown` with "Add your X".
- `other` items are always `unknown` with "Check on the official page".
- GPA: convert between scales linearly only when both scales are known; otherwise `unknown`.
- `hardFail` when any of nationality, level, gender, or age is `not_met`.
- Tests: at least 25 cases including missing data, scale conversion, age boundaries, rolling deadlines.

## Ranking (`src/lib/ranking`)
Score = eligibility ratio (met / (met + notMet)) × 0.5 + field/interest overlap × 0.3 + deadline proximity × 0.2 (closer within 60 days scores higher; past deadlines excluded). Hard fails excluded unless the filter is on. Deterministic and unit-tested.

## Ingestion pipeline (`scripts/pipeline`, run by `.github/workflows/pipeline.yml`)
Schedule: `0 22 * * *` and `0 10 * * *` UTC (midnight and midday in Kigali), plus manual dispatch.
1. **Load** active sources.
2. **Discover** candidate URLs: RSS items, or HTML listing pages parsed with cheerio using `crawl_hint` (selectors, URL patterns). Skip URLs already in `seen_urls`.
3. **Politeness:** respect robots.txt, User-Agent `Student360Bot/1.0 (+SITE_URL/bot)`, one request per second per domain, 15 s timeout, max 3 retries with backoff. Mark sources failing 5 runs in a row as inactive and surface in admin.
4. **Read** each page to clean text with Readability. Discard pages under 300 characters.
5. **Extract** with `AI_MODEL_FAST` using the extraction prompt in `AI_ADVISOR.md`, zod-validated JSON. Invalid JSON → one retry → otherwise log and skip.
6. **Filter:** drop if not open to Rwandan students, if the deadline has passed, or if not an opportunity.
7. **Resolve official link:** for items discovered on aggregators, find the official organisation URL on the page. None found → `pending_review` with a flag. Never publish an aggregator URL as the official link.
8. **Dedupe:** canonical URL match, then `content_hash` of normalised organisation + title, then `pg_trgm` similarity > 0.8 on title within the same organisation. Merge updates into the existing row.
9. **Publish rule:** `confidence >= 0.8` and official domain → `published`. Otherwise `pending_review`.
10. **Expire:** mark past-deadline items `expired`. Re-check published items older than 7 days (`last_checked_at`) for changed deadlines.
11. **Notify:** create batched in-app notifications for users newly eligible.
12. **Log** to `pipeline_runs`. Hard cap of LLM calls per run (default 200) to control cost.
News follows the same path with the news prompt and a relevance threshold (≥ 0.6).
Secrets for Actions are set with `gh secret set` from `.env.local`.

## AI integration (`src/lib/ai`)
- One module wraps model access. Models from `AI_MODEL_FAST` and `AI_MODEL_SMART`. Look up current model names in Google AI Studio docs and write them into `.env.local`, `.env.example` comments, and Vercel env.
- Advisor: streaming route handler, `AI_MODEL_SMART`, tools `search_opportunities(query, filters)` and `get_opportunity(id)` backed by Postgres full-text search. Context assembly and prompt in `AI_ADVISOR.md`.
- Cap: `AI_DAILY_MESSAGE_CAP` per user per day via `ai_usage` (atomic upsert-increment in a Postgres function). Over cap → clear message with reset time (midnight Kigali, UTC+2).
- Max output tokens: advisor 700, review 500, extraction 1,200.
- Log token counts per call. Admin page shows daily totals.

## Realtime
Cohort messages via Supabase Realtime (postgres_changes on `messages` filtered by `cohort_id`). Paginate history 50 at a time.

## Jobs
- `reminders.yml` daily 05:00 UTC: deadline reminders at 7 and 1 days (in-app, email if opted in).
- `digest.yml` Mondays 05:00 UTC: weekly email digest (only if Resend configured).
- `ci.yml` on push/PR: install, typecheck, lint, unit tests, build.
- `lighthouse.yml` on push to main after deploy: mobile Lighthouse on `/`, `/opportunities`, one detail page.

## Performance budget
- First-load JS under 150 KB gzipped on `/` and `/opportunities`.
- No client-side data fetching for first paint of lists.
- Fonts via `next/font`, subset, `display: swap`.
- Images: none required for core flows.
- Lighthouse mobile: performance ≥ 90, accessibility ≥ 95, best practices ≥ 95.

## Environment
See `.env.example`. Mirror all runtime variables into Vercel with `vercel env add` (production and preview) and pipeline variables into GitHub secrets.

## Cost guardrails
Free tiers everywhere at launch. LLM cost controlled by: cheap models, per-user daily cap, pipeline call cap, token limits. The admin page shows yesterday's token usage.
