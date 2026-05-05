/**
 * Ingredient grid — renders cards for a single category.
 * Reads ingredients from the store filtered by `categoryId`, sorted by
 * `sortOrder`, and applies blocked-state when the category is at
 * maxSelections.
 *
 * Phase 2: functional. Visual polish lands in Phase 3.
 */
import type { JSX } from "preact";
import {
  categories,
  ingredients,
  selectedCountInCategory,
  selections,
} from "../lib/store";
import { IngredientCard } from "./IngredientCard";

interface IngredientGridProps {
  categoryId: string;
}

export function IngredientGrid({ categoryId }: IngredientGridProps): JSX.Element {
  // Subscribe to selections so blocked-state recomputes on every change.
  void selections.value;

  const category = categories.value.find((c) => c.id === categoryId);
  const items = ingredients.value
    .filter((i) => i.categoryId === categoryId && i.isAvailable)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const atLimit =
    category?.selectionType === "multi" &&
    category.maxSelections != null &&
    selectedCountInCategory(categoryId) >= category.maxSelections;

  return (
    <div class="nc-grid" role="list">
      {items.map((ing) => (
        <div role="listitem" key={ing.id}>
          <IngredientCard ingredient={ing} blocked={atLimit} />
        </div>
      ))}
    </div>
  );
}
