/**
 * Pure nutrition math — no signals, no side effects, no DOM.
 *
 * All functions in this file are deterministic given their inputs. This
 * matters for two reasons:
 *   1. The PRD §5.4 tap-to-feedback target (< 100 ms) is much easier to hit
 *      when totals math is O(n) over the selections, with no async work.
 *   2. Pure functions are trivially unit-testable, which the PRD §9 Phase 1
 *      acceptance criteria require (4 cases in tests/nutrition.test.ts).
 *
 * Rounding policy: we accumulate floating-point and only round at the call
 * site (totals panel). Internal totals stay precise so multiple ingredients
 * don't drift due to repeated rounding. The %DV bars in Phase 3 round to
 * the nearest integer percent at render time.
 */
import type {
  Ingredient,
  MealFormat,
  NutritionTotals,
  Selection,
} from "../types";

export const EMPTY_TOTALS: NutritionTotals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  satFat_g: 0,
  fiber_g: 0,
  sugar_g: 0,
  sodium_mg: 0,
};

/**
 * Sum the calories + macros for a build: format base + each selected
 * ingredient scaled by its portion multiplier.
 *
 * Selections referencing unknown ingredient IDs are skipped silently per
 * PRD §17.1 — defends against stale share URLs and malformed input.
 */
export function calculateTotals(
  format: MealFormat,
  selections: Record<string, Selection>,
  ingredients: Ingredient[],
): NutritionTotals {
  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

  const totals: NutritionTotals = {
    calories: format.baseCalories,
    protein_g: format.baseProtein_g,
    carbs_g: format.baseCarbs_g,
    fat_g: format.baseFat_g,
    satFat_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: format.baseSodium_mg,
  };

  for (const sel of Object.values(selections)) {
    const ing = ingredientById.get(sel.ingredientId);
    if (!ing) continue;
    const m = sel.portionMultiplier;
    if (m <= 0) continue;
    totals.calories += ing.calories * m;
    totals.protein_g += ing.protein_g * m;
    totals.carbs_g += ing.carbs_g * m;
    totals.fat_g += ing.fat_g * m;
    totals.satFat_g += ing.satFat_g * m;
    totals.fiber_g += ing.fiber_g * m;
    totals.sugar_g += ing.sugar_g * m;
    totals.sodium_mg += ing.sodium_mg * m;
  }

  return totals;
}

/**
 * FDA reference daily values for a 2,000 cal diet — used by the %DV bars
 * (PRD §4.1 #8). Source: 21 CFR 101.9.
 */
export const DAILY_VALUES = {
  calories: 2000,
  protein_g: 50,
  carbs_g: 275,
  fat_g: 78,
  satFat_g: 20,
  fiber_g: 28,
  sugar_g: 50,
  sodium_mg: 2300,
} as const satisfies Record<keyof NutritionTotals, number>;

export function percentDailyValue(
  total: number,
  key: keyof typeof DAILY_VALUES,
): number {
  return (total / DAILY_VALUES[key]) * 100;
}
