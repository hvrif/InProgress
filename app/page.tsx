import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingChat } from "@/components/OnboardingChat";
import { TaskBoard } from "@/components/TaskBoard";
import { XpBar } from "@/components/XpBar";
import { AppHeader } from "@/components/AppHeader";
import { ChatCard } from "@/components/ChatCard";
import { CoinBalance } from "@/components/CoinBalance";
import { ensureTodayLog, fetchTaskCompletionsForLog } from "@/lib/queries";
import type { CheckInMessage, Profile, Task, UserStats } from "@/lib/types";

export default async function Home() {
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
    return <OnboardingChat />;
  }
  const profile = profileRow as Profile;

  const { data: activeTasksRows } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  const activeTasks = (activeTasksRows ?? []) as Task[];

  // Finalizes any prior open day and ensures today's row (+ task_completions,
  // + a proactive opening message) exists before we read anything else.
  const todaysLog = await ensureTodayLog(supabase, user.id, activeTasks, profile);

  const { data: statsRow } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  const stats = statsRow as UserStats | null;

  const todaysTasks = await fetchTaskCompletionsForLog(supabase, todaysLog.id);

  const { data: todaysMessageRows } = await supabase
    .from("checkin_messages")
    .select("*")
    .eq("daily_log_id", todaysLog.id)
    .order("created_at", { ascending: false })
    .limit(1);
  const lastMessage = ((todaysMessageRows ?? []) as CheckInMessage[])[0] ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader stats={stats} active="/" />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        {stats && <XpBar stats={stats} />}
        {stats && <CoinBalance balance={stats.coin_balance} />}

        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-400">Today</h2>
          <TaskBoard
            dailyLogId={todaysLog.id}
            tasks={todaysTasks}
            ended={!!todaysLog.ended_at}
          />
        </div>

        <ChatCard ended={!!todaysLog.ended_at} lastMessage={lastMessage} />
      </main>
    </div>
  );
}
