import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { ShopGrid } from "@/components/ShopGrid";
import type { Character, InventoryEntry, ShopItem, UserStats } from "@/lib/types";

export default async function ShopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: statsRow } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  const stats = statsRow as UserStats | null;

  const { data: itemRows } = await supabase
    .from("shop_items")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });
  const items = (itemRows ?? []) as ShopItem[];

  const { data: inventoryRows } = await supabase
    .from("inventory")
    .select("*")
    .eq("user_id", user.id);
  const ownedItemIds = new Set(((inventoryRows ?? []) as InventoryEntry[]).map((i) => i.item_id));

  const { data: characterRow } = await supabase
    .from("characters")
    .select("equipped_accessory, equipped_pet")
    .eq("user_id", user.id)
    .maybeSingle();
  const character = characterRow as Pick<Character, "equipped_accessory" | "equipped_pet"> | null;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader stats={stats} active="/shop" />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
          <span className="text-sm text-neutral-400">Balance</span>
          <span className="text-lg font-semibold text-neutral-100">
            🪙 {stats?.coin_balance ?? 0}
          </span>
        </div>

        <ShopGrid
          items={items}
          ownedItemIds={[...ownedItemIds]}
          equippedAccessory={character?.equipped_accessory ?? null}
          equippedPet={character?.equipped_pet ?? null}
          coinBalance={stats?.coin_balance ?? 0}
        />
      </main>
    </div>
  );
}
