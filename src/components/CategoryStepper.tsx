/**
 * Category stepper — top-of-screen progress indicator showing the current
 * and completed steps (Protein → Cheese → Veggies → Sauces for Forefathers).
 *
 * Single-page mode: clicking a step scrolls to that section. Completion is
 * inferred from `selectedCountInCategory(id) > 0`.
 *
 * Phase 2: functional + minimal styling. Visual polish lands in Phase 3.
 */
import type { JSX } from "preact";
import { categories, selectedCountInCategory, selections } from "../lib/store";

export function CategoryStepper(): JSX.Element {
  // Subscribe to selections so the stepper re-renders on selection change.
  void selections.value;
  const sortedCategories = [...categories.value].sort((a, b) => a.step - b.step);

  function jumpTo(id: string): void {
    const el = document.getElementById(`nc-section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <ol class="nc-stepper" aria-label="Build steps">
      {sortedCategories.map((cat) => {
        const count = selectedCountInCategory(cat.id);
        const complete = count > 0;
        return (
          <li key={cat.id} class={`nc-stepper__item${complete ? " is-complete" : ""}`}>
            <button
              type="button"
              onClick={() => jumpTo(cat.id)}
              class="nc-stepper__btn"
              aria-current={complete ? "step" : undefined}
            >
              <span class="nc-stepper__num">{cat.step}</span>
              <span class="nc-stepper__name">{cat.name}</span>
              {cat.maxSelections != null && cat.selectionType === "multi" && (
                <span class="nc-stepper__count">
                  {count}/{cat.maxSelections}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
