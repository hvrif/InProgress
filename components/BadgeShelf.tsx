import { emojiForTaskTitle, nextTierThreshold, tierForStreak, type Tier } from "@/lib/badges";
import type { TaskStreak } from "@/lib/queries";
import type { UserStats } from "@/lib/types";

const TIER_STYLES: Record<Tier, string> = {
  bronze: "border-amber-700 bg-amber-950/40 text-amber-200",
  silver: "border-neutral-400 bg-neutral-800/60 text-neutral-100",
  gold: "border-yellow-500 bg-yellow-950/40 text-yellow-200",
};

function Tile({
  emoji,
  title,
  tier,
  subtitle,
}: {
  emoji: string;
  title: string;
  tier: Tier | null;
  subtitle: string;
}) {
  const locked = tier === null;

  return (
    <div
      className={[
        "flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-center transition",
        locked ? "border-neutral-800 bg-neutral-900/60 text-neutral-500" : TIER_STYLES[tier],
        tier === "gold" ? "animate-pulse" : "",
      ].join(" ")}
    >
      <span className={["text-2xl", locked ? "grayscale opacity-40" : ""].join(" ")}>
        {locked ? "🔒" : emoji}
      </span>
      <p className="text-xs font-medium leading-tight">{title}</p>
      <p className="text-[11px] opacity-80">{subtitle}</p>
    </div>
  );
}

const GLOBAL_BADGES: { title: string; threshold: number; tier: Tier }[] = [
  { title: "7-Day Warrior", threshold: 7, tier: "bronze" },
  { title: "30-Day Warrior", threshold: 30, tier: "silver" },
  { title: "100-Day Legend", threshold: 100, tier: "gold" },
];

export function BadgeShelf({
  stats,
  taskStreaks,
}: {
  stats: UserStats;
  taskStreaks: TaskStreak[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-400">Badges</h2>
        <div className="grid grid-cols-3 gap-2">
          {GLOBAL_BADGES.map((b) => {
            const unlocked = stats.longest_streak >= b.threshold;
            return (
              <Tile
                key={b.title}
                emoji="🏆"
                title={b.title}
                tier={unlocked ? b.tier : null}
                subtitle={
                  unlocked
                    ? `🔥 ${stats.longest_streak} day streak`
                    : `${b.threshold - stats.longest_streak} days to go`
                }
              />
            );
          })}
        </div>
      </div>

      {taskStreaks.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-neutral-500">Task streaks</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {taskStreaks.map((ts) => {
              const tier = tierForStreak(ts.longestStreak);
              const next = nextTierThreshold(ts.longestStreak);
              return (
                <Tile
                  key={ts.taskId}
                  emoji={emojiForTaskTitle(ts.title)}
                  title={`${ts.title} Streak`}
                  tier={tier}
                  subtitle={
                    tier
                      ? `🔥 ${ts.currentStreak} day streak`
                      : `${next! - ts.longestStreak} days to bronze`
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
