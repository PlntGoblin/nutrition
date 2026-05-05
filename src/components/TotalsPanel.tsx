/**
 * Totals panel — calories + macros readout.
 *
 * Phase 2: basic numeric display. Spring-physics counter, animated macro
 * donut, and %DV bars land in Phase 3 per PRD §9. Right-rail layout (desktop)
 * vs. mobile bottom sheet split lands in Phase 4.
 */
import type { JSX } from "preact";
import { selectionCount, totals } from "../lib/store";

function fmt(n: number): string {
  return n < 10 ? n.toFixed(1).replace(/\.0$/, "") : Math.round(n).toString();
}

export function TotalsPanel(): JSX.Element {
  const t = totals.value;
  const count = selectionCount.value;

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
          {Math.round(t.calories)}
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
