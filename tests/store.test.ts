/**
 * Unit tests for `src/lib/store.ts`.
 *
 * Covers the selection mutation layer that sits between UI events and the
 * nutrition math. These tests are the most business-critical in the suite
 * because every ingredient-card click goes through these functions and any
 * regression here breaks the live calorie counter.
 *
 * Test coverage:
 *  - setMenu / setFormat
 *  - toggleIngredientInCategory: single-select enforcement (Protein, Base)
 *  - toggleIngredientInCategory: multi-select with maxSelections cap (Veggies, Sauces)
 *  - toggleIngredientInCategory: multi-select with null (unlimited) cap (Sides, Cheese)
 *  - setPortion: normal, Light, Double, zero → deselect
 *  - clearSelections
 *  - selectedCountInCategory
 *  - allergenViolations computed signal
 *  - totals computed signal (smoke test — detailed math in nutrition.test.ts)
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  menuData,
  selections,
  selectedFormatId,
  activeFilters,
  allergenViolations,
  totals,
  setMenu,
  setFormat,
  toggleIngredientInCategory,
  setPortion,
  clearSelections,
  selectedCountInCategory,
} from "../src/lib/store";
import seed from "../data/seed-ingredients.json";
import type { MenuData } from "../src/types";

const menu = seed as unknown as MenuData;

/** Reset all signals to a clean state before each test. */
beforeEach(() => {
  menuData.value        = null;
  selections.value      = {};
  selectedFormatId.value = null;
  activeFilters.value   = { diets: [], excludeAllergens: [] };
});

// ── setMenu / setFormat ────────────────────────────────────────────────────

describe("setMenu", () => {
  it("populates menuData with the provided data", () => {
    setMenu(menu);
    expect(menuData.value).toBe(menu);
  });

  it("defaults selectedFormatId to the first format when none is set", () => {
    setMenu(menu);
    expect(selectedFormatId.value).toBe(menu.formats[0]?.id);
  });

  it("does not override an already-set selectedFormatId", () => {
    selectedFormatId.value = "fmt-cheesesteak-reg";
    setMenu(menu);
    expect(selectedFormatId.value).toBe("fmt-cheesesteak-reg");
  });
});

describe("setFormat", () => {
  it("updates selectedFormatId", () => {
    setFormat("fmt-salad");
    expect(selectedFormatId.value).toBe("fmt-salad");
  });
});

// ── toggleIngredientInCategory — single-select ────────────────────────────

describe("toggleIngredientInCategory — single-select (Protein)", () => {
  beforeEach(() => setMenu(menu));

  it("selects the ingredient and returns true", () => {
    expect(toggleIngredientInCategory("ing-steak")).toBe(true);
    expect(selections.value).toHaveProperty("ing-steak");
  });

  it("deselects when the same ingredient is tapped again", () => {
    toggleIngredientInCategory("ing-steak");
    expect(toggleIngredientInCategory("ing-steak")).toBe(true);
    expect(selections.value).not.toHaveProperty("ing-steak");
  });

  it("replaces the previous protein when a new one is chosen", () => {
    toggleIngredientInCategory("ing-steak");
    toggleIngredientInCategory("ing-chicken");
    expect(selections.value).not.toHaveProperty("ing-steak");
    expect(selections.value).toHaveProperty("ing-chicken");
  });

  it("single-select does NOT clear ingredients in other categories", () => {
    toggleIngredientInCategory("ing-provolone"); // cat-cheese
    toggleIngredientInCategory("ing-steak");     // cat-protein
    toggleIngredientInCategory("ing-chicken");   // replaces steak
    expect(selections.value).toHaveProperty("ing-provolone");
    expect(selections.value).toHaveProperty("ing-chicken");
    expect(selections.value).not.toHaveProperty("ing-steak");
  });

  it("sets portionMultiplier to 1 on first selection", () => {
    toggleIngredientInCategory("ing-steak");
    expect(selections.value["ing-steak"]?.portionMultiplier).toBe(1);
  });
});

// ── toggleIngredientInCategory — multi with maxSelections ─────────────────

describe("toggleIngredientInCategory — multi-select capped at 4 (Veggies)", () => {
  beforeEach(() => setMenu(menu));

  const getVeggies = () =>
    menu.ingredients.filter(i => i.categoryId === "cat-veggies" && i.isAvailable);

  it("allows selecting up to the maxSelections limit", () => {
    getVeggies().slice(0, 4).forEach(v => {
      expect(toggleIngredientInCategory(v.id)).toBe(true);
    });
    expect(selectedCountInCategory("cat-veggies")).toBe(4);
  });

  it("blocks a 5th selection and returns false", () => {
    const veggies = getVeggies();
    veggies.slice(0, 4).forEach(v => toggleIngredientInCategory(v.id));
    const fifth = veggies[4];
    if (fifth) {
      expect(toggleIngredientInCategory(fifth.id)).toBe(false);
      expect(selections.value).not.toHaveProperty(fifth.id);
    }
  });

  it("unblocks the slot after deselecting one, allowing a new pick", () => {
    const veggies = getVeggies();
    veggies.slice(0, 4).forEach(v => toggleIngredientInCategory(v.id));
    toggleIngredientInCategory(veggies[0]!.id); // deselect first
    const fifth = veggies[4];
    if (fifth) {
      expect(toggleIngredientInCategory(fifth.id)).toBe(true);
      expect(selections.value).toHaveProperty(fifth.id);
    }
  });
});

