-- "Talk now" — an always-available thread separate from the daily check-in.
-- No XP/streak impact, no ended_at concept; it's just an open line to the
-- coach for whenever (danger-zone moments, after a slip, before a decision).

create table support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table support_messages enable row level security;

create policy "own support messages" on support_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index support_messages_user_idx on support_messages (user_id, created_at);
