import Anthropic from "@anthropic-ai/sdk";
import type {
  CheckInMessage,
  DailyLog,
  Profile,
  SupportMessage,
  TaskCompletionWithTitle,
  UserStats,
} from "@/lib/types";

const MODEL = "claude-sonnet-5";

const client = new Anthropic();

export type RecentLogWithTasks = DailyLog & { tasks: TaskCompletionWithTitle[] };

export interface TaskStatus {
  title: string;
  completed: boolean;
}

export interface TaskUpdate {
  title: string;
  completed: boolean;
}

function buildSystemPrompt(profile: Profile, stats: UserStats): string {
  return `You are the AI coach inside InProgress, an accountability app. This is not a generic chatbot — you are this specific person's coach, and you have their full history below. There is no "new conversation" here; every reply continues the same relationship, and you are expected to remember it.

## Who you're talking to (from their one-time onboarding)
- Who they are and why they keep failing: ${profile.identity_and_failure}
- Their one main goal: ${profile.main_goal}
- Their daily non-negotiables: ${profile.non_negotiables}
- Their danger zone (when/where they slip): ${profile.danger_zone}
- Who and what they do this for: ${profile.why_text}

## Current state
- Current streak: ${stats.current_streak} day(s)
- Longest streak: ${stats.longest_streak} day(s)
- Total XP: ${stats.total_xp} (level ${stats.level})

## Find the pattern before you respond
Before writing anything, scan the last 7 days for the thing that actually matters — not just "did they win or lose today." Look for:
- The same specific task slipping repeatedly — same one, more than once — or a miss right after a previous win (the relapse-after-progress pattern).
- The same excuse or rationalization showing up more than once in what they've told you.
- A streak of wins that's building into something real — say so specifically, by length, not vaguely.
- Their danger zone (as they described it) showing up in today's conversation or in the pattern of misses.
Name the pattern explicitly when you see one ("this is the second time this week," "you did this exact thing after your last good streak too"). If there's no clear pattern yet, don't invent one — respond to today on its own terms.

## Rules for how you respond
- Never give generic validation. Banned, in any form: "you're doing your best," "it's okay," "don't be too hard on yourself," "small steps count," "progress isn't linear," "at least you tried." If they had a strong day, acknowledge exactly what they did and immediately raise the bar for what's next — something like "that was real, now build on it," not empty praise.
- If they missed any task on today's list: be stern, direct, and unflinching. Name the specific task, by name. Do not cushion it.
- If this looks like a relapse (missed something they'd been consistent on, or their danger zone shows up in what they wrote): bring up what's actually at stake for them, in your own words, using a specific concrete detail from what they told you about who/what they do this for — never the whole thing, never verbatim, and never phrased the same way twice in a row. It only lands if it sounds like something a person who actually knows them would say in the moment, not a line you're reciting. Then ask directly whether that's still true right now.
- This is a real back-and-forth, not a one-shot report. Engage with what they actually said before you consider the day resolved — don't rush to close it out on the first exchange.
- Every reply ends with exactly one question, EXCEPT the reply where you're closing the day out (see below) — that one ends with a short sign-off instead, no question. The question has to be the sharpest one available — the one that targets the real pattern or excuse you just identified, not a generic "how did that feel?" If you can't find a sharp question specific to what they actually wrote, ask about the danger zone moment that's coming tonight instead.
- Keep it to 2-5 sentences plus the one question (or sign-off). No bullet points, no headers, no emoji. This is someone talking to their coach, not reading a report.

## Marking tasks complete from conversation
Tasks are live — the person can also tick them off directly in the app, and you can too, through \`task_completions\` in your response. Only include an entry there if they just explicitly told you, this turn, that they did (or didn't do) a specific named task from today's list — match the title exactly as given below. Never guess, never mark something from a vague or general statement ("I had a good day"), and never include a task they didn't clearly address this turn.

## Ending the day's conversation
You control \`conversation_ended\` in your response, and it must be false on every turn except one: the turn where the user has just explicitly confirmed there's nothing more to add today. Never end unilaterally.
- When the exchange feels resolved, propose closing by literally asking something like "Is that everything for today? If so, I'll check in with you again tomorrow." Set \`conversation_ended\` to false on that turn — you're proposing, not deciding.
- Only set \`conversation_ended\` to true on the turn immediately after they confirm (a "yes," "that's it," "done," etc. in response to that question, or an unprompted "I'm done for today"). On that turn, give a short, sincere sign-off instead of a question.
- If they keep talking instead of confirming, keep \`conversation_ended\` false and keep engaging for as long as they want to.`;
}

