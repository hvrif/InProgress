"use client";

import { useState } from "react";

const NUDGE_THRESHOLD = 5;

export function TaskListEditor({
  initialTasks,
  onConfirm,
}: {
  initialTasks: string[];
  onConfirm: (tasks: string[]) => void;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [draft, setDraft] = useState("");
  const [acceptedOverage, setAcceptedOverage] = useState(false);

  const overThreshold = tasks.length > NUDGE_THRESHOLD;
  const showNudge = overThreshold && !acceptedOverage;

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
    setAcceptedOverage(false);
  }

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setTasks((prev) => [...prev, value]);
    setDraft("");
    setAcceptedOverage(false);
  }

  function updateTask(index: number, value: string) {
    setTasks((prev) => prev.map((t, i) => (i === index ? value : t)));
  }

  return (
    <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <ul className="space-y-2">
        {tasks.map((task, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              value={task}
              onChange={(e) => updateTask(i, e.target.value)}
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            />
            <button
              onClick={() => removeTask(i)}
              className="text-xs text-neutral-500 hover:text-red-400"
              aria-label={`Remove ${task}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={addTask} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add another task"
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-500"
        />
        <button
          type="submit"
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-500"
        >
          Add
        </button>
      </form>

      {showNudge ? (
        <div className="space-y-2 rounded-md border border-amber-900/50 bg-amber-950/30 p-3 text-sm text-amber-100">
          <p>
            That&rsquo;s {tasks.length} tasks — are you sure you want to hold yourself to
            all of these every single day, or do you want to cut it down?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setAcceptedOverage(true)}
              className="rounded-md border border-amber-700 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-900/40"
            >
              Keep all {tasks.length} anyway
            </button>
            <span className="self-center text-xs text-amber-300/70">
              or remove some above
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onConfirm(tasks.filter((t) => t.trim().length > 0))}
          disabled={tasks.filter((t) => t.trim().length > 0).length === 0}
          className="w-full rounded-lg bg-neutral-100 px-3 py-2 font-medium text-neutral-900 transition hover:bg-white disabled:opacity-50"
        >
          Confirm tasks
        </button>
      )}
    </div>
  );
}
