/**
 * Diet + allergen filter chips. Active state desaturates non-matching
 * ingredient cards to 40% opacity rather than hiding them (PRD §4.1 #7) —
 * keeps the menu visible so guests learn what's available *and* what they're
 * filtering out.
 *
 * Two groups:
 *   - Diet (AND across active): Vegan, Vegetarian, Gluten-free, Dairy-free,
 *     Keto, Low Carb, High Protein
 *   - Allergen exclusion (OR — any match fails): No Gluten, No Dairy,
 *     No Soy, No Eggs, No Nuts (peanuts + treenuts), No Sesame
 *
 * "No Nuts" is a UX shortcut that toggles both `peanuts` and `treenuts`
 * exclusions together — guests with a nut allergy don't distinguish.
 */
import type { JSX } from "preact";
import type { AllergenTag, DietTag } from "../types";
import {
  activeFilters,
  setAllergenExclusions,
  setDietFilters,
} from "../lib/store";

interface DietChip {
  id: DietTag;
  label: string;
}

interface AllergenChip {
  id: string;
  label: string;
  /** Allergen tags this chip toggles together. */
  allergens: AllergenTag[];
}

const DIET_CHIPS: DietChip[] = [
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "glutenfree", label: "Gluten-free" },
  { id: "dairyfree", label: "Dairy-free" },
  { id: "keto", label: "Keto" },
  { id: "lowcarb", label: "Low Carb" },
  { id: "highprotein", label: "High Protein" },
];

const ALLERGEN_CHIPS: AllergenChip[] = [
  { id: "no-gluten", label: "No Gluten", allergens: ["gluten"] },
  { id: "no-dairy", label: "No Dairy", allergens: ["dairy"] },
  { id: "no-eggs", label: "No Eggs", allergens: ["eggs"] },
  { id: "no-soy", label: "No Soy", allergens: ["soy"] },
  { id: "no-nuts", label: "No Nuts", allergens: ["peanuts", "treenuts"] },
  { id: "no-sesame", label: "No Sesame", allergens: ["sesame"] },
];

function toggleDiet(diet: DietTag): void {
  const current = activeFilters.value.diets;
  const next = current.includes(diet)
    ? current.filter((d) => d !== diet)
    : [...current, diet];
  setDietFilters(next);
}

function toggleAllergens(toToggle: AllergenTag[]): void {
  const current = activeFilters.value.excludeAllergens;
  // Chip is "active" when all its allergens are excluded.
  const allActive = toToggle.every((a) => current.includes(a));
  const next = allActive
    ? current.filter((a) => !toToggle.includes(a))
    : [...new Set([...current, ...toToggle])];
  setAllergenExclusions(next);
}

export function FilterChips(): JSX.Element {
  const filters = activeFilters.value;
  const activeDiets = new Set(filters.diets);
  const activeAllergens = new Set(filters.excludeAllergens);

  return (
    <section class="nc-filters" aria-labelledby="nc-filters-eyebrow">
      <p id="nc-filters-eyebrow" class="nc-eyebrow">Dietary filters</p>
      <div class="nc-filters__group" role="group" aria-label="Diet">
        {DIET_CHIPS.map((chip) => {
          const isActive = activeDiets.has(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              class={`nc-chip${isActive ? " is-active" : ""}`}
              aria-pressed={isActive}
              onClick={() => toggleDiet(chip.id)}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
      <div class="nc-filters__group" role="group" aria-label="Exclude allergens">
        {ALLERGEN_CHIPS.map((chip) => {
          const isActive = chip.allergens.every((a) => activeAllergens.has(a));
          return (
            <button
              key={chip.id}
              type="button"
              class={`nc-chip nc-chip--allergen${isActive ? " is-active" : ""}`}
              aria-pressed={isActive}
              onClick={() => toggleAllergens(chip.allergens)}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
