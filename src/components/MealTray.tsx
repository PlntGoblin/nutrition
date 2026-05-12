import type { JSX } from "preact";
import { meal, mealSummaryOpen, mealTotals } from "../lib/store";

export function MealTray(): JSX.Element | null {
  const items = meal.value;
  if (items.length === 0) return null;

  const mt = mealTotals.value;

  return (
    <div class="nc-meal-tray" role="status" aria-live="polite">
      <div class="nc-meal-tray__info">
        <span class="nc-meal-tray__count">
          {items.length} {items.length === 1 ? "item" : "items"} in meal
        </span>
        <span class="nc-meal-tray__cal">
          {Math.round(mt.calories)} cal total
        </span>
      </div>
      <button
        type="button"
        class="nc-meal-tray__btn"
        onClick={() => { mealSummaryOpen.value = true; }}
      >
        See Full Meal →
      </button>
    </div>
  );
}
