import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { isReadyToAdd, selectionCount, totals } from "../lib/store";
import { useAnimatedNumber } from "../lib/use-animated-number";
import { MacroRing } from "./MacroRing";
import { DailyValueBar } from "./DailyValueBar";

function fmt(n: number): string {
  return n < 10 && n > 0 ? n.toFixed(1).replace(/\.0$/, "") : Math.round(n).toString();
}

interface TotalsPanelProps {
  variant?: "hero" | "full";
  animationDuration?: number;
  onAddToBag?: () => void;
  alwaysExpanded?: boolean;
}

function macroPct(kcal: number, total: number): string {
  if (total <= 0) return "0%";
  return Math.round((kcal / total) * 100) + "%";
}

export function TotalsPanel({ variant = "hero", animationDuration = 400, onAddToBag, alwaysExpanded = false }: TotalsPanelProps): JSX.Element {
  const t = totals.value;
  const count = selectionCount.value;
  const animatedCal = useAnimatedNumber(t.calories, animationDuration);
  const [expanded, setExpanded] = useState(alwaysExpanded);

  if (variant === "hero") {
    const fatPct  = macroPct(t.fat_g * 9,     t.calories);
    const proPct  = macroPct(t.protein_g * 4,  t.calories);
    const carbPct = macroPct(t.carbs_g * 4,    t.calories);
    const calFromFat = Math.round(t.fat_g * 9);

    return (
      <div class="nc-hero-totals" aria-label="Live nutrition totals">
        {!alwaysExpanded && (
          <button
            type="button"
            class={`nc-hero-totals__expand-btn${expanded ? " is-open" : ""}`}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse nutrition details" : "Expand nutrition details"}
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? "×" : "+"}
          </button>
        )}
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

        {/* ADD TO BAG in collapsed state — gated by format-specific readiness */}
        {!expanded && onAddToBag && isReadyToAdd.value && (
          <button type="button" class="nc-bd-add-btn nc-bd-add-btn--collapsed" onClick={onAddToBag}>
            Add to Meal
          </button>
        )}

        {expanded && (
          <div class="nc-hero-totals__breakdown">
            <dl class="nc-bd-rows">
              {/* Calories */}
              <div class="nc-bd-row">
                <dt><span class="nc-hero-bd__dot nc-bd-dot--cal" />Total Calories</dt>
                <dd>{Math.round(t.calories)}<span class="nc-bd-unit">cal</span></dd>
              </div>

              {/* Fat */}
              <div class="nc-bd-row">
                <dt><span class="nc-hero-bd__dot nc-hero-bd__dot--fat" />Total Fat</dt>
                <dd class="nc-hero-bd__val--fat">{fmt(t.fat_g)}g</dd>
              </div>
              {calFromFat > 0 && (
                <div class="nc-bd-row nc-bd-row--sub">
                  <dt>Calories from Fat</dt>
                  <dd>{calFromFat}<span class="nc-bd-unit">cal</span></dd>
                </div>
              )}
              {t.satFat_g > 0 && (
                <div class="nc-bd-row nc-bd-row--sub">
                  <dt>Saturated Fat</dt>
                  <dd>{fmt(t.satFat_g)}g</dd>
                </div>
              )}

              {/* Protein */}
              <div class="nc-bd-row">
                <dt><span class="nc-hero-bd__dot nc-hero-bd__dot--pro" />Protein</dt>
                <dd class="nc-hero-bd__val--pro">{fmt(t.protein_g)}g</dd>
              </div>

              {/* Carbs */}
              <div class="nc-bd-row">
                <dt><span class="nc-hero-bd__dot nc-hero-bd__dot--carb" />Carbohydrates</dt>
                <dd class="nc-hero-bd__val--carb">{fmt(t.carbs_g)}g</dd>
              </div>
              {t.fiber_g > 0 && (
                <div class="nc-bd-row nc-bd-row--sub">
                  <dt>Dietary Fiber</dt>
                  <dd>{fmt(t.fiber_g)}g</dd>
                </div>
              )}
              {t.sugar_g > 0 && (
                <div class="nc-bd-row nc-bd-row--sub">
                  <dt>Sugar</dt>
                  <dd>{fmt(t.sugar_g)}g</dd>
                </div>
              )}

              {/* Sodium */}
              <div class="nc-bd-row">
                <dt>Sodium</dt>
                <dd>{Math.round(t.sodium_mg)}<span class="nc-bd-unit">mg</span></dd>
              </div>
            </dl>

            {onAddToBag && isReadyToAdd.value && (
              <button type="button" class="nc-bd-add-btn nc-bd-add-btn--expanded" onClick={onAddToBag}>
                Add to Meal
              </button>
            )}
          </div>
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
