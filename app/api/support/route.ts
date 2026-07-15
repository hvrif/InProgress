import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSupportResponse } from "@/lib/anthropic";
import { fetchRecentLogsWithTasks } from "@/lib/queries";
import type { Profile, SupportMessage, UserStats } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data } = await supabase
    .from("support_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return NextResponse.json({ messages: (data ?? []) as SupportMessage[] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { message?: string };
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profileRow) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  }
  const profile = profileRow as Profile;

  const { data: statsRow } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!statsRow) {
    return NextResponse.json({ error: "Missing stats row" }, { status: 500 });
  }
  const stats = statsRow as UserStats;

  // "Strictly before" a date one day out so today's log (if any) is included
  // in the most-recent-7 window, same as the original unbounded query did.
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const recentLogs = await fetchRecentLogsWithTasks(
    supabase,
    user.id,
    tomorrow.toISOString().slice(0, 10),
  );

  const { data: priorMessagesRows } = await supabase
    .from("support_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(40);
  const priorMessages = (priorMessagesRows ?? []) as SupportMessage[];

  const { error: insertUserMsgError } = await supabase.from("support_messages").insert({
    user_id: user.id,
    role: "user",
    content: message,
  });
  if (insertUserMsgError) {
    return NextResponse.json({ error: insertUserMsgError.message }, { status: 500 });
  }

  let reply: string;
  try {
    reply = await generateSupportResponse({
      profile,
      stats,
      recentLogs,
      priorMessages,
      newMessage: message,
    });
  } catch (err) {
    console.error("Failed to generate support response", err);
    return NextResponse.json(
      { error: "The coach couldn't respond right now. Try again." },
      { status: 502 },
    );
  }

  const { error: insertAssistantMsgError } = await supabase.from("support_messages").insert({
    user_id: user.id,
    role: "assistant",
    content: reply,
  });
  if (insertAssistantMsgError) {
    return NextResponse.json({ error: insertAssistantMsgError.message }, { status: 500 });
  }

  return NextResponse.json({ reply });
}