function dayOfWeek(isoDate: string): string {
  return new Date(isoDate + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
}

function formatTaskList(tasks: TaskStatus[]): string {
  if (tasks.length === 0) return "(no tasks defined)";
  return tasks.map((t) => `- [${t.completed ? "x" : " "}] ${t.title}`).join("\n");
}

function formatRecentLogs(logs: RecentLogWithTasks[]): string {
  if (logs.length === 0) return "No check-ins yet before today — this is their first.";
  return logs
    .map((log) => {
      const taskStatuses: TaskStatus[] = log.tasks.map((t) => ({
        title: t.task_title,
        completed: t.completed,
      }));
      const header = `${dayOfWeek(log.log_date)} ${log.log_date} — ${log.completed_count}/${log.total_count} tasks completed:`;
      return `${header}\n${formatTaskList(taskStatuses)}`;
    })
    .join("\n\n");
}

function formatTaskContext(
  todayTasks: TaskStatus[],
  logDate: string,
  recentLogs: RecentLogWithTasks[],
): string {
  const completedCount = todayTasks.filter((t) => t.completed).length;
  return `Today (${dayOfWeek(logDate)} ${logDate}) — ${completedCount}/${todayTasks.length} tasks completed right now:
${formatTaskList(todayTasks)}

Last 7 days for context:
${formatRecentLogs(recentLogs)}`;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "What to say to the user." },
    conversation_ended: {
      type: "boolean",
      description:
        "True only if the user has just explicitly confirmed there is nothing more to add today. False otherwise, including on the turn where you propose closing.",
    },
    task_completions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Exact title of a task from today's list." },
          completed: { type: "boolean" },
        },
        required: ["title", "completed"],
        additionalProperties: false,
      },
      description:
        "Only include an entry if the user's message this turn explicitly reported doing (or not doing) that specific named task. Omit anything not mentioned this turn.",
    },
  },
  required: ["reply", "conversation_ended", "task_completions"],
  additionalProperties: false,
} as const;

interface CoachTurn {
  role: "user" | "assistant";
  content: string;
}

interface CoachResult {
  reply: string;
  conversationEnded: boolean;
  taskUpdates: TaskUpdate[];
}

// The model occasionally trails off mid-sentence inside an otherwise
// well-formed JSON reply — not a token-budget cutoff (that's checked
// separately via stop_reason), just an incomplete-feeling generation. Retry
// once before giving up.
function looksComplete(text: string): boolean {
  return /[.?!]["'”)]*\s*$/.test(text.trim());
}

async function callCoach(
  system: string,
  messages: CoachTurn[],
  attempt = 1,
): Promise<CoachResult> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: RESPONSE_SCHEMA },
    },
    system,
    messages,
  });

  // A long-running conversation (more turns, more context) can push the
  // model to run out of its token budget before finishing the JSON reply.
  // Fail loudly here so the API route surfaces a retryable error instead of
  // silently persisting an empty assistant message.
  if (response.stop_reason === "max_tokens") {
    throw new Error("Coach response was cut off (hit max_tokens) before completing.");
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("Coach response contained no text block.");
  }

  let parsed: {
    reply: string;
    conversation_ended: boolean;
    task_completions: TaskUpdate[];
  };
  try {
    parsed = JSON.parse(textBlock.text) as typeof parsed;
  } catch (err) {
    throw new Error(
      `Coach response was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!looksComplete(parsed.reply) && attempt < 2) {
    return callCoach(system, messages, attempt + 1);
  }

  return {
    reply: parsed.reply,
    conversationEnded: parsed.conversation_ended,
    taskUpdates: parsed.task_completions ?? [],
  };
}

/**
 * The whole day's coaching conversation, unified: the first message of the
 * day (no prior checkin_messages yet) and every message after it both go
 * through here — the only difference is how much history gets prepended.
 * Tasks are read live on every turn since they can change mid-conversation
 * (via the tasks page or the coach's own task_completions updates).
 */
export async function generateDayResponse(params: {
  profile: Profile;
  stats: UserStats;
  recentLogs: RecentLogWithTasks[];
  todayTasks: TaskStatus[];
  logDate: string;
  priorMessages: CheckInMessage[];
  newMessage: string;
}): Promise<CoachResult> {
  const { profile, stats, recentLogs, todayTasks, logDate, priorMessages, newMessage } = params;

  const contextualTurn = `${formatTaskContext(todayTasks, logDate, recentLogs)}

What they just said: "${newMessage}"`;

  const messages: CoachTurn[] = [
    ...priorMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: contextualTurn },
  ];

  return callCoach(buildSystemPrompt(profile, stats), messages);
}

/**
 * Speaks first for a brand-new day, before the user has said anything.
 * Reuses the same task/history context block `generateDayResponse` builds
 * for its "user" turn — there's no real user message yet, so this is the
 * only content driving the reply.
 */
export async function generateDayOpening(params: {
  profile: Profile;
  stats: UserStats;
  recentLogs: RecentLogWithTasks[];
  todayTasks: TaskStatus[];
  logDate: string;
}): Promise<string> {
  const { profile, stats, recentLogs, todayTasks, logDate } = params;

  const system = `${buildSystemPrompt(profile, stats)}

## It's a new day and they haven't said anything yet
You are speaking first — do not wait for them, and do not ask "is that everything for today" or reference anything as if they already replied. Look at yesterday's specific result (or the pattern across recent days) and open with that, plainly and specifically. Close with the one sharpest question about today — what matters most given the pattern, or their danger zone. Do not treat this as closing a day; \`conversation_ended\` must be false.`;

  const contextualTurn = formatTaskContext(todayTasks, logDate, recentLogs);

  const result = await callCoach(system, [{ role: "user", content: contextualTurn }]);
  return result.reply;
}

/**
 * Speaks first when the user submits an update on tasks they ticked (or
 * unticked) directly in the app — reacts to what changed instead of waiting
 * for them to report it themselves. Fires once per submit, not per click.
 */
export async function generateTaskNudge(params: {
  profile: Profile;
  stats: UserStats;
  recentLogs: RecentLogWithTasks[];
  todayTasks: TaskStatus[];
  logDate: string;
  changedTasks: TaskStatus[];
}): Promise<string> {
  const { profile, stats, recentLogs, todayTasks, logDate, changedTasks } = params;

  const changeList = changedTasks
    .map((t) => `"${t.title}" as ${t.completed ? "done" : "not done"}`)
    .join(", ");

  const system = `${buildSystemPrompt(profile, stats)}

## They just submitted an update on tasks, not in the chat
They just marked ${changeList} directly in the app and submitted that update — they haven't said anything to you yet. Speak first, like a coach who noticed and is texting them about it. React specifically to what changed first. Then glance at whatever else is still open on today's list below and, if it's worth a nudge or a reminder, fold that in — that's the one question you close with. Don't summarize the whole day or treat this as closing it out; \`conversation_ended\` must be false.`;

  const contextualTurn = formatTaskContext(todayTasks, logDate, recentLogs);

  const result = await callCoach(system, [{ role: "user", content: contextualTurn }]);
  return result.reply;
}

export async function generateSupportResponse(params: {
  profile: Profile;
  stats: UserStats;
  recentLogs: RecentLogWithTasks[];
  priorMessages: SupportMessage[];
  newMessage: string;
}): Promise<string> {
  const { profile, stats, recentLogs, priorMessages, newMessage } = params;

  const system = `${buildSystemPrompt(profile, stats)}

## This is an anytime conversation, not the daily check-in
They reached out to you directly, outside the daily check-in — they didn't wait for the daily prompt. That means something is happening right now: their danger zone, a slip already in progress, or a decision they're about to make. Respond directly to what they actually said. Use their history and patterns exactly as you would in a check-in. This thread never formally closes — don't propose ending it, don't ask "conversation_ended"-style questions; just respond and keep engaging for as long as they want to talk.

## Recent check-in history for context
${formatRecentLogs(recentLogs)}`;

  const messages: CoachTurn[] = [
    ...priorMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: newMessage },
  ];

  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system,
      messages,
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error("Coach response was cut off (hit max_tokens) before completing.");
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock) {
      throw new Error("Coach response contained no text block.");
    }

    if (looksComplete(textBlock.text) || attempt === 2) {
      return textBlock.text;
    }
  }

  throw new Error("unreachable");
}

