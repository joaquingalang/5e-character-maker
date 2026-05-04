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
