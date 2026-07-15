import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseTasksFromText } from "@/lib/anthropic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { text?: string };
  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Text required" }, { status: 400 });
  }

  try {
    const tasks = await parseTasksFromText(text);
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Failed to parse tasks", err);
    return NextResponse.json(
      { error: "Couldn't parse that into tasks. Try again." },
      { status: 502 },
    );
  }
}
