export type Tier = "bronze" | "silver" | "gold";

// Same numbers as STREAK_MILESTONES in lib/xp.ts, so a "7-day streak" means
// the same thing everywhere in the app, whether it's a day streak or a
// single task's streak.
export const BADGE_TIERS: { threshold: number; tier: Tier }[] = [
  { threshold: 7, tier: "bronze" },
  { threshold: 30, tier: "silver" },
  { threshold: 100, tier: "gold" },
];

export function tierForStreak(longestStreak: number): Tier | null {
  let reached: Tier | null = null;
  for (const { threshold, tier } of BADGE_TIERS) {
    if (longestStreak >= threshold) reached = tier;
  }
  return reached;
}

export function nextTierThreshold(longestStreak: number): number | null {
  for (const { threshold } of BADGE_TIERS) {
    if (longestStreak < threshold) return threshold;
  }
  return null;
}

const EMOJI_KEYWORDS: [RegExp, string][] = [
  [/exercise|workout|gym/i, "🏋️"],
  [/run/i, "🏃"],
  [/walk/i, "🚶"],
  [/eat|food|diet|nutrition|health/i, "🥗"],
  [/water|hydrate/i, "💧"],
  [/sleep/i, "😴"],
  [/read/i, "📖"],
  [/meditat|mindful/i, "🧘"],
  [/journal|write/i, "✍️"],
  [/code|study|work/i, "💻"],
  [/pray/i, "🙏"],
];

export function emojiForTaskTitle(title: string): string {
  for (const [pattern, emoji] of EMOJI_KEYWORDS) {
    if (pattern.test(title)) return emoji;
  }
  return "🎯";
}
