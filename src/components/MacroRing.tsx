/**
 * Macro donut chart — animated SVG ring showing protein/carbs/fat split.
 *
 * Shows the % of total macro calories from each source. Segments transition
 * smoothly via stroke-dasharray + stroke-dashoffset (CSS transition on
 * `stroke-dashoffset`) when the underlying totals change.
 *
 * Reduced-motion respect: when enabled, `--nc-ring-anim-ms` shrinks to 1 ms
 * via the global rule in animations.css, so the ring snaps without
 * animating.
 */
import type { JSX } from "preact";
import { totals } from "../lib/store";

const RING_SIZE = 120;
const STROKE = 14;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUM = 2 * Math.PI * RADIUS;

interface Segment {
  label: "Protein" | "Carbs" | "Fat";
  calories: number;
  color: string;
}

function macroCalorieBreakdown(
  protein_g: number,
  carbs_g: number,
  fat_g: number,
): Segment[] {
  // FDA Atwater factors: 4 cal/g protein, 4 cal/g carbs, 9 cal/g fat.
  return [
    { label: "Protein", calories: protein_g * 4, color: "var(--color-brand)" },
    { label: "Carbs", calories: carbs_g * 4, color: "var(--color-ink)" },
    { label: "Fat", calories: fat_g * 9, color: "var(--color-muted)" },
  ];
}

export function MacroRing(): JSX.Element {
  const t = totals.value;
  const segments = macroCalorieBreakdown(t.protein_g, t.carbs_g, t.fat_g);
  const total = segments.reduce((sum, s) => sum + s.calories, 0);

  // When there's nothing on the ring yet, render a single subtle empty
  // track so the SVG doesn't visually "pop" on first selection.
  if (total <= 0) {
    return (
      <svg
        class="nc-macro-ring"
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        width={RING_SIZE}
        height={RING_SIZE}
        role="img"
        aria-label="Macro split: no selections yet"
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-border)"
          stroke-width={STROKE}
        />
      </svg>
    );
  }

  let offset = 0;
  const ariaLabel = `Macro split: ${segments
    .map((s) => `${s.label} ${Math.round((s.calories / total) * 100)}%`)
    .join(", ")}`;

  return (
    <svg
      class="nc-macro-ring"
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      width={RING_SIZE}
      height={RING_SIZE}
      role="img"
      aria-label={ariaLabel}
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="var(--color-border)"
        stroke-width={STROKE}
      />
      {segments.map((seg) => {
        const fraction = seg.calories / total;
        const dash = fraction * CIRCUM;
        const gap = CIRCUM - dash;
        const dashArray = `${dash} ${gap}`;
        const dashOffset = -offset;
        offset += dash;
        return (
          <circle
            key={seg.label}
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={seg.color}
            stroke-width={STROKE}
            stroke-dasharray={dashArray}
            stroke-dashoffset={dashOffset}
            stroke-linecap="butt"
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            class="nc-macro-ring__seg"
          />
        );
      })}
    </svg>
  );
}
