/**
 * Unit tests for `src/lib/nutrition.ts`.
 *
 * Covers the four cases mandated by PRD §9 Phase 1 task 7:
 *   1. Empty bowl returns base calories only
 *   2. Adding chicken adds correct macros
 *   3. Portion=Extra multiplies that ingredient's contribution
 *   4. Multiple ingredients sum correctly
 *
 * Plus two resilience cases that align with PRD §17.1 (silent recovery):
 *   5. Selections referencing unknown ingredient IDs are skipped
 *   6. Selections with multiplier 0 contribute nothing
 *
 * Test fixtures use the actual Forefathers seed data so the math under test
 * matches what guests will see — divergence between test fixtures and
 * production data is a common bug source.
 */
import { describe, expect, it } from "vitest";
import { calculateTotals } from "../src/lib/nutrition";
import seed from "../data/seed-ingredients.json";
import type { Ingredient, MealFormat, Selection } from "../src/types";

const formats = seed.formats as unknown as MealFormat[];
const ingredients = seed.ingredients as unknown as Ingredient[];

const cheesesteakReg = formats.find((f) => f.id === "fmt-cheesesteak-reg")!;
const bowl = formats.find((f) => f.id === "fmt-bowl")!;
const chicken = ingredients.find((i) => i.id === "ing-chicken")!;
const steak = ingredients.find((i) => i.id === "ing-steak")!;
const provolone = ingredients.find((i) => i.id === "ing-provolone")!;
const onions = ingredients.find((i) => i.id === "ing-onions")!;

function sel(id: string, multiplier = 1): Record<string, Selection> {
  return { [id]: { ingredientId: id, portionMultiplier: multiplier } };
}

