/**
 * Ingredient card — photo + name + calorie count + allergen icons + tap-toggle.
 *
 * Phase 3: full visual treatment. Photo at top (1:1, lazy-loaded); name in
 * display weight; cal count muted; allergen tag row at the bottom (max 3
 * visible plus an overflow chip when there are more — PRD §8.4).
 *
 * Selected state: 2 px brand outline + soft glow (animation handled in
 * `animations.css` via the `.is-selected` class on the button).
 */
import type { JSX } from "preact";
import type { AllergenTag, Ingredient } from "../types";
import { selections, toggleIngredientInCategory } from "../lib/store";

interface IngredientCardProps {
  ingredient: Ingredient;
  blocked?: boolean;
}

const ALLERGEN_LABELS: Record<AllergenTag, string> = {
  gluten: "Gluten",
  dairy: "Dairy",
  soy: "Soy",
  eggs: "Eggs",
  peanuts: "Peanuts",
  treenuts: "Tree Nuts",
  fish: "Fish",
  shellfish: "Shellfish",
  sesame: "Sesame",
};

const MAX_VISIBLE_ALLERGENS = 3;

function AllergenTags({ allergens }: { allergens: AllergenTag[] }): JSX.Element | null {
  if (allergens.length === 0) return null;
  const visible = allergens.slice(0, MAX_VISIBLE_ALLERGENS);
  const overflow = allergens.length - visible.length;
  return (
    <ul class="nc-card__allergens" aria-label={`Contains: ${allergens.map((a) => ALLERGEN_LABELS[a]).join(", ")}`}>
      {visible.map((a) => (
        <li key={a} class="nc-card__allergen">
          {ALLERGEN_LABELS[a]}
        </li>
      ))}
      {overflow > 0 && (
        <li class="nc-card__allergen nc-card__allergen--overflow">+{overflow}</li>
      )}
    </ul>
  );
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
        <AllergenTags allergens={ingredient.allergens} />
      </div>
    </button>
  );
}
