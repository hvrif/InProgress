"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STAT_CATEGORIES, STAT_EMOJI, STAT_LABELS } from "@/lib/character";
import type { StatCategory, Task } from "@/lib/types";

export function TaskManager({ initialTasks }: { initialTasks: Task[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [draft, setDraft] = useState("");
  const [statCategory, setStatCategory] = useState<StatCategory | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, statCategory: statCategory || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }
      const body = (await res.json()) as { task: Task };
      setTasks((prev) => [...prev, body.task]);
      setDraft("");
      setStatCategory("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function removeTask(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: false }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }
      setTasks((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300 transition hover:border-neutral-600 hover:text-neutral-100"
      >
        Edit Tasks
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
          >
            <span className="text-sm text-neutral-100">{task.title}</span>
            <button
              onClick={() => removeTask(task.id)}
              disabled={busy}
              className="text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
            >
              Remove
            </button>
          </li>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-neutral-500">No active tasks. Add one below.</p>
        )}
      </ul>

      <form onSubmit={addTask} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task"
          disabled={busy}
          className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-600 disabled:opacity-50"
        />
        <select
          value={statCategory}
          onChange={(e) => setStatCategory(e.target.value as StatCategory | "")}
          disabled={busy}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-600 disabled:opacity-50"
        >
          <option value="">No stat</option>
          {STAT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {STAT_EMOJI[cat]} {STAT_LABELS[cat]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-neutral-100 px-4 py-2 font-medium text-neutral-900 transition hover:bg-white disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={() => setEditing(false)}
        className="text-sm text-neutral-500 hover:text-neutral-300"
      >
        Done
      </button>
    </div>
  );
}
