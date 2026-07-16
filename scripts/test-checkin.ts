/**
 * Reruns the same check-in input against generateDayResponse N times so you
 * can compare tone/quality across prompt edits without going through the
 * browser, magic-link email, or a live Supabase profile.
 *
 * Usage:
 *   npm run test:checkin -- --scenario=miss --runs=3
 *   npm run test:checkin -- --scenario=relapse
 *   npm run test:checkin -- --scenario=win
 *
 * Sample data below is a generic placeholder persona, not a real person —
 * edit SAMPLE_* below (or copy this file to test-checkin.local.ts, which is
 * gitignored) if you want to test against your own real onboarding answers
 * without committing them.
 */
import {
  generateDayResponse,
  type RecentLogWithTasks,
  type TaskStatus,
} from "../lib/anthropic";
import type { Profile, TaskCompletionWithTitle, UserStats } from "../lib/types";

type Scenario = "win" | "miss" | "relapse";

function parseArgs() {
  const args = process.argv.slice(2);
  const scenarioArg = args.find((a) => a.startsWith("--scenario="));
  const runsArg = args.find((a) => a.startsWith("--runs="));
  const scenario = (scenarioArg?.split("=")[1] ?? "miss") as Scenario;
  const runs = Number(runsArg?.split("=")[1] ?? "3");
  return { scenario, runs };
}

const SAMPLE_PROFILE: Profile = {
  id: "test-user",
  identity_and_failure:
    "Someone with real ambition and no support system. I fail because I let one bad night turn into a bad week — I tell myself there's always tomorrow, then Friday comes and I've undone the whole week.",
  main_goal: "Build my app into something that actually makes money.",
  non_negotiables: "Exercise, Keep diet, Work on project",
  danger_zone: "Late at night, alone, bored, nothing else going on.",
  why_text:
    "My family is under real financial pressure and they're counting on me to be the one who breaks that cycle. I told myself I wouldn't let another year pass without changing something.",
  welcome_message: "",
  onboarding_completed_at: new Date().toISOString(),
};

const SAMPLE_STATS_BASE: Pick<
  UserStats,
  "total_xp" | "level" | "updated_at" | "user_id" | "coin_balance" | "unspent_stat_points"
> = {
  user_id: "test-user",
  total_xp: 480,
  level: 3,
  updated_at: new Date().toISOString(),
  coin_balance: 60,
  unspent_stat_points: 0,
};

function makeTaskCompletion(
  logId: string,
  title: string,
  completed: boolean,
): TaskCompletionWithTitle {
  return {
    id: `${logId}-${title}`,
    daily_log_id: logId,
    task_id: `task-${title}`,
    user_id: "test-user",
    completed,
    created_at: new Date().toISOString(),
    task_title: title,
  };
}

function makeLog(
  daysAgo: number,
  overrides: { exercised?: boolean; keptDiet?: boolean; workedHours?: boolean },
): RecentLogWithTasks {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  const log_date = date.toISOString().slice(0, 10);
  const exercised = overrides.exercised ?? true;
  const keptDiet = overrides.keptDiet ?? true;
  const workedHours = overrides.workedHours ?? true;
  const completedCount = [exercised, keptDiet, workedHours].filter(Boolean).length;
  const id = `log-${daysAgo}`;

  return {
    id,
    user_id: "test-user",
    log_date,
    is_win: completedCount === 3,
    completed_count: completedCount,
    total_count: 3,
    xp_earned: 0,
    created_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    tasks: [
      makeTaskCompletion(id, "Exercise", exercised),
      makeTaskCompletion(id, "Keep diet", keptDiet),
      makeTaskCompletion(id, "Work on project", workedHours),
    ],
  };
}

// 7 days back, oldest first. Deliberately repeats a "Keep diet" miss on the
// same two days — history is now structural (which task, which day) rather
// than narrative, since freeform notes were replaced by the chat itself —
// so the pattern-detection instructions still have something real to find.
const RECENT_LOGS: RecentLogWithTasks[] = [
  makeLog(7, {}),
  makeLog(6, { keptDiet: false }),
  makeLog(5, {}),
  makeLog(4, {}),
  makeLog(3, {}),
  makeLog(2, { keptDiet: false }),
  makeLog(1, {}),
];

const SCENARIOS: Record<
  Scenario,
  { todayTasks: TaskStatus[]; message: string; currentStreak: number; longestStreak: number }
> = {
  win: {
    todayTasks: [
      { title: "Exercise", completed: true },
      { title: "Keep diet", completed: true },
      { title: "Work on project", completed: true },
    ],
    message: "Shipped the check-in flow end to end and tested it myself for the first time.",
    currentStreak: 4,
    longestStreak: 6,
  },
  miss: {
    todayTasks: [
      { title: "Exercise", completed: true },
      { title: "Keep diet", completed: true },
      { title: "Work on project", completed: false },
    ],
    message: "Only did about 2 hours on the project. Kept telling myself I'd start after one more video.",
    currentStreak: 0,
    longestStreak: 6,
  },
  relapse: {
    todayTasks: [
      { title: "Exercise", completed: true },
      { title: "Keep diet", completed: false },
      { title: "Work on project", completed: true },
    ],
    message:
      "Family had snacks out again tonight, told myself it was fine since I'd already worked my hours.",
    currentStreak: 6,
    longestStreak: 6,
  },
};

async function main() {
  const { scenario, runs } = parseArgs();
  const scenarioConfig = SCENARIOS[scenario];
  if (!scenarioConfig) {
    console.error(`Unknown scenario "${scenario}". Use win, miss, or relapse.`);
    process.exit(1);
  }

  const stats: UserStats = {
    ...SAMPLE_STATS_BASE,
    current_streak: scenarioConfig.currentStreak,
    longest_streak: scenarioConfig.longestStreak,
    last_log_date: RECENT_LOGS[RECENT_LOGS.length - 1].log_date,
  };

  const today = new Date();
  const logDate = today.toISOString().slice(0, 10);

  console.log(`\n=== scenario: ${scenario} | runs: ${runs} ===`);
  console.log(`Today's tasks: ${JSON.stringify(scenarioConfig.todayTasks, null, 2)}`);
  console.log(`Message: ${scenarioConfig.message}`);
  console.log(`Streak going in: ${stats.current_streak} (longest ${stats.longest_streak})\n`);

  for (let i = 1; i <= runs; i++) {
    const { reply, conversationEnded, taskUpdates } = await generateDayResponse({
      profile: SAMPLE_PROFILE,
      stats,
      recentLogs: RECENT_LOGS,
      todayTasks: scenarioConfig.todayTasks,
      logDate,
      priorMessages: [],
      newMessage: scenarioConfig.message,
    });
    console.log(
      `--- run ${i} (conversation_ended=${conversationEnded}, taskUpdates=${JSON.stringify(taskUpdates)}) ---`,
    );
    console.log(reply);
    console.log("");
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
