/**
 * Per-ingredient portion stepper (Sweetgreen pattern, PRD §4.2 #15).
 *
 * Renders inline inside the IngredientCard body when the ingredient is
 * selected AND `allowsExtra: true`. For Forefathers that's primarily
 * the Cheese category (matches the menu's "Double Cheese for Additional
 * $1.00") plus the proteins.
 *
 * Buttons read PortionOptions from the loaded menu so the multipliers
 * stay data-driven (Airtable manager can extend the stepper without a
 * code change).
 *
 * Tap behavior: clicking the active option leaves it selected; clicking
 * "None" deselects the ingredient entirely (delegated to the store).
 */
import type { JSX } from "preact";
import type { Ingredient } from "../types";
import { portionOptions, selections, setPortion } from "../lib/store";

interface PortionStepperProps {
  ingredient: Ingredient;
}

export function PortionStepper({ ingredient }: PortionStepperProps): JSX.Element | null {
  if (!ingredient.allowsExtra) return null;
  const sel = selections.value[ingredient.id];
  if (!sel) return null;

  const options = [...portionOptions.value].sort((a, b) => a.sortOrder - b.sortOrder);
  if (options.length === 0) return null;

  return (
    <div
      class="nc-portion"
      role="radiogroup"
      aria-label={`Portion for ${ingredient.name}`}
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((opt) => {
        const isActive = Math.abs(sel.portionMultiplier - opt.multiplier) < 0.01;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            class={`nc-portion__btn${isActive ? " is-active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setPortion(ingredient.id, opt.multiplier);
            }}
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}
