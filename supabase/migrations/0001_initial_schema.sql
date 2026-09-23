-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- Types & Enums
create type level_type as enum ('diploma', 'bachelor', 'master', 'phd');
create type user_role as enum ('user', 'admin');

-- 1. Universities Table
create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text not null,
  city text not null,
  official_url text not null,
  is_verified boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS for Universities
alter table public.universities enable row level security;

create policy "Universities are readable by everyone"
  on public.universities for select
  using (true);

create policy "Universities can be modified by admins only"
  on public.universities for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 2. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  university_id uuid references public.universities(id) on delete set null,
  university_other text,
  college text,
  programme text,
  level level_type not null default 'bachelor',
  year_of_study int check (year_of_study between 1 and 7),
  expected_graduation date,
  gpa numeric(4,2),
  gpa_scale numeric(4,2) default 4.0,
  nationality text not null default 'Rwandan',
  gender text check (gender in ('female', 'male', 'other', 'prefer_not_to_say')),
  date_of_birth date,
  languages jsonb default '[]'::jsonb,
  skills text[] default array[]::text[],
  fields text[] default array[]::text[],
  interests text[] default array[]::text[],
  goals text[] default array[]::text[],
  destinations text[] default array[]::text[],
  experience jsonb default '[]'::jsonb,
  leadership jsonb default '[]'::jsonb,
  cv_path text,
  cv_parsed jsonb,
  email_opt_in boolean not null default false,
  onboarding_complete boolean not null default false,
  role user_role not null default 'user',
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Function & trigger to maintain updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can view and edit all profiles"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Profile creation hook on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
