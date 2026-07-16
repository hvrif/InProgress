import {
  STAT_BAR_CAP,
  STAT_CATEGORIES,
  STAT_EMOJI,
  STAT_LABELS,
  deriveCharacterClass,
  powerLevel,
  rankForPower,
  type ClassId,
} from "@/lib/character";
import { StatRadar } from "@/components/StatRadar";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import type { Character } from "@/lib/types";

const CLASS_STYLES: Record<
  ClassId,
  { border: string; glow: string; text: string; bar: string }
> = {
  attacker: {
    border: "border-red-800",
    glow: "bg-red-500",
    text: "text-red-400",
    bar: "bg-red-500",
  },
  tank: {
    border: "border-sky-800",
    glow: "bg-sky-500",
    text: "text-sky-400",
    bar: "bg-sky-500",
  },
  mage: {
    border: "border-violet-800",
    glow: "bg-violet-500",
    text: "text-violet-400",
    bar: "bg-violet-500",
  },
  sentinel: {
    border: "border-amber-800",
    glow: "bg-amber-500",
    text: "text-amber-400",
    bar: "bg-amber-500",
  },
  balanced: {
    border: "border-emerald-800",
    glow: "bg-emerald-500",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
  },
  novice: {
    border: "border-neutral-800",
    glow: "bg-neutral-500",
    text: "text-neutral-400",
    bar: "bg-neutral-500",
  },
};

export function CharacterSheet({
  character,
  accessoryEmoji,
  petEmoji,
}: {
  character: Character;
  accessoryEmoji?: string | null;
  petEmoji?: string | null;
}) {
  const characterClass = deriveCharacterClass(character);
  const power = powerLevel(character);
  const rank = rankForPower(power);
  const style = CLASS_STYLES[characterClass.id];

  return (
    <div className="space-y-6">
      <div
        className={`relative overflow-hidden rounded-xl border ${style.border} bg-neutral-900/60 px-4 py-6 text-center`}
      >
        <div className="relative mx-auto flex h-48 w-44 items-center justify-center">
          <div
            className={`absolute inset-x-0 top-4 mx-auto h-32 w-32 rounded-full ${style.glow} opacity-40 blur-2xl animate-[aura-pulse_3s_ease-in-out_infinite]`}
          />
          <CharacterAvatar
            appearance={character.appearance}
            accessoryEmoji={accessoryEmoji}
            petEmoji={petEmoji}
            className="relative h-48 w-44"
          />
          <span className="absolute -bottom-1 -right-4 text-3xl animate-[float-idle_2.5s_ease-in-out_infinite]">
            {characterClass.emoji}
          </span>
        </div>

        <p className="mt-3 text-lg font-semibold text-neutral-100">{character.name}</p>
        <p className={`text-sm font-medium ${style.text}`}>
          {rank} {characterClass.label}
        </p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-neutral-500">{characterClass.tagline}</p>

        <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-950/60 px-3 py-1 text-xs text-neutral-400">
          <span>⚡ Power</span>
          <span className="font-semibold text-neutral-200">{power}</span>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 py-2">
        <StatRadar stats={character} accentClassName={style.text} />
      </div>

      <div className="space-y-3">
        {STAT_CATEGORIES.map((cat) => {
          const value = character[cat];
          const pct = Math.min(100, Math.round((value / STAT_BAR_CAP) * 100));
          const isDominant = characterClass.id !== "novice" && value === Math.max(...STAT_CATEGORIES.map((c) => character[c]));
          return (
            <div key={cat} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>
                  {STAT_EMOJI[cat]} {STAT_LABELS[cat]}
                </span>
                <span>{value}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isDominant ? style.bar : "bg-neutral-600"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
