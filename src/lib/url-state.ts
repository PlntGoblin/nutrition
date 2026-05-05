/**
 * URL-hash build encoding/decoding.
 *
 * Format (URLSearchParams-style inside the location hash):
 *   #f=cheesesteak-reg&i=ing-steak,ing-provolone,ing-onions&p=ing-provolone:2
 *
 * Where:
 *   - `f` = format ID (must match a known MealFormat)
 *   - `i` = comma-separated ingredient IDs (each must match a known Ingredient
 *           AND be marked isAvailable)
 *   - `p` = comma-separated `id:multiplier` pairs for non-default portions
 *           (multiplier must match a known PortionOption value)
 *
 * Defenses (PRD §18.3):
 *   - Strict whitelist: every decoded ID is validated against the loaded
 *     menu data. Unknown IDs are silently dropped — never rendered.
 *   - 500-character cap: longer hashes are truncated; defends malformed
 *     input from blowing up parser perf.
 *   - Type validation: portion multipliers must match a known PortionOption.
 *     Unknown multipliers default to 1.0.
 *   - No eval, no innerHTML, no URL constructors that could redirect.
 *
 * History semantics: encode writes to `location.hash` via `replaceState`
 * so we don't pollute the back button. Listeners on `hashchange` are
 * intentionally not wired — the widget is the source of truth, not the
 * URL bar (PRD §17.1 silent-recovery: malformed/edited hashes degrade
 * to a clean state without surfacing errors).
 */
import type {
  BuildState,
  MenuData,
  Selection,
} from "../types";

const MAX_HASH_LENGTH = 500;

interface DecodedBuild {
  formatId: string | null;
  selections: Record<string, Selection>;
}

export function encodeBuild(state: Pick<BuildState, "formatId" | "selections">): string {
  const params = new URLSearchParams();
  if (state.formatId) params.set("f", state.formatId);

  const entries = Object.values(state.selections);
  if (entries.length > 0) {
    params.set("i", entries.map((s) => s.ingredientId).join(","));
    const overrides = entries.filter((s) => s.portionMultiplier !== 1);
    if (overrides.length > 0) {
      params.set(
        "p",
        overrides.map((s) => `${s.ingredientId}:${s.portionMultiplier}`).join(","),
      );
    }
  }
  return params.toString();
}

export function decodeBuild(hash: string, menu: MenuData): DecodedBuild {
  let clean = hash.replace(/^#/, "");
  if (clean.length === 0) return { formatId: null, selections: {} };
  if (clean.length > MAX_HASH_LENGTH) {
    console.warn(
      `[nutrition-calculator] URL hash exceeds ${MAX_HASH_LENGTH} chars; truncating.`,
    );
    clean = clean.slice(0, MAX_HASH_LENGTH);
  }

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(clean);
  } catch {
    return { formatId: null, selections: {} };
  }

  const validFormatIds = new Set(menu.formats.map((f) => f.id));
  const validIngredientIds = new Set(
    menu.ingredients.filter((i) => i.isAvailable).map((i) => i.id),
  );
  const validMultipliers = new Set(menu.portionOptions.map((p) => p.multiplier));

  const formatRaw = params.get("f");
  const formatId =
    formatRaw && validFormatIds.has(formatRaw) ? formatRaw : null;

  // Parse portion overrides first so we can apply them when building selections.
  const portionMap: Record<string, number> = {};
  const portionRaw = params.get("p");
  if (portionRaw) {
    for (const entry of portionRaw.split(",")) {
      const [id, mulStr] = entry.split(":");
      if (!id || !mulStr) continue;
      const mul = parseFloat(mulStr);
      if (
        validIngredientIds.has(id) &&
        Number.isFinite(mul) &&
        validMultipliers.has(mul)
      ) {
        portionMap[id] = mul;
      }
    }
  }

  const selections: Record<string, Selection> = {};
  const ingredientRaw = params.get("i");
  if (ingredientRaw) {
    for (const id of ingredientRaw.split(",")) {
      if (validIngredientIds.has(id)) {
        const mul = portionMap[id] ?? 1;
        selections[id] = { ingredientId: id, portionMultiplier: mul };
      }
    }
  }

  return { formatId, selections };
}

/**
 * Write the current build to `location.hash` without polluting the back
 * button. Caller is expected to debounce; PRD §9 Phase 5 task 5 specs
 * 500 ms debounce on selection-driven writes.
 */
export function writeHash(state: Pick<BuildState, "formatId" | "selections">): void {
  if (typeof window === "undefined") return;
  const encoded = encodeBuild(state);
  const newHash = encoded ? `#${encoded}` : "";
  if (window.location.hash === newHash) return;
  // Use replaceState so we don't add to back-button history.
  const url = new URL(window.location.href);
  url.hash = newHash;
  window.history.replaceState(window.history.state, "", url.toString());
}
