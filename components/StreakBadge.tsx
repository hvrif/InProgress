import type { UserStats } from "@/lib/types";

export function StreakBadge({ stats }: { stats: UserStats }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-base">🔥</span>
        <span className="font-semibold text-neutral-100">
          {stats.current_streak}
        </span>
        <span className="text-neutral-500">day streak</span>
      </div>
      <div className="h-4 w-px bg-neutral-800" />
      <div className="flex items-center gap-1.5">
        <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs font-medium text-neutral-300">
          Lv {stats.level}
        </span>
        <span className="text-neutral-500">{stats.total_xp} XP</span>
      </div>
    </div>
  );
}
