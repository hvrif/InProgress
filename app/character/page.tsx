import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { CharacterPanel } from "@/components/CharacterPanel";
import { resolveAppearance } from "@/lib/character";
import type { Character, UserStats } from "@/lib/types";

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

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader stats={stats} active="/character" />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        <CharacterPanel character={character} />
      </main>
    </div>
  );
}
