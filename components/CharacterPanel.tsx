"use client";

import { useState } from "react";
import { CharacterSheet } from "@/components/CharacterSheet";
import { CharacterCustomizer } from "@/components/CharacterCustomizer";
import type { Character } from "@/lib/types";

export function CharacterPanel({ character }: { character: Character | null }) {
  const [editing, setEditing] = useState(!character);

  if (character && !editing) {
    return (
      <div className="space-y-4">
        <CharacterSheet character={character} />
        <button
          onClick={() => setEditing(true)}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300 transition hover:border-neutral-600 hover:text-neutral-100"
        >
          Edit Appearance
        </button>
      </div>
    );
  }

  return (
    <CharacterCustomizer
      existing={character ?? undefined}
      onSaved={() => setEditing(false)}
    />
  );
}
