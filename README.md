# InProgress

One continuous conversation with an AI coach that holds you to what you said on day one. No new-chat button, no reset — onboarding plus every daily check-in since lives in one scrolling thread.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the migration** — in the Supabase SQL editor, paste and run `supabase/migrations/0001_init.sql`. It creates `profiles`, `daily_logs`, `user_stats`, and enables Row Level Security scoped to `auth.uid()`.
3. **Enable email auth** — in Supabase Dashboard → Authentication → Providers, confirm Email is on (magic link is part of the default email provider, no extra setup).
4. **Copy env vars** — `cp .env.local.example .env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase Dashboard → Settings → API.
   - `ANTHROPIC_API_KEY` — from the [Anthropic Console](https://console.anthropic.com).
5. **Run it:**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`, where entering your email sends a magic link. Clicking it drops you into the one-time onboarding, then the daily check-in.

## Email delivery (Resend)

Supabase's built-in email sender is rate-limited to a few emails/hour — fine for the first login, not for daily use. To send magic links through Resend instead:

1. Supabase Dashboard → **Authentication → Emails → SMTP Settings** → enable **Custom SMTP**.
2. Fill in:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: your Resend API key (`re_...`)
   - Sender email: `onboarding@resend.dev`
   - Sender name: `InProgress`
3. Save.

**No domain required to start** — Resend's shared `onboarding@resend.dev` sender works without domain verification, but only delivers to the email address your Resend account itself is registered under. That's fine for single-user use. Once you verify a domain in Resend (a few DNS records, whenever you get one), switch the sender email to `something@yourdomain.com` to send to anyone.

## How it works

- **Auth**: Supabase magic link (passwordless), session cookies refreshed by `proxy.ts` (Next.js's middleware convention, renamed in Next 16).
- **Data**: `profiles` (onboarding answers, written once), `daily_logs` (one row per day), `user_stats` (streak/XP/level, updated on every check-in). All RLS-scoped — ready for multiple users without schema changes, just open up who can request a login link.
- **AI**: `lib/anthropic.ts` calls `claude-sonnet-5` on every check-in, rebuilding context from Postgres each time (full profile + last 7 days) — no client-side chat history is trusted. See `lib/xp.ts` for the streak/XP formulas (tunable constants at the top of the file).

## Testing the coach's tone without the browser

`scripts/test-checkin.ts` calls `generateCheckInResponse` directly with sample data — no Supabase profile, no email, no browser needed. Useful for iterating on the prompt in `lib/anthropic.ts` and comparing output across runs/edits.

```bash
npm run test:checkin -- --scenario=miss      # default: worked_hours=false
npm run test:checkin -- --scenario=relapse   # diet break after a 6-day streak
npm run test:checkin -- --scenario=win       # all three hit
npm run test:checkin -- --scenario=relapse --runs=5
```

The sample profile/history is a generic placeholder, not real data — edit the `SAMPLE_*` constants directly, or copy the file to `scripts/test-checkin.local.ts` (gitignored) if you want to test against your own real onboarding answers without committing them.

## Notes for later (multi-user)

Nothing in the schema or RLS policies assumes a single user — `auth.uid()` scoping is already in place. Opening this up to more people is just removing whatever gate you put in front of `/login` (there isn't one yet).
