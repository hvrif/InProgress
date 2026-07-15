import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOnboardingWelcome } from "@/lib/anthropic";
import type { OnboardingAnswers, Profile } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const answers = (await request.json()) as OnboardingAnswers;

  for (const field of [
    "identity_and_failure",
    "main_goal",
    "danger_zone",
    "why_text",
  ] as const) {
    if (!answers[field]?.trim()) {
      return NextResponse.json(
        { error: `Missing answer for ${field}` },
        { status: 400 },
      );
    }
  }

  const tasks = (answers.tasks ?? []).map((t) => t.trim()).filter(Boolean);
  if (tasks.length === 0) {
    return NextResponse.json({ error: "At least one task is required" }, { status: 400 });
  }

  const draftProfile: Profile = {
    id: user.id,
    identity_and_failure: answers.identity_and_failure,
    main_goal: answers.main_goal,
    non_negotiables: tasks.join(", "),
    danger_zone: answers.danger_zone,
    why_text: answers.why_text,
    welcome_message: "",
    onboarding_completed_at: new Date().toISOString(),
  };

  let welcomeMessage: string;
  try {
    welcomeMessage = await generateOnboardingWelcome(draftProfile);
  } catch (err) {
    console.error("Failed to generate onboarding welcome message", err);
    return NextResponse.json(
      { error: "The coach couldn't respond right now. Try again." },
      { status: 502 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({ ...draftProfile, welcome_message: welcomeMessage })
    .select()
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: tasksError } = await supabase.from("tasks").insert(
    tasks.map((title, index) => ({
      user_id: user.id,
      title,
      active: true,
      sort_order: index,
    })),
  );

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 });
  }

  const { error: statsError } = await supabase.from("user_stats").insert({
    user_id: user.id,
    current_streak: 0,
    longest_streak: 0,
    total_xp: 0,
    level: 1,
    last_log_date: null,
    updated_at: new Date().toISOString(),
  });

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  return NextResponse.json({ profile: profile as Profile });
}
