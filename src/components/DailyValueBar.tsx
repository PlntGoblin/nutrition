/**
 * % Daily Value bars — sodium / fiber / sat fat, per PRD §4.1 #8.
 *
 * Each bar shows the build's contribution as a fraction of the FDA 2,000 cal
 * reference daily value (DAILY_VALUES in `lib/nutrition.ts`). Values over 100%
 * are clamped visually but the numeric label still shows the true percent.
 *
 * Bars only render when there's at least one selection — empty state stays
 * uncluttered. Hidden under reduced-motion via the global override.
 */
import type { JSX } from "preact";
import { selectionCount, totals } from "../lib/store";
import { DAILY_VALUES } from "../lib/nutrition";
import type { NutritionTotals } from "../types";

interface BarSpec {
  key: keyof Pick<NutritionTotals, "sodium_mg" | "fiber_g" | "satFat_g">;
  label: string;
  unit: string;
}

const BARS: BarSpec[] = [
  { key: "sodium_mg", label: "Sodium", unit: "mg" },
  { key: "fiber_g", label: "Fiber", unit: "g" },
  { key: "satFat_g", label: "Sat fat", unit: "g" },
];

export function DailyValueBar(): JSX.Element | null {
  const t = totals.value;
  const count = selectionCount.value;

  if (count === 0) return null;

  return (
    <ul class="nc-dv" aria-label="Percent daily values">
      {BARS.map((bar) => {
        const value = t[bar.key];
        const dv = DAILY_VALUES[bar.key];
        const pct = (value / dv) * 100;
        const fillPct = Math.min(100, pct);
        const over = pct > 100;
        return (
          <li key={bar.key} class={`nc-dv__row${over ? " is-over" : ""}`}>
            <div class="nc-dv__head">
              <span class="nc-dv__label">{bar.label}</span>
              <span class="nc-dv__value">
                {Math.round(value)} {bar.unit} · {Math.round(pct)}% DV
              </span>
            </div>
            <div class="nc-dv__track" aria-hidden="true">
              <div class="nc-dv__fill" style={{ width: `${fillPct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
