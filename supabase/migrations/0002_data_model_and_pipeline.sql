-- Types & Enums for Pipeline & App Features
create type opportunity_type as enum (
  'scholarship',
  'fellowship',
  'internship',
  'course',
  'competition',
  'conference',
  'grant',
  'exchange',
  'research'
);

create type location_scope as enum ('rwanda', 'africa', 'abroad', 'online', 'mixed');
create type funding_type as enum ('full', 'partial', 'none', 'unknown');
create type opportunity_status as enum ('pending_review', 'published', 'rejected', 'expired');
create type news_category as enum ('universities', 'policy', 'funding', 'careers');
create type news_status as enum ('pending_review', 'published', 'rejected');
create type application_status as enum (
  'saved',
  'applying',
  'submitted',
  'interview',
  'accepted',
  'rejected',
  'withdrawn'
);

-- 1. Sources Table
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  kind text check (kind in ('rss', 'html', 'manual')) not null,
  category text check (category in ('opportunity', 'news')) not null,
  is_official boolean not null default true,
  is_aggregator boolean not null default false,
  active boolean not null default true,
  crawl_hint jsonb,
  last_run_at timestamptz,
  last_success_at timestamptz,
  fail_count int not null default 0
);

alter table public.sources enable row level security;
create policy "Sources are readable by everyone" on public.sources for select using (true);
create policy "Sources are writable by admins only" on public.sources for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- 2. Opportunities Table
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  type opportunity_type not null,
  title text not null,
  organisation text not null,
  summary text not null,
  key_facts jsonb,
  official_url text not null unique,
  source_id uuid references public.sources(id) on delete set null,
  deadline date,
  deadline_rolling boolean not null default false,
  opens_at date,
  starts_at date,
  location_scope location_scope not null default 'rwanda',
  location_text text,
  funding funding_type not null default 'unknown',
  levels text[] default array[]::text[],
  fields text[] default array[]::text[],
  eligibility jsonb,
  plan_ahead boolean not null default false,
  prepare_now jsonb,
  status opportunity_status not null default 'pending_review',
  confidence numeric(3,2) not null default 1.0,
  content_hash text,
  search tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(organisation, '') || ' ' || coalesce(summary, ''))
  ) stored,
  first_seen_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.handle_updated_at();

-- Indexes for Opportunities
create index if not exists idx_opportunities_status_deadline on public.opportunities (status, deadline);
create index if not exists idx_opportunities_search on public.opportunities using gin (search);
create index if not exists idx_opportunities_title_trgm on public.opportunities using gin (title gin_trgm_ops);
create index if not exists idx_opportunities_content_hash on public.opportunities (content_hash);
create index if not exists idx_opportunities_plan_ahead on public.opportunities (plan_ahead, status);

alter table public.opportunities enable row level security;
create policy "Published opportunities readable by everyone" on public.opportunities for select
  using (status = 'published' or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Opportunities writable by admins only" on public.opportunities for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- 3. News Items Table
create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  url text not null unique,
  source_id uuid references public.sources(id) on delete set null,
  published_at timestamptz,
  category news_category not null default 'universities',
  relevance numeric(3,2) not null default 1.0,
  status news_status not null default 'pending_review',
  created_at timestamptz not null default now()
);

alter table public.news_items enable row level security;
create policy "Published news readable by everyone" on public.news_items for select
  using (status = 'published' or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "News writable by admins only" on public.news_items for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- 4. Applications Table
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status application_status not null default 'saved',
  had_interview boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.handle_updated_at();

alter table public.applications enable row level security;
create policy "Users can view own applications" on public.applications for select using (auth.uid() = user_id);
create policy "Users can insert own applications" on public.applications for insert with check (auth.uid() = user_id);
create policy "Users can update own applications" on public.applications for update using (auth.uid() = user_id);
create policy "Users can delete own applications" on public.applications for delete using (auth.uid() = user_id);

-- 5. Application Events Table
create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status application_status,
  to_status application_status not null,
  created_at timestamptz not null default now()
);

alter table public.application_events enable row level security;
create policy "Users can view own application events" on public.application_events for select
  using (exists (select 1 from public.applications where applications.id = application_events.application_id and applications.user_id = auth.uid()));
create policy "Users can insert own application events" on public.application_events for insert
  with check (exists (select 1 from public.applications where applications.id = application_events.application_id and applications.user_id = auth.uid()));

-- 6. Cohorts & Cohort Members Table
create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null unique references public.opportunities(id) on delete cascade,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.cohorts enable row level security;
create policy "Cohorts are readable by everyone" on public.cohorts for select using (true);
create policy "Cohorts writable by admins only" on public.cohorts for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create table if not exists public.cohort_members (
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  rules_accepted_at timestamptz,
  left_at timestamptz,
  primary key (cohort_id, user_id)
);

