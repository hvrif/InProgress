"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CelebrationPopup } from "@/components/CelebrationPopup";
import { XP_PER_TASK_COMPLETED } from "@/lib/xp";
import type { TaskCompletionWithTitle } from "@/lib/types";

export function TaskBoard({
  dailyLogId,
  tasks,
  ended,
}: {
  dailyLogId: string;
  tasks: TaskCompletionWithTitle[];
  ended: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, setToast] = useState<{ taskId: string; id: number } | null>(null);
  const toastCounter = useRef(0);
  const [pending, setPending] = useState<Record<string, { title: string; completed: boolean }>>(
    {},
  );
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "sent">("idle");

  async function toggle(task: TaskCompletionWithTitle) {
    if (ended || busyId) return;
    setBusyId(task.id);
    setError(null);
    const wasAllComplete = tasks.length > 0 && tasks.every((t) => t.completed);
    const willBeCompleted = !task.completed;

    try {
      const res = await fetch("/api/tasks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyLogId,
          taskId: task.task_id,
          completed: willBeCompleted,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }
      const body = (await res.json()) as { completedCount: number; totalCount: number };
      if (!wasAllComplete && body.totalCount > 0 && body.completedCount === body.totalCount) {
        setShowCelebration(true);
      }

      if (willBeCompleted) {
        toastCounter.current += 1;
        const id = toastCounter.current;
        setToast({ taskId: task.id, id });
        setTimeout(() => {
          setToast((t) => (t?.id === id ? null : t));
        }, 900);
      }

      // Queue this change instead of nudging the coach immediately — the
      // user submits their update explicitly, once, when they're ready.
      setPending((prev) => ({
        ...prev,
        [task.task_id]: { title: task.task_title, completed: willBeCompleted },
      }));
      setSubmitState("idle");

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function submitUpdate() {
    const changedTasks = Object.values(pending);
    if (changedTasks.length === 0 || submitState === "sending") return;

    setSubmitState("sending");
    try {
      await fetch("/api/checkin/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changedTasks }),
      });
      setPending({});
      setSubmitState("sent");
      setTimeout(() => setSubmitState((s) => (s === "sent" ? "idle" : s)), 2000);
    } catch {
      setSubmitState("idle");
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-500">
        No active tasks yet.{" "}
        <Link href="/tasks" className="underline hover:text-neutral-300">
          Add some
        </Link>
        .
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const pct = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Today&rsquo;s quest</span>
          <span>
            {completedCount}/{tasks.length}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="relative">
            <button
              type="button"
              onClick={() => toggle(task)}
              disabled={ended || busyId === task.id}
              className={[
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition active:scale-95 disabled:opacity-50",
                task.completed
                  ? "border-emerald-800 bg-emerald-950/30 text-emerald-100"
                  : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600",
              ].join(" ")}
            >
              <span
                key={`check-${task.id}-${task.completed}`}
                className={[
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs",
                  task.completed
                    ? "border-emerald-600 bg-emerald-600 text-neutral-950 animate-[pop_0.25s_ease-out]"
                    : "border-neutral-600",
                ].join(" ")}
              >
                {task.completed ? "✓" : ""}
              </span>
              {task.task_title}
            </button>
            {toast?.taskId === task.id && (
              <span
                key={toast.id}
                className="pointer-events-none absolute right-3 top-1 text-xs font-semibold text-emerald-400 animate-[float-up_0.9s_ease-out_forwards]"
              >
                +{XP_PER_TASK_COMPLETED} XP
              </span>
            )}
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {Object.keys(pending).length > 0 && (
        <button
          type="button"
          onClick={submitUpdate}
          disabled={submitState === "sending"}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitState === "sending" ? "Sending..." : "Submit update to coach"}
        </button>
      )}
      {submitState === "sent" && (
        <p className="text-center text-sm text-emerald-400">Sent — check chat for a reply.</p>
      )}

      {showCelebration && (
        <CelebrationPopup onClose={() => setShowCelebration(false)} />
      )}
    </div>
  );
}
