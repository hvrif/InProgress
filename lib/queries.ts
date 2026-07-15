import type { createClient } from "@/lib/supabase/server";
import { computeXp } from "@/lib/xp";
import { applyCoinDelta, computeCoinDelta } from "@/lib/coins";
import { applyStatDelta, STAT_DELTA_PER_TASK } from "@/lib/character";
import { generateDayOpening, type RecentLogWithTasks } from "@/lib/anthropic";
import type {
  DailyLog,
  Profile,
  StatCategory,
  Task,
  TaskCompletion,
  TaskCompletionWithTitle,
  UserStats,
} from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface RawLogWithCompletions extends DailyLog {
  task_completions: (TaskCompletion & { tasks: { title: string } | null })[];
}

function withTitle(
  tc: TaskCompletion & { tasks: { title: string } | null },
): TaskCompletionWithTitle {
  return {
    id: tc.id,
    daily_log_id: tc.daily_log_id,
    task_id: tc.task_id,
    user_id: tc.user_id,
    completed: tc.completed,
    created_at: tc.created_at,
    task_title: tc.tasks?.title ?? "(deleted task)",
  };
}

/** Last `limit` days strictly before `beforeDate`, oldest first, each with its task completions joined in. */
export async function fetchRecentLogsWithTasks(
  supabase: SupabaseServerClient,
  userId: string,
  beforeDate: string,
  limit = 7,
): Promise<RecentLogWithTasks[]> {
  const { data } = await supabase
    .from("daily_logs")
    .select("*, task_completions(*, tasks(title))")
    .eq("user_id", userId)
    .lt("log_date", beforeDate)
    .order("log_date", { ascending: false })
    .limit(limit);

  return ((data ?? []) as RawLogWithCompletions[])
    .map((row) => {
      const { task_completions, ...log } = row;
      return {
        ...(log as DailyLog),
        tasks: task_completions.map(withTitle),
      };
    })
    .reverse();
}

/** Task completions for one specific day, joined with task titles. */
export async function fetchTaskCompletionsForLog(
  supabase: SupabaseServerClient,
  dailyLogId: string,
): Promise<TaskCompletionWithTitle[]> {
  const { data } = await supabase
    .from("task_completions")
    .select("*, tasks(title)")
    .eq("daily_log_id", dailyLogId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as (TaskCompletion & { tasks: { title: string } | null })[]).map(withTitle);
}

export interface TaskStreak {
  taskId: string;
  title: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}

/**
 * Per-task streak data, derived from that task's own completion history —
 * one entry per active task. `currentStreak` skips today if it exists and
 * isn't completed yet, so an unfinished today doesn't zero out an otherwise
 * live streak (same grace as the day-level streak math in computeXp).
 */
export async function fetchTaskStreaks(
  supabase: SupabaseServerClient,
  userId: string,
  activeTasks: Task[],
): Promise<TaskStreak[]> {
  if (activeTasks.length === 0) return [];

  const { data } = await supabase
    .from("task_completions")
    .select("task_id, completed, daily_logs(log_date)")
    .eq("user_id", userId)
    .in(
      "task_id",
      activeTasks.map((t) => t.id),
    );

  type Row = { task_id: string; completed: boolean; daily_logs: { log_date: string }[] };
  const byTask = new Map<string, { log_date: string; completed: boolean }[]>();
  for (const row of (data ?? []) as unknown as Row[]) {
    const logDate = row.daily_logs[0]?.log_date;
    if (!logDate) continue;
    const bucket = byTask.get(row.task_id) ?? [];
    bucket.push({ log_date: logDate, completed: row.completed });
    byTask.set(row.task_id, bucket);
  }

  const today = todayIso();

  return activeTasks.map((task) => {
    const days = (byTask.get(task.id) ?? []).sort((a, b) =>
      a.log_date < b.log_date ? 1 : a.log_date > b.log_date ? -1 : 0,
    );

    const totalCompletions = days.filter((d) => d.completed).length;

    let start = 0;
    if (days.length > 0 && days[0].log_date === today && !days[0].completed) {
      start = 1;
    }
    let currentStreak = 0;
    for (let i = start; i < days.length; i++) {
      if (!days[i].completed) break;
      currentStreak++;
    }

    let longestStreak = 0;
    let run = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].completed) {
        run++;
        longestStreak = Math.max(longestStreak, run);
      } else {
        run = 0;
      }
    }

    return {
      taskId: task.id,
      title: task.title,
      currentStreak,
      longestStreak,
      totalCompletions,
    };
  });
}

/**
 * Closes out one day: computes XP/streak (computeXp) and the coin delta for
 * the same win/loss verdict (computeCoinDelta), writes both to daily_logs
 * and user_stats, and records the actual applied coin delta in coin_ledger.
 * Shared by every place a day gets finalized — the stale-day sweep in
 * ensureTodayLog, the explicit "end for today" route, and the coach
 * confirming conversation_ended in the continue route.
 */
