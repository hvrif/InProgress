# Handoff

State snapshot for switching between machines (Mac / Windows desktop). Claude
reads this automatically at the start of each session and updates it
automatically before stopping if the working tree has changes.

## Last session
- 2026-07-16 — On the Mac, pulled in the merged app work (onboarding, daily check-ins, tasks, coins, character system) which added Supabase auth (`@supabase/ssr`, `@supabase/supabase-js`) and `@anthropic-ai/sdk`. `npm run dev` initially failed with `Module not found: Can't resolve '@supabase/ssr'` because `node_modules` was stale relative to the new `package.json`. Fixed with `npm install`; dev server now boots clean and `proxy.ts` correctly redirects unauthenticated requests to `/login`.

## Current state
- App now has real functionality: onboarding, daily check-ins, tasks, coins, character system (Supabase-backed), plus Anthropic SDK usage somewhere in the app.
- Auth middleware lives in `proxy.ts` (this Next.js version's replacement for `middleware.ts` — see `AGENTS.md` breaking-changes note) and gates all routes except `/login` and `/auth/callback`.
- `.env.local.example` (tracked in git) documents the required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`. `.env.local` on this Mac is already filled in and working.
- `node_modules/` is not committed — always run `npm install` after `git pull` if `package.json`/`package-lock.json` changed, especially right after pulling a merge.

## Next
- Nothing in progress. Next session: continue building on the onboarding/check-ins/tasks/coins/character features, or pick a new feature to work on.
