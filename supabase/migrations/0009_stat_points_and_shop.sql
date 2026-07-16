-- Level-up stat points: banked whenever total_xp crosses a level threshold
-- (see STAT_POINTS_PER_LEVEL in lib/xp.ts), spent one at a time on whichever
-- stat the player picks via /api/character/allocate-stat.
alter table user_stats add column unspent_stat_points int not null default 0;

-- Shop catalog: cosmetics (accessory/pet — bought once, then equipped/
-- unequipped freely) and xp_boost (consumed immediately on purchase, never
-- added to inventory). Shared read-only catalog, seeded below.
create table shop_items (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  category text not null check (category in ('accessory', 'pet', 'xp_boost')),
  emoji text not null,
  price_coins int not null,
  xp_amount int,
  sort_order int not null default 0
);
alter table shop_items enable row level security;
create policy "read shop items" on shop_items for select using (auth.role() = 'authenticated');

-- Cosmetics a user owns — permanent, one row per (user, item). xp_boost
-- purchases never land here; they're applied straight to user_stats.
create table inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references shop_items(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  unique (user_id, item_id)
);
alter table inventory enable row level security;
create policy "own inventory" on inventory for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into shop_items (key, name, description, category, emoji, price_coins, xp_amount, sort_order) values
  ('acc_tophat', 'Top Hat', 'A dapper accessory for a distinguished adventurer.', 'accessory', '🎩', 60, null, 1),
  ('acc_shades', 'Shades', 'Cool under any deadline.', 'accessory', '🕶️', 40, null, 2),
  ('acc_crown', 'Crown', 'Wear your progress with pride.', 'accessory', '👑', 150, null, 3),
  ('acc_scarf', 'Scarf', 'A cozy touch for the long grind.', 'accessory', '🧣', 30, null, 4),
  ('pet_dog', 'Dog', 'A loyal companion that never misses a check-in.', 'pet', '🐶', 80, null, 1),
  ('pet_cat', 'Cat', 'Judges your streak silently.', 'pet', '🐱', 80, null, 2),
  ('pet_owl', 'Owl', 'Wise, watchful, nocturnal focus buddy.', 'pet', '🦉', 100, null, 3),
  ('pet_dragon', 'Baby Dragon', 'Grows fiercer as you do.', 'pet', '🐉', 200, null, 4),
  ('xp_small', 'Small XP Potion', 'An instant +25 XP.', 'xp_boost', '🧪', 20, 25, 1),
  ('xp_medium', 'Medium XP Potion', 'An instant +75 XP.', 'xp_boost', '⚗️', 55, 75, 2),
  ('xp_large', 'Large XP Potion', 'An instant +200 XP.', 'xp_boost', '🔮', 140, 200, 3);
