/**
 * Tests for `src/lib/filters.ts`.
 *
 * Covers PRD §4.1 #7 semantics:
 *   - Empty filters → everything passes
 *   - Allergen exclusion fails any ingredient with that allergen
 *   - Diet filters AND across multiple active diets
 *   - findAllergenViolations surfaces conflicts in the current build
 */
import { describe, expect, it } from "vitest";
import {
  applyFilters,
  findAllergenViolations,
} from "../src/lib/filters";
import seed from "../data/seed-ingredients.json";
import type { Ingredient, MenuData, Selection } from "../src/types";

const menu = seed as unknown as MenuData;
const ingredients = menu.ingredients as Ingredient[];

const provolone = ingredients.find((i) => i.id === "ing-provolone")!;
const steak = ingredients.find((i) => i.id === "ing-steak")!;
const onions = ingredients.find((i) => i.id === "ing-onions")!;
const buffalo = ingredients.find((i) => i.id === "ing-buffalo")!;

function sel(id: string): Record<string, Selection> {
  return { [id]: { ingredientId: id, portionMultiplier: 1 } };
}

describe("applyFilters", () => {
  it("returns true when no filters are active", () => {
    expect(applyFilters(provolone, { diets: [], excludeAllergens: [] })).toBe(
      true,
    );
  });

  it("fails an ingredient that carries an excluded allergen", () => {
    expect(
      applyFilters(provolone, { diets: [], excludeAllergens: ["dairy"] }),
    ).toBe(false);
  });

  it("passes an ingredient with none of the excluded allergens", () => {
    expect(
      applyFilters(steak, { diets: [], excludeAllergens: ["dairy"] }),
    ).toBe(true);
  });

  it("passes a vegan ingredient when only vegan is active", () => {
    expect(applyFilters(onions, { diets: ["vegan"], excludeAllergens: [] })).toBe(
      true,
    );
  });

  it("fails an ingredient that lacks one of multiple required diet tags (AND semantics)", () => {
    // Onions are vegan + glutenfree but not highprotein.
    expect(
      applyFilters(onions, {
        diets: ["vegan", "highprotein"],
        excludeAllergens: [],
      }),
    ).toBe(false);
  });

  it("passes an ingredient when allergen-exclusion + matching diet both apply cleanly", () => {
    // Buffalo sauce is vegan + dairy-free + has no allergens.
    expect(
      applyFilters(buffalo, {
        diets: ["vegan"],
        excludeAllergens: ["dairy", "gluten"],
      }),
    ).toBe(true);
  });
});

describe("findAllergenViolations", () => {
  it("returns an empty array when no allergen exclusions are active", () => {
    expect(
      findAllergenViolations(sel(provolone.id), ingredients, {
        diets: [],
        excludeAllergens: [],
      }),
    ).toEqual([]);
  });

  it("returns the offending ingredient + the conflicting allergen", () => {
    const violations = findAllergenViolations(sel(provolone.id), ingredients, {
      diets: [],
      excludeAllergens: ["dairy"],
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.ingredient.id).toBe("ing-provolone");
    expect(violations[0]?.allergens).toEqual(["dairy"]);
  });

  it("returns empty array when the build has no allergens conflicting with active exclusions", () => {
    const violations = findAllergenViolations(sel(steak.id), ingredients, {
      diets: [],
      excludeAllergens: ["dairy"],
    });
    expect(violations).toEqual([]);
  });
});
