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
 *  - toggleIngredientInCategory: No Cheese exclusivity logic
 *  - setPortion: normal, Light, Extra, zero → deselect
 *  - clearSelections
 *  - selectedCountInCategory
 *  - isReadyToAdd: format-specific gating (cheesesteak, bowl, salad, sides)
 *  - addToMeal / removeFromMeal / clearMeal
 *  - mealTotals computed signal
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
  meal,
  mealTotals,
  isReadyToAdd,
  setMenu,
  setFormat,
  toggleIngredientInCategory,
  setPortion,
  clearSelections,
  selectedCountInCategory,
  selectedSlotsInCategory,
  canSetPortion,
  addToMeal,
  removeFromMeal,
  clearMeal,
} from "../src/lib/store";
import seed from "../data/seed-ingredients.json";
import type { MenuData } from "../src/types";

const menu = seed as unknown as MenuData;

/** Reset all signals to a clean state before each test. */
beforeEach(() => {
  menuData.value         = null;
  selections.value       = {};
  selectedFormatId.value = null;
  activeFilters.value    = { diets: [], excludeAllergens: [] };
  meal.value             = [];
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

describe("toggleIngredientInCategory — slot-capped (Cheese, max 4 slots)", () => {
  beforeEach(() => setMenu(menu));

  const getCheeses = () =>
    menu.ingredients.filter(
      i => i.categoryId === "cat-cheese" && i.isAvailable && i.id !== "ing-no-cheese"
    );

  it("allows selecting all 4 real cheese types simultaneously (4 × 1 slot)", () => {
    const cheeses = getCheeses();
    expect(cheeses.length).toBe(4); // Wiz, American, Provolone, Mozzarella
    cheeses.forEach(c => expect(toggleIngredientInCategory(c.id)).toBe(true));
    expect(selectedCountInCategory("cat-cheese")).toBe(4);
    expect(selectedSlotsInCategory("cat-cheese")).toBe(4);
  });

  it("all 4 real cheeses at normal portion fills all 4 slots — upgrading any to Extra is then blocked", () => {
    // getCheeses() excludes ing-no-cheese, so we have exactly 4 real cheeses.
    const cheeses = getCheeses();
    cheeses.forEach(c => toggleIngredientInCategory(c.id));
    expect(selectedSlotsInCategory("cat-cheese")).toBe(4);
    // Upgrading any cheese to Extra would push from 4 → 5 slots — blocked.
    expect(setPortion(cheeses[0]!.id, 2)).toBe(false);
    expect(selections.value[cheeses[0]!.id]?.portionMultiplier).toBe(1);
  });

  it("extra cheese costs 2 slots: Wiz×2 + American×1 + Provolone×1 = 4 slots → full", () => {
    const [wiz, american, provolone, mozzarella] = getCheeses();
    toggleIngredientInCategory(wiz!.id);
    setPortion(wiz!.id, 2);           // Wiz Extra now uses 2 slots
    toggleIngredientInCategory(american!.id);
    toggleIngredientInCategory(provolone!.id);
    expect(selectedSlotsInCategory("cat-cheese")).toBe(4);
    // Adding Mozzarella would push to 5 slots → blocked
    expect(toggleIngredientInCategory(mozzarella!.id)).toBe(false);
  });

  it("selectedCountInCategory reflects slots, not distinct count, for cheese", () => {
    const [wiz] = getCheeses();
    toggleIngredientInCategory(wiz!.id);
    setPortion(wiz!.id, 2);
    // 1 ingredient but 2 slots
    expect(selectedSlotsInCategory("cat-cheese")).toBe(2);
    expect(selectedCountInCategory("cat-cheese")).toBe(2); // slot-based
  });

  it("setPortion to extra cheese is blocked when it would exceed the 4-slot cap", () => {
    const [wiz, american, provolone] = getCheeses();
    toggleIngredientInCategory(wiz!.id);
    toggleIngredientInCategory(american!.id);
    toggleIngredientInCategory(provolone!.id);
    // 3 slots used; setting Provolone to Extra would go to 4 slots — allowed
    expect(setPortion(provolone!.id, 2)).toBe(true);
    expect(selectedSlotsInCategory("cat-cheese")).toBe(4);
    // Now setting American to Extra would push to 5 — blocked
    expect(setPortion(american!.id, 2)).toBe(false);
    expect(selections.value[american!.id]?.portionMultiplier).toBe(1);
  });

  it("canSetPortion returns false for a portion that would exceed the cap", () => {
    const [wiz, american, provolone, mozzarella] = getCheeses();
    toggleIngredientInCategory(wiz!.id);
    setPortion(wiz!.id, 2); // 2 slots
    toggleIngredientInCategory(american!.id); // 3 slots
    toggleIngredientInCategory(provolone!.id); // 4 slots — full
    // Can't set American to Extra (would need 5 slots)
    expect(canSetPortion(american!.id, 2)).toBe(false);
    // Can't add mozzarella at all
    expect(canSetPortion(mozzarella!.id, 1)).toBe(false);
    // But setting american back to 1 (no change) is fine
    expect(canSetPortion(american!.id, 1)).toBe(true);
  });

  it("freeing a slot by deselecting allows adding another cheese", () => {
    const [wiz, american, provolone, mozzarella] = getCheeses();
    [wiz!, american!, provolone!, mozzarella!].forEach(c => toggleIngredientInCategory(c.id));
    expect(selectedSlotsInCategory("cat-cheese")).toBe(4);
    toggleIngredientInCategory(wiz!.id); // deselect
    expect(selectedSlotsInCategory("cat-cheese")).toBe(3);
    // Now we can re-add Wiz or set another cheese to Extra.
    expect(toggleIngredientInCategory(wiz!.id)).toBe(true);
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

  it("sets an Extra (1.5×) portion multiplier", () => {
    setPortion("ing-steak", 1.5);
    expect(selections.value["ing-steak"]?.portionMultiplier).toBe(1.5);
  });

  it("sets a Light (0.6×) portion multiplier", () => {
    setPortion("ing-steak", 0.6);
    expect(selections.value["ing-steak"]?.portionMultiplier).toBe(0.6);
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
    setPortion("ing-steak", 1.5);
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

// ── No Cheese exclusivity ──────────────────────────────────────────────────

describe("toggleIngredientInCategory — No Cheese exclusivity", () => {
  beforeEach(() => setMenu(menu));

  it("selecting No Cheese clears all real cheeses and returns true", () => {
    toggleIngredientInCategory("ing-provolone");
    toggleIngredientInCategory("ing-american");
    expect(toggleIngredientInCategory("ing-no-cheese")).toBe(true);
    // Real cheeses gone, No Cheese is in
    expect(selections.value).not.toHaveProperty("ing-provolone");
    expect(selections.value).not.toHaveProperty("ing-american");
    expect(selections.value).toHaveProperty("ing-no-cheese");
  });

  it("selecting No Cheese when no other cheeses are active just selects it", () => {
    expect(toggleIngredientInCategory("ing-no-cheese")).toBe(true);
    expect(selections.value["ing-no-cheese"]?.portionMultiplier).toBe(1);
  });

  it("selecting a real cheese while No Cheese is active removes No Cheese first", () => {
    toggleIngredientInCategory("ing-no-cheese");
    expect(selections.value).toHaveProperty("ing-no-cheese");
    // Now add a real cheese — No Cheese should be dropped
    toggleIngredientInCategory("ing-provolone");
    expect(selections.value).not.toHaveProperty("ing-no-cheese");
    expect(selections.value).toHaveProperty("ing-provolone");
  });

  it("replacing No Cheese with a real cheese does not consume a slot from No Cheese", () => {
    toggleIngredientInCategory("ing-no-cheese");
    toggleIngredientInCategory("ing-wiz");       // removes No Cheese, adds Wiz (1 slot)
    toggleIngredientInCategory("ing-american");  // 2 slots
    toggleIngredientInCategory("ing-provolone"); // 3 slots
    toggleIngredientInCategory("ing-mozzarella"); // 4 slots
    // All 4 slots used — cap is exactly met, not exceeded
    expect(selectedSlotsInCategory("cat-cheese")).toBe(4);
  });

  it("No Cheese does not count toward the slot cap when removed by real-cheese selection", () => {
    toggleIngredientInCategory("ing-no-cheese");
    // Select a real cheese → No Cheese wiped before slot check runs
    expect(toggleIngredientInCategory("ing-wiz")).toBe(true);
    expect(selectedSlotsInCategory("cat-cheese")).toBe(1);
  });
});

// ── isReadyToAdd ──────────────────────────────────────────────────────────

describe("isReadyToAdd", () => {
  beforeEach(() => setMenu(menu));

  it("returns false when no format is selected", () => {
    selectedFormatId.value = null;
    expect(isReadyToAdd.value).toBe(false);
  });

  it("returns false when menuData is null", () => {
    menuData.value = null;
    selectedFormatId.value = "fmt-cheesesteak-reg";
    expect(isReadyToAdd.value).toBe(false);
  });

  describe("cheesesteak + bowl formats (require bread base AND protein)", () => {
    it.each(["fmt-cheesesteak-mini", "fmt-cheesesteak-reg", "fmt-cheesesteak-lg", "fmt-bowl"])(
      "%s: returns false with no selections",
      (formatId) => {
        setFormat(formatId);
        expect(isReadyToAdd.value).toBe(false);
      },
    );

    it("returns false when only bread base is selected (no protein)", () => {
      setFormat("fmt-cheesesteak-reg");
      toggleIngredientInCategory("ing-hoagie-roll"); // cat-cheesesteak-base
      expect(isReadyToAdd.value).toBe(false);
    });

    it("returns false when only protein is selected (no bread base)", () => {
      setFormat("fmt-cheesesteak-reg");
      toggleIngredientInCategory("ing-steak"); // cat-protein
      expect(isReadyToAdd.value).toBe(false);
    });

    it("returns true once both bread base and protein are selected", () => {
      setFormat("fmt-cheesesteak-reg");
      toggleIngredientInCategory("ing-hoagie-roll");
      toggleIngredientInCategory("ing-steak");
      expect(isReadyToAdd.value).toBe(true);
    });

    it("remains true after adding extra ingredients on top", () => {
      setFormat("fmt-bowl");
      toggleIngredientInCategory("ing-hoagie-roll");
      toggleIngredientInCategory("ing-chicken");
      toggleIngredientInCategory("ing-provolone");
      toggleIngredientInCategory("ing-onions");
      expect(isReadyToAdd.value).toBe(true);
    });
  });

  describe("salad formats (require greens AND salad type)", () => {
    it.each(["fmt-salad-half", "fmt-salad"])(
      "%s: returns false with no selections",
      (formatId) => {
        setFormat(formatId);
        expect(isReadyToAdd.value).toBe(false);
      },
    );

    it("returns false when only greens are selected (no salad type)", () => {
      setFormat("fmt-salad");
      toggleIngredientInCategory("ing-salad-romaine"); // cat-salad-base
      expect(isReadyToAdd.value).toBe(false);
    });

    it("returns false when only salad type is selected (no greens)", () => {
      setFormat("fmt-salad");
      toggleIngredientInCategory("ing-salad-steak"); // cat-salad-protein
      expect(isReadyToAdd.value).toBe(false);
    });

    it("returns true once both greens and salad type are selected", () => {
      setFormat("fmt-salad");
      toggleIngredientInCategory("ing-salad-romaine");
      toggleIngredientInCategory("ing-salad-chicken");
      expect(isReadyToAdd.value).toBe(true);
    });

    it("half salad also gates correctly (greens + type required)", () => {
      setFormat("fmt-salad-half");
      toggleIngredientInCategory("ing-salad-kale");
      toggleIngredientInCategory("ing-salad-steak");
      expect(isReadyToAdd.value).toBe(true);
    });
  });

  describe("sides / other formats (require at least one selection)", () => {
    it("returns false for fmt-sides with no selections", () => {
      setFormat("fmt-sides");
      expect(isReadyToAdd.value).toBe(false);
    });

    it("returns true for fmt-sides after any single selection", () => {
      setFormat("fmt-sides");
      toggleIngredientInCategory("ing-sides-fries");
      expect(isReadyToAdd.value).toBe(true);
    });
  });
});

// ── Meal management ────────────────────────────────────────────────────────

describe("addToMeal", () => {
  beforeEach(() => {
    setMenu(menu);
    setFormat("fmt-cheesesteak-reg");
  });

  it("appends a MealItem to the meal signal", () => {
    toggleIngredientInCategory("ing-hoagie-roll");
    toggleIngredientInCategory("ing-steak");
    addToMeal();
    expect(meal.value).toHaveLength(1);
    expect(meal.value[0]?.formatId).toBe("fmt-cheesesteak-reg");
  });

  it("captures a snapshot of selections at add time (later changes don't mutate old items)", () => {
    toggleIngredientInCategory("ing-steak");
    addToMeal();
    const firstItem = meal.value[0]!;
    // Change selections — the first meal item should be unaffected.
    clearSelections();
    toggleIngredientInCategory("ing-chicken");
    expect(firstItem.selections).toHaveProperty("ing-steak");
    expect(firstItem.selections).not.toHaveProperty("ing-chicken");
  });

  it("captures a snapshot of nutrition totals at add time", () => {
    toggleIngredientInCategory("ing-steak");
    const snapshot = totals.value.calories;
    addToMeal();
    // Clear and change format — item nutrition is frozen.
    clearSelections();
    setFormat("fmt-bowl");
    expect(meal.value[0]?.nutrition.calories).toBe(snapshot);
  });

  it("generates a unique id for each item added", () => {
    addToMeal();
    addToMeal();
    const ids = meal.value.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is a no-op when no format is selected", () => {
    selectedFormatId.value = null;
    addToMeal();
    expect(meal.value).toHaveLength(0);
  });
});

describe("removeFromMeal", () => {
  beforeEach(() => {
    setMenu(menu);
    setFormat("fmt-cheesesteak-reg");
    addToMeal(); // item 1
    addToMeal(); // item 2
  });

  it("removes the item with the matching id", () => {
    const idToRemove = meal.value[0]!.id;
    removeFromMeal(idToRemove);
    expect(meal.value).toHaveLength(1);
    expect(meal.value.find(i => i.id === idToRemove)).toBeUndefined();
  });

  it("is a no-op for an unknown id (does not throw or clear other items)", () => {
    removeFromMeal("meal-does-not-exist");
    expect(meal.value).toHaveLength(2);
  });
});

describe("clearMeal", () => {
  beforeEach(() => {
    setMenu(menu);
    setFormat("fmt-cheesesteak-reg");
    addToMeal();
    addToMeal();
  });

  it("empties all meal items", () => {
    clearMeal();
    expect(meal.value).toHaveLength(0);
  });

  it("is a no-op when the meal is already empty", () => {
    clearMeal();
    expect(() => clearMeal()).not.toThrow();
    expect(meal.value).toHaveLength(0);
  });
});

describe("mealTotals computed", () => {
  beforeEach(() => setMenu(menu));

  it("returns zero totals when meal is empty", () => {
    expect(mealTotals.value.calories).toBe(0);
    expect(mealTotals.value.protein_g).toBe(0);
  });

  it("sums calories across all meal items", () => {
    // Build item 1: cheesesteak-reg + steak
    setFormat("fmt-cheesesteak-reg");
    toggleIngredientInCategory("ing-steak");
    const item1Cal = totals.value.calories;
    addToMeal();

    // Build item 2: bowl + chicken
    clearSelections();
    setFormat("fmt-bowl");
    toggleIngredientInCategory("ing-chicken");
    const item2Cal = totals.value.calories;
    addToMeal();

    expect(mealTotals.value.calories).toBeCloseTo(item1Cal + item2Cal, 5);
  });

  it("sums all macro fields (protein, carbs, fat, sodium) correctly", () => {
    setFormat("fmt-cheesesteak-reg");
    toggleIngredientInCategory("ing-steak");
    addToMeal();
    clearSelections();
    toggleIngredientInCategory("ing-chicken");
    addToMeal();

    const [a, b] = meal.value as [typeof meal.value[0], typeof meal.value[0]];
    expect(mealTotals.value.protein_g).toBeCloseTo(a.nutrition.protein_g + b.nutrition.protein_g, 5);
    expect(mealTotals.value.fat_g).toBeCloseTo(a.nutrition.fat_g + b.nutrition.fat_g, 5);
    expect(mealTotals.value.sodium_mg).toBeCloseTo(a.nutrition.sodium_mg + b.nutrition.sodium_mg, 5);
  });

  it("updates reactively when an item is removed", () => {
    setFormat("fmt-cheesesteak-reg");
    toggleIngredientInCategory("ing-steak");
    addToMeal();
    const calAfterOne = mealTotals.value.calories;
    addToMeal(); // same build, adds again
    expect(mealTotals.value.calories).toBeCloseTo(calAfterOne * 2, 5);
    removeFromMeal(meal.value[0]!.id);
    expect(mealTotals.value.calories).toBeCloseTo(calAfterOne, 5);
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

  it("multiplies the ingredient contribution when Extra portion is set", () => {
    setFormat("fmt-cheesesteak-reg");
    const fmt = menu.formats.find(f => f.id === "fmt-cheesesteak-reg")!;
    const steak = menu.ingredients.find(i => i.id === "ing-steak")!;
    toggleIngredientInCategory("ing-steak");
    setPortion("ing-steak", 1.5);
    expect(totals.value.calories).toBe(fmt.baseCalories + steak.calories * 1.5);
  });
});
