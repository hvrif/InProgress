import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STAT_CATEGORIES } from "@/lib/character";
import type { StatCategory, Task } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { title?: string; statCategory?: string };
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  const statCategory: StatCategory | null = STAT_CATEGORIES.includes(
    body.statCategory as StatCategory,
  )
    ? (body.statCategory as StatCategory)
    : null;

  const { data: last } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = last ? (last as Pick<Task, "sort_order">).sort_order + 1 : 0;

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title,
      active: true,
      sort_order: nextSortOrder,
      stat_category: statCategory,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: task as Task });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string; active?: boolean; title?: string };
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const update: Partial<Pick<Task, "active" | "title">> = {};
  if (typeof body.active === "boolean") update.active = body.active;
  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: task as Task });
}
