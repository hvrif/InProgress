import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDayResponse } from "@/lib/anthropic";
import {
  fetchRecentLogsWithTasks,
  fetchTaskCompletionsForLog,
  finalizeDayLog,
  toggleTaskCompletion,
} from "@/lib/queries";
import type { CheckInMessage, DailyLog, Profile, UserStats } from "@/lib/types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { message?: string };
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const logDate = todayIso();

  const { data: logRow } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("log_date", logDate)
    .maybeSingle();

  if (!logRow) {
    return NextResponse.json({ error: "No check-in for today yet" }, { status: 400 });
  }
  const log = logRow as DailyLog;

  if (log.ended_at) {
    return NextResponse.json(
      { error: "Today's check-in has already ended" },
      { status: 409 },
    );
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profileRow) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  }
  const profile = profileRow as Profile;

  const { data: statsRow } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!statsRow) {
    return NextResponse.json({ error: "Missing stats row" }, { status: 500 });
  }
  const stats = statsRow as UserStats;

  const recentLogs = await fetchRecentLogsWithTasks(supabase, user.id, logDate);
  const todaysTaskCompletions = await fetchTaskCompletionsForLog(supabase, log.id);
  const todayTasks = todaysTaskCompletions.map((tc) => ({
    title: tc.task_title,
    completed: tc.completed,
  }));

  const { data: priorMessagesRows } = await supabase
    .from("checkin_messages")
    .select("*")
    .eq("daily_log_id", log.id)
    .order("created_at", { ascending: true });
  const priorMessages = (priorMessagesRows ?? []) as CheckInMessage[];

  const { error: insertUserMsgError } = await supabase.from("checkin_messages").insert({
    daily_log_id: log.id,
    user_id: user.id,
    role: "user",
    content: message,
  });
  if (insertUserMsgError) {
    return NextResponse.json({ error: insertUserMsgError.message }, { status: 500 });
  }

  let result: Awaited<ReturnType<typeof generateDayResponse>>;
  try {
    result = await generateDayResponse({
      profile,
      stats,
      recentLogs,
      todayTasks,
      logDate: log.log_date,
      priorMessages,
      newMessage: message,
    });
  } catch (err) {
    console.error("Failed to continue check-in conversation", err);
    return NextResponse.json(
      { error: "The coach couldn't respond right now. Try again." },
      { status: 502 },
    );
  }

  const { error: insertAssistantMsgError } = await supabase.from("checkin_messages").insert({
    daily_log_id: log.id,
    user_id: user.id,
    role: "assistant",
    content: result.reply,
  });
  if (insertAssistantMsgError) {
    return NextResponse.json({ error: insertAssistantMsgError.message }, { status: 500 });
  }

  // Apply any task completions the coach picked up from the conversation —
  // matched by title against today's list (case/whitespace-insensitive).
  const titleToTaskId = new Map(
    todaysTaskCompletions.map((tc) => [tc.task_title.trim().toLowerCase(), tc.task_id]),
  );
  for (const update of result.taskUpdates) {
    const taskId = titleToTaskId.get(update.title.trim().toLowerCase());
    if (taskId) {
      await toggleTaskCompletion(supabase, user.id, log.id, taskId, update.completed);
    }
  }

  if (result.conversationEnded) {
    const { data: freshLog } = await supabase
      .from("daily_logs")
      .select("completed_count, total_count")
      .eq("id", log.id)
      .single();
    const counts = (freshLog ?? {
      completed_count: log.completed_count,
      total_count: log.total_count,
    }) as { completed_count: number; total_count: number };

    await finalizeDayLog(supabase, user.id, { ...log, ...counts }, stats);
  }

  return NextResponse.json({
    reply: result.reply,
    conversationEnded: result.conversationEnded,
  });
}
