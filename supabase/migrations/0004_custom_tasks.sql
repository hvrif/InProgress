-- Replaces the fixed 3-question check-in (exercised/kept_diet/worked_hours)
-- with a user-defined daily task list. Tasks are deactivated, never
-- hard-deleted, so historical days stay intact even after the list changes.

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table tasks enable row level security;
create policy "own tasks" on tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Per-day, per-task completion. daily_logs stays one row per day; this is
-- the many-rows-per-day detail table.
create table task_completions (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references daily_logs(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (daily_log_id, task_id)
);
alter table task_completions enable row level security;
create policy "own task completions" on task_completions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index task_completions_log_idx on task_completions (daily_log_id);

-- daily_logs: drop the fixed 3-boolean shape, replace with a task-count
-- snapshot. is_win can no longer be `generated always as` (it now depends on
-- another table via task_completions), so it becomes a plain column computed
-- at write time in application code. The generated is_win column must be
-- dropped BEFORE the columns it depends on, or Postgres refuses the drop.
alter table daily_logs drop column is_win;
alter table daily_logs drop column exercised;
alter table daily_logs drop column kept_diet;
alter table daily_logs drop column worked_hours;
alter table daily_logs rename column work_description to notes;
alter table daily_logs alter column notes drop not null;
alter table daily_logs add column is_win boolean not null default false;
alter table daily_logs add column completed_count int not null default 0;
alter table daily_logs add column total_count int not null default 0;
