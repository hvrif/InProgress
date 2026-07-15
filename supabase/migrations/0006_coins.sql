-- Coins: a separate, spendable/losable balance alongside XP (which stays
-- permanent and untouched). Awarded/deducted at the same day-finalization
-- moments computeXp already runs at.

alter table user_stats add column coin_balance int not null default 0;

create table coin_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_log_id uuid references daily_logs(id) on delete set null,
  delta int not null,
  reason text not null check (reason in ('day_win', 'day_miss', 'shop_purchase')),
  created_at timestamptz not null default now()
);
alter table coin_ledger enable row level security;
create policy "own coin ledger" on coin_ledger for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index coin_ledger_user_idx on coin_ledger (user_id, created_at desc);
