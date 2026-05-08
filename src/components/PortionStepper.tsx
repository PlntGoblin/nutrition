import type { JSX } from "preact";
import type { Ingredient } from "../types";
import { canSetPortion, portionOptions, selections, setPortion } from "../lib/store";

interface PortionStepperProps {
  ingredient: Ingredient;
}

// IDs that belong exclusively to the Low Carb Bowl slaw toggle
const SLAW_IDS     = new Set(["port-with-slaw", "port-extra-slaw", "port-no-slaw"]);
// Multipliers used by the standard Light / Normal / Double stepper
const STANDARD_MULTIPLIERS = new Set([0.5, 1, 2]);
// Veggies: Normal + Double only — no Light option (just skip the veggie if you want less)
const VEGGIE_MULTIPLIERS   = new Set([1, 2]);
const VEGGIE_CATEGORIES    = new Set(["cat-veggies"]);

export function PortionStepper({ ingredient }: PortionStepperProps): JSX.Element | null {
  if (!ingredient.allowsExtra) return null;
  const sel = selections.value[ingredient.id];
  if (!sel) return null;

  const isSlawIngredient  = ingredient.id === "ing-kale-slaw-base";
  const isVeggie          = VEGGIE_CATEGORIES.has(ingredient.categoryId);
  const allowedMultipliers = isVeggie ? VEGGIE_MULTIPLIERS : STANDARD_MULTIPLIERS;

  const options = [...portionOptions.value]
    .filter(o =>
      isSlawIngredient
        ? SLAW_IDS.has(o.id)                                                  // bowl: slaw only
        : allowedMultipliers.has(o.multiplier) && !SLAW_IDS.has(o.id)        // others: per-category set
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
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
            disabled={!isActive && !canSetPortion(ingredient.id, opt.multiplier)}
            class={`nc-portion__opt${isActive ? " is-active" : ""}${!isActive && !canSetPortion(ingredient.id, opt.multiplier) ? " is-capped" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setPortion(ingredient.id, opt.multiplier);
            }}
          >
            <span class="nc-portion__radio" aria-hidden="true" />
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}
