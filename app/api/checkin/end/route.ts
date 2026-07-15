import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { finalizeDayLog } from "@/lib/queries";
import type { DailyLog, UserStats } from "@/lib/types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: logRow } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("log_date", todayIso())
    .is("ended_at", null)
    .maybeSingle();

  if (!logRow) {
    return NextResponse.json({ error: "No open check-in for today" }, { status: 404 });
  }
  const log = logRow as DailyLog;

  const { data: statsRow } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!statsRow) {
    return NextResponse.json({ error: "Missing stats row" }, { status: 500 });
  }
  const stats = statsRow as UserStats;

  await finalizeDayLog(supabase, user.id, log, stats);

  return NextResponse.json({ ended: true });
}
