/**
 * Unit tests for `src/lib/nutrition.ts`.
 *
 * Phase 0: a single smoke test so `npm test` exits 0 and the runner is wired.
 * Phase 1 fills in the real coverage per PRD §9 Phase 1 task 7:
 *   - Empty bowl returns base calories only
 *   - Adding chicken adds correct macros
 *   - Portion=Double doubles that ingredient's contribution
 *   - Multiple ingredients sum correctly
 */
import { describe, it, expect } from "vitest";

describe("nutrition (phase 0 placeholder)", () => {
  it("test runner is wired", () => {
    expect(true).toBe(true);
  });
});
