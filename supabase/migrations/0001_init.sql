-- profiles: one row per user, written once at onboarding
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  identity_and_failure text not null,
  main_goal text not null,
  non_negotiables text not null,
  danger_zone text not null,
  why_text text not null,
  welcome_message text not null,
  onboarding_completed_at timestamptz not null default now()
);

-- daily_logs: one row per user per day
create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  exercised boolean not null,
  kept_diet boolean not null,
  worked_hours boolean not null,
  work_description text not null,
  is_win boolean generated always as (exercised and kept_diet and worked_hours) stored,
  ai_response text not null,
  xp_earned int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

-- user_stats: single row per user, updated on every check-in
create table user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  total_xp int not null default 0,
  level int not null default 1,
  last_log_date date,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table daily_logs enable row level security;
alter table user_stats enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own logs" on daily_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own stats" on user_stats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index daily_logs_user_date_idx on daily_logs (user_id, log_date desc);
