/**
 * Totals panel — calories + macros readout.
 *
 * Two render variants:
 *   - "hero": compact horizontal row for the sticky hero band; includes the
 *     animated macro donut. Always visible above the fold.
 *   - "full": full breakdown for the mobile bottom sheet (Phase 4).
 *
 * Calorie number animates via `useAnimatedNumber` (rAF-driven cubic ease-out,
 * 400 ms) — PRD §8.5 mandates spring-physics-flavored counter, never snap.
 */
import type { JSX } from "preact";
import { selectionCount, totals } from "../lib/store";
import { useAnimatedNumber } from "../lib/use-animated-number";
import { MacroRing } from "./MacroRing";
import { DailyValueBar } from "./DailyValueBar";

function fmt(n: number): string {
  return n < 10 && n > 0 ? n.toFixed(1).replace(/\.0$/, "") : Math.round(n).toString();
}

interface TotalsPanelProps {
  variant?: "hero" | "full";
}

export function TotalsPanel({ variant = "hero" }: TotalsPanelProps): JSX.Element {
  const t = totals.value;
  const count = selectionCount.value;
  const animatedCal = useAnimatedNumber(t.calories);

  if (variant === "hero") {
    return (
      <div class="nc-hero-totals" aria-label="Live nutrition totals">
        <div class="nc-hero-totals__top">
          <MacroRing />
          <div class="nc-hero-totals__numbers">
            <div class="nc-hero-totals__cal">
              <span class="nc-hero-totals__cal-num" aria-live="polite">
                {Math.round(animatedCal)}
              </span>
              <span class="nc-hero-totals__cal-unit">cal</span>
            </div>
            <ul class="nc-hero-totals__macros">
              <li>
                <span class="nc-hero-totals__macro-num">{fmt(t.fat_g)}g</span>
                <span class="nc-hero-totals__macro-label">Fat</span>
              </li>
              <li>
                <span class="nc-hero-totals__macro-num">{fmt(t.protein_g)}g</span>
                <span class="nc-hero-totals__macro-label">Protein</span>
              </li>
              <li>
                <span class="nc-hero-totals__macro-num">{fmt(t.carbs_g)}g</span>
                <span class="nc-hero-totals__macro-label">Carbs</span>
              </li>
            </ul>
          </div>
        </div>
        <DailyValueBar />
      </div>
    );
  }

  return (
    <aside class="nc-totals" aria-label="Nutrition totals">
      <header class="nc-totals__header">
        <span class="nc-totals__eyebrow">Your build</span>
        <span class="nc-totals__count">
          {count} {count === 1 ? "ingredient" : "ingredients"}
        </span>
      </header>

      <div class="nc-totals__cal">
        <span class="nc-totals__cal-num" aria-live="polite">
          {Math.round(animatedCal)}
        </span>
        <span class="nc-totals__cal-label">calories</span>
      </div>

      <dl class="nc-totals__macros">
        <div class="nc-totals__macro">
          <dt>Protein</dt>
          <dd>{fmt(t.protein_g)} g</dd>
        </div>
        <div class="nc-totals__macro">
          <dt>Carbs</dt>
          <dd>{fmt(t.carbs_g)} g</dd>
        </div>
        <div class="nc-totals__macro">
          <dt>Fat</dt>
          <dd>{fmt(t.fat_g)} g</dd>
        </div>
        <div class="nc-totals__macro">
          <dt>Fiber</dt>
          <dd>{fmt(t.fiber_g)} g</dd>
        </div>
        <div class="nc-totals__macro">
          <dt>Sugar</dt>
          <dd>{fmt(t.sugar_g)} g</dd>
        </div>
        <div class="nc-totals__macro">
          <dt>Sodium</dt>
          <dd>{Math.round(t.sodium_mg)} mg</dd>
        </div>
      </dl>
    </aside>
  );
}