describe("toggleIngredientInCategory — multi-select capped at 2 (Sauces)", () => {
  beforeEach(() => setMenu(menu));

  const getSauces = () =>
    menu.ingredients.filter(i => i.categoryId === "cat-sauces" && i.isAvailable);

  it("allows up to 2 sauces", () => {
    const sauces = getSauces();
    expect(toggleIngredientInCategory(sauces[0]!.id)).toBe(true);
    expect(toggleIngredientInCategory(sauces[1]!.id)).toBe(true);
    expect(selectedCountInCategory("cat-sauces")).toBe(2);
  });

  it("blocks a 3rd sauce", () => {
    const sauces = getSauces();
    toggleIngredientInCategory(sauces[0]!.id);
    toggleIngredientInCategory(sauces[1]!.id);
    expect(toggleIngredientInCategory(sauces[2]!.id)).toBe(false);
    expect(selectedCountInCategory("cat-sauces")).toBe(2);
  });
});

describe("toggleIngredientInCategory — multi-select capped at 4 (Cheese)", () => {
  beforeEach(() => setMenu(menu));

  it("allows selecting all 4 real cheese types simultaneously", () => {
    // Exclude ing-no-cheese — that's a choice slot, not a cheese type
    const realCheeses = menu.ingredients.filter(
      i => i.categoryId === "cat-cheese" && i.isAvailable && i.id !== "ing-no-cheese"
    );
    expect(realCheeses.length).toBe(4); // Wiz, American, Provolone, Mozzarella
    realCheeses.forEach(c => expect(toggleIngredientInCategory(c.id)).toBe(true));
    expect(selectedCountInCategory("cat-cheese")).toBe(4);
  });

  it("blocks a 5th selection (maxSelections = 4)", () => {
    const allCheeses = menu.ingredients.filter(i => i.categoryId === "cat-cheese" && i.isAvailable);
    allCheeses.slice(0, 4).forEach(c => toggleIngredientInCategory(c.id));
    const fifth = allCheeses[4];
    if (fifth) {
      expect(toggleIngredientInCategory(fifth.id)).toBe(false);
    }
  });
});

describe("toggleIngredientInCategory — multi-select unlimited (Sides)", () => {
  beforeEach(() => setMenu(menu));

  it("allows selecting multiple sides with no cap", () => {
    const sides = menu.ingredients.filter(i => i.categoryId === "cat-sides-type" && i.isAvailable);
    sides.forEach(s => expect(toggleIngredientInCategory(s.id)).toBe(true));
    expect(selectedCountInCategory("cat-sides-type")).toBe(sides.length);
  });
});

describe("toggleIngredientInCategory — unknown ingredient ID", () => {
  beforeEach(() => setMenu(menu));

  it("returns false for an ingredient that does not exist", () => {
    expect(toggleIngredientInCategory("ing-does-not-exist")).toBe(false);
    expect(selections.value).not.toHaveProperty("ing-does-not-exist");
  });

  it("returns false when menuData is null", () => {
    menuData.value = null;
    expect(toggleIngredientInCategory("ing-steak")).toBe(false);
  });
});

// ── setPortion ─────────────────────────────────────────────────────────────

describe("setPortion", () => {
  beforeEach(() => {
    setMenu(menu);
    toggleIngredientInCategory("ing-steak");
  });

  it("sets a Double (2×) portion multiplier", () => {
    setPortion("ing-steak", 2);
    expect(selections.value["ing-steak"]?.portionMultiplier).toBe(2);
  });

  it("sets a Light (0.5×) portion multiplier", () => {
    setPortion("ing-steak", 0.5);
    expect(selections.value["ing-steak"]?.portionMultiplier).toBe(0.5);
  });

  it("sets portion on an ingredient that was not yet selected", () => {
    setPortion("ing-chicken", 1);
    expect(selections.value["ing-chicken"]?.portionMultiplier).toBe(1);
  });

  it("deselects the ingredient when multiplier is set to 0", () => {
    setPortion("ing-steak", 0);
    expect(selections.value).not.toHaveProperty("ing-steak");
  });

  it("does not affect other selections when changing one portion", () => {
    toggleIngredientInCategory("ing-provolone");
    setPortion("ing-steak", 2);
    expect(selections.value).toHaveProperty("ing-provolone");
    expect(selections.value["ing-provolone"]?.portionMultiplier).toBe(1);
  });
});

// ── clearSelections ────────────────────────────────────────────────────────