alter table public.cohort_members enable row level security;
create policy "Cohort members can view memberships" on public.cohort_members for select
  using (auth.uid() = user_id or exists (select 1 from public.cohort_members as cm where cm.cohort_id = cohort_members.cohort_id and cm.user_id = auth.uid() and cm.left_at is null));
create policy "Users can join cohorts" on public.cohort_members for insert with check (auth.uid() = user_id);
create policy "Users can update own cohort membership" on public.cohort_members for update using (auth.uid() = user_id);

-- Cohort Member Profiles View (privacy preserving: first name, university, programme only)
create or replace view public.cohort_member_profiles as
select
  cm.cohort_id,
  cm.user_id,
  split_part(p.full_name, ' ', 1) as first_name,
  coalesce(u.name, p.university_other, 'University student') as university_name,
  coalesce(p.programme, 'Student') as programme,
  cm.joined_at
from public.cohort_members cm
join public.profiles p on p.id = cm.user_id
left join public.universities u on u.id = p.university_id
where cm.left_at is null and p.suspended = false;

-- 7. Messages, Reports, and Blocks
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id)
);

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- RLS for Messages
alter table public.messages enable row level security;
alter table public.message_reports enable row level security;
alter table public.user_blocks enable row level security;

create policy "Messages readable by non-blocked cohort members" on public.messages for select
  using (
    hidden = false
    and exists (
      select 1 from public.cohort_members as cm
      where cm.cohort_id = messages.cohort_id and cm.user_id = auth.uid() and cm.left_at is null
    )
    and not exists (
      select 1 from public.user_blocks
      where blocker_id = auth.uid() and blocked_id = messages.user_id
    )
  );

create policy "Messages insertable by active cohort members" on public.messages for insert
  with check (
    auth.uid() = user_id
    and not exists (select 1 from public.profiles where id = auth.uid() and suspended = true)
    and exists (
      select 1 from public.cohort_members as cm
      where cm.cohort_id = messages.cohort_id and cm.user_id = auth.uid() and cm.left_at is null
    )
    and exists (
      select 1 from public.cohorts as c
      where c.id = messages.cohort_id and (c.closes_at is null or c.closes_at > now())
    )
  );

create policy "Users can report messages" on public.message_reports for insert with check (auth.uid() = reporter_id);
create policy "Users can view own reports" on public.message_reports for select using (auth.uid() = reporter_id);
create policy "Users can manage blocks" on public.user_blocks for all using (auth.uid() = blocker_id);

-- Trigger to auto-hide message upon 3 reports
create or replace function public.handle_message_reports_count()
returns trigger as $$
declare
  report_count int;
begin
  select count(*) into report_count from public.message_reports where message_id = new.message_id;
  if report_count >= 3 then
    update public.messages set hidden = true where id = new.message_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_message_reported
  after insert on public.message_reports
  for each row execute function public.handle_message_reports_count();

-- 8. AI Threads, Messages, Usage
create table if not exists public.ai_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.ai_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  tokens_in int,
  tokens_out int,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'Africa/Kigali')::date,
  messages int not null default 0,
  tokens int not null default 0,
  primary key (user_id, day)
);

alter table public.ai_threads enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_usage enable row level security;

create policy "Users own ai threads" on public.ai_threads for all using (auth.uid() = user_id);
create policy "Users own ai messages" on public.ai_messages for all
  using (exists (select 1 from public.ai_threads where ai_threads.id = ai_messages.thread_id and ai_threads.user_id = auth.uid()));
create policy "Users own ai usage" on public.ai_usage for all using (auth.uid() = user_id);

-- Atomic increment for AI usage function
create or replace function public.increment_ai_usage(
  p_user_id uuid,
  p_day date,
  p_messages int,
  p_tokens int
)
returns table (messages int, tokens int) as $$
begin
  return query
  insert into public.ai_usage (user_id, day, messages, tokens)
  values (p_user_id, p_day, p_messages, p_tokens)
  on conflict (user_id, day) do update
  set
    messages = public.ai_usage.messages + excluded.messages,
    tokens = public.ai_usage.tokens + excluded.tokens
  returning public.ai_usage.messages, public.ai_usage.tokens;
end;
$$ language plpgsql security definer;

-- 9. Progress Reviews, Notifications, Pipeline Runs, Seen URLs
create table if not exists public.progress_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  stats jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb,
  errors jsonb
);

create table if not exists public.seen_urls (
  url_hash text primary key,
  url text not null,
  first_seen_at timestamptz not null default now(),
  outcome text
);

alter table public.progress_reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.pipeline_runs enable row level security;
alter table public.seen_urls enable row level security;

create policy "Users own progress reviews" on public.progress_reviews for all using (auth.uid() = user_id);
create policy "Users own notifications" on public.notifications for all using (auth.uid() = user_id);
create policy "Pipeline runs viewable by admins" on public.pipeline_runs for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Seen urls viewable by admins" on public.seen_urls for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
