/**
 * Diet + allergen filter logic. Pure functions only.
 *
 * Behavior (PRD §4.1 #7): when one or more filters are active, ingredients
 * that don't match are *desaturated* in the UI rather than hidden. The
 * card stays clickable; clicking adds it but a warning surfaces (per
 * `findAllergenViolations` below).
 *
 * Filter semantics:
 *   - Diet filters are AND across active filters: a card passes only if it
 *     carries ALL active diet tags. Example: vegan + glutenfree → only
 *     ingredients tagged BOTH vegan and glutenfree match.
 *   - Allergen exclusions: a card fails if it carries ANY excluded allergen.
 */
import type {
  ActiveFilters,
  AllergenTag,
  Ingredient,
  Selection,
} from "../types";

/**
 * Returns true when the ingredient passes the active filters.
 * Both empty filters and a fully-matching ingredient → true.
 */
export function applyFilters(
  ingredient: Ingredient,
  filters: ActiveFilters,
): boolean {
  for (const allergen of filters.excludeAllergens) {
    if (ingredient.allergens.includes(allergen)) return false;
  }
  for (const diet of filters.diets) {
    if (!ingredient.dietTags.includes(diet)) return false;
  }
  return true;
}

/**
 * Returns the list of ingredients in the current build whose allergens
 * conflict with active exclusions. Used by the warning banner so guests
 * with a "no nuts" filter don't accidentally keep peanut oil in their
 * bowl after toggling the filter on.
 */
export interface AllergenViolation {
  ingredient: Ingredient;
  allergens: AllergenTag[];
}

export function findAllergenViolations(
  selections: Record<string, Selection>,
  ingredients: Ingredient[],
  filters: ActiveFilters,
): AllergenViolation[] {
  if (filters.excludeAllergens.length === 0) return [];
  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));
  const out: AllergenViolation[] = [];
  for (const sel of Object.values(selections)) {
    const ing = ingredientById.get(sel.ingredientId);
    if (!ing) continue;
    const conflicting = ing.allergens.filter((a) =>
      filters.excludeAllergens.includes(a),
    );
    if (conflicting.length > 0) {
      out.push({ ingredient: ing, allergens: conflicting });
    }
  }
  return out;
}
