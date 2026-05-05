/**
 * Ingredient card — photo + name + calorie count + allergen icons + tap-toggle.
 *
 * Phase 3: full visual treatment.
 * Phase 5: filter-mismatch desaturation. When the active diet/allergen
 *   filters mark this ingredient as not-matching, the card drops to 40%
 *   opacity and shows a `title=` tooltip explaining why. The card stays
 *   clickable (PRD §4.1 #7 — desaturate, don't hide) — clicking still
 *   adds it; the allergen warning banner takes over from there.
 */
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
    <ul
      class="nc-card__allergens"
      aria-label={`Contains: ${allergens.map((a) => ALLERGEN_LABELS[a]).join(", ")}`}
    >
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

function explainFilterMismatch(ingredient: Ingredient): string {
  // Subscribe to filters so the tooltip text refreshes when filters change.
  const filters = activeFilters.value;
  const conflictingAllergens = ingredient.allergens.filter((a) =>
    filters.excludeAllergens.includes(a),
  );
  if (conflictingAllergens.length > 0) {
    const labels = conflictingAllergens.map((a) => ALLERGEN_LABELS[a]).join(", ");
    return `Contains ${labels}`;
  }
  const missingDiets = filters.diets.filter((d) => !ingredient.dietTags.includes(d));
  if (missingDiets.length > 0) {
    return `Doesn't match: ${missingDiets.join(", ")}`;
  }
  return "Doesn't match active filters";
}

export function IngredientCard({
  ingredient,
  blocked = false,
}: IngredientCardProps): JSX.Element {
  const isSelected = ingredient.id in selections.value;
  const isFilteredOut = isIngredientFilteredOut(ingredient);
  const tooltip = isFilteredOut ? explainFilterMismatch(ingredient) : undefined;

  return (
    <button
      type="button"
      onClick={() => {
        const wasSelected = ingredient.id in selections.value;
        toggleIngredientInCategory(ingredient.id);
        track(wasSelected ? "ingredient_removed" : "ingredient_added", {
          id: ingredient.id,
          category: ingredient.categoryId,
        });
      }}
      aria-pressed={isSelected}
      aria-disabled={blocked && !isSelected ? true : undefined}
      title={tooltip}
      class={`nc-card${isSelected ? " is-selected" : ""}${
        blocked && !isSelected ? " is-blocked" : ""
      }${isFilteredOut ? " is-filtered-out" : ""}`}
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
        {isSelected && <PortionStepper ingredient={ingredient} />}
      </div>
    </button>
  );
}
