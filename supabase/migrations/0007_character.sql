-- Manual per-task stat tagging (Strength/Endurance/Focus/Discipline).
-- Nullable: tasks aren't required to feed a stat.
alter table tasks add column stat_category text
  check (stat_category in ('strength', 'endurance', 'focus', 'discipline'));

-- One row per user. base_id/equipped_* are cosmetic-only preset picks — no
-- real-body data, opt-in appearance changes only.
create table characters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  base_id text not null,
  strength int not null default 0,
  endurance int not null default 0,
  focus int not null default 0,
  discipline int not null default 0,
  equipped_hair text,
  equipped_outfit text,
  equipped_accessory text,
  equipped_pet text,
  created_at timestamptz not null default now()
);
alter table characters enable row level security;
create policy "own character" on characters for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
