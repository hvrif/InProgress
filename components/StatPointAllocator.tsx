"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STAT_CATEGORIES, STAT_EMOJI, STAT_LABELS } from "@/lib/character";
import type { StatCategory } from "@/lib/types";

export function StatPointAllocator({ points }: { points: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<StatCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (points <= 0) return null;

  async function allocate(stat: StatCategory) {
    setBusy(stat);
    setError(null);
    try {
      const res = await fetch("/api/character/allocate-stat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stat }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to allocate");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to allocate");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-emerald-800 bg-emerald-950/20 p-4">
      <p className="text-sm font-medium text-emerald-300">
        ✨ {points} stat point{points === 1 ? "" : "s"} to spend
      </p>
      <div className="grid grid-cols-2 gap-2">
        {STAT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            disabled={busy !== null}
            onClick={() => allocate(cat)}
            className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 transition hover:border-emerald-600 disabled:opacity-50"
          >
            <span>
              {STAT_EMOJI[cat]} {STAT_LABELS[cat]}
            </span>
            <span className="text-emerald-400">+</span>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
