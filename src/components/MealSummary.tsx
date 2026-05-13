import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  clearMeal,
  ingredients,
  meal,
  mealSummaryOpen,
  mealTotals,
  removeFromMeal,
} from "../lib/store";
import type { NutritionTotals } from "../types";

function portionLabel(multiplier: number): string {
  if (multiplier <= 0.6) return " (Light)";
  if (multiplier >= 1.5) return " (Extra)";
  return "";
}

function mac(n: number): string {
  return Math.round(n).toString();
}

function fmt(n: number): string {
  return n < 10 && n > 0 ? n.toFixed(1).replace(/\.0$/, "") : Math.round(n).toString();
}

function NutritionBreakdown({ n }: { n: NutritionTotals }): JSX.Element {
  return (
    <dl class="nc-meal-breakdown">
      <div class="nc-meal-bd__row">
        <dt>Total Calories</dt>
        <dd>{mac(n.calories)} cal</dd>
      </div>
      <div class="nc-meal-bd__row">
        <dt>Total Fat</dt>
        <dd>{fmt(n.fat_g)}g</dd>
      </div>
      {n.satFat_g > 0 && (
        <div class="nc-meal-bd__row nc-meal-bd__row--sub">
          <dt>Saturated Fat</dt>
          <dd>{fmt(n.satFat_g)}g</dd>
        </div>
      )}
      <div class="nc-meal-bd__row">
        <dt>Protein</dt>
        <dd>{fmt(n.protein_g)}g</dd>
      </div>
      <div class="nc-meal-bd__row">
        <dt>Carbohydrates</dt>
        <dd>{fmt(n.carbs_g)}g</dd>
      </div>
      {n.fiber_g > 0 && (
        <div class="nc-meal-bd__row nc-meal-bd__row--sub">
          <dt>Dietary Fiber</dt>
          <dd>{fmt(n.fiber_g)}g</dd>
        </div>
      )}
      {n.sugar_g > 0 && (
        <div class="nc-meal-bd__row nc-meal-bd__row--sub">
          <dt>Sugar</dt>
          <dd>{fmt(n.sugar_g)}g</dd>
        </div>
      )}
      <div class="nc-meal-bd__row">
        <dt>Sodium</dt>
        <dd>{mac(n.sodium_mg)}mg</dd>
      </div>
    </dl>
  );
}

export function MealSummary(): JSX.Element | null {
  const isOpen = mealSummaryOpen.value;
  const items = meal.value;
  const ings = ingredients.value;
  const mt = mealTotals.value;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") mealSummaryOpen.value = false;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      class="nc-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) mealSummaryOpen.value = false;
      }}
    >
      <div
        class="nc-modal nc-meal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nc-meal-title"
      >
        <div class="nc-modal__header">
          <span class="nc-modal__title" id="nc-meal-title">Your Full Meal</span>
          <button
            type="button"
            class="nc-modal__close"
            aria-label="Close"
            onClick={() => { mealSummaryOpen.value = false; }}
          >
            ×
          </button>
        </div>

        <div class="nc-modal__body nc-meal-body">
          {/* Column header */}
          <div class="nc-meal-table-head">
            <span class="nc-meal-table-head__item">Item</span>
            <span>Cal</span>
            <span>Fat</span>
            <span>Pro</span>
            <span>Carb</span>
          </div>

          {items.map((item) => {
            const selectedIngs = Object.values(item.selections)
              .map((sel) => {
                const ing = ings.find((i) => i.id === sel.ingredientId);
                return ing
                  ? { name: ing.name, multiplier: sel.portionMultiplier }
                  : null;
              })
              .filter((x): x is { name: string; multiplier: number } => x !== null);

            const isExpanded = expandedIds.has(item.id);

            return (
              <div
                key={item.id}
                class={`nc-meal-item${isExpanded ? " is-expanded" : ""}`}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onClick={() => toggleExpand(item.id)}
                onKeyDown={(e) => e.key === "Enter" && toggleExpand(item.id)}
              >
                <div class="nc-meal-item__head">
                  <div class="nc-meal-item__head-left">
                    <span class="nc-meal-item__name">{item.formatName}</span>
                    {selectedIngs.length > 0 && (
                      <span class="nc-meal-item__ings">
                        {" · "}
                        {selectedIngs
                          .map((i) => `${i.name}${portionLabel(i.multiplier)}`)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                  <div class="nc-meal-item__head-right">
                    <button
                      type="button"
                      class="nc-meal-item__remove"
                      aria-label={`Remove ${item.formatName}`}
                      onClick={(e) => { e.stopPropagation(); removeFromMeal(item.id); }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div class="nc-meal-item__macros">
                  <span class="nc-meal-item__macros-cal">
                    <strong>{mac(item.nutrition.calories)}</strong>
                    <em>cal</em>
                  </span>
                  <span>
                    <strong>{mac(item.nutrition.fat_g)}g</strong>
                    <em>fat</em>
                  </span>
                  <span>
                    <strong>{mac(item.nutrition.protein_g)}g</strong>
                    <em>pro</em>
                  </span>
                  <span>
                    <strong>{mac(item.nutrition.carbs_g)}g</strong>
                    <em>carb</em>
                  </span>
                </div>

                {isExpanded && <NutritionBreakdown n={item.nutrition} />}
              </div>
            );
          })}

          {/* Grand total row */}
          {items.length > 0 && (
            <div class="nc-meal-total">
              <span class="nc-meal-total__label">Grand Total</span>
              <div class="nc-meal-item__macros">
                <span class="nc-meal-item__macros-cal">
                  <strong>{mac(mt.calories)}</strong>
                  <em>cal</em>
                </span>
                <span>
                  <strong>{mac(mt.fat_g)}g</strong>
                  <em>fat</em>
                </span>
                <span>
                  <strong>{mac(mt.protein_g)}g</strong>
                  <em>pro</em>
                </span>
                <span>
                  <strong>{mac(mt.carbs_g)}g</strong>
                  <em>carb</em>
                </span>
              </div>
            </div>
          )}

          {items.length === 0 && (
            <p class="nc-meal-empty">No items in your meal yet.</p>
          )}
        </div>

        <div class="nc-modal__footer nc-meal-footer">
          <button
            type="button"
            class="nc-meal-footer__start-over"
            onClick={() => {
              clearMeal();
              mealSummaryOpen.value = false;
            }}
          >
            Start Over
          </button>
          <button
            type="button"
            class="nc-meal-footer__add-another"
            onClick={() => { mealSummaryOpen.value = false; }}
          >
            Add Another Item
          </button>
        </div>
      </div>
    </div>
  );
}
