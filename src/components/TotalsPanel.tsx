import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { selectionCount, totals } from "../lib/store";
import { useAnimatedNumber } from "../lib/use-animated-number";
import { MacroRing } from "./MacroRing";
import { DailyValueBar } from "./DailyValueBar";

function fmt(n: number): string {
  return n < 10 && n > 0 ? n.toFixed(1).replace(/\.0$/, "") : Math.round(n).toString();
}

interface TotalsPanelProps {
  variant?: "hero" | "full";
  animationDuration?: number;
}

export function TotalsPanel({ variant = "hero", animationDuration = 400 }: TotalsPanelProps): JSX.Element {
  const t = totals.value;
  const count = selectionCount.value;
  const animatedCal = useAnimatedNumber(t.calories, animationDuration);
  const [expanded, setExpanded] = useState(false);

  if (variant === "hero") {
    return (
      <div class="nc-hero-totals" aria-label="Live nutrition totals">
        <button
          type="button"
          class={`nc-hero-totals__expand-btn${expanded ? " is-open" : ""}`}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse nutrition details" : "Expand nutrition details"}
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? "×" : "+"}
        </button>
        <div class="nc-hero-totals__row">
          <div class="nc-hero-totals__cal">
            <span
              key={Math.round(t.calories)}
              class="nc-hero-totals__cal-num"
              aria-live="polite"
            >
              {Math.round(t.calories)}
            </span>
            <span class="nc-hero-totals__cal-unit">cal</span>
          </div>
          <ul class="nc-hero-totals__macros">
            <li>
              <span class="nc-hero-totals__macro-num nc-hero-totals__macro-num--fat">{fmt(t.fat_g)}g</span>
              <span class="nc-hero-totals__macro-label">Fat</span>
            </li>
            <li>
              <span class="nc-hero-totals__macro-num nc-hero-totals__macro-num--pro">{fmt(t.protein_g)}g</span>
              <span class="nc-hero-totals__macro-label">Protein</span>
            </li>
            <li>
              <span class="nc-hero-totals__macro-num nc-hero-totals__macro-num--carb">{fmt(t.carbs_g)}g</span>
              <span class="nc-hero-totals__macro-label">Carbs</span>
            </li>
          </ul>
        </div>

        {expanded && (
          <dl class="nc-hero-totals__breakdown">
            <div class="nc-hero-bd__row">
              <dt>Total Calories</dt>
              <dd>{Math.round(t.calories)}</dd>
            </div>
            <div class="nc-hero-bd__row">
              <dt><span class="nc-hero-bd__dot nc-hero-bd__dot--fat" />Total Fat</dt>
              <dd class="nc-hero-bd__val--fat">{fmt(t.fat_g)}g</dd>
            </div>
            {t.satFat_g > 0 && (
              <div class="nc-hero-bd__row nc-hero-bd__row--sub">
                <dt>Saturated Fat</dt>
                <dd>{fmt(t.satFat_g)}g</dd>
              </div>
            )}
            <div class="nc-hero-bd__row">
              <dt><span class="nc-hero-bd__dot nc-hero-bd__dot--pro" />Protein</dt>
              <dd class="nc-hero-bd__val--pro">{fmt(t.protein_g)}g</dd>
            </div>
            <div class="nc-hero-bd__row">
              <dt><span class="nc-hero-bd__dot nc-hero-bd__dot--carb" />Carbohydrates</dt>
              <dd class="nc-hero-bd__val--carb">{fmt(t.carbs_g)}g</dd>
            </div>
            {t.fiber_g > 0 && (
              <div class="nc-hero-bd__row nc-hero-bd__row--sub">
                <dt>Dietary Fiber</dt>
                <dd>{fmt(t.fiber_g)}g</dd>
              </div>
            )}
            {t.sugar_g > 0 && (
              <div class="nc-hero-bd__row nc-hero-bd__row--sub">
                <dt>Sugar</dt>
                <dd>{fmt(t.sugar_g)}g</dd>
              </div>
            )}
            <div class="nc-hero-bd__row">
              <dt>Sodium</dt>
              <dd>{Math.round(t.sodium_mg)}mg</dd>
            </div>
          </dl>
        )}
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

      <div class="nc-totals__top">
        <MacroRing />
        <div class="nc-totals__cal">
          <span class="nc-totals__cal-num" aria-live="polite">
            {Math.round(animatedCal)}
          </span>
          <span class="nc-totals__cal-label">calories</span>
        </div>
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

      <DailyValueBar />
    </aside>
  );
}
