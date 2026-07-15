import { STAT_BAR_CAP, STAT_CATEGORIES, STAT_EMOJI } from "@/lib/character";
import type { StatCategory } from "@/lib/types";

const SIZE = 180;
const CENTER = SIZE / 2;
const RADIUS = 62;

const ANGLES = STAT_CATEGORIES.map(
  (_, i) => (Math.PI * 2 * i) / STAT_CATEGORIES.length - Math.PI / 2,
);

function point(angle: number, radius: number): [number, number] {
  return [CENTER + radius * Math.cos(angle), CENTER + radius * Math.sin(angle)];
}

function polygonPoints(radius: number): string {
  return ANGLES.map((a) => point(a, radius).join(",")).join(" ");
}

export function StatRadar({
  stats,
  accentClassName,
}: {
  stats: Record<StatCategory, number>;
  accentClassName: string;
}) {
  const dataPoints = STAT_CATEGORIES.map((cat, i) => {
    const value = Math.min(stats[cat], STAT_BAR_CAP);
    return point(ANGLES[i], (value / STAT_BAR_CAP) * RADIUS);
  });
  const dataPath = dataPoints.map((p) => p.join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto h-44 w-44">
      {[0.33, 0.66, 1].map((frac) => (
        <polygon
          key={frac}
          points={polygonPoints(RADIUS * frac)}
          fill="none"
          className="stroke-neutral-800"
          strokeWidth={1}
        />
      ))}
      {ANGLES.map((a, i) => {
        const [x, y] = point(a, RADIUS);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            className="stroke-neutral-800"
            strokeWidth={1}
          />
        );
      })}
      <polygon
        points={dataPath}
        fill="currentColor"
        fillOpacity={0.35}
        stroke="currentColor"
        strokeWidth={2}
        className={`${accentClassName} transition-all duration-500`}
      />
      {ANGLES.map((a, i) => {
        const [x, y] = point(a, RADIUS + 16);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={14}>
            {STAT_EMOJI[STAT_CATEGORIES[i]]}
          </text>
        );
      })}
    </svg>
  );
}
