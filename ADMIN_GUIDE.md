# Forefathers Steaks — Manager Guide

This guide is for the restaurant manager who owns the menu data. It tells you
how to update ingredients, add new items, mark items unavailable, and
publish a Popular Build — without calling engineering.

> **TL;DR:** All data lives in Airtable. Edit a cell, save, wait 5–10 minutes
> for the cache to roll. The live nutrition calculator updates automatically.

---

## What you can do without engineering

- ✅ Add a new ingredient (with photo, calories, allergens, serving size)
- ✅ Edit an existing ingredient's nutrition values
- ✅ Mark an ingredient unavailable (`IsAvailable` checkbox) — guests stop seeing it within 10 min
- ✅ Re-order ingredients within a category (`SortOrder` number)
- ✅ Add or update a Popular Build (preset bowl)
- ✅ Update the disclaimer's "Last updated" date (auto-tracked from any edit)

## What still requires engineering

- ❌ Adding a new **category** (Protein / Cheese / Veggies / Sauces)
- ❌ Changing the **format selector** (Cheesesteak / Bowl options)
- ❌ Adding new **allergen tags** beyond the standard nine
- ❌ Branding changes (colors, fonts, layout)

---

## Logging into Airtable

1. Open your browser to **airtable.com**.
2. Sign in with the account associated with the Forefathers nutrition base.
3. Open the **`Forefathers Nutrition`** base.

You'll see five tables in the left sidebar:

| Table | What's in it |
|---|---|
| `Categories` | Protein / Cheese / Veggies / Sauces — the build steps |
| `Ingredients` | Every individual item the guest can pick |
| `MealFormats` | Cheesesteak Regular / Cheesesteak Large / Low Carb Bowl |
| `PortionOptions` | None / Light / Regular / Extra / Double multipliers |
| `PresetBowls` | Popular Builds shown on the empty state |

Most of your edits will happen in **`Ingredients`**.

---

## How to edit an existing ingredient

**Example: changing the calories on Grilled Steak from 420 to 430.**

1. Open the **`Ingredients`** table.
2. Find the row for "Grilled Steak."
3. Click the **`Calories`** cell.
4. Type the new number.
5. Press Enter or click outside. **There is no "Save" button** — Airtable saves automatically.

Within 5–10 minutes, the live calculator will reflect the change. You can verify by
opening the calculator URL in a fresh browser tab (or incognito window).

> **Why the delay?** The widget caches the menu at the edge for 5 minutes for speed.
> If you need an immediate refresh, contact engineering — there's a manual cache-bust button in the Cloudflare dashboard.

---

## How to add a new ingredient

1. In the **`Ingredients`** table, click **+ New record** at the bottom of the list.
2. Fill in every field:

| Field | What to put | Example |
|---|---|---|
| `Name` | The customer-facing name | "Pepper Jack" |
| `Category` | Click the cell, pick a Category record | Cheese |
| `Photo` | Upload a 480×480 (or larger) square JPG/PNG | (drag in your photo) |
| `Calories` | Calories per default serving | 95 |
| `Protein_g` | Grams of protein | 6 |
| `Carbs_g` | Grams of carbs | 1 |
| `Fat_g` | Grams of total fat | 7 |
| `SatFat_g` | Grams of saturated fat | 4 |
| `Fiber_g` | Grams of fiber | 0 |
| `Sugar_g` | Grams of sugar | 0 |
| `Sodium_mg` | Milligrams of sodium | 200 |
| `ServingSize` | Human-readable serving size | "1 oz" |
| `Allergens` | Multi-select: gluten, dairy, soy, eggs, peanuts, treenuts, fish, shellfish, sesame | dairy |
| `DietTags` | Multi-select: vegan, vegetarian, glutenfree, dairyfree, keto, paleo, lowcarb, highprotein | glutenfree, vegetarian, keto |
| `IsAvailable` | Checkbox — must be on for the ingredient to appear | ☑ |
| `SortOrder` | Number — lower = appears earlier in the category | 5 |
| `AllowsExtra` | Checkbox — true if guests can pick Extra/Double portion | ☑ |

