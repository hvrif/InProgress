# Handoff

State snapshot for switching between machines (Mac / Windows desktop). Claude
reads this automatically at the start of each session and updates it
automatically before stopping if the working tree has changes.

## Last session
- 2026-07-16 — Fixed a coaching-prompt bug the user flagged as making the AI coach "feel copy and paste" / "cringe."
  - Root cause: `lib/anthropic.ts`'s `buildSystemPrompt`, in the relapse-handling rule, told the model to quote the user's onboarding `why_text` back **verbatim, in full** every single time it detected a relapse pattern — so if `why_text` names a specific person, the coach mechanically recited the exact same paragraph turn after turn.
  - Fix: rule now says to reference the stakes in the coach's own words, pull one specific detail (not the whole block), and never phrase it the same way twice in a row.
  - `npx tsc --noEmit` and `npm run lint` both clean. Not yet tested against a live conversation (needs migration 0009 applied + a real check-in to observe over multiple relapse-flagged turns).

## Current state
- **Migration `supabase/migrations/0009_stat_points_and_shop.sql` still needs to be applied to the live Supabase project** (carried over from last session — level-up stat points + coin shop for cosmetics/XP potions). Shop/stat-point routes will error until it's run.
- Game system built last session: task completion still auto-bumps tagged stats; level-ups bank free stat points (`user_stats.unspent_stat_points`) spent via `/api/character/allocate-stat`; `/shop` sells cosmetics (equip via `/api/character/equip`, rendered as emoji on `CharacterAvatar`) and XP potions (`/api/shop/purchase`) with coins.
- App also has onboarding, daily check-ins, tasks, coins, character system (Supabase-backed), Anthropic SDK-driven coach. Auth middleware in `proxy.ts` gates all routes except `/login` and `/auth/callback`.
- `.env.local.example` documents required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`.
- `node_modules/` is not committed — run `npm install` after `git pull` if `package.json`/`package-lock.json` changed.

## Next
- Apply migration 0009, then test the game system end-to-end (see previous handoff notes).
- User should try a few real check-in conversations to confirm the coach no longer feels repetitive/scripted; if it still does, look beyond the verbatim-quote bug — e.g. the "exactly one question every reply" structural rule in `buildSystemPrompt` could be a secondary contributor worth revisiting.