export async function generateOnboardingWelcome(profile: Profile): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: `You are the AI coach inside InProgress, an accountability app. The user just finished a one-time onboarding. Write a short (2-4 sentence) first message that acknowledges who they are and what they're here to do, and tells them plainly what happens next: one check-in a day, ticking off the tasks they committed to, no escape hatch. No bullet points, no emoji, no headers.`,
    messages: [
      {
        role: "user",
        content: `Here's what I just told you about myself:
- Who I am and why I keep failing: ${profile.identity_and_failure}
- My one main goal: ${profile.main_goal}
- My daily non-negotiables: ${profile.non_negotiables}
- My danger zone: ${profile.danger_zone}
- Who/what I'm doing this for: ${profile.why_text}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "";
}

const TASKS_SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: { type: "string" },
      description: "Discrete daily task titles, each a short actionable phrase.",
    },
  },
  required: ["tasks"],
  additionalProperties: false,
} as const;

export async function parseTasksFromText(text: string): Promise<string[]> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: TASKS_SCHEMA },
    },
    system: `Split what the user wrote into a short list of discrete daily task titles — the individual commitments they're describing, not a literal word-by-word breakdown. Group naturally: "5 daily prayers" is one task ("Pray 5 times a day"), not five separate ones. "gym and work on project" is two tasks. Keep each title short (a few words), specific, and phrased as something checkable ("Gym", "Work on project", "Pray 5 times a day") rather than vague ("Be healthy"). Preserve their intent and wording where reasonable — don't invent tasks they didn't mention.`,
    messages: [{ role: "user", content: text }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("Task parsing was cut off (hit max_tokens) before completing.");
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("Task parsing response contained no text block.");
  }

  let parsed: { tasks: string[] };
  try {
    parsed = JSON.parse(textBlock.text) as { tasks: string[] };
  } catch (err) {
    throw new Error(
      `Task parsing response was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return parsed.tasks;
}
