import type { JSX } from "preact";
import type { Ingredient } from "../types";
import { portionOptions, selections, setPortion } from "../lib/store";

interface PortionStepperProps {
  ingredient: Ingredient;
}

const SHOWN_MULTIPLIERS = new Set([0.5, 1, 2]);
const SLAW_MULTIPLIERS  = new Set([1, 0.01]);

export function PortionStepper({ ingredient }: PortionStepperProps): JSX.Element | null {
  if (!ingredient.allowsExtra) return null;
  const sel = selections.value[ingredient.id];
  if (!sel) return null;

  const isSlawIngredient = ingredient.id === "ing-kale-slaw-base";
  const allowed = isSlawIngredient ? SLAW_MULTIPLIERS : SHOWN_MULTIPLIERS;

  const options = [...portionOptions.value]
    .filter(o => allowed.has(o.multiplier))
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
            class={`nc-portion__opt${isActive ? " is-active" : ""}`}
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
