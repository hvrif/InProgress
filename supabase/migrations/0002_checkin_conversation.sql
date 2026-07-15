-- Lets a day's check-in continue as a back-and-forth conversation instead of
-- a single Q&A exchange. The four structured answers + first AI reply still
-- live on daily_logs (unchanged); anything after that is a checkin_messages
-- row. A day is "closed" once ended_at is set — either the coach proposed
-- ending and the user confirmed, or the user hit "End for today" directly.

alter table daily_logs add column ended_at timestamptz;

create table checkin_messages (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references daily_logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table checkin_messages enable row level security;

create policy "own checkin messages" on checkin_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index checkin_messages_log_idx on checkin_messages (daily_log_id, created_at);
