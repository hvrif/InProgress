# InProgress — Full Product & UI Brief (for a UI redesign)

> Paste this whole document into a fresh Claude chat. It describes what the app is, how every screen behaves, the exact rules/numbers behind it, and what is wrong with the current UI. The goal: **redesign the entire UI from scratch** (visuals, layout, navigation, interactions) while keeping the product logic below.

---

## 1. What the app is (one paragraph)

**InProgress** is a single-user **accountability app with an AI coach**. The tagline is *"One conversation. It never resets."* The user defines a handful of **daily non‑negotiable tasks**, ticks them off every day, and talks to an AI coach that **remembers their whole history**, notices patterns (same task slipping, same excuse repeated, relapse right after a good streak) and responds **sternly and specifically — never with generic validation**. Around that core sits a light **RPG / game layer**: XP, levels, a daily streak, coins, a customizable character with four stats that grow from real tasks, badges, and a shop. The coach is *not* a friendly chatbot; it's a direct, no‑fluff coach holding the user to what they said in onboarding.

Current user: one person (the builder). It is a personal tool first, but should feel like a polished product.

**Tone / feel the UI should carry:** serious, focused, a little intense ("lock-in mode"), but rewarding — game feedback (XP pops, confetti, streaks) layered on a calm, high-discipline surface. Currently it's a plain dark theme; it should feel like a deliberate designed product.

---

## 2. Tech context (so designs are buildable)

- Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript. Font: Geist Sans/Mono.
- Supabase (Postgres + Auth, row-level security on every table). Auth = email magic link (a dev-only shortcut route exists for local work).
- Anthropic API powers the coach (server-side only).
- **All business logic lives in server code/API routes; the UI is a thin layer on top.** A redesign can replace every component and page without touching logic. Mobile-first matters (this is a daily-use app on a phone), but it must also work on desktop.
- Current layout: a single centered column, `max-w-2xl`, dark (`neutral-950` background), emerald-green accent. Pure Tailwind utility classes, no component library.

---

## 3. Core concepts & rules (the "game design")

### Daily loop
1. Each calendar day has one **day log** (`daily_logs`). It is created automatically the first time the user opens the app that day.
2. When created, it gets **one task row per active task** (all unchecked), and the **coach speaks first**: an AI-generated opening message based on yesterday's result and the last 7 days.
3. The user ticks tasks on the **Home** screen (or tells the coach in chat, and the coach can tick them for them).
4. The user can press **"Submit update to coach"** after ticking → the coach reacts to what changed.
5. The user chats with the coach. When they've said everything, the coach asks *"Is that everything for today?"*; once the user confirms, the coach says a short sign-off and **the day is closed** ("ended"). The user can also press **"End for today"** manually.
6. If a day is never explicitly closed, it is **auto-finalized the next time the app is opened** (stale-day sweep).
7. When a day closes: XP, streak, coins, level and stat points are computed once.
8. After closing, the day is read-only ("You already checked in today. Come back tomorrow.").

### Numbers
| Thing | Rule |
|---|---|
| XP for checking in | +10 per day |
| XP per completed task | +15 each |
| XP per level | 200 XP (level = floor(totalXp/200)+1) |
| Win condition | ≥ **80%** of active tasks done |
| Streak | consecutive winning days; +1 on a win following the previous day, resets to 1 if a gap, **0 on a miss** |
| Streak milestone bonus XP | 7 days = +50, 30 = +100, 100 = +250 |
| Coins | **+20** on a win day, **−10** on a miss day (never below 0) |
| Stat points | **3 free points** banked per level-up, spent one at a time on a stat |
| Task stat gain | Ticking a task tagged with a stat gives **+2** to that stat instantly (unticking removes 2; floor 0) |
| Stat bar cap (visual) | 50 |

### Character
- One character per user. **Purely cosmetic appearance** — never based on the user's real body. Body build is opt-in cosmetic.
- Four stats: 💪 **Strength**, 🏃 **Endurance**, 🎯 **Focus**, 🧭 **Discipline**. Each task can be tagged with one stat (or none).
- **Class is earned, not chosen** — whichever stat is highest:
  - Strength → ⚔️ **Attacker** (red) · Endurance → 🛡️ **Tank** (sky blue) · Focus → 🔮 **Mage** (violet) · Discipline → 🕯️ **Sentinel** (amber)
  - Tie → ⚖️ **Balanced** (emerald) · all zero → 🌱 **Novice** (grey)
