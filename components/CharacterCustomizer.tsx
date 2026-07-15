"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ARMOR_STYLES,
  BODY_BUILDS,
  DEFAULT_APPEARANCE,
  FACIAL_HAIR_STYLES,
  HAIR_COLORS,
  HAIR_STYLES,
  LEGS_STYLES,
  OUTFIT_COLORS,
  OUTFIT_STYLES,
  SKIN_TONES,
} from "@/lib/character";
import type { CharacterAppearance } from "@/lib/character";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import type { Character } from "@/lib/types";

function SwatchRow({
  colors,
  value,
  onChange,
}: {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={
            color === value
              ? "h-7 w-7 rounded-full ring-2 ring-neutral-100 ring-offset-2 ring-offset-neutral-950"
              : "h-7 w-7 rounded-full ring-1 ring-neutral-700 hover:ring-neutral-400"
          }
          style={{ backgroundColor: color }}
          aria-label={color}
        />
      ))}
    </div>
  );
}

function OptionRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={
            opt.id === value
              ? "rounded-lg border border-neutral-100 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-100"
              : "rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-400 hover:border-neutral-600"
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-neutral-400">{label}</p>
      {children}
    </div>
  );
}

export function CharacterCustomizer({
  existing,
  onSaved,
}: {
  existing?: Character;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? "");
  const [appearance, setAppearance] = useState<CharacterAppearance>(
    existing?.appearance ?? DEFAULT_APPEARANCE,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CharacterAppearance>(key: K, value: CharacterAppearance[K]) {
    setAppearance((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/character", {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, appearance }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }
      router.refresh();
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {!existing && (
        <p className="text-sm text-neutral-400">
          Create your character. Appearance is purely cosmetic — pick whatever you like.
        </p>
      )}

      <CharacterAvatar appearance={appearance} className="mx-auto h-48 w-44" />

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Character name"
        disabled={busy}
        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-600 disabled:opacity-50"
      />

      <div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <Field label="Skin tone">
          <SwatchRow
            colors={SKIN_TONES}
            value={appearance.skinTone}
            onChange={(v) => set("skinTone", v)}
          />
        </Field>

        <Field label="Hair style">
          <OptionRow options={HAIR_STYLES} value={appearance.hairStyle} onChange={(v) => set("hairStyle", v)} />
        </Field>

        <Field label="Hair color">
          <SwatchRow colors={HAIR_COLORS} value={appearance.hairColor} onChange={(v) => set("hairColor", v)} />
        </Field>

        <Field label="Facial hair">
          <OptionRow
            options={FACIAL_HAIR_STYLES}
            value={appearance.facialHair}
            onChange={(v) => set("facialHair", v)}
          />
        </Field>

        <Field label="Body build">
          <OptionRow options={BODY_BUILDS} value={appearance.bodyBuild} onChange={(v) => set("bodyBuild", v)} />
        </Field>

        <Field label="Legs">
          <OptionRow options={LEGS_STYLES} value={appearance.legsStyle} onChange={(v) => set("legsStyle", v)} />
        </Field>

        <Field label="Legs color">
          <SwatchRow colors={OUTFIT_COLORS} value={appearance.legsColor} onChange={(v) => set("legsColor", v)} />
        </Field>

        <Field label="Clothes">
          <OptionRow
            options={OUTFIT_STYLES}
            value={appearance.outfitStyle}
            onChange={(v) => set("outfitStyle", v)}
          />
        </Field>

        <Field label="Clothes color">
          <SwatchRow
            colors={OUTFIT_COLORS}
            value={appearance.outfitColor}
            onChange={(v) => set("outfitColor", v)}
          />
        </Field>

        <Field label="Armor">
          <OptionRow options={ARMOR_STYLES} value={appearance.armor} onChange={(v) => set("armor", v)} />
        </Field>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="w-full rounded-lg bg-neutral-100 px-4 py-2 font-medium text-neutral-900 transition hover:bg-white disabled:opacity-50"
      >
        {existing ? "Save appearance" : "Create character"}
      </button>
    </form>
  );
}
