"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageBubble } from "@/components/MessageBubble";
import { TaskListEditor } from "@/components/TaskListEditor";
import type { OnboardingAnswers } from "@/lib/types";

type Phase =
  | "identity_and_failure"
  | "main_goal"
  | "tasks_freeform"
  | "tasks_parsing"
  | "tasks_editing"
  | "danger_zone"
  | "why_text"
  | "submitting"
  | "done";

const FULL_ORDER: Phase[] = [
  "identity_and_failure",
  "main_goal",
  "tasks_freeform",
  "tasks_parsing",
  "tasks_editing",
  "danger_zone",
  "why_text",
  "submitting",
  "done",
];

const PROMPTS = {
  identity_and_failure: "Who are you, and why do you keep failing?",
  main_goal: "What is your one main goal?",
  tasks_freeform: "What are the tasks you want to do every day?",
  danger_zone: "What is your danger zone — the time of day or situation where you slip?",
  why_text:
    "Who and what do you do this for? I'll show this back to you the moment you relapse.",
} as const;

const TEXT_INPUT_PHASES: Phase[] = [
  "identity_and_failure",
  "main_goal",
  "tasks_freeform",
  "danger_zone",
  "why_text",
];

interface Answers {
  identity_and_failure?: string;
  main_goal?: string;
  tasksRaw?: string;
  tasks?: string[];
  danger_zone?: string;
  why_text?: string;
}

