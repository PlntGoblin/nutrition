/**
 * Round-trip + defense tests for `src/lib/url-state.ts`.
 *
 * Covers PRD §18.3 defenses:
 *   - Round-trip identity for valid builds
 *   - Unknown ingredient IDs silently dropped
 *   - Unknown format IDs ignored
 *   - 500-character cap enforced
 *   - Malformed input (garbage) decodes to empty state
 *   - Portion multipliers outside the known set default to 1.0
 */
import { describe, expect, it } from "vitest";
import { decodeBuild, encodeBuild } from "../src/lib/url-state";
import seed from "../data/seed-ingredients.json";
import type { MenuData, Selection } from "../src/types";

const menu = seed as unknown as MenuData;

function sel(id: string, multiplier = 1): Record<string, Selection> {
  return { [id]: { ingredientId: id, portionMultiplier: multiplier } };
}

describe("encodeBuild + decodeBuild", () => {
  it("round-trips a valid build (format + ingredients + portion overrides)", () => {
    const original = {
      formatId: "fmt-cheesesteak-reg",
      selections: {
        ...sel("ing-steak"),
        ...sel("ing-provolone", 2),
        ...sel("ing-onions"),
      },
    };
    const encoded = encodeBuild(original);
    const decoded = decodeBuild(`#${encoded}`, menu);
    expect(decoded.formatId).toBe(original.formatId);
    expect(Object.keys(decoded.selections).sort()).toEqual(
      Object.keys(original.selections).sort(),
    );
    expect(decoded.selections["ing-provolone"]?.portionMultiplier).toBe(2);
    expect(decoded.selections["ing-steak"]?.portionMultiplier).toBe(1);
  });

  it("encodes an empty build to an empty string", () => {
    expect(encodeBuild({ formatId: null, selections: {} })).toBe("");
  });

  it("decodes an empty hash to a clean empty state", () => {
    const { formatId, selections } = decodeBuild("", menu);
    expect(formatId).toBeNull();
    expect(selections).toEqual({});
  });

  it("silently drops unknown ingredient IDs (PRD §17.1 + §18.3)", () => {
    const decoded = decodeBuild(
      "#f=fmt-cheesesteak-reg&i=ing-steak,ing-bogus-injection,ing-provolone",
      menu,
    );
    expect(Object.keys(decoded.selections).sort()).toEqual([
      "ing-provolone",
      "ing-steak",
    ]);
    expect(decoded.selections).not.toHaveProperty("ing-bogus-injection");
  });

  it("ignores unknown format ID (defaults to null)", () => {
    const decoded = decodeBuild(
      "#f=fmt-does-not-exist&i=ing-steak",
      menu,
    );
    expect(decoded.formatId).toBeNull();
    // Ingredients should still decode normally.
    expect(decoded.selections).toHaveProperty("ing-steak");
  });

  it("defaults unknown portion multipliers to 1.0 (PRD §18.3 type validation)", () => {
    // 99 is not a known PortionOption — should fall back to 1.
    const decoded = decodeBuild(
      "#f=fmt-cheesesteak-reg&i=ing-provolone&p=ing-provolone:99",
      menu,
    );
    expect(decoded.selections["ing-provolone"]?.portionMultiplier).toBe(1);
  });

  it("clamps hash to 500 characters", () => {
    const padding = "x".repeat(600);
    const decoded = decodeBuild(`#i=ing-steak&junk=${padding}`, menu);
    // ing-steak is at the start so it should still parse.
    expect(decoded.selections).toHaveProperty("ing-steak");
  });

  it("decodes malformed garbage to a clean empty state without throwing", () => {
    expect(() => decodeBuild("#%%%not-a-valid-hash%%%", menu)).not.toThrow();
    const decoded = decodeBuild("#%%%not-a-valid-hash%%%", menu);
    expect(decoded.formatId).toBeNull();
    expect(decoded.selections).toEqual({});
  });

  it("excludes unavailable ingredients from the whitelist", () => {
    // Synthesize a menu where one ingredient is unavailable.
    const localMenu: MenuData = {
      ...menu,
      ingredients: menu.ingredients.map((i) =>
        i.id === "ing-steak" ? { ...i, isAvailable: false } : i,
      ),
    };
    const decoded = decodeBuild("#i=ing-steak,ing-chicken", localMenu);
    expect(decoded.selections).not.toHaveProperty("ing-steak");
    expect(decoded.selections).toHaveProperty("ing-chicken");
  });
});
