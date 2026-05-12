import type { JSX } from "preact";
import { useEffect } from "preact/hooks";
import {
  clearMeal,
  ingredients,
  meal,
  mealSummaryOpen,
  mealTotals,
  removeFromMeal,
} from "../lib/store";

function portionLabel(multiplier: number): string {
  if (multiplier <= 0.6) return " (Light)";
  if (multiplier >= 1.5) return " (Extra)";
  return "";
}

function mac(n: number): string {
  return Math.round(n).toString();
}

export function MealSummary(): JSX.Element | null {
  const isOpen = mealSummaryOpen.value;
  const items = meal.value;
  const ings = ingredients.value;
  const mt = mealTotals.value;

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

            return (
              <div key={item.id} class="nc-meal-item">
                <div class="nc-meal-item__head">
                  <span class="nc-meal-item__name">{item.formatName}</span>
                  <button
                    type="button"
                    class="nc-meal-item__remove"
                    aria-label={`Remove ${item.formatName}`}
                    onClick={() => removeFromMeal(item.id)}
                  >
                    ✕
                  </button>
                </div>

                {selectedIngs.length > 0 && (
                  <p class="nc-meal-item__ings">
                    {selectedIngs
                      .map((i) => `${i.name}${portionLabel(i.multiplier)}`)
                      .join(", ")}
                  </p>
                )}

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
            class="nc-meal-footer__clear"
            onClick={() => {
              clearMeal();
              mealSummaryOpen.value = false;
            }}
          >
            Start Over
          </button>
          <button
            type="button"
            class="nc-modal__apply"
            onClick={() => { mealSummaryOpen.value = false; }}
          >
            Add Another Item
          </button>
        </div>
      </div>
    </div>
  );
}
