import type { JSX } from "preact";
import {
  categories,
  ingredients,
  selectedCountInCategory,
  selections,
} from "../lib/store";
import { IngredientCard } from "./IngredientCard";

interface Props { categoryId: string; }

export function IngredientGrid({ categoryId }: Props): JSX.Element {
  const category = categories.value.find(c => c.id === categoryId);
  const items = ingredients.value
    .filter(i => i.categoryId === categoryId && i.isAvailable)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const atLimit =
    category?.selectionType === "multi" &&
    category.maxSelections != null &&
    selectedCountInCategory(categoryId) >= category.maxSelections;

  return (
    <div class="nc-list" role="list">
      {/* Column header — matches outer 4-col grid + inner nutrition sub-grid */}
      <div class="nc-list__header" aria-hidden="true">
        <span />
        <span />
        <span />
        <div class="nc-list__hd-nutrition">
          <span class="nc-list__hd-cal">Cal</span>
          <span class="nc-list__hd-fat">Fat</span>
          <span class="nc-list__hd-pro">Protein</span>
          <span class="nc-list__hd-carb">Carbs</span>
        </div>
      </div>

      {items.map(ing => (
        <div role="listitem" key={ing.id}>
          <IngredientCard ingredient={ing} blocked={atLimit} />
        </div>
      ))}
    </div>
  );
}
