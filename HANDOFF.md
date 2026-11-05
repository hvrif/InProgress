# Handoff

State snapshot for switching between machines (Mac / Windows desktop). Claude
reads this automatically at the start of each session and updates it
automatically before stopping if the working tree has changes.

## Last session
- 2026-11-05 (Windows) — Audited the project and ran it in Chrome. Debugged login: first `Failed to fetch` (Supabase URL in `.env.local` pointed at a host that didn't resolve), then a red `{}` (Supabase `500 Error sending confirmation email` from `/auth/v1/otp`; the project is reachable and the key is valid, but it can't send the magic-link email — likely the built-in mailer rate limit or a bad SMTP config).
- Added a dev-only login shortcut: `app/auth/dev/route.ts` (+ `/auth/dev` in `proxy.ts` PUBLIC_PATHS, two new vars in `.env.local.example`). It mints a real session for one fixed user via the admin `generateLink` + `verifyOtp`, with no email. Returns 404 unless `NODE_ENV=development`. `/login` is unchanged. **Not yet tested** (needs the service role key).
- Earlier (2026-07-16, Mac) — Tuned the AI coach relapse replies in `lib/anthropic.ts` `buildSystemPrompt`: stopped quoting `why_text` verbatim, and now stays on the actual pattern/rationalization unless the "why" genuinely connects to the moment. Verified with `scripts/test-checkin.local.ts` (gitignored, real Anthropic call). One reply in testing skipped the mandatory closing question; user was asked whether to tighten that rule — no answer yet.

## Current state
- Next.js 16 / React 19 / Tailwind 4 app is built out: auth (magic link), onboarding chat, daily check-ins, tasks, coins, character system, emergency support chat, plus stat points and a coin shop.
- Dev server runs (`npm run dev`); unauthenticated visits redirect to `/login`. Everything behind login is unverified on Windows. RLS is on all tables (`auth.uid()`), so a real Supabase session is required.
- **Migration `0009_stat_points_and_shop.sql` still needs to be applied to the live Supabase project** (shop/stat-point routes error until then). Migrations 0001–0008 are also unverified on the project in `.env.local`.
- Supabase project in `.env.local` is `ynblivsqwvfoeezuydqc` — NOT visible to the Supabase MCP account (which only lists `adkx…` and `kmzg…`), so migrations can't be checked/applied from the MCP.
- `scripts/test-checkin.local.ts` (gitignored) is a two-turn relapse repro: `node --env-file=.env.local --import tsx scripts/test-checkin.local.ts`.

## Next
1. In `.env.local` (not committed) add `DEV_LOGIN_EMAIL=<your email>` and `SUPABASE_SERVICE_ROLE_KEY=<secret key from Supabase → Project Settings → API Keys>`, restart `npm run dev`, open `http://localhost:3000/auth/dev`.
2. Confirm migrations 0001–0009 are applied to the `ynbl…` project.
3. Click through onboarding, check-in, tasks, coins, shop, character pages and fix what breaks.
4. Make `app/login/page.tsx` show a real error message (the error text can be empty -> red `{}`), and fix the email sending (SMTP / rate limit) before shipping.
5. Ask whether to tighten the "always end with a question" coach rule; test the coach on `win` and `miss` scenarios too.
6. Run `npm run build` + lint to check health.
