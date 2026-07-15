import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAppearance } from "@/lib/character";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string; appearance?: unknown };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const appearance = resolveAppearance(body.appearance);

  const { data: character, error } = await supabase
    .from("characters")
    .insert({ user_id: user.id, name, appearance })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ character });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string; appearance?: unknown };

  const update: { name?: string; appearance?: unknown } = {};
  if (typeof body.name === "string" && body.name.trim()) {
    update.name = body.name.trim();
  }
  if (body.appearance !== undefined) {
    update.appearance = resolveAppearance(body.appearance);
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data: character, error } = await supabase
    .from("characters")
    .update(update)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ character });
}