describe("calculateTotals", () => {
  it("returns format base nutrition when no ingredients selected", () => {
    const totals = calculateTotals(cheesesteakReg, {}, ingredients);
    expect(totals.calories).toBe(cheesesteakReg.baseCalories);
    expect(totals.protein_g).toBe(cheesesteakReg.baseProtein_g);
    expect(totals.carbs_g).toBe(cheesesteakReg.baseCarbs_g);
    expect(totals.fat_g).toBe(cheesesteakReg.baseFat_g);
    expect(totals.sodium_mg).toBe(cheesesteakReg.baseSodium_mg);
    // Bowl base calories should equal exactly what the format declares.
    const bowlTotals = calculateTotals(bowl, {}, ingredients);
    expect(bowlTotals.calories).toBe(bowl.baseCalories);
  });

  it("adding grilled chicken adds chicken's macros to the format base", () => {
    const totals = calculateTotals(cheesesteakReg, sel(chicken.id), ingredients);
    expect(totals.calories).toBe(cheesesteakReg.baseCalories + chicken.calories);
    expect(totals.protein_g).toBe(cheesesteakReg.baseProtein_g + chicken.protein_g);
    expect(totals.fat_g).toBe(cheesesteakReg.baseFat_g + chicken.fat_g);
    expect(totals.sodium_mg).toBe(cheesesteakReg.baseSodium_mg + chicken.sodium_mg);
  });

  it("portion=Extra multiplies that ingredient's contribution by 1.5 (and only that one)", () => {
    const single = calculateTotals(cheesesteakReg, sel(steak.id, 1), ingredients);
    const extra = calculateTotals(cheesesteakReg, sel(steak.id, 1.5), ingredients);
    // Format base contributes once in both; the steak contribution scales.
    expect(extra.calories - cheesesteakReg.baseCalories).toBe(
      (single.calories - cheesesteakReg.baseCalories) * 1.5,
    );
    expect(extra.protein_g - cheesesteakReg.baseProtein_g).toBe(
      (single.protein_g - cheesesteakReg.baseProtein_g) * 1.5,
    );
  });

  it("multiple ingredients sum correctly (steak + provolone + onions on bowl)", () => {
    const selections = {
      ...sel(steak.id),
      ...sel(provolone.id),
      ...sel(onions.id),
    };
    const totals = calculateTotals(bowl, selections, ingredients);

    const expectedCalories =
      bowl.baseCalories + steak.calories + provolone.calories + onions.calories;
    const expectedProtein =
      bowl.baseProtein_g + steak.protein_g + provolone.protein_g + onions.protein_g;
    const expectedSodium =
      bowl.baseSodium_mg +
      steak.sodium_mg +
      provolone.sodium_mg +
      onions.sodium_mg;

    expect(totals.calories).toBeCloseTo(expectedCalories, 5);
    expect(totals.protein_g).toBeCloseTo(expectedProtein, 5);
    expect(totals.sodium_mg).toBeCloseTo(expectedSodium, 5);
  });

  it("skips selections referencing unknown ingredient IDs (PRD §17.1)", () => {
    const totals = calculateTotals(
      cheesesteakReg,
      {
        ...sel(chicken.id),
        ...sel("ing-does-not-exist"),
      },
      ingredients,
    );
    // Unknown ID contributed nothing; result equals chicken-only build.
    const chickenOnly = calculateTotals(cheesesteakReg, sel(chicken.id), ingredients);
    expect(totals.calories).toBe(chickenOnly.calories);
  });

  it("treats portion=0 as 'not selected' and contributes nothing", () => {
    const totals = calculateTotals(cheesesteakReg, sel(chicken.id, 0), ingredients);
    expect(totals.calories).toBe(cheesesteakReg.baseCalories);
  });

  it("Mini cheesesteak scales ingredient nutrition by sizeMultiplier (0.6×)", () => {
    const mini = formats.find((f) => f.id === "fmt-cheesesteak-mini")!;
    const reg = cheesesteakReg;
    expect(mini.sizeMultiplier).toBe(0.6);
    const miniTotals = calculateTotals(mini, sel(steak.id), ingredients);
    const regTotals = calculateTotals(reg, sel(steak.id), ingredients);
    // Strip out base (which differs) — compare just the ingredient contribution.
    const miniContribution = miniTotals.calories - mini.baseCalories;
    const regContribution = regTotals.calories - reg.baseCalories;
    expect(miniContribution).toBeCloseTo(regContribution * 0.6, 5);
    expect(miniTotals.protein_g - mini.baseProtein_g).toBeCloseTo(
      (regTotals.protein_g - reg.baseProtein_g) * 0.6,
      5,
    );
  });

  it("Large cheesesteak scales ingredient nutrition by sizeMultiplier (1.5×)", () => {
    const large = formats.find((f) => f.id === "fmt-cheesesteak-lg")!;
    expect(large.sizeMultiplier).toBe(1.5);
    const largeTotals = calculateTotals(large, sel(steak.id), ingredients);
    const regTotals = calculateTotals(cheesesteakReg, sel(steak.id), ingredients);
    const largeContribution = largeTotals.calories - large.baseCalories;
    const regContribution = regTotals.calories - cheesesteakReg.baseCalories;
    expect(largeContribution).toBeCloseTo(regContribution * 1.5, 5);
  });

  it("Whole salad (1.0×) shows full ingredient calories; half salad (0.6×) shows 60%", () => {
    const half = formats.find((f) => f.id === "fmt-salad-half")!;
    const whole = formats.find((f) => f.id === "fmt-salad")!;
    expect(half.sizeMultiplier).toBe(0.6);
    expect(whole.sizeMultiplier).toBe(1.0);
    const halfTotals = calculateTotals(half, sel(chicken.id), ingredients);
    const wholeTotals = calculateTotals(whole, sel(chicken.id), ingredients);
    const halfContribution = halfTotals.calories - half.baseCalories;
    const wholeContribution = wholeTotals.calories - whole.baseCalories;
    // Whole = 1.0× the ingredient; half = 0.6× → whole is 1/0.6 ≈ 1.667× the half
    expect(wholeContribution).toBeCloseTo(halfContribution / 0.6, 5);
    // Sanity: whole salad shows 100% of ingredient calories, half shows 60%
    expect(wholeContribution).toBeCloseTo(chicken.calories * 1.0, 5);
    expect(halfContribution).toBeCloseTo(chicken.calories * 0.6, 5);
  });
});
