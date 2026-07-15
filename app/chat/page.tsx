import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DayChat } from "@/components/DayChat";
import { AppHeader } from "@/components/AppHeader";
import { Timeline } from "@/components/Timeline";
import { ensureTodayLog } from "@/lib/queries";
import type {
  CheckInMessage,
  DailyLog,
  DailyLogWithMessages,
  Profile,
  Task,
  TaskCompletion,
  TaskCompletionWithTitle,
  UserStats,
} from "@/lib/types";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileRow) {
    redirect("/");
  }
  const profile = profileRow as Profile;

  const { data: activeTasksRows } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  const activeTasks = (activeTasksRows ?? []) as Task[];

  const todaysLog = await ensureTodayLog(supabase, user.id, activeTasks, profile);

  const { data: statsRow } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  const stats = statsRow as UserStats | null;

  const { data: logsRows } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("log_date", { ascending: true });
  const logs = (logsRows ?? []) as DailyLog[];

  const { data: messagesRows } = await supabase
    .from("checkin_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  const messages = (messagesRows ?? []) as CheckInMessage[];

  const { data: taskCompletionRows } = await supabase
    .from("task_completions")
    .select("*, tasks(title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  const taskCompletions = (
    (taskCompletionRows ?? []) as (TaskCompletion & { tasks: { title: string } | null })[]
  ).map(
    (tc): TaskCompletionWithTitle => ({
      id: tc.id,
      daily_log_id: tc.daily_log_id,
      task_id: tc.task_id,
      user_id: tc.user_id,
      completed: tc.completed,
      created_at: tc.created_at,
      task_title: tc.tasks?.title ?? "(deleted task)",
    }),
  );

  const messagesByLogId = new Map<string, CheckInMessage[]>();
  for (const m of messages) {
    const bucket = messagesByLogId.get(m.daily_log_id) ?? [];
    bucket.push(m);
    messagesByLogId.set(m.daily_log_id, bucket);
  }
  const tasksByLogId = new Map<string, TaskCompletionWithTitle[]>();
  for (const tc of taskCompletions) {
    const bucket = tasksByLogId.get(tc.daily_log_id) ?? [];
    bucket.push(tc);
    tasksByLogId.set(tc.daily_log_id, bucket);
  }
  const logsWithMessages: DailyLogWithMessages[] = logs.map((log) => ({
    ...log,
    messages: messagesByLogId.get(log.id) ?? [],
    tasks: tasksByLogId.get(log.id) ?? [],
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader stats={stats} active="/chat" />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        <Timeline profile={profile} logs={logsWithMessages} />
      </main>

      {todaysLog.ended_at ? (
        <div className="border-t border-neutral-900 bg-neutral-950 px-4 py-4 text-center text-sm text-neutral-500">
          You already checked in today. Come back tomorrow.
        </div>
      ) : (
        <DayChat />
      )}
    </div>
  );
}
