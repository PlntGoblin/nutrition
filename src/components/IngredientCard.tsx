/**
 * Ingredient card — photo, name, calorie count, tap-to-toggle.
 * Phase 2: basic version. Allergen icons + selected-outline polish + hover
 * lift land in Phase 3 per PRD §8.4.
 */
import type { JSX } from "preact";
import type { Ingredient } from "../types";
import { selections, toggleIngredientInCategory } from "../lib/store";

interface IngredientCardProps {
  ingredient: Ingredient;
  /** True when the ingredient's category is at maxSelections and this card
   * isn't currently selected (so tap would be a no-op). */
  blocked?: boolean;
}

export function IngredientCard({
  ingredient,
  blocked = false,
}: IngredientCardProps): JSX.Element {
  const isSelected = ingredient.id in selections.value;

  return (
    <button
      type="button"
      onClick={() => toggleIngredientInCategory(ingredient.id)}
      aria-pressed={isSelected}
      aria-disabled={blocked && !isSelected ? true : undefined}
      class={`nc-card${isSelected ? " is-selected" : ""}${
        blocked && !isSelected ? " is-blocked" : ""
      }`}
    >
      <div class="nc-card__photo">
        <img
          src={ingredient.photoCDN}
          alt=""
          loading="lazy"
          width={240}
          height={240}
        />
      </div>
      <div class="nc-card__body">
        <span class="nc-card__name">{ingredient.name}</span>
        <span class="nc-card__cal">{ingredient.calories} cal</span>
      </div>
    </button>
  );
}
