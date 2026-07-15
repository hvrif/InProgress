import type { StatCategory } from "@/lib/types";

export const STAT_CATEGORIES: StatCategory[] = ["strength", "endurance", "focus", "discipline"];

export const STAT_LABELS: Record<StatCategory, string> = {
  strength: "Strength",
  endurance: "Endurance",
  focus: "Focus",
  discipline: "Discipline",
};

export const STAT_EMOJI: Record<StatCategory, string> = {
  strength: "💪",
  endurance: "🏃",
  focus: "🎯",
  discipline: "🧭",
};

export const STAT_DELTA_PER_TASK = 2;

// Soft visual cap for stat bars — bars fill up to this value, then stay full.
export const STAT_BAR_CAP = 50;

/** Stats never go negative — a bad stretch bottoms out at 0, not into the negatives. */
export function applyStatDelta(value: number, delta: number): number {
  return Math.max(0, value + delta);
}

// ── Appearance ─────────────────────────────────────────────────────────────
// A real layered paper doll: every slot below is an independent, purely
// cosmetic pick from a fixed catalog — never derived from anything about the
// user's real body. Body build in particular is opt-in only, per design.

export type BodyBuild = "slim" | "athletic" | "broad";
export type HairStyleId = "bald" | "short" | "long" | "mohawk" | "curly";
export type FacialHairId = "none" | "stubble" | "mustache" | "beard";
export type LegsStyleId = "pants" | "shorts";
export type OutfitStyleId = "tshirt" | "tanktop" | "tunic" | "robe";
export type ArmorId = "none" | "leather" | "plate" | "cloak";

export interface CharacterAppearance {
  skinTone: string;
  hairStyle: HairStyleId;
  hairColor: string;
  facialHair: FacialHairId;
  bodyBuild: BodyBuild;
  legsStyle: LegsStyleId;
  legsColor: string;
  outfitStyle: OutfitStyleId;
  outfitColor: string;
  armor: ArmorId;
}

export const DEFAULT_APPEARANCE: CharacterAppearance = {
  skinTone: "#f1c27d",
  hairStyle: "short",
  hairColor: "#1a1a1a",
  facialHair: "none",
  bodyBuild: "athletic",
  legsStyle: "pants",
  legsColor: "#3b5bdb",
  outfitStyle: "tshirt",
  outfitColor: "#e03131",
  armor: "none",
};

export const SKIN_TONES: string[] = [
  "#ffe0bd",
  "#f1c27d",
  "#e0ac69",
  "#c68642",
  "#8d5524",
  "#5c3a21",
];

export const HAIR_COLORS: string[] = [
  "#1a1a1a",
  "#4b3621",
  "#d4af37",
  "#a83c1e",
  "#9ca3af",
  "#3b82f6",
];

export const OUTFIT_COLORS: string[] = [
  "#e03131",
  "#3b5bdb",
  "#2f9e44",
  "#9c36b5",
  "#f08c00",
  "#1f2937",
  "#f3f4f6",
  "#78350f",
];

export const HAIR_STYLES: { id: HairStyleId; label: string }[] = [
  { id: "bald", label: "Bald" },
  { id: "short", label: "Short" },
  { id: "long", label: "Long" },
  { id: "mohawk", label: "Mohawk" },
  { id: "curly", label: "Curly" },
];

export const FACIAL_HAIR_STYLES: { id: FacialHairId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "stubble", label: "Stubble" },
  { id: "mustache", label: "Mustache" },
  { id: "beard", label: "Beard" },
];

export const BODY_BUILDS: { id: BodyBuild; label: string }[] = [
  { id: "slim", label: "Slim" },
  { id: "athletic", label: "Athletic" },
  { id: "broad", label: "Broad" },
];

export const LEGS_STYLES: { id: LegsStyleId; label: string }[] = [
  { id: "pants", label: "Pants" },
  { id: "shorts", label: "Shorts" },
];

export const OUTFIT_STYLES: { id: OutfitStyleId; label: string }[] = [
  { id: "tshirt", label: "T-Shirt" },
  { id: "tanktop", label: "Tank Top" },
  { id: "tunic", label: "Tunic" },
  { id: "robe", label: "Robe" },
];

export const ARMOR_STYLES: { id: ArmorId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "leather", label: "Leather" },
  { id: "plate", label: "Plate" },
  { id: "cloak", label: "Cloak" },
];

