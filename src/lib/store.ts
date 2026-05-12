/**
 * Global widget state via Preact signals.
 *
 * Why signals over a Redux-style store: every UI subscription is fine-grained,
 * so the totals panel re-renders independently of the ingredient grid, and
 * the macro donut animates without the rest of the page reconciling. This
 * matters for the PRD §5.4 tap-to-visual-feedback < 100 ms target.
 *
 * Mutations go through the helper functions exported below — components
 * never write to signals directly. This keeps the cardinality of "things
 * that can change state" small and auditable.
 *
 * Phase 1 scope: structure + selection mutations. Filter UX wires up in
 * Phase 5; preset application wires up in Phase 7.
 */
import { computed, signal } from "@preact/signals";
import type {
  ActiveFilters,
  AllergenTag,
  Category,
  DietTag,
  Ingredient,
  MealFormat,
  MenuData,
  NutritionTotals,
  PortionOption,
  PresetBowl,
  Selection,
} from "../types";
import { calculateTotals, EMPTY_TOTALS } from "./nutrition";
import { applyFilters, findAllergenViolations } from "./filters";
import type { AllergenViolation } from "./filters";

// === Raw signals ===========================================================

export const menuData = signal<MenuData | null>(null);
export const selectedFormatId = signal<string | null>(null);
export const selections = signal<Record<string, Selection>>({});
export const activeFilters = signal<ActiveFilters>({
  diets: [],
  excludeAllergens: [],
});
export const isLoading = signal<boolean>(false);
export const loadError = signal<Error | null>(null);

// === Derived signals (computed) ============================================

export const formats = computed<MealFormat[]>(() => menuData.value?.formats ?? []);
export const categories = computed<Category[]>(() => menuData.value?.categories ?? []);
export const ingredients = computed<Ingredient[]>(() => menuData.value?.ingredients ?? []);
export const portionOptions = computed<PortionOption[]>(
  () => menuData.value?.portionOptions ?? [],
);
export const presets = computed<PresetBowl[]>(() => menuData.value?.presets ?? []);

export const selectedFormat = computed<MealFormat | null>(() => {
  const id = selectedFormatId.value;
  return id ? (formats.value.find((f) => f.id === id) ?? null) : null;
});

export const totals = computed<NutritionTotals>(() => {
  const fmt = selectedFormat.value;
  if (!fmt) return EMPTY_TOTALS;
  return calculateTotals(fmt, selections.value, ingredients.value);
});

export const selectionCount = computed<number>(
  () => Object.keys(selections.value).length,
);

/**
 * Allergen violations in the current build (intersection of selected
 * ingredient allergens with active exclusion filters). Empty array when
 * no exclusions are active or no conflicts exist.
 */
export const allergenViolations = computed<AllergenViolation[]>(() =>
  findAllergenViolations(selections.value, ingredients.value, activeFilters.value),
);

/** True when an ingredient is filtered-out by the active diet/allergen filters. */
export function isIngredientFilteredOut(ingredient: Ingredient): boolean {
  return !applyFilters(ingredient, activeFilters.value);
}

/**
 * Categories where maxSelections is enforced as total *portion slots* rather
 * than a simple distinct-ingredient count. Adding an ingredient costs 1 slot;
 * a cheese Extra portion costs 2 slots.
 *
 * "cat-cheese" (max 4): Wiz Extra×2 + American×1 + Provolone×1 = 4 slots → full.
 * You cannot add Mozzarella or set Provolone to Extra at that point.
 */
const SLOT_CAPPED_CATEGORIES = new Set(["cat-cheese"]);

// === Mutations =============================================================

export function setMenu(data: MenuData): void {
  menuData.value = data;
  // Default to the first format unless one is already chosen.
  if (!selectedFormatId.value && data.formats.length > 0) {
    const first = data.formats[0];
    if (first) selectedFormatId.value = first.id;
  }
}

export function setFormat(formatId: string): void {
  selectedFormatId.value = formatId;
}

export function selectIngredient(ingredientId: string, multiplier = 1): void {
  selections.value = {
    ...selections.value,
    [ingredientId]: { ingredientId, portionMultiplier: multiplier },
  };
}

export function deselectIngredient(ingredientId: string): void {
  if (!(ingredientId in selections.value)) return;
  const next = { ...selections.value };
  delete next[ingredientId];
  selections.value = next;
}

export function toggleIngredient(ingredientId: string, multiplier = 1): void {
  if (ingredientId in selections.value) {
    deselectIngredient(ingredientId);
  } else {
    selectIngredient(ingredientId, multiplier);
  }
}

