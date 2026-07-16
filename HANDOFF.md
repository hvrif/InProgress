# Handoff

State snapshot for switching between machines (Mac / Windows desktop). Claude
reads this automatically at the start of each session and updates it
automatically before stopping if the working tree has changes.

## Last session
- 2026-07-16 — Built the game upgrade system: level-up stat points and a coin shop.
  - `lib/xp.ts`: `STAT_POINTS_PER_LEVEL` (3) — every level-up banks free stat points into `user_stats.unspent_stat_points`, allocated 1 at a time via `/api/character/allocate-stat` (+2 per point, same unit a completed task grants).
  - New `/shop` page + `ShopGrid` component: coins buy cosmetics (4 accessories, 4 pets — equip/unequip via `/api/character/equip`, rendered as emoji layers on `CharacterAvatar`) and XP potions (`/api/shop/purchase`, consumed instantly, feed the same level-up → stat-point pipeline). Coins never buy stats directly, per design decision made this session.
  - New migration `supabase/migrations/0009_stat_points_and_shop.sql`: `user_stats.unspent_stat_points` column, `shop_items` catalog (seeded), `inventory` table.
  - Repurposed previously-dead columns (`characters.equipped_accessory`, `equipped_pet`, `coin_ledger.reason = 'shop_purchase'`) that existed from earlier work but were never wired up.
  - `npx tsc --noEmit` and `npm run lint` both clean. Dev server boots and auth-redirects correctly; shop/stat-point flows not yet tested live.

## Current state
- **Migration 0009 has NOT been applied to the live Supabase project yet** — no DB connection from this session. Run it via the Supabase dashboard SQL editor or CLI before testing the shop or stat-point allocation in the running app, otherwise those routes will error on the missing column/tables.
- App also has: onboarding, daily check-ins, tasks, coins, character system (Supabase-backed), Anthropic SDK usage. Auth middleware in `proxy.ts` gates all routes except `/login` and `/auth/callback`.
- `.env.local.example` documents required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`.
- `node_modules/` is not committed — run `npm install` after `git pull` if `package.json`/`package-lock.json` changed.

## Next
- Apply migration 0009 to Supabase, then manually test: earning a level-up grants stat points, allocating a point bumps the right stat, buying/equipping a cosmetic shows up on the avatar, buying an XP potion adds XP and (if it crosses a level) more stat points.
- No other work in progress.
