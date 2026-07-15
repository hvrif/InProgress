import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toggleTaskCompletion } from "@/lib/queries";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as {
    dailyLogId?: string;
    taskId?: string;
    completed?: boolean;
  };
  if (!body.dailyLogId || !body.taskId || typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data: logRow } = await supabase
    .from("daily_logs")
    .select("ended_at")
    .eq("id", body.dailyLogId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!logRow) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }
  if ((logRow as { ended_at: string | null }).ended_at) {
    return NextResponse.json(
      { error: "Today's check-in has already ended" },
      { status: 409 },
    );
  }

  try {
    const result = await toggleTaskCompletion(
      supabase,
      user.id,
      body.dailyLogId,
      body.taskId,
      body.completed,
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update task" },
      { status: 500 },
    );
  }
}
