import type { JSX } from "preact";
import type { Ingredient } from "../types";
import { canSetPortion, portionOptions, selections, setPortion } from "../lib/store";
import type { PortionOption } from "../types";

interface PortionStepperProps {
  ingredient: Ingredient;
}

// IDs that belong exclusively to the Low Carb Bowl slaw toggle
const SLAW_IDS     = new Set(["port-with-slaw", "port-extra-slaw", "port-no-slaw"]);
// Cheese keeps its older portion math while sharing the client-facing
// Light / Normal / Extra labels used by the rest of the menu.
const CHEESE_CATEGORY_ID = "cat-cheese";
const CHEESE_PORTION_MULTIPLIERS: Record<string, number> = {
  "port-light": 0.5,
  "port-extra": 2,
};

function optionForIngredient(option: PortionOption, ingredient: Ingredient): PortionOption {
  if (ingredient.categoryId !== CHEESE_CATEGORY_ID) return option;
  const multiplier = CHEESE_PORTION_MULTIPLIERS[option.id];
  return multiplier === undefined ? option : { ...option, multiplier };
}

export function PortionStepper({ ingredient }: PortionStepperProps): JSX.Element | null {
  if (!ingredient.allowsExtra) return null;
  const sel = selections.value[ingredient.id];
  if (!sel) return null;

  const isSlawIngredient = ingredient.id === "ing-kale-slaw-base";

  const options = [...portionOptions.value]
    .filter(o =>
      isSlawIngredient
        ? SLAW_IDS.has(o.id)                                                  // bowl: slaw only
        : !SLAW_IDS.has(o.id) && o.multiplier > 0                             // others: Light / Normal / Extra
    )
    .map(o => optionForIngredient(o, ingredient))
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
