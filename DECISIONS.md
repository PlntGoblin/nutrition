# Architectural Decisions

Running log of every non-obvious choice. Format from PRD §15.

---

## 2026-05-05: Project scaffolded for Forefathers Steaks (Phase 0)

**Context:** Kicking off PRD v2.0 build. Client is Forefathers Steaks
(forefatherssteaks.com), a build-your-own cheesesteak concept with 2 proteins,
4 cheeses, 6 veggies, 6 sauces, plus 3 pre-built salads and a Low Carb Bowl
alternative. Menu structure derived from a photo of the in-store menu board
provided by the client.

**Decisions made:**
- Project lives at `Fathers/nutrition-calculator/` (subdirectory; PRD + kickoff stay at the parent root).
- Package manager: npm (Node v25.6.1 / npm v11.9.0 already installed).
- Single project, single Airtable base, single Worker — no multi-tenant abstractions per PRD §1 "What we're NOT shipping."

---

## 2026-05-05: Cloudflare Web Analytics in place of Plausible

**Context:** Client is a small business and asked whether the stack can run
free. Plausible is $9/month and we don't yet have a strong reason to prefer
it over the free Cloudflare Web Analytics tier.

**Options considered:**
- **Plausible** ($9/mo) — best-in-class privacy analytics, simple custom-event API.
- **Cloudflare Web Analytics** (free) — same cookieless model, same privacy posture, custom events supported via the JS SDK.
- **No analytics** — would compromise the data-informed decisions in PRD §9 Phase 7 task 5 (which event informs which decision).

**Decision:** Cloudflare Web Analytics.

**Rationale:** It satisfies the PRD's analytics requirements (cookieless, no PII, custom events tied to specific decisions), keeps recurring cost at $0, and removes one third-party signup. The `src/lib/analytics.ts` wrapper isolates the provider so swapping back to Plausible later is a one-file change.

**Consequences:** None — Cloudflare Web Analytics is mature; the only minor friction is the dashboard is tied to a Cloudflare account rather than a separate Plausible login, which the client already has via Pages/Workers.

---

## 2026-05-05: Cloudinary kept (free tier) despite small-business cost concern

**Context:** Client asked whether Cloudinary is necessary given budget concerns.

**Options considered:**
- **Cloudinary free tier** (25 GB storage / 25 GB bandwidth/mo) — PRD §6.5 default.
- **Bundle images in the repo** — free, but managers can't add new ingredient photos without engineering.
- **Cloudflare R2 + Workers** — free egress, but more upload-pipeline work.

**Decision:** Cloudinary free tier.

**Rationale:** Forefathers' realistic image volume (~30 ingredient photos × ~50 KB optimized = ~1.5 MB stored; bandwidth well under 10 GB/mo at expected page-view scale) sits comfortably inside Cloudinary's free tier. Free tier signup requires no credit card. Bundling images in the repo would violate the "manager edits Airtable, no developer needed for menu changes" principle from PRD §3 every time a new ingredient or seasonal item gets a photo. The PRD's Cloudinary mandate (§6.5) is correct for this scale.

**Consequences:** None at expected scale. If the free tier is ever exceeded, the documented fallback (Cloudflare Images $5/mo, same field schema per PRD §6.5) is a one-line config swap.

---

## 2026-05-05: Brand colors set to red / black / white from menu photo + client confirmation

**Context:** PRD §8.1 ships with a deep-green default; Forefathers' brand uses
red script headers on white with black body text (visible on the in-store menu
board photo). Client confirmed in writing: "their colors are red, black and white."

**Decision:** Set CSS-variable defaults in `src/styles/tokens.css` to:
- `--color-brand: #C8102E` (American steakhouse red — WCAG AA passes on white at 5.49:1)
- `--color-accent: #1A1A1A`
- `--color-bg: #FFFFFF`
- `--color-ink: #1A1A1A` (slightly softer than `#000` for body text comfort)

