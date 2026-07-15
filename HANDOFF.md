# Handoff

State snapshot for switching between machines (Mac / Windows desktop). Claude
reads this automatically at the start of each session and updates it
automatically before stopping if the working tree has changes.

## Last session
- 2026-07-15 — Cloned the repo on the Mac, ran `npm install`, confirmed `npm run dev` serves at http://localhost:3000. Set up the Claude Code handoff automation itself (this file + `.claude/settings.json` hooks).

## Current state
- Fresh Next.js 16 / React 19 / Tailwind 4 app from `create-next-app`, no custom features built yet.
- `node_modules/` is not committed — run `npm install` after every `git pull` on a machine that hasn't installed yet.

## Next
- Nothing in progress. Next session: decide what to actually build.
