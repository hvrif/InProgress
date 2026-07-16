import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allocateStatPoint } from "@/lib/queries";
import { STAT_CATEGORIES } from "@/lib/character";
import type { StatCategory } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { stat?: string };
  if (!STAT_CATEGORIES.includes(body.stat as StatCategory)) {
    return NextResponse.json({ error: "Invalid stat" }, { status: 400 });
  }

  try {
    const result = await allocateStatPoint(supabase, user.id, body.stat as StatCategory);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to allocate stat point" },
      { status: 400 },
    );
  }
}
