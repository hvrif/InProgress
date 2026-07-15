import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTaskNudge } from "@/lib/anthropic";
import { fetchRecentLogsWithTasks, fetchTaskCompletionsForLog } from "@/lib/queries";
import type { DailyLog, Profile, UserStats } from "@/lib/types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Fired once when the user submits an update after ticking/unticking tasks
// directly in the app, so the coach can react on its own instead of the user
// having to report it in chat themselves.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as {
    changedTasks?: { title?: string; completed?: boolean }[];
  };
  const changedTasks = (body.changedTasks ?? []).filter(
    (t): t is { title: string; completed: boolean } =>
      typeof t.title === "string" && typeof t.completed === "boolean",
  );
  if (changedTasks.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const logDate = todayIso();

  const { data: logRow } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("log_date", logDate)
    .maybeSingle();
  if (!logRow) {
    return NextResponse.json({ ok: false });
  }
  const log = logRow as DailyLog;
  if (log.ended_at) {
    return NextResponse.json({ ok: false });
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profileRow) {
    return NextResponse.json({ ok: false });
  }
  const profile = profileRow as Profile;

  const { data: statsRow } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!statsRow) {
    return NextResponse.json({ ok: false });
  }
  const stats = statsRow as UserStats;

  const recentLogs = await fetchRecentLogsWithTasks(supabase, user.id, logDate);
  const todaysTaskCompletions = await fetchTaskCompletionsForLog(supabase, log.id);
  const todayTasks = todaysTaskCompletions.map((tc) => ({
    title: tc.task_title,
    completed: tc.completed,
  }));

  try {
    const reply = await generateTaskNudge({
      profile,
      stats,
      recentLogs,
      todayTasks,
      logDate: log.log_date,
      changedTasks,
    });

    await supabase.from("checkin_messages").insert({
      daily_log_id: log.id,
      user_id: user.id,
      role: "assistant",
      content: reply,
    });
  } catch (err) {
    console.error("Failed to generate task nudge:", err);
  }

  return NextResponse.json({ ok: true });
}
