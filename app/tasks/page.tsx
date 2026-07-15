import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskManager } from "@/components/TaskManager";
import { TaskBoard } from "@/components/TaskBoard";
import { AppHeader } from "@/components/AppHeader";
import { BadgeShelf } from "@/components/BadgeShelf";
import { ensureTodayLog, fetchTaskCompletionsForLog, fetchTaskStreaks } from "@/lib/queries";
import type { Profile, Task, UserStats } from "@/lib/types";

export default async function TasksPage() {
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

  const { data: statsRow } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  const stats = statsRow as UserStats | null;

  const { data: tasksRows } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  const tasks = (tasksRows ?? []) as Task[];

  const todaysLog = await ensureTodayLog(supabase, user.id, tasks, profile);
  const todaysTasks = await fetchTaskCompletionsForLog(supabase, todaysLog.id);
  const taskStreaks = await fetchTaskStreaks(supabase, user.id, tasks);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader stats={stats} active="/tasks" />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-6">
        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-400">Today</h2>
          <TaskBoard
            dailyLogId={todaysLog.id}
            tasks={todaysTasks}
            ended={!!todaysLog.ended_at}
          />
        </div>

        {stats && <BadgeShelf stats={stats} taskStreaks={taskStreaks} />}

        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-400">Manage tasks</h2>
          <TaskManager initialTasks={tasks} />
        </div>
      </main>
    </div>
  );
}
