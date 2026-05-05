-- Run this entire file in your Supabase SQL editor:
-- Dashboard → SQL Editor → New query → paste this → Run

create table characters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,

  -- Step 1: Race & Class
  race       text,
  subrace    text,
  class      text,
  subclass   text,

  -- Step 2: Story & Background
  backstory  text,
  goal       text,
  background text,

  -- Step 3: Skills
  skills     text[],

  -- Step 4: Ability Scores
  ability_scores       jsonb,
  ability_score_method text,

  -- Step 5: Identity
  name       text,
  alignment  text,

  -- Step 4: Equipment
  equipment    jsonb,

  -- Starting level
  level        int  default 1,

  -- Wizard state
  current_step int  default 1,
  completed    bool default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security so users only see their own characters
alter table characters enable row level security;

create policy "Users can manage their own characters" on characters
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at on every change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger characters_updated_at
  before update on characters
  for each row execute function update_updated_at();

-- ============================================================
-- Profiles table (user roles)
-- Run this block after the characters block above
-- ============================================================

create table profiles (
  id     uuid primary key references auth.users(id) on delete cascade,
  email  text,
  is_dm  boolean not null default false
);

alter table profiles enable row level security;

-- Security-definer helper — avoids recursive RLS when policies query profiles
create or replace function is_dm()
returns boolean as $$
  select coalesce((select is_dm from profiles where id = auth.uid()), false);
$$ language sql security definer stable;

-- Users can read their own profile
create policy "Users can read own profile" on profiles
  for select using (auth.uid() = id);

-- Users can insert/update their own profile (needed for app-layer upsert fallback)
create policy "Users can upsert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- DMs can read all profiles
create policy "DMs can read all profiles" on profiles
  for select using (is_dm());

-- DMs can read all characters (supplements the per-user policy)
create policy "DMs can read all characters" on characters
  for select using (is_dm());

-- Auto-create profile on new signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
exception
  when others then
    -- Never block auth if profile creation fails; the app upserts as fallback.
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill existing users
insert into profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Set Joaquin as DM
update profiles set is_dm = true where email = 'galang.joaquin.dev@gmail.com';
