import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { CharacterPanel } from "@/components/CharacterPanel";
import { resolveAppearance } from "@/lib/character";
import type { Character, ShopItem, UserStats } from "@/lib/types";

export default async function CharacterPage() {
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

  const { data: characterRow } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const rawCharacter = characterRow as (Omit<Character, "appearance"> & { appearance: unknown }) | null;
  const character: Character | null = rawCharacter
    ? { ...rawCharacter, appearance: resolveAppearance(rawCharacter.appearance) }
    : null;

  const equippedKeys = [character?.equipped_accessory, character?.equipped_pet].filter(
    (k): k is string => !!k,
  );
  let equippedEmoji: Record<string, string> = {};
  if (equippedKeys.length > 0) {
    const { data: equippedRows } = await supabase
      .from("shop_items")
      .select("key, emoji")
      .in("key", equippedKeys);
    equippedEmoji = Object.fromEntries(
      ((equippedRows ?? []) as Pick<ShopItem, "key" | "emoji">[]).map((r) => [r.key, r.emoji]),
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader stats={stats} active="/character" />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        <CharacterPanel
          character={character}
          unspentStatPoints={stats?.unspent_stat_points ?? 0}
          accessoryEmoji={character?.equipped_accessory ? equippedEmoji[character.equipped_accessory] : null}
          petEmoji={character?.equipped_pet ? equippedEmoji[character.equipped_pet] : null}
        />
      </main>
    </div>
  );
}
