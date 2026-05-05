/**
 * Allergen-violation warning banner.
 *
 * Renders only when the build contains one or more ingredients that
 * conflict with the guest's active allergen-exclusion filters
 * (PRD §9 Phase 5 task 3 + §17.5).
 *
 * Each conflicting ingredient gets a "Remove" button so guests can fix
 * the problem in one tap. The banner is keyed by the violations list so
 * it shows + dismisses smoothly as the build changes.
 */
import type { JSX } from "preact";
import { allergenViolations, deselectIngredient } from "../lib/store";

export function AllergenWarning(): JSX.Element | null {
  const violations = allergenViolations.value;
  if (violations.length === 0) return null;

  return (
    <div class="nc-warning" role="alert">
      <div class="nc-warning__head">
        <span class="nc-warning__icon" aria-hidden="true">!</span>
        <p class="nc-warning__title">
          Your build contains{" "}
          {[...new Set(violations.flatMap((v) => v.allergens))].join(", ")}
        </p>
      </div>
      <ul class="nc-warning__list">
        {violations.map(({ ingredient }) => (
          <li key={ingredient.id} class="nc-warning__row">
            <span>{ingredient.name}</span>
            <button
              type="button"
              class="nc-warning__remove"
              onClick={() => deselectIngredient(ingredient.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