/**
 * Category-aware toggle. Honors:
 *   - `selectionType: "single"` → selecting an ingredient deselects any other
 *     ingredient in the same category first (Protein, Cheese on Forefathers).
 *   - `maxSelections` on multi-select categories → at-limit taps are no-ops
 *     (Veggies max 4, Sauces max 2). Phase 2 silently ignores; Phase 5 may
 *     surface a tooltip per the in-store menu's "UP TO 4 / UP TO 2" copy.
 *
 * Returns whether the click changed state (used by IngredientCard for any
 * "blocked"-state visual feedback in later phases).
 */
export function toggleIngredientInCategory(ingredientId: string): boolean {
  const data = menuData.value;
  if (!data) return false;
  const ing = data.ingredients.find((i) => i.id === ingredientId);
  if (!ing) return false;
  const category = data.categories.find((c) => c.id === ing.categoryId);
  if (!category) return false;

  const isSelected = ingredientId in selections.value;
  if (isSelected) {
    deselectIngredient(ingredientId);
    return true;
  }

  if (category.selectionType === "single") {
    const next: Record<string, Selection> = {};
    for (const [id, sel] of Object.entries(selections.value)) {
      const otherIng = data.ingredients.find((i) => i.id === id);
      if (otherIng && otherIng.categoryId !== category.id) {
        next[id] = sel;
      }
    }
    next[ingredientId] = { ingredientId, portionMultiplier: 1 };
    selections.value = next;
    return true;
  }

  if (category.maxSelections != null) {
    if (SLOT_CAPPED_CATEGORIES.has(category.id)) {
      // Adding a new ingredient always costs 1 slot at first.
      if (selectedSlotsInCategory(category.id) + 1 > category.maxSelections) {
        return false;
      }
    } else {
      const inThisCategory = Object.keys(selections.value).filter((id) => {
        const otherIng = data.ingredients.find((i) => i.id === id);
        return otherIng?.categoryId === category.id;
      });
      if (inThisCategory.length >= category.maxSelections) {
        return false;
      }
    }
  }

  selectIngredient(ingredientId);
  return true;
}

/**
 * Sum of portionMultiplier values for all selected ingredients in a category.
 * For slot-capped categories this is what's checked against maxSelections.
 */
export function selectedSlotsInCategory(categoryId: string): number {
  const data = menuData.value;
  if (!data) return 0;
  let slots = 0;
  for (const [id, sel] of Object.entries(selections.value)) {
    const ing = data.ingredients.find((i) => i.id === id);
    if (ing?.categoryId === categoryId) slots += sel.portionMultiplier;
  }
  return slots;
}

/**
 * Count how many ingredients in a given category are currently selected.
 * For slot-capped categories (e.g. cheese) returns total portion slots so
 * that IngredientGrid's atLimit check respects larger portions automatically.
 */
export function selectedCountInCategory(categoryId: string): number {
  if (SLOT_CAPPED_CATEGORIES.has(categoryId)) return selectedSlotsInCategory(categoryId);
  const data = menuData.value;
  if (!data) return 0;
  let count = 0;
  for (const id of Object.keys(selections.value)) {
    const ing = data.ingredients.find((i) => i.id === id);
    if (ing?.categoryId === categoryId) count++;
  }
  return count;
}

/**
 * Returns true if setting ingredientId to the given portionMultiplier is
 * within the category's slot cap.  Always true for non-slot-capped categories.
 */
export function canSetPortion(ingredientId: string, multiplier: number): boolean {
  if (multiplier === 0) return true;
  const data = menuData.value;
  if (!data) return true;
  const ing = data.ingredients.find((i) => i.id === ingredientId);
  if (!ing) return true;
  const cat = data.categories.find((c) => c.id === ing.categoryId);
  if (!cat || cat.maxSelections == null || !SLOT_CAPPED_CATEGORIES.has(cat.id)) return true;
  const currentMult = selections.value[ingredientId]?.portionMultiplier ?? 0;
  return selectedSlotsInCategory(cat.id) - currentMult + multiplier <= cat.maxSelections;
}

export function setPortion(ingredientId: string, multiplier: number): boolean {
  if (multiplier === 0) {
    deselectIngredient(ingredientId);
    return true;
  }
  if (!canSetPortion(ingredientId, multiplier)) return false;
  selections.value = {
    ...selections.value,
    [ingredientId]: { ingredientId, portionMultiplier: multiplier },
  };
  return true;
}

export function clearSelections(): void {
  selections.value = {};
}

export function setDietFilters(diets: DietTag[]): void {
  activeFilters.value = { ...activeFilters.value, diets };
}

export function setAllergenExclusions(excludeAllergens: AllergenTag[]): void {
  activeFilters.value = { ...activeFilters.value, excludeAllergens };
}

/**
 * Reset to a fresh build (no selections, default format). Filters persist —
 * a guest who set "no gluten" once shouldn't have to set it again on reset.
 */
export function resetBuild(): void {
  selections.value = {};
  const data = menuData.value;
  if (data && data.formats.length > 0) {
    const first = data.formats[0];
    if (first) selectedFormatId.value = first.id;
  }
}
