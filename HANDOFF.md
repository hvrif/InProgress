# Handoff

State snapshot for switching between machines (Mac / Windows desktop). Claude
reads this automatically at the start of each session and updates it
automatically before stopping if the working tree has changes.

## Last session
- 2026-07-16 — Continued fixing the AI coach "feels copy-paste/cringe" complaint from earlier this session, with a real end-to-end test.
  - First fix (already committed as 9f0fbb7): stopped the coach from quoting `why_text` back verbatim on every relapse.
  - User then pointed out the *remaining* problem via a live sim: even paraphrased, forcing a `why_text` detail into every relapse reply produces non-sequiturs (e.g. "eating cookies" tied to "your sister's debt" — no real connection).
  - Second fix (this commit, `lib/anthropic.ts` `buildSystemPrompt` relapse rule): the coach now defaults to staying on the actual pattern/rationalization in front of the user, and only reaches for the bigger-picture "why" when there's a genuine direct link to the moment — not as a mandatory move every time.
  - Verified via `scripts/test-checkin.local.ts` (gitignored, real Anthropic API call) — reran the same relapse scenario before/after; second version stayed on-topic (mom's cooking, the "doesn't count" rationalization, the Wednesday counter-example) instead of detouring into unrelated stakes.
  - Known minor deviation observed, not yet acted on: one reply in testing ended without the mandatory closing question (prompt rule says every non-closing reply ends in exactly one question). User was asked whether to tighten that instruction further — no answer yet.

## Current state
- **Migration `supabase/migrations/0009_stat_points_and_shop.sql` still needs to be applied to the live Supabase project** (carried over — level-up stat points + coin shop). Shop/stat-point routes will error until it's run.
- `scripts/test-checkin.local.ts` exists locally (gitignored, matches the `scripts/*.local.ts` convention) — a two-turn relapse-scenario repro script useful for testing further coach prompt tweaks without going through the browser. Run with `node --env-file=.env.local --import tsx scripts/test-checkin.local.ts`.
- Game system (stat points, shop) and coach prompt both built/tuned this and last session — no other in-progress work.

## Next
- Ask the user whether to tighten the "always end with a question" rule in `buildSystemPrompt` (they hadn't answered when this session ended).
- Apply migration 0009, then test the game system end-to-end (see previous handoff notes).
- Consider testing the coach prompt against a `win` and `miss` scenario too (only `relapse` has been manually verified since the fixes).