3. Within 5–10 minutes the new ingredient appears for guests.

> **Photo tip:** Use a clean, well-lit square photo (at least 480×480 px). The
> image system automatically converts it to web-optimized formats for guests.
> No need to compress before uploading.

---

## How to mark an ingredient unavailable (86)

You ran out of mushrooms? Quick fix:

1. In the **`Ingredients`** table, find the row for "Grilled Mushrooms."
2. Click the **`IsAvailable`** checkbox to **uncheck** it.

Within 5–10 minutes, the ingredient disappears from the calculator. When you
restock, just re-check the box.

You do NOT need to delete the row — keep the data so when you restock there's
no re-entry work.

---

## How to publish a Popular Build

1. Open the **`PresetBowls`** table.
2. Click **+ New record**.
3. Fill in:
   - `Name`: e.g. "Game Day Cheesesteak"
   - `Description`: a short pitch line, ≤ 80 characters
   - `Format`: link to a record in MealFormats (e.g., "Cheesesteak (Large)")
   - `Ingredients`: a JSON array — see below
   - `Image`: upload a hero photo of the bowl
   - `Tags`: multi-select (popular, chef-pick, spicy, vegetarian, etc.)
   - `IsActive`: ☑
   - `SortOrder`: number — lower = appears first in the gallery
4. The preset appears on the calculator's empty state within 10 minutes.

**Ingredients field format** (JSON — copy this template):

```json
[
  {"ingredientId": "ing-steak", "portionMultiplier": 1},
  {"ingredientId": "ing-american", "portionMultiplier": 2},
  {"ingredientId": "ing-onions", "portionMultiplier": 1},
  {"ingredientId": "ing-buffalo", "portionMultiplier": 1}
]
```

Use `2` for Double portion, `1` for Regular, `1.5` for Extra, `0.5` for Light.

> **Where do I find ingredient IDs?** In the `Ingredients` table, the `id`
> column shows the slug (e.g., `ing-steak`). Copy from there.

---

## Allergen accuracy — IMPORTANT

Allergen and dietary tags are how guests with food allergies or restrictions
make safe choices. Errors here are a health risk, not just bad UX.

**Rules:**
1. **Engineering does NOT edit allergen tags.** Only you (the manager) and a
   designated reviewer at Forefathers do.
2. Before launch, sign off on every ingredient's allergen list in writing.
3. When you add a new ingredient, double-check the `Allergens` field with the
   actual recipe. If unsure, mark the allergen — false positives are
   acceptable; false negatives are not.
4. The disclaimer footer on the live calculator already warns guests:
   "Values are estimates and may vary by preparation. If you have a severe
   allergy, please speak with a manager before ordering." This is your
   secondary safety net, not your primary one.

---

## How long do changes take to appear?

| Type of change | Visible to guests in |
|---|---|
| Ingredient nutrition edits | 5–10 minutes |
| Mark ingredient unavailable | 5–10 minutes |
| Add new ingredient | 5–10 minutes |
| New Popular Build | 5–10 minutes |
| Change a category constraint (e.g., max veggies) | 5–10 minutes |
| Photo updated in Airtable | Up to **24 hours** (nightly mirror) |
| Brand color / layout change | Requires engineering deploy |

---

## What if something looks broken on the live site?

1. **Check Airtable first** — does the data look right?
2. **Wait 10 minutes** for the cache to roll.
3. **Try a fresh browser window** (or incognito mode) to bypass your local cache.
4. **Still broken?** Contact engineering with:
   - The URL of the calculator page
   - The ingredient or feature affected
   - A screenshot if possible

---

## Cheat sheet

| Goal | Click |
|---|---|
| Add new menu item | `Ingredients` → + New record |
| Hide an item temporarily | Uncheck `IsAvailable` |
| Change calories on an item | `Ingredients` → row → `Calories` cell |
| Promote a featured bowl | `PresetBowls` → + New record (or check `IsActive`) |
| Change menu order | Edit `SortOrder` numbers |

---

## Questions?

Engineering contact: (your team's contact info goes here before launch)

Last updated: 2026-05-05