**Rationale:** Better to ship Phase 0 with the correct brand palette than to scaffold against the PRD's generic defaults and refactor later. The exact red hex was inferred from a single menu photo and is a starting guess.

**Consequences:** Stakeholder visual review in Phase 8.5 must confirm or refine the precise red value against the client's official brand guide. Logo + lockup assets are pending in `../FF files/` (folder exists but empty as of 2026-05-05).

---

## 2026-05-05: Forefathers menu modeled as 3 formats + 4 categories + 3 preset salads

**Context:** Forefathers' menu (per the client-provided menu board photo) has:
- Cheesesteak (Regular $10 / Large $13)
- Low Carb Style (bowl over cabbage-kale slaw)
- 3 pre-built salads (Buffalo Chicken, BBQ Chicken, Steak)
- Customization steps: Protein → Cheese → Veggies (UP TO 4) → Sauces (UP TO 2)
- Double Cheese for an additional $1
- Mini Cheesesteak / Sides — kids menu and add-ons, not build-your-own

**Decision:**
- **Three `MealFormats`:** Cheesesteak Regular, Cheesesteak Large, Low Carb Bowl. Different `BaseCalories` per format (different bread roll size, or slaw base).
- **Four `Categories`:** Protein (single, required), Cheese (single, optional, supports Double via PortionOptions), Veggies (multi, max 4), Sauces (multi, max 2).
- **Three `PresetBowls`:** the menu salads, modeled as preset starting points the guest can customize (PRD §4.2 #16 "Popular Builds gallery").
- **Out of scope for v1:** Mini Cheesesteak (kids portion) and Sides (fries / bisque) — not build-your-own.

**Rationale:** Maps cleanly to PRD §6 schema with no architectural changes. The "UP TO 4" / "UP TO 2" constraints become `MaxSelections` values on the Veggies/Sauces categories — already supported by the schema.

**Consequences:** PortionStepper component (PRD §4.2 P1) is most useful on the Cheese category here. Other ingredients may not need portion variation, but the data shape stays uniform across the menu.

---

## 2026-05-05: Real Forefathers data ingested from client xlsx; sizeMultiplier added to MealFormat

**Context:** Client provided `Forefathers.xlsx` containing the actual menu structure and computed nutrition totals at three cheesesteak sizes (Mini $8 / Regular $13 / Large $16) plus a Low Carb Bowl variant. The seed JSON was previously USDA placeholders.

**Changes:**
- Per-ingredient nutrition for **Steak, Chicken, Cheese Wiz, American, Provolone, Mozzarella, Kale Slaw** is now computed from the xlsx's per-size totals divided by per-size portions (rows 33-78 of the Menu sheet). These values are CONFIRMED by the client.
- **Three cheesesteak sizes** instead of two: Mini, Regular, Large. Plus the existing Low Carb Bowl.
- New `sizeMultiplier` field on `MealFormat` (Mini 0.6×, Regular 1.0×, Large 1.5×) — `nutrition.calculateTotals()` now scales every selected ingredient's nutrition by `format.sizeMultiplier × selection.portionMultiplier`. Reflects the xlsx pattern where Mini steak = 4.286 oz vs Regular 7.143 oz vs Large 10.714 oz (a roughly 0.6/1.0/1.5 ratio).
- **Yellow-highlighted batch recipes** in the xlsx (Fry Sauce, Spicy Blue Cheese, Ranch, Jalapeño Cilantro Ranch, Kale Slaw, Romaine/Spring Mix, Kale/Spring Mix, Corn Relish) are house-made; ingredient lists documented in the Batch Recipes tab. They're modeled as single ingredients in the calculator (matching how guests think about them); their batch-recipe details surface only if the client wants it later.

**Still placeholders pending client confirmation:**
- Onions, Mushrooms, Green Peppers, Jalapeños, Sweet Peppers, Cherry Peppers — USDA averages
- Marinara, Buffalo Sauce, BBQ Sauce — USDA averages
- Fry Sauce, Spicy Blue Cheese, Ranch, Jalapeño Cilantro Ranch — derived from the batch recipes (mayo + buttermilk + blue cheese / ranch mix base) but not lab-tested
- Bread base calorie values for Mini/Regular/Large — USDA hoagie roll averages

**Out of scope for v1:**
- Salads (Buffalo Chicken / BBQ Chicken / Steak Salad) require salad-specific ingredients (Romaine/Spring Mix, Kale/Spring Mix, Monterey Jack, Tortilla Strips, Corn Relish) not currently modeled. Revisit when client requests.
- Sides (Regular Fries, Sweet Potato Fries, Cheese Fries, Tomato Basil Bisque, Side Salad, Chicken Tenders, sweets) are not build-your-own; out of scope.
- Mini Cheesesteak Wiz O / etc. preset shortcuts in Sheet4 — replaced by the more flexible PresetBowls layer.

**Why sizeMultiplier instead of separate ingredient records per size:**
- 20 ingredients × 3 sizes = 60 records vs 20 records with a multiplier. Smaller payload, easier for the manager to maintain in Airtable.
- The xlsx scales ingredients fairly uniformly within ~10% of the multiplier; the residual error is smaller than the rounding error in displayed calorie counts (which are integers anyway).
- Where the size scaling diverges meaningfully (e.g. cheese slice counts: 1/2/3 not 0.6/1/1.5), the calculator already accepts the small discrepancy as a Phase 1 simplification documented here.

**Schema impact:** `MealFormat.sizeMultiplier?: number` (optional, defaults to 1.0). `nutrition.calculateTotals()` updated. New unit tests in `tests/nutrition.test.ts` lock the 0.6/1.0/1.5 behavior.

---

## 2026-05-05: Phase 1 nutrition values are USDA-derived placeholders pending client data

**Context:** Phase 1 needs realistic seed data so the math in `nutrition.ts` and the unit tests are meaningful. The client said real per-serving values from Forefathers would be available "later this evening" but Phase 1 is the unblocker for Phases 2–5.

**Decision:** Populate `data/seed-ingredients.json` with USDA FoodData Central averages and published per-serving values for analogous ingredients (sliced ribeye, low-moisture mozzarella, grilled bell peppers, etc.). Mark the file's `_comment` field clearly as "estimates pending client confirmation."

**Rationale:** USDA values are the FDA-recommended source per PRD §9 Phase 1 task 2. They're public, free, and accurate enough that any unit test built against them stays valid even when individual numbers are swapped — the test asserts `chicken.calories adds chicken.calories`, not the literal value, so swapping the JSON later doesn't break tests.

**Consequences:**
- Phase 6 swaps these values for the client-confirmed numbers as part of the Airtable seeding script (`scripts/seed-airtable.ts`).
- The `LastUpdated` field on each Airtable record (PRD §6) is what guests will see in the disclaimer footer; manager-edited values are authoritative.
- Engineering does NOT edit allergen tags after Phase 1 — only the client confirms them in writing per PRD §18.7.

---

## 2026-05-05: Tailwind v4 CSS-first config; `tailwind.config.ts` retained as a stub

**Context:** PRD §7 requires `tailwind.config.ts` in the file structure. Tailwind v4 deprecated JS/TS config in favor of CSS `@theme` blocks.

**Decision:** Keep `tailwind.config.ts` as a minimal `content`-only stub for editor tooling that still expects it. Real theme tokens live in `src/styles/tokens.css` under `@theme`.

**Rationale:** Honors §7's file layout while using the modern v4 idiom. Keeps everything tree-shakable and avoids running an outdated JIT engine alongside the v4 plugin.

**Consequences:** None functional. Future engineers reading the v3-pattern config file should follow the comment header pointing them to `tokens.css`.
