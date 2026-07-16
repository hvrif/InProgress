import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { purchaseShopItem } from "@/lib/queries";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { itemKey?: string };
  if (!body.itemKey) {
    return NextResponse.json({ error: "itemKey required" }, { status: 400 });
  }

  try {
    const result = await purchaseShopItem(supabase, user.id, body.itemKey);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Purchase failed" },
      { status: 400 },
    );
  }
}