- **Power** = sum of all four stats. **Rank** by power: Novice (0), Apprentice (20), Adept (50), Veteran (100), Legend (150). Displayed like "Adept Mage".
- Appearance options (paper-doll, drawn as SVG): skin tone (6), hair style (bald/short/long/mohawk/curly), hair color (6), facial hair (none/stubble/mustache/beard), body build (slim/athletic/broad), legs (pants/shorts) + color (8), clothes (t-shirt/tank/tunic/robe) + color (8), armor (none/leather/plate/cloak — plate & cloak hide hair).
- Equipped shop items: one **accessory** and one **pet** (shown as emoji overlays on the avatar).

### Badges
- **Global streak badges:** 7‑Day Warrior (bronze), 30‑Day Warrior (silver), 100‑Day Legend (gold) — based on longest streak. Locked state shows "N days to go".
- **Per-task streak badges:** each task gets its own streak tile (emoji guessed from the task title, e.g. gym 🏋️, pray 🙏, code 💻, default 🎯) with the same bronze/silver/gold thresholds (7/30/100) on that task's longest streak.

### Shop (coins)
- **Accessories:** Top Hat 🎩 60, Shades 🕶️ 40, Crown 👑 150, Scarf 🧣 30
- **Pets:** Dog 🐶 80, Cat 🐱 80, Owl 🦉 100, Baby Dragon 🐉 200
- **XP Potions (consumed instantly):** Small 🧪 20 coins → +25 XP, Medium ⚗️ 55 → +75 XP, Large 🔮 140 → +200 XP
- Accessories/pets are bought once, go to inventory, then can be **Equipped / Unequipped** (one per slot). Potions can be bought repeatedly.
- Buy buttons show the price and are disabled when the user can't afford it.

---

## 4. The AI coach (behavior the UI must support)

The coach appears in **three** places, same personality, same memory:
1. **Daily check-in** (the main conversation, `/chat`): speaks first each day; back-and-forth; closes the day on confirmation.
2. **Task nudge**: after the user ticks tasks and presses "Submit update to coach," the coach sends a message reacting to exactly what changed.
3. **"Talk now" emergency chat**: a separate always-open thread reachable from every screen. For when the user is about to slip / is slipping *right now*. **No XP or streak impact**, never "ends".

Coach rules (so the UI can reflect the right vibe): 2–5 sentences + exactly one sharp question; no bullet points, no emoji, no headers; stern on misses; names specific tasks; calls out patterns; recalls the user's onboarding answers (identity, goal, danger zone, "why"). Replies in chat have a **tone**: after a day is closed, the coach's messages are tinted **green (win)** or **red (miss)**.

UI implications: replies take a few seconds (show a good thinking/typing state); messages are plain text with line breaks preserved; the conversation is **one continuous timeline across all days**, with day separators.

---

## 5. Screens, in detail (current behavior)

Global shell on every logged-in page: sticky **header** (blurred dark bar) containing, left → right:
- **Streak badge:** 🔥 `{current streak}` "day streak" | divider | pill `Lv {level}` + `{total XP} XP`
- **Nav links (small text):** Home · Chat · Tasks · Character · Shop (active one is brighter)
- **"Talk now"** red pill button (opens the emergency chat overlay)
- **Sign out** text button

