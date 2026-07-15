import type { BodyBuild, CharacterAppearance, OutfitStyleId } from "@/lib/character";

const CX = 65;
const HEAD_CY = 34;
const HEAD_R = 27;
const TORSO_TOP = HEAD_CY + HEAD_R - 6;
const LEG_TOP = 90;
const LEG_BOTTOM = 130;
const SHORTS_BOTTOM = 108;

const OUTLINE = "#161616";
const OUTLINE_WIDTH = 3;

const PLATE_COLOR = "#9ca3af";
const PLATE_ACCENT = "#e5e7eb";
const LEATHER_COLOR = "#78350f";
const CLOAK_COLOR = "#312e81";

const BUILD_WIDTHS: Record<BodyBuild, { torso: number; arm: number; leg: number }> = {
  slim: { torso: 34, arm: 9, leg: 12 },
  athletic: { torso: 42, arm: 11, leg: 14 },
  broad: { torso: 52, arm: 13, leg: 17 },
};

const OUTFIT_BOTTOM: Record<OutfitStyleId, number> = {
  tshirt: 90,
  tanktop: 88,
  tunic: 105,
  robe: 120,
};
const OUTFIT_TOP: Record<OutfitStyleId, number> = {
  tshirt: TORSO_TOP,
  tanktop: TORSO_TOP + 3,
  tunic: TORSO_TOP,
  robe: TORSO_TOP - 2,
};

