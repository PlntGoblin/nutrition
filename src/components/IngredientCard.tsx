import type { JSX } from "preact";
import type { AllergenTag, Ingredient } from "../types";
import {
  activeFilters,
  isIngredientFilteredOut,
  selections,
  toggleIngredientInCategory,
} from "../lib/store";
import { track } from "../lib/analytics";
import { PortionStepper } from "./PortionStepper";

interface Props {
  ingredient: Ingredient;
  blocked?: boolean;
}

const ALLERGEN_LABELS: Record<AllergenTag, string> = {
  gluten: "Gluten", dairy: "Dairy", soy: "Soy", eggs: "Eggs",
  peanuts: "Peanuts", treenuts: "Tree Nuts", fish: "Fish",
  shellfish: "Shellfish", sesame: "Sesame",
};

const CATEGORY_BG: Record<string, string> = {
  "cat-protein": "#C8102E",
  "cat-cheese":  "#B8860B",
  "cat-veggies": "#2A7A40",
  "cat-sauces":  "#5B6FA6",
};

function explainFilterMismatch(ingredient: Ingredient): string {
  const filters = activeFilters.value;
  const bad = ingredient.allergens.filter(a => filters.excludeAllergens.includes(a));
  if (bad.length) return `Contains ${bad.map(a => ALLERGEN_LABELS[a]).join(", ")}`;
  const missing = filters.diets.filter(d => !ingredient.dietTags.includes(d));
  if (missing.length) return `Doesn't match: ${missing.join(", ")}`;
  return "Doesn't match active filters";
}

export function IngredientCard({ ingredient, blocked = false }: Props): JSX.Element {
  const isSelected  = ingredient.id in selections.value;
  const isFiltered  = isIngredientFilteredOut(ingredient);
  const tooltip     = isFiltered ? explainFilterMismatch(ingredient) : undefined;

  const hasRealPhoto = ingredient.photoCDN.startsWith("https://res.cloudinary.com");
  const initial      = ingredient.name.charAt(0).toUpperCase();
  const bgColor      = CATEGORY_BG[ingredient.categoryId] ?? "#6B6B6B";

  const allergenLine = ingredient.allergens.length > 0
    ? `Contains: ${ingredient.allergens.map(a => ALLERGEN_LABELS[a]).join(", ")}`
    : null;

  return (
    <button
      type="button"
      onClick={() => {
        const wasSelected = ingredient.id in selections.value;
        toggleIngredientInCategory(ingredient.id);
        track(wasSelected ? "ingredient_removed" : "ingredient_added", {
          id: ingredient.id, category: ingredient.categoryId,
        });
      }}
      aria-pressed={isSelected}
      aria-disabled={blocked && !isSelected ? true : undefined}
      title={tooltip}
      class={[
        "nc-row",
        isSelected             ? "is-selected"    : "",
        blocked && !isSelected ? "is-blocked"      : "",
        isFiltered             ? "is-filtered-out" : "",
      ].filter(Boolean).join(" ")}
    >
      {/* Selection circle */}
      <span class="nc-row__select" aria-hidden="true">
        <span class="nc-row__select-check">✓</span>
      </span>

      {/* Photo circle */}
      <div class="nc-row__photo" style={hasRealPhoto ? undefined : `background:${bgColor}`}>
        {hasRealPhoto
          ? <img src={ingredient.photoCDN} alt="" loading="lazy" width={48} height={48} />
          : <span class="nc-row__initial">{initial}</span>
        }
      </div>

      {/* Name + optional allergen line + portion stepper */}
      <div class="nc-row__info">
        <span class="nc-row__name">{ingredient.name}</span>
        {allergenLine && <span class="nc-row__allergens">{allergenLine}</span>}
        {isSelected && <PortionStepper ingredient={ingredient} />}
      </div>

      {/* Shaded nutrition block */}
      <div class="nc-row__nutrition" aria-label={`${ingredient.calories} calories`}>
        <span class="nc-row__cal">
          {ingredient.calories}<span class="nc-row__cal-unit"> cal</span>
        </span>
        <span class="nc-row__fat"  aria-hidden="true">{Math.round(ingredient.fat_g)}g</span>
        <span class="nc-row__pro"  aria-hidden="true">{Math.round(ingredient.protein_g)}g</span>
        <span class="nc-row__carb" aria-hidden="true">{Math.round(ingredient.carbs_g)}g</span>
      </div>
    </button>
  );
}
