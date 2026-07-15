"use client";

import { useState } from "react";

const LINES = [
  "Every task done. That's a real day — protect it tomorrow.",
  "All of it, done. This is the version of you that actually wins.",
  "Full clear. Don't let tonight undo it.",
  "That's the standard. Hold it again tomorrow.",
];

const CONFETTI_COLORS = ["#34d399", "#fbbf24", "#60a5fa", "#f472b6", "#a78bfa"];

interface ConfettiPiece {
  left: number;
  delay: number;
  duration: number;
  rotate: number;
  color: string;
}

export function CelebrationPopup({ onClose }: { onClose: () => void }) {
  const [line] = useState(() => LINES[Math.floor(Math.random() * LINES.length)]);
  const [pieces] = useState<ConfettiPiece[]>(() =>
    Array.from({ length: 24 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.2 + Math.random() * 0.8,
      rotate: Math.random() * 360,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    })),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/60 px-4">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-1/4 h-2 w-2 rounded-sm animate-[confetti-fall_var(--duration)_ease-in_var(--delay)_forwards]"
          style={
            {
              left: `${p.left}%`,
              backgroundColor: p.color,
              transform: `rotate(${p.rotate}deg)`,
              "--duration": `${p.duration}s`,
              "--delay": `${p.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}

      <div className="max-w-sm space-y-4 rounded-2xl border border-emerald-800 bg-neutral-950 p-6 text-center animate-[pop_0.3s_ease-out]">
        <p className="text-2xl">✓</p>
        <p className="text-sm text-neutral-100">{line}</p>
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 transition hover:bg-white"
        >
          Keep going
        </button>
      </div>
    </div>
  );
}