export function OnboardingChat() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("identity_and_failure");
  const [answers, setAnswers] = useState<Answers>({});
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function isPast(target: Phase): boolean {
    return FULL_ORDER.indexOf(phase) > FULL_ORDER.indexOf(target);
  }

  async function submitAll(finalAnswers: Required<Pick<Answers,
    "identity_and_failure" | "main_goal" | "tasks" | "danger_zone" | "why_text"
  >>) {
    setPhase("submitting");
    setError(null);
    try {
      const payload: OnboardingAnswers = {
        identity_and_failure: finalAnswers.identity_and_failure,
        main_goal: finalAnswers.main_goal,
        tasks: finalAnswers.tasks,
        danger_zone: finalAnswers.danger_zone,
        why_text: finalAnswers.why_text,
      };
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("why_text");
    }
  }

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setDraft("");
    setError(null);

    if (phase === "identity_and_failure" || phase === "main_goal" || phase === "danger_zone") {
      const nextPhase: Record<"identity_and_failure" | "main_goal" | "danger_zone", Phase> = {
        identity_and_failure: "main_goal",
        main_goal: "tasks_freeform",
        danger_zone: "why_text",
      };
      setAnswers((prev) => ({ ...prev, [phase]: value }));
      setPhase(nextPhase[phase]);
      return;
    }

    if (phase === "tasks_freeform") {
      setAnswers((prev) => ({ ...prev, tasksRaw: value }));
      setPhase("tasks_parsing");
      try {
        const res = await fetch("/api/onboarding/parse-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: value }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Something went wrong");
        }
        const body = (await res.json()) as { tasks: string[] };
        setAnswers((prev) => ({ ...prev, tasks: body.tasks ?? [] }));
        setPhase("tasks_editing");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setPhase("tasks_freeform");
      }
      return;
    }

    if (phase === "why_text") {
      const complete =
        answers.identity_and_failure && answers.main_goal && answers.tasks && answers.danger_zone;
      if (complete) {
        await submitAll({
          identity_and_failure: answers.identity_and_failure!,
          main_goal: answers.main_goal!,
          tasks: answers.tasks!,
          danger_zone: answers.danger_zone!,
          why_text: value,
        });
      }
      return;
    }
  }

  function confirmTasks(tasks: string[]) {
    setAnswers((prev) => ({ ...prev, tasks }));
    setPhase("danger_zone");
  }

  const showTextInput = TEXT_INPUT_PHASES.includes(phase);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold text-neutral-100">Before we start</h1>
      <p className="mb-8 text-sm text-neutral-400">
        A few questions, once. Answer honestly — this is what I&rsquo;ll hold you to.
      </p>

      <div className="flex-1 space-y-4">
        {isPast("identity_and_failure") && (
          <div className="space-y-2">
            <MessageBubble speaker="coach">{PROMPTS.identity_and_failure}</MessageBubble>
            <MessageBubble speaker="user">{answers.identity_and_failure}</MessageBubble>
          </div>
        )}
        {phase === "identity_and_failure" && (
          <MessageBubble speaker="coach">{PROMPTS.identity_and_failure}</MessageBubble>
        )}

        {isPast("main_goal") && (
          <div className="space-y-2">
            <MessageBubble speaker="coach">{PROMPTS.main_goal}</MessageBubble>
            <MessageBubble speaker="user">{answers.main_goal}</MessageBubble>
          </div>
        )}
        {phase === "main_goal" && <MessageBubble speaker="coach">{PROMPTS.main_goal}</MessageBubble>}

        {isPast("tasks_editing") && answers.tasks && (
          <div className="space-y-2">
            <MessageBubble speaker="coach">{PROMPTS.tasks_freeform}</MessageBubble>
            <MessageBubble speaker="user">{answers.tasksRaw}</MessageBubble>
            <MessageBubble speaker="coach">
              {`Got it — here's what I heard: ${answers.tasks.join(", ")}.`}
            </MessageBubble>
          </div>
        )}
        {phase === "tasks_freeform" && (
          <MessageBubble speaker="coach">{PROMPTS.tasks_freeform}</MessageBubble>
        )}
        {phase === "tasks_parsing" && (
          <>
            <MessageBubble speaker="coach">{PROMPTS.tasks_freeform}</MessageBubble>
            <MessageBubble speaker="user">{answers.tasksRaw}</MessageBubble>
            <MessageBubble speaker="coach">Breaking that down...</MessageBubble>
          </>
        )}
        {phase === "tasks_editing" && answers.tasks && (
          <>
            <MessageBubble speaker="coach">{PROMPTS.tasks_freeform}</MessageBubble>
            <MessageBubble speaker="user">{answers.tasksRaw}</MessageBubble>
            <MessageBubble speaker="coach">
              Here&rsquo;s what I heard — edit anything that&rsquo;s off, then confirm.
            </MessageBubble>
            <TaskListEditor initialTasks={answers.tasks} onConfirm={confirmTasks} />
          </>
        )}

        {isPast("danger_zone") && (
          <div className="space-y-2">
            <MessageBubble speaker="coach">{PROMPTS.danger_zone}</MessageBubble>
            <MessageBubble speaker="user">{answers.danger_zone}</MessageBubble>
          </div>
        )}
        {phase === "danger_zone" && (
          <MessageBubble speaker="coach">{PROMPTS.danger_zone}</MessageBubble>
        )}

        {isPast("why_text") && (
          <div className="space-y-2">
            <MessageBubble speaker="coach">{PROMPTS.why_text}</MessageBubble>
            <MessageBubble speaker="user">{answers.why_text}</MessageBubble>
          </div>
        )}
        {phase === "why_text" && <MessageBubble speaker="coach">{PROMPTS.why_text}</MessageBubble>}

        {phase === "submitting" && (
          <MessageBubble speaker="coach">Reading what you wrote...</MessageBubble>
        )}

        {error && (
          <p className="text-sm text-red-400">
            {error} —{" "}
            <button className="underline" onClick={() => setError(null)}>
              try again
            </button>
          </p>
        )}
      </div>

      {showTextInput && (
        <form onSubmit={handleTextSubmit} className="mt-6 flex gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your answer..."
            className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-600"
          />
          <button
            type="submit"
            className="rounded-lg bg-neutral-100 px-4 py-2 font-medium text-neutral-900 transition hover:bg-white"
          >
            {phase === "why_text" ? "Finish" : "Next"}
          </button>
        </form>
      )}
    </div>
  );
}
