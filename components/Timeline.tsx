import { MessageBubble } from "@/components/MessageBubble";
import type { DailyLogWithMessages, Profile } from "@/lib/types";

const ONBOARDING_QA: { question: string; key: keyof Profile }[] = [
  { question: "Who are you, and why do you keep failing?", key: "identity_and_failure" },
  { question: "What is your one main goal?", key: "main_goal" },
  {
    question: "What are the tasks you want to do every day?",
    key: "non_negotiables",
  },
  {
    question: "What is your danger zone — the time of day or situation where you slip?",
    key: "danger_zone",
  },
  {
    question:
      "Who and what do you do this for? I'll show this back to you the moment you relapse.",
    key: "why_text",
  },
];

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function Timeline({
  profile,
  logs,
}: {
  profile: Profile;
  logs: DailyLogWithMessages[];
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4 border-b border-neutral-900 pb-6">
        {ONBOARDING_QA.map(({ question, key }) => (
          <div key={key} className="space-y-2">
            <MessageBubble speaker="coach">{question}</MessageBubble>
            <MessageBubble speaker="user">{profile[key]}</MessageBubble>
          </div>
        ))}
        <MessageBubble speaker="coach">{profile.welcome_message}</MessageBubble>
      </div>

      {logs.map((log) => {
        const taskLines = log.tasks.map(
          (t) => `${t.completed ? "[x]" : "[ ]"} ${t.task_title}`,
        );
        const answerLines = [`${log.completed_count}/${log.total_count} tasks completed:`, ...taskLines].join(
          "\n",
        );

        return (
          <div key={log.id} className="space-y-2">
            <p className="text-center text-xs font-medium text-neutral-600">
              {formatDate(log.log_date)}
              {log.ended_at && log.is_win && (
                <span className="ml-1.5 text-emerald-500">+{log.xp_earned} XP</span>
              )}
            </p>
            <MessageBubble speaker="user">{answerLines}</MessageBubble>
            {log.messages.map((m) => (
              <MessageBubble
                key={m.id}
                speaker={m.role === "user" ? "user" : "coach"}
                tone={m.role === "assistant" && log.ended_at ? (log.is_win ? "win" : "miss") : undefined}
              >
                {m.content}
              </MessageBubble>
            ))}
          </div>
        );
      })}
    </div>
  );
}