(The Coins page exists at `/coins` but isn't in the nav.)

### 5.1 Login `/login`
Centered card on black: title "InProgress", subtitle "One conversation. It never resets.", an email field (placeholder `you@example.com`), a white **"Send magic link"** button (shows "Sending..." while busy). After sending, the form is replaced by "Check **{email}** for your sign-in link." Errors show in small red text under the button. Unauthenticated visits to any page redirect here.

### 5.2 Onboarding (shown at `/` when the user has no profile yet)
A **chat-style, one-time flow** titled "Before we start — A few questions, once. Answer honestly — this is what I'll hold you to." The coach asks questions one at a time as chat bubbles (coach = dark bubble left, user = white bubble right); the answered ones stay visible above, new one appears below; text input + "Next" button pinned at the bottom (autofocus). Steps:
1. "Who are you, and why do you keep failing?" (free text)
2. "What is your one main goal?"
3. "What are the tasks you want to do every day?" (free text, e.g. "gym, 5 prayers, 5 hours of work") → coach says "Breaking that down..." → AI splits it into discrete tasks → coach shows **"Here's what I heard — edit anything that's off, then confirm"** with an **editable task list** (rename, remove, add, then confirm).
4. "What is your danger zone — the time of day or situation where you slip?"
5. "Who and what do you do this for? I'll show this back to you the moment you relapse." → button says **"Finish"** → "Reading what you wrote..." → AI writes a personalized welcome message → app reloads into Home.
Errors show red with "try again".

### 5.3 Home `/` (the daily dashboard — most-used screen)
Top to bottom in one column:
1. **XP bar:** "Level 2" left, "150 / 200 XP" right, green progress bar.
2. **Coin balance card:** yellow coin dot + "Coins" … big number (e.g. 60).
3. **"Today" section → Task board:**
   - Header row "Today's quest" with `done/total` (e.g. 0/5) and a green progress bar.
   - A list of **big tappable task rows** with a checkbox square on the left. Tapping toggles complete: row turns green-tinted, checkbox pops in with a ✓ (pop animation), and a **"+15 XP" floats up** from the row for ~1s. Rows are disabled once the day is ended.
   - If **all** tasks become complete: a full-screen **celebration popup** — confetti (24 colored squares falling), a ✓, one of 4 random lines (e.g. "Every task done. That's a real day — protect it tomorrow."), and a "Keep going" button.
   - After any tick, a green full-width button appears: **"Submit update to coach"** (→ "Sending..." → "Sent — check chat for a reply."). Ticks are queued so the coach is nudged once per submit, not once per click.
   - Empty state: "No active tasks yet. Add some." (link to Tasks).
4. **Chat card** (link to /chat): label changes — "Check in with your coach today" (no message yet) / "Continue talking to your coach" / "Today's check-in is done — tap to review" — plus a 2-line preview of the latest coach message.

### 5.4 Chat `/chat`
A single, long **timeline** (messages left = coach, right = user), oldest at top:
- First, the **entire onboarding Q&A replayed** as bubbles + the coach's welcome message.
- Then for **each day**: a centered date label ("Wed, Nov 5", with a green "+{xp} XP" if that day was a win and closed), then a synthetic user bubble summarizing the tasks (`3/5 tasks completed:` then `[x] Gym` / `[ ] Diet` lines), then that day's coach/user messages. Closed days tint coach bubbles green (win) or red (miss).
- **Bottom input bar** (sticky): text field "Say more, or end for today." + white **Send** + outlined **End for today**. When the day is already closed, the bar is replaced by "You already checked in today. Come back tomorrow."

### 5.5 Tasks `/tasks`
1. "Today" task board (same component as Home).
2. **Badges** section: 3-up grid of global streak tiles (🏆; locked = 🔒 greyed with "N days to go"; bronze = amber, silver = grey/white, gold = yellow + pulsing), then a "Task streaks" grid (3–4 columns) of per-task tiles ("Gym Streak", "🔥 5 day streak" or "2 days to bronze").
3. **Manage tasks:** collapsed to an "Edit Tasks" button. Expanded: list of tasks each with a "Remove" link (soft delete; history is preserved), an "Add a task" input + a **stat dropdown** ("No stat / 💪 Strength / 🏃 Endurance / 🎯 Focus / 🧭 Discipline") + Add button, and a "Done" link.

### 5.6 Character `/character`
- If no character exists yet: **character creator** (see below).
- Otherwise, top to bottom:
  - **Stat point allocator** (only when unspent points > 0): green-bordered card "✨ 3 stat points to spend" with a 2×2 grid of stat buttons (e.g. "💪 Strength +"). Each click spends one point (+1 stat).
  - **Character sheet card** (border/glow color = class color): big avatar (SVG paper doll) on a pulsing colored aura, the class emoji floating beside it (idle bobbing animation), name, "{Rank} {Class}" in class color, a one-line class tagline, and a "⚡ Power {n}" pill.
  - **Stat radar chart** (4-axis SVG polygon, emoji at the axis tips, filled with class color).
  - **Four stat bars** (emoji + label + number; the dominant stat's bar uses the class color, others grey).
  - **"Edit Appearance"** button → opens the creator pre-filled.
- **Creator/customizer form:** live avatar preview at top, a name field ("Character name"), a boxed panel of option groups — Skin tone (swatches), Hair style (chips), Hair color (swatches), Facial hair, Body build, Legs, Legs color, Clothes, Clothes color, Armor — and a "Create character" / "Save appearance" button. Appearance is cosmetic; changes preview instantly.

### 5.7 Shop `/shop`
Balance card, then three sections — **Accessories**, **Pets**, **XP Potions** — each a vertical list of item rows: big emoji, name, one-line description, and a right-side button: `🪙 {price}` (disabled/dim if unaffordable), or for owned cosmetics **"Equip"** / green **"Equipped"** (tap to unequip). Errors show red above the list.

### 5.8 Coins `/coins` (hidden from nav)
Balance card + **history list**: each row = reason ("Day completed" / "Day missed" / "Shop purchase"), date, and a signed amount (green +20, red −10).

### 5.9 "Talk now" overlay (global)
Red pill in the header. Opens a **modal** (bottom sheet on mobile, centered card on desktop, dark scrim): title "Talk now" + Close, scrolling chat, empty-state text "Say what's going on. This doesn't count toward today's check-in — it's just for right now.", input "What's going on right now?" + Send. History loads on open and persists forever.

---

## 6. Data the UI works with (names & shapes)

- **Profile:** identity_and_failure, main_goal, non_negotiables, danger_zone, why_text, welcome_message.
- **UserStats:** current_streak, longest_streak, total_xp, level, coin_balance, unspent_stat_points, last_log_date.
- **Task:** title, active, sort_order, stat_category (strength|endurance|focus|discipline|null).
- **DailyLog:** log_date, is_win, completed_count, total_count, xp_earned, ended_at (null = open).
- **TaskCompletion:** per-day-per-task completed flag. **CheckInMessage / SupportMessage:** role (user|assistant), content, created_at.
- **Character:** name, appearance{…}, strength/endurance/focus/discipline, equipped_hair/outfit/accessory/pet.
- **ShopItem:** key, name, description, category (accessory|pet|xp_boost), emoji, price_coins, xp_amount. **InventoryEntry:** owned item. **CoinLedgerEntry:** delta, reason, date.

(Existing API routes the UI calls: tasks toggle/add/remove, checkin continue/end/nudge, support chat, onboarding + parse-tasks, character create/update/allocate-stat/equip, shop purchase. These can stay as is.)

---

## 7. What's wrong with the current UI (why we're redoing it)

- Generic and flat: near-black + grey boxes everywhere; every screen is "a stack of identical rounded rectangles." No visual identity, no hierarchy, no personality.
- Header is cramped: tiny 12px nav text, hard to tap on mobile, streak/level text mashed together; "Coins" page isn't reachable.
- No mobile navigation pattern (no bottom tab bar), even though it's a daily phone app.
- The coach — the heart of the product — is hidden behind a small card; chat is a plain list with weak day structure.
- The game layer (XP, streak, coins, character) feels bolted-on: emoji-only icons, default progress bars, no sense of progression/reward beyond the small pop animation.
- The character avatar is a rough SVG doll; the customizer is a wall of chips and swatches.
- Home doesn't answer "what do I need to do right now, and how am I doing?" at a glance.
- Little use of motion, depth, spacing, or typography; Geist is loaded but the body falls back to Arial in CSS.

---

## 8. What I want from you (the redesign request)

1. **Propose a visual identity** (palette, typography, spacing, iconography instead of emoji where it helps, motion language) that fits "serious accountability + earned RPG progression." Dark-first is fine but not required; avoid the generic grey-card look.
2. **Redesign the information architecture and navigation** — mobile-first (e.g. bottom tab bar) with a good desktop layout. Decide where Coins, Shop, Badges, and "Talk now" should live. "Talk now" must stay one tap away on every screen and feel urgent.
3. **Design each screen in section 5**, including empty, loading, error, and "day already ended" states. Make **Home** a true command center: today's progress, streak at risk, the coach's latest words, and the next action.
4. **Make the coach conversation feel premium** — clear day separators, win/miss tinting, a thinking state while the AI replies, a distinct "close the day" moment.
5. **Make progression feel good** — level-ups, streak milestones (7/30/100), stat-point spending, badge unlocks, shop purchases, all-tasks-complete celebration.
6. **Design a better character** — a stronger avatar presentation and a customizer that is fun, not a form. Keep appearance cosmetic only.
7. Keep all rules/numbers from section 3 and the data shapes from section 6 intact. Deliver as production-ready **Next.js + Tailwind** components (plus a short design-system note: tokens, components list) that I can drop in over the existing pages.

Ask me questions first if anything is ambiguous, then propose the design system before building screens one at a time.
