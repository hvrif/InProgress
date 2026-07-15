import { XP_PER_LEVEL } from "@/lib/xp";
import type { UserStats } from "@/lib/types";

export function XpBar({ stats }: { stats: UserStats }) {
  const xpIntoLevel = stats.total_xp % XP_PER_LEVEL;
  const pct = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>Level {stats.level}</span>
        <span>
          {xpIntoLevel} / {XP_PER_LEVEL} XP
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
