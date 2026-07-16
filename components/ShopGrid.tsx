"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ShopItem, ShopItemCategory } from "@/lib/types";

const SECTION_LABEL: Record<ShopItemCategory, string> = {
  accessory: "Accessories",
  pet: "Pets",
  xp_boost: "XP Potions",
};

function ItemCard({
  item,
  owned,
  equipped,
  canAfford,
  onBuy,
  onEquip,
  onUnequip,
  busy,
}: {
  item: ShopItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onEquip: () => void;
  onUnequip: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5">
      <span className="text-2xl">{item.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-100">{item.name}</p>
        <p className="truncate text-xs text-neutral-500">{item.description}</p>
      </div>

      {item.category === "xp_boost" ? (
        <button
          type="button"
          disabled={busy || !canAfford}
          onClick={onBuy}
          className="shrink-0 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-100 transition hover:border-neutral-500 disabled:opacity-40"
        >
          🪙 {item.price_coins}
        </button>
      ) : owned ? (
        <button
          type="button"
          disabled={busy}
          onClick={equipped ? onUnequip : onEquip}
          className={
            equipped
              ? "shrink-0 rounded-lg border border-emerald-700 bg-emerald-900/40 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:border-emerald-500"
              : "shrink-0 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-100 transition hover:border-neutral-500"
          }
        >
          {equipped ? "Equipped" : "Equip"}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy || !canAfford}
          onClick={onBuy}
          className="shrink-0 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-100 transition hover:border-neutral-500 disabled:opacity-40"
        >
          🪙 {item.price_coins}
        </button>
      )}
    </div>
  );
}

export function ShopGrid({
  items,
  ownedItemIds,
  equippedAccessory,
  equippedPet,
  coinBalance,
}: {
  items: ShopItem[];
  ownedItemIds: string[];
  equippedAccessory: string | null;
  equippedPet: string | null;
  coinBalance: number;
}) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const owned = new Set(ownedItemIds);

  async function buy(item: ShopItem) {
    setBusyKey(item.key);
    setError(null);
    try {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey: item.key }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Purchase failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function equip(item: ShopItem, itemKey: string | null) {
    setBusyKey(item.key);
    setError(null);
    try {
      const res = await fetch("/api/character/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: item.category, itemKey }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to equip");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to equip");
    } finally {
      setBusyKey(null);
    }
  }

  const sections: ShopItemCategory[] = ["accessory", "pet", "xp_boost"];

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}

      {sections.map((category) => {
        const sectionItems = items.filter((i) => i.category === category);
        if (sectionItems.length === 0) return null;

        return (
          <div key={category}>
            <h2 className="mb-2 text-sm font-medium text-neutral-400">
              {SECTION_LABEL[category]}
            </h2>
            <div className="space-y-2">
              {sectionItems.map((item) => {
                const isOwned = owned.has(item.id);
                const isEquipped =
                  (item.category === "accessory" && equippedAccessory === item.key) ||
                  (item.category === "pet" && equippedPet === item.key);

                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    owned={isOwned}
                    equipped={isEquipped}
                    canAfford={coinBalance >= item.price_coins}
                    busy={busyKey === item.key}
                    onBuy={() => buy(item)}
                    onEquip={() => equip(item, item.key)}
                    onUnequip={() => equip(item, null)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