describe("clearSelections", () => {
  beforeEach(() => setMenu(menu));

  it("empties all selections", () => {
    toggleIngredientInCategory("ing-steak");
    toggleIngredientInCategory("ing-provolone");
    clearSelections();
    expect(selections.value).toEqual({});
  });

  it("is a no-op when selections are already empty", () => {
    expect(() => clearSelections()).not.toThrow();
    expect(selections.value).toEqual({});
  });
});

// ── selectedCountInCategory ────────────────────────────────────────────────

describe("selectedCountInCategory", () => {
  beforeEach(() => setMenu(menu));

  it("returns 0 when nothing is selected", () => {
    expect(selectedCountInCategory("cat-veggies")).toBe(0);
  });

  it("returns 0 when menuData is null", () => {
    menuData.value = null;
    expect(selectedCountInCategory("cat-veggies")).toBe(0);
  });

  it("counts only ingredients in the specified category", () => {
    toggleIngredientInCategory("ing-steak");     // cat-protein
    toggleIngredientInCategory("ing-provolone"); // cat-cheese
    toggleIngredientInCategory("ing-onions");    // cat-veggies
    expect(selectedCountInCategory("cat-veggies")).toBe(1);
    expect(selectedCountInCategory("cat-protein")).toBe(1);
    expect(selectedCountInCategory("cat-cheese")).toBe(1);
  });

  it("increments as more items in a category are selected", () => {
    const veggies = menu.ingredients.filter(i => i.categoryId === "cat-veggies" && i.isAvailable);
    veggies.slice(0, 3).forEach(v => toggleIngredientInCategory(v.id));
    expect(selectedCountInCategory("cat-veggies")).toBe(3);
  });
});

// ── allergenViolations computed ────────────────────────────────────────────

describe("allergenViolations", () => {
  beforeEach(() => setMenu(menu));

  it("returns an empty array when no exclusions are active", () => {
    selections.value = { "ing-steak": { ingredientId: "ing-steak", portionMultiplier: 1 } };
    expect(allergenViolations.value).toHaveLength(0);
  });

  it("returns an empty array when excluded allergen is not in the build", () => {
    activeFilters.value = { diets: [], excludeAllergens: ["shellfish"] };
    selections.value = { "ing-steak": { ingredientId: "ing-steak", portionMultiplier: 1 } };
    expect(allergenViolations.value).toHaveLength(0);
  });

  it("flags an ingredient that contains an excluded allergen", () => {
    const glutenIng = menu.ingredients.find(i => i.allergens.includes("gluten") && i.isAvailable);
    if (!glutenIng) return; // skip if no gluten ingredient in seed (shouldn't happen)
    activeFilters.value = { diets: [], excludeAllergens: ["gluten"] };
    selections.value = { [glutenIng.id]: { ingredientId: glutenIng.id, portionMultiplier: 1 } };
    expect(allergenViolations.value.length).toBeGreaterThan(0);
    expect(allergenViolations.value[0]?.allergens).toContain("gluten");
  });

  it("clears violations when the offending ingredient is deselected", () => {
    const glutenIng = menu.ingredients.find(i => i.allergens.includes("gluten") && i.isAvailable);
    if (!glutenIng) return;
    activeFilters.value = { diets: [], excludeAllergens: ["gluten"] };
    selections.value = { [glutenIng.id]: { ingredientId: glutenIng.id, portionMultiplier: 1 } };
    expect(allergenViolations.value.length).toBeGreaterThan(0);
    selections.value = {};
    expect(allergenViolations.value).toHaveLength(0);
  });
});

// ── totals computed (smoke test) ───────────────────────────────────────────

describe("totals computed", () => {
  beforeEach(() => setMenu(menu));

  it("returns zero totals when no format is selected", () => {
    selectedFormatId.value = null;
    expect(totals.value.calories).toBe(0);
    expect(totals.value.protein_g).toBe(0);
  });

  it("returns base format calories with no selections", () => {
    setFormat("fmt-cheesesteak-reg");
    const fmt = menu.formats.find(f => f.id === "fmt-cheesesteak-reg")!;
    expect(totals.value.calories).toBe(fmt.baseCalories);
  });

  it("adds ingredient calories to base when an ingredient is selected", () => {
    setFormat("fmt-cheesesteak-reg");
    const fmt = menu.formats.find(f => f.id === "fmt-cheesesteak-reg")!;
    const chicken = menu.ingredients.find(i => i.id === "ing-chicken")!;
    toggleIngredientInCategory("ing-chicken");
    expect(totals.value.calories).toBe(fmt.baseCalories + chicken.calories);
  });

  it("doubles the ingredient contribution when Double portion is set", () => {
    setFormat("fmt-cheesesteak-reg");
    const fmt = menu.formats.find(f => f.id === "fmt-cheesesteak-reg")!;
    const steak = menu.ingredients.find(i => i.id === "ing-steak")!;
    toggleIngredientInCategory("ing-steak");
    setPortion("ing-steak", 2);
    expect(totals.value.calories).toBe(fmt.baseCalories + steak.calories * 2);
  });
});