/** Merges partial/legacy jsonb into a complete appearance — every field falls back to the default if missing or invalid. */
export function resolveAppearance(raw: unknown): CharacterAppearance {
  const value = (raw && typeof raw === "object" ? raw : {}) as Partial<CharacterAppearance>;

  return {
    skinTone: SKIN_TONES.includes(value.skinTone ?? "") ? value.skinTone! : DEFAULT_APPEARANCE.skinTone,
    hairStyle: HAIR_STYLES.some((s) => s.id === value.hairStyle)
      ? value.hairStyle!
      : DEFAULT_APPEARANCE.hairStyle,
    hairColor: HAIR_COLORS.includes(value.hairColor ?? "")
      ? value.hairColor!
      : DEFAULT_APPEARANCE.hairColor,
    facialHair: FACIAL_HAIR_STYLES.some((s) => s.id === value.facialHair)
      ? value.facialHair!
      : DEFAULT_APPEARANCE.facialHair,
    bodyBuild: BODY_BUILDS.some((s) => s.id === value.bodyBuild)
      ? value.bodyBuild!
      : DEFAULT_APPEARANCE.bodyBuild,
    legsStyle: LEGS_STYLES.some((s) => s.id === value.legsStyle)
      ? value.legsStyle!
      : DEFAULT_APPEARANCE.legsStyle,
    legsColor: OUTFIT_COLORS.includes(value.legsColor ?? "")
      ? value.legsColor!
      : DEFAULT_APPEARANCE.legsColor,
    outfitStyle: OUTFIT_STYLES.some((s) => s.id === value.outfitStyle)
      ? value.outfitStyle!
      : DEFAULT_APPEARANCE.outfitStyle,
    outfitColor: OUTFIT_COLORS.includes(value.outfitColor ?? "")
      ? value.outfitColor!
      : DEFAULT_APPEARANCE.outfitColor,
    armor: ARMOR_STYLES.some((s) => s.id === value.armor) ? value.armor! : DEFAULT_APPEARANCE.armor,
  };
}

export type ClassId = "attacker" | "tank" | "mage" | "sentinel" | "balanced" | "novice";

export interface ClassDef {
  id: ClassId;
  label: string;
  emoji: string;
  tagline: string;
}

// Class is never picked — it's earned. Whichever stat you've built up the
// most through real tasks IS your class, and it shifts as your habits do.
export const CLASS_BY_STAT: Record<StatCategory, ClassDef> = {
  strength: {
    id: "attacker",
    label: "Attacker",
    emoji: "⚔️",
    tagline: "Hits hardest — built on strength tasks.",
  },
  endurance: {
    id: "tank",
    label: "Tank",
    emoji: "🛡️",
    tagline: "Outlasts everything — built on endurance tasks.",
  },
  focus: {
    id: "mage",
    label: "Mage",
    emoji: "🔮",
    tagline: "Sharp and precise — built on focus tasks.",
  },
  discipline: {
    id: "sentinel",
    label: "Sentinel",
    emoji: "🕯️",
    tagline: "Steady no matter what — built on discipline tasks.",
  },
};

export const NOVICE_CLASS: ClassDef = {
  id: "novice",
  label: "Novice",
  emoji: "🌱",
  tagline: "No stats built up yet — tag a task to start your path.",
};

export const BALANCED_CLASS: ClassDef = {
  id: "balanced",
  label: "Balanced",
  emoji: "⚖️",
  tagline: "Equally strong across the board.",
};

type StatBlock = Record<StatCategory, number>;

/** Whichever stat is currently highest determines the class — ties are "Balanced", all-zero is "Novice". */
export function deriveCharacterClass(stats: StatBlock): ClassDef {
  const max = Math.max(...STAT_CATEGORIES.map((cat) => stats[cat]));
  if (max === 0) return NOVICE_CLASS;

  const topStats = STAT_CATEGORIES.filter((cat) => stats[cat] === max);
  if (topStats.length > 1) return BALANCED_CLASS;

  return CLASS_BY_STAT[topStats[0]];
}

export function powerLevel(stats: StatBlock): number {
  return STAT_CATEGORIES.reduce((sum, cat) => sum + stats[cat], 0);
}

const RANK_THRESHOLDS: { min: number; label: string }[] = [
  { min: 0, label: "Novice" },
  { min: 20, label: "Apprentice" },
  { min: 50, label: "Adept" },
  { min: 100, label: "Veteran" },
  { min: 150, label: "Legend" },
];

/** Overall progression title, driven by total stat points across all 4 stats. */
export function rankForPower(power: number): string {
  let label = RANK_THRESHOLDS[0].label;
  for (const tier of RANK_THRESHOLDS) {
    if (power >= tier.min) label = tier.label;
  }
  return label;
}