/** Lightens (positive) or darkens (negative) a hex color for simple flat cel-shading. */
function shade(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const r = clamp(((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = clamp(((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = clamp((num & 0xff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function CharacterAvatar({
  appearance,
  className,
}: {
  appearance: CharacterAppearance;
  className?: string;
}) {
  const { torso: torsoWidth, arm: armWidth, leg: legWidth } = BUILD_WIDTHS[appearance.bodyBuild];
  const torsoLeft = CX - torsoWidth / 2;
  const torsoRight = CX + torsoWidth / 2;
  const armY = TORSO_TOP + 2;
  const armBottom = 95;
  const leftArmX = torsoLeft - armWidth - 2;
  const rightArmX = torsoRight + 2;
  const leftLegX = CX - legWidth - 3;
  const rightLegX = CX + 3;

  const outfitTop = OUTFIT_TOP[appearance.outfitStyle];
  const outfitBottom = OUTFIT_BOTTOM[appearance.outfitStyle];
  const outfitShadow = shade(appearance.outfitColor, -0.18);
  const skinShadow = shade(appearance.skinTone, -0.15);
  const skinHighlight = shade(appearance.skinTone, 0.12);

  const hidesHair = appearance.armor === "plate" || appearance.armor === "cloak";

  return (
    <svg viewBox="0 0 130 150" className={className}>
      {/* ground shadow */}
      <ellipse cx={CX} cy={LEG_BOTTOM + 3} rx={torsoWidth / 2 + 12} ry={5} fill="#000000" opacity={0.25} />

      {/* cloak, drapes behind the body */}
      {appearance.armor === "cloak" && (
        <path
          d={`M ${torsoLeft - 8} ${TORSO_TOP} L ${torsoRight + 8} ${TORSO_TOP} L ${torsoRight + 18} 122 L ${torsoLeft - 18} 122 Z`}
          fill={CLOAK_COLOR}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_WIDTH}
          strokeLinejoin="round"
        />
      )}

      {/* legs */}
      {appearance.legsStyle === "shorts" ? (
        <>
          <rect x={leftLegX} y={LEG_TOP} width={legWidth} height={SHORTS_BOTTOM - LEG_TOP} rx={5} fill={appearance.legsColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
          <rect x={rightLegX} y={LEG_TOP} width={legWidth} height={SHORTS_BOTTOM - LEG_TOP} rx={5} fill={appearance.legsColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
          <rect x={leftLegX} y={SHORTS_BOTTOM} width={legWidth} height={LEG_BOTTOM - SHORTS_BOTTOM} rx={5} fill={appearance.skinTone} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
          <rect x={rightLegX} y={SHORTS_BOTTOM} width={legWidth} height={LEG_BOTTOM - SHORTS_BOTTOM} rx={5} fill={appearance.skinTone} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
        </>
      ) : (
        <>
          <rect x={leftLegX} y={LEG_TOP} width={legWidth} height={LEG_BOTTOM - LEG_TOP} rx={5} fill={appearance.legsColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
          <rect x={rightLegX} y={LEG_TOP} width={legWidth} height={LEG_BOTTOM - LEG_TOP} rx={5} fill={appearance.legsColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
        </>
      )}
      {/* boot shading */}
      <rect x={leftLegX} y={LEG_BOTTOM - 10} width={legWidth} height={10} rx={4} fill="#00000022" />
      <rect x={rightLegX} y={LEG_BOTTOM - 10} width={legWidth} height={10} rx={4} fill="#00000022" />

      {/* arms */}
      <rect x={leftArmX} y={armY} width={armWidth} height={armBottom - armY} rx={4} fill={appearance.skinTone} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
      <rect x={rightArmX} y={armY} width={armWidth} height={armBottom - armY} rx={4} fill={appearance.skinTone} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
      {appearance.outfitStyle !== "tanktop" && (
        <>
          <rect x={leftArmX} y={armY} width={armWidth} height={13} rx={4} fill={appearance.outfitColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
          <rect x={rightArmX} y={armY} width={armWidth} height={13} rx={4} fill={appearance.outfitColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
        </>
      )}

      {/* torso / outfit */}
      {appearance.outfitStyle === "robe" ? (
        <path
          d={`M ${torsoLeft} ${outfitTop} L ${torsoRight} ${outfitTop} L ${torsoRight + 13} ${outfitBottom} L ${torsoLeft - 13} ${outfitBottom} Z`}
          fill={appearance.outfitColor}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_WIDTH}
          strokeLinejoin="round"
        />
      ) : (
        <rect x={torsoLeft} y={outfitTop} width={torsoWidth} height={outfitBottom - outfitTop} rx={10} fill={appearance.outfitColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
      )}
      {/* torso shading: highlight top-left, shadow bottom */}
      <rect x={torsoLeft + 3} y={outfitTop + 3} width={torsoWidth * 0.35} height={10} rx={5} fill="#ffffff" opacity={0.15} />
      <rect x={torsoLeft} y={outfitBottom - 10} width={torsoWidth} height={10} fill={outfitShadow} opacity={0.5} />

      {/* armor overlays on top of the torso */}
      {appearance.armor === "leather" && (
        <rect
          x={torsoLeft - 2}
          y={78}
          width={torsoWidth + 4}
          height={8}
          rx={4}
          fill={LEATHER_COLOR}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_WIDTH}
          strokeLinejoin="round"
          transform={`rotate(-15 ${CX} 82)`}
        />
      )}
      {appearance.armor === "plate" && (
        <>
          <rect x={torsoLeft - 4} y={TORSO_TOP} width={torsoWidth + 8} height={40} rx={10} fill={PLATE_COLOR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
          <rect x={CX - 3} y={TORSO_TOP + 6} width={6} height={26} rx={2} fill={PLATE_ACCENT} opacity={0.8} />
          <circle cx={leftArmX + armWidth / 2} cy={armY + 2} r={7} fill={PLATE_ACCENT} stroke={OUTLINE} strokeWidth={2} />
          <circle cx={rightArmX + armWidth / 2} cy={armY + 2} r={7} fill={PLATE_ACCENT} stroke={OUTLINE} strokeWidth={2} />
        </>
      )}

      {/* head */}
      <circle cx={CX} cy={HEAD_CY} r={HEAD_R} fill={appearance.skinTone} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
      <ellipse cx={CX - 9} cy={HEAD_CY - 12} rx={10} ry={7} fill={skinHighlight} opacity={0.5} />
      <ellipse cx={CX} cy={HEAD_CY + 16} rx={HEAD_R * 0.6} ry={7} fill={skinShadow} opacity={0.35} />

      {/* hair (hidden under a helmet or hood) */}
      {!hidesHair && appearance.hairStyle === "short" && (
        <ellipse cx={CX} cy={HEAD_CY - 13} rx={HEAD_R + 1} ry={14} fill={appearance.hairColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
      )}
      {!hidesHair && appearance.hairStyle === "long" && (
        <>
          <ellipse cx={CX} cy={HEAD_CY - 13} rx={HEAD_R + 1} ry={14} fill={appearance.hairColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
          <rect x={CX - HEAD_R - 3} y={HEAD_CY - 14} width={10} height={42} rx={5} fill={appearance.hairColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
          <rect x={CX + HEAD_R - 7} y={HEAD_CY - 14} width={10} height={42} rx={5} fill={appearance.hairColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
        </>
      )}
      {!hidesHair && appearance.hairStyle === "mohawk" && (
        <rect x={CX - 8} y={HEAD_CY - HEAD_R - 6} width={16} height={30} rx={6} fill={appearance.hairColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
      )}
      {!hidesHair && appearance.hairStyle === "curly" && (
        <>
          <ellipse cx={CX} cy={HEAD_CY - 13} rx={HEAD_R} ry={13} fill={appearance.hairColor} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
          {[-18, -6, 6, 18].map((dx) => (
            <circle key={dx} cx={CX + dx} cy={HEAD_CY - HEAD_R + 3} r={7} fill={appearance.hairColor} stroke={OUTLINE} strokeWidth={2} />
          ))}
        </>
      )}

      {/* helmet (plate armor) or hood (cloak) replace the hairstyle entirely */}
      {appearance.armor === "plate" && (
        <>
          <ellipse cx={CX} cy={HEAD_CY - 8} rx={HEAD_R + 4} ry={HEAD_R - 1} fill={PLATE_COLOR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
          <rect x={CX - HEAD_R - 2} y={HEAD_CY - 4} width={(HEAD_R + 2) * 2} height={7} fill="#111111" opacity={0.7} />
          <rect x={CX - 4} y={HEAD_CY - HEAD_R - 6} width={8} height={10} rx={3} fill="#dc2626" stroke={OUTLINE} strokeWidth={2} />
        </>
      )}
      {appearance.armor === "cloak" && (
        <ellipse cx={CX} cy={HEAD_CY - 6} rx={HEAD_R + 5} ry={HEAD_R + 1} fill={CLOAK_COLOR} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
      )}

      {/* face */}
      {!(appearance.armor === "plate") && (
        <>
          <ellipse cx={CX - 9} cy={HEAD_CY} rx={4} ry={5.5} fill="#161616" />
          <ellipse cx={CX + 9} cy={HEAD_CY} rx={4} ry={5.5} fill="#161616" />
          <circle cx={CX - 16} cy={HEAD_CY + 9} r={4} fill="#f87171" opacity={0.35} />
          <circle cx={CX + 16} cy={HEAD_CY + 9} r={4} fill="#f87171" opacity={0.35} />
          <path
            d={`M ${CX - 5} ${HEAD_CY + 13} Q ${CX} ${HEAD_CY + 16} ${CX + 5} ${HEAD_CY + 13}`}
            fill="none"
            stroke="#161616"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.6}
          />
        </>
      )}

      {/* facial hair */}
      {appearance.facialHair === "stubble" && (
        <ellipse cx={CX} cy={HEAD_CY + 13} rx={15} ry={9} fill="#000000" opacity={0.14} />
      )}
      {appearance.facialHair === "mustache" && (
        <rect x={CX - 8} y={HEAD_CY + 6} width={16} height={4} rx={2} fill={appearance.hairColor} />
      )}
      {appearance.facialHair === "beard" && (
        <ellipse cx={CX} cy={HEAD_CY + 17} rx={17} ry={11} fill={appearance.hairColor} stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />
      )}
    </svg>
  );
}
