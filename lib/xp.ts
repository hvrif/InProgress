import type { UserStats } from "@/lib/types";

export const XP_FOR_CHECKING_IN = 10;
export const XP_PER_TASK_COMPLETED = 15;
export const XP_PER_LEVEL = 200;

// Free stat points banked each time total_xp crosses a level threshold —
// spent one at a time via /api/character/allocate-stat.
export const STAT_POINTS_PER_LEVEL = 3;

// A day only counts toward the streak if at least this fraction of active
// tasks got done — partial credit on XP, but the streak needs real
// consistency, not just "did something."
export const STREAK_THRESHOLD = 0.8;

export const STREAK_MILESTONES: Record<number, number> = {
  7: 50,
  30: 100,
  100: 250,
};

export function levelForXp(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

function isConsecutiveDay(prevDate: string | null, logDate: string): boolean {
  if (!prevDate) return false;
  const prev = new Date(prevDate + "T00:00:00Z");
  const curr = new Date(logDate + "T00:00:00Z");
  const diffDays = Math.round(
    (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays === 1;
}

export interface XpResult {
  xpEarned: number;
  isWin: boolean;
  newStats: Pick<
    UserStats,
    "current_streak" | "longest_streak" | "total_xp" | "level" | "last_log_date"
  >;
  hitMilestone: number | null;
  statPointsEarned: number;
}

/**
 * Pure function: given today's task completion counts and the prior stats
 * row, compute the new streak/XP/level state. `logDate` is the ISO date
 * (YYYY-MM-DD) of the check-in being scored.
 */
export function computeXp(
  completedCount: number,
  totalCount: number,
  logDate: string,
  prevStats: Pick<
    UserStats,
    "current_streak" | "longest_streak" | "total_xp" | "level" | "last_log_date"
  >,
): XpResult {
  const completionRate = totalCount > 0 ? completedCount / totalCount : 0;
  const isWin = completionRate >= STREAK_THRESHOLD;

  let xpEarned = XP_FOR_CHECKING_IN + completedCount * XP_PER_TASK_COMPLETED;

  let currentStreak: number;
  if (isWin) {
    currentStreak = isConsecutiveDay(prevStats.last_log_date, logDate)
      ? prevStats.current_streak + 1
      : 1;
  } else {
    currentStreak = 0;
  }

  let hitMilestone: number | null = null;
  if (isWin && STREAK_MILESTONES[currentStreak]) {
    hitMilestone = currentStreak;
    xpEarned += STREAK_MILESTONES[currentStreak];
  }

  const totalXp = prevStats.total_xp + xpEarned;
  const longestStreak = Math.max(prevStats.longest_streak, currentStreak);
  const newLevel = levelForXp(totalXp);
  const statPointsEarned = Math.max(0, newLevel - prevStats.level) * STAT_POINTS_PER_LEVEL;

  return {
    xpEarned,
    isWin,
    newStats: {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_xp: totalXp,
      level: newLevel,
      last_log_date: logDate,
    },
    hitMilestone,
    statPointsEarned,
  };
}