export async function finalizeDayLog(
  supabase: SupabaseServerClient,
  userId: string,
  log: DailyLog,
  stats: UserStats,
): Promise<void> {
  const xpResult = computeXp(log.completed_count, log.total_count, log.log_date, stats);
  const coinResult = computeCoinDelta(xpResult.isWin);
  const newCoinBalance = applyCoinDelta(stats.coin_balance, coinResult.delta);

  await supabase
    .from("daily_logs")
    .update({
      is_win: xpResult.isWin,
      xp_earned: xpResult.xpEarned,
      ended_at: new Date().toISOString(),
    })
    .eq("id", log.id);

  await supabase
    .from("user_stats")
    .update({
      ...xpResult.newStats,
      coin_balance: newCoinBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  await supabase.from("coin_ledger").insert({
    user_id: userId,
    daily_log_id: log.id,
    delta: newCoinBalance - stats.coin_balance,
    reason: coinResult.reason,
  });
}

/**
 * Finalizes any prior day left open (XP/streak computed from whatever
 * completed_count/total_count it ended at, oldest first so streak math
 * stays correct), then ensures today's row exists — creating it with one
 * incomplete task_completions row per active task if it doesn't.
 */
export async function ensureTodayLog(
  supabase: SupabaseServerClient,
  userId: string,
  activeTasks: Task[],
  profile: Profile,
): Promise<DailyLog> {
  const today = todayIso();

  const { data: staleRows } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .is("ended_at", null)
    .lt("log_date", today)
    .order("log_date", { ascending: true });

  for (const staleLog of (staleRows ?? []) as DailyLog[]) {
    const { data: statsRow } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();
    const stats = statsRow as UserStats;

    await finalizeDayLog(supabase, userId, staleLog, stats);
  }

  const { data: existing } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", today)
    .maybeSingle();

  if (existing) {
    return existing as DailyLog;
  }

  const { data: created, error } = await supabase
    .from("daily_logs")
    .insert({
      user_id: userId,
      log_date: today,
      is_win: false,
      completed_count: 0,
      total_count: activeTasks.length,
      xp_earned: 0,
      ended_at: null,
    })
    .select()
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Failed to create today's log");
  }

  if (activeTasks.length > 0) {
    await supabase.from("task_completions").insert(
      activeTasks.map((t) => ({
        daily_log_id: created.id,
        task_id: t.id,
        user_id: userId,
        completed: false,
      })),
    );
  }

  try {
    const { data: statsRow } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();
    const stats = statsRow as UserStats;

    const recentLogs = await fetchRecentLogsWithTasks(supabase, userId, today);

    const opening = await generateDayOpening({
      profile,
      stats,
      recentLogs,
      todayTasks: activeTasks.map((t) => ({ title: t.title, completed: false })),
      logDate: today,
    });

    await supabase.from("checkin_messages").insert({
      daily_log_id: created.id,
      user_id: userId,
      role: "assistant",
      content: opening,
    });
  } catch (err) {
    console.error("Failed to generate day-opening message:", err);
  }

  return created as DailyLog;
}

/**
 * Flips one task's completion for a day and keeps daily_logs.completed_count
 * /total_count in sync. Does NOT touch XP/streak — those are computed once,
 * at end of day (see ensureTodayLog's stale-day finalization, or the
 * explicit "end for today" / chat-confirmed-close paths).
 */
export async function toggleTaskCompletion(
  supabase: SupabaseServerClient,
  userId: string,
  dailyLogId: string,
  taskId: string,
  completed: boolean,
): Promise<{ completedCount: number; totalCount: number }> {
  const { error: updateError } = await supabase
    .from("task_completions")
    .update({ completed })
    .eq("daily_log_id", dailyLogId)
    .eq("task_id", taskId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { data: rows } = await supabase
    .from("task_completions")
    .select("completed")
    .eq("daily_log_id", dailyLogId);

  const completions = (rows ?? []) as { completed: boolean }[];
  const completedCount = completions.filter((r) => r.completed).length;
  const totalCount = completions.length;

  await supabase
    .from("daily_logs")
    .update({ completed_count: completedCount, total_count: totalCount })
    .eq("id", dailyLogId);

  await bumpStatForTask(supabase, userId, taskId, completed);

  return { completedCount, totalCount };
}

/** Bumps the character's tagged stat for a task, if any. No-ops if the task has no stat_category or the user has no character yet. */
async function bumpStatForTask(
  supabase: SupabaseServerClient,
  userId: string,
  taskId: string,
  completed: boolean,
): Promise<void> {
  const { data: taskRow } = await supabase
    .from("tasks")
    .select("stat_category")
    .eq("id", taskId)
    .maybeSingle();

  const statCategory = (taskRow as { stat_category: StatCategory | null } | null)
    ?.stat_category;
  if (!statCategory) return;

  const { data: character } = await supabase
    .from("characters")
    .select(statCategory)
    .eq("user_id", userId)
    .maybeSingle();
  if (!character) return;

  const current = (character as unknown as Record<StatCategory, number>)[statCategory];
  const delta = completed ? STAT_DELTA_PER_TASK : -STAT_DELTA_PER_TASK;
  const next = applyStatDelta(current, delta);

  await supabase
    .from("characters")
    .update({ [statCategory]: next })
    .eq("user_id", userId);
}
