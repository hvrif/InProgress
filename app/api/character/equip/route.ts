import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ShopItem } from "@/lib/types";

const EQUIP_COLUMN = {
  accessory: "equipped_accessory",
  pet: "equipped_pet",
} as const;

type Slot = keyof typeof EQUIP_COLUMN;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { slot?: string; itemKey?: string | null };
  const slot = body.slot as Slot;
  if (!(slot in EQUIP_COLUMN)) {
    return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  }

  const column = EQUIP_COLUMN[slot];

  // Unequip: itemKey is null/undefined.
  if (!body.itemKey) {
    const { error } = await supabase
      .from("characters")
      .update({ [column]: null })
      .eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ equipped: null });
  }

  const { data: itemRow } = await supabase
    .from("shop_items")
    .select("*")
    .eq("key", body.itemKey)
    .eq("category", slot)
    .maybeSingle();
  if (!itemRow) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  const item = itemRow as ShopItem;

  const { data: owned } = await supabase
    .from("inventory")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_id", item.id)
    .maybeSingle();
  if (!owned) {
    return NextResponse.json({ error: "Item not owned" }, { status: 403 });
  }

  const { error } = await supabase
    .from("characters")
    .update({ [column]: item.key })
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ equipped: item.key });
}
