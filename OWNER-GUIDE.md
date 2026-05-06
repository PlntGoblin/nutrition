# Forefathers Nutrition Calculator — Owner Guide

> **For Claude:** Read this entire file before helping the owner make any changes.
> All nutrition data lives in Airtable. Changes there flow automatically to the live
> calculator within 5 minutes. No code changes are needed for adding or editing
> ingredients, nutrition values, or photos.

---

## How the System Works

```
Airtable (your data) → Cloudflare Worker (API) → Live Calculator Website
```

- You add or edit an ingredient in Airtable
- The website auto-refreshes within **5 minutes**
- That's it — no developer needed for routine data updates

---

## Getting Into Airtable

1. Go to **airtable.com** and sign in (or create a free account)
2. Ask Dan (your developer) to invite your email to the **Forefathers** base
3. Once invited, the base will appear on your Airtable home screen
4. Direct link to the base: `https://airtable.com/appdjvKFDbVf0hnp0`

> **Note for Claude:** If the owner is not yet invited, they need to give Dan their
> email address. Dan invites them via Airtable's Share button (Editor role).
> Do NOT share the AIRTABLE_PAT — that is a developer secret.

---

## The Five Tables (What Goes Where)

| Table | What's in it |
|---|---|
| **Formats** | The meal types (Regular Cheesesteak, Salad, Fries, etc.) |
| **Categories** | The step sections within each meal (Protein, Cheese, Veggies, etc.) |
| **Ingredients** | Every individual item a customer can pick |
| **Portions** | The size multipliers (Light / Normal / Double / With Slaw / No Slaw) |
| **Presets** | Pre-built "premade" combinations shown in the gallery |

For day-to-day use, you will almost always be working in **Ingredients**.

---

## Most Common Task: Adding a New Ingredient

In the **Ingredients** table, click **+** to add a row and fill in these fields:

### Required Fields

| Field | What to enter | Example |
|---|---|---|
| `IngredientId` | A unique ID — format: `ing-` then the name, lowercase, hyphens | `ing-corn-relish` |
| `Name` | Display name exactly as it should appear | `Corn Relish` |
| `CategoryId` | Which step/section it belongs to (see Category IDs below) | `cat-veggies` |
| `Calories` | Calories per regular serving | `45` |
| `Protein_g` | Protein in grams | `1` |
| `Carbs_g` | Carbs in grams | `9` |
| `Fat_g` | Fat in grams | `0.5` |
| `IsAvailable` | Check this box for the item to show up | ✅ |
| `SortOrder` | Controls display order within the category (lower = higher up) | `5` |

### Optional but Recommended

| Field | What to enter |
|---|---|
| `SatFat_g` | Saturated fat in grams |
| `Fiber_g` | Dietary fiber in grams |
| `Sugar_g` | Sugar in grams |
| `Sodium_mg` | Sodium in milligrams |
| `ServingSize` | Human-readable size (e.g. `2 oz`, `3 slices`) |
| `Description` | One-line description shown to customers |
| `Allergens` | Comma-separated: `gluten,dairy,soy,eggs,peanuts,treenuts,fish,shellfish,sesame` |
| `DietTags` | Comma-separated: `glutenfree,dairyfree,keto,lowcarb,vegan,vegetarian,highprotein,paleo` |
| `AllowsExtra` | Check if the item can be doubled (Light / Normal / Double options appear) |
| `Photo` | Upload a photo directly here — it syncs to the website automatically overnight |
| `PhotoCDN` | Leave blank — the system fills this in automatically from your uploaded photo |

---

## Category IDs — Reference Sheet

When adding an ingredient you must set `CategoryId` to one of these exact values:

### Cheesesteak / Low Carb Bowl
| CategoryId | What it is |
|---|---|
| `cat-cheesesteak-base` | Base — Hoagie Roll or Low Carb Bowl |
| `cat-protein` | Protein — Steak or Chicken |
| `cat-cheese` | Cheese — Wiz, American, Provolone, Mozzarella |
| `cat-veggies` | Veggies — Onions, Mushrooms, Peppers, etc. |
| `cat-sauces` | Sauces — Fry Sauce, Ranch, etc. |

### Salad
| CategoryId | What it is |
|---|---|
| `cat-salad-base` | Greens — Romaine, Kale/Spring Mix, etc. |
| `cat-salad-protein` | Protein — Steak, Chicken, BBQ Chicken, etc. |
| `cat-salad-toppings` | Toppings — Peppers, Corn Relish, etc. |
| `cat-salad-dressing` | Dressing — Ranch, Balsamic, etc. |

### Chicken Tenders
| CategoryId | What it is |
|---|---|
| `cat-tenders-sauce` | Dipping sauce options |

### Fries
| CategoryId | What it is |
|---|---|
| `cat-fries-style` | Style — Regular, Loaded, etc. |
| `cat-fries-sauce` | Sauce — Fry Sauce, Ranch, etc. |

### Desserts
| CategoryId | What it is |
|---|---|
| `cat-desserts` | Individual dessert items |

---

## How to Update an Existing Ingredient

1. Find the ingredient in the **Ingredients** table
2. Click on its row to open it
3. Edit any field directly — nutrition numbers, name, description, allergens
4. Click out of the field — Airtable saves automatically
5. **Wait 5 minutes** and the live website will reflect your change

---

## How to Add a Photo

1. Find the ingredient in the **Ingredients** table
2. Click the `Photo` field (attachment column)
3. Upload your image — JPG or PNG, ideally square, at least 400×400px
4. The website syncs photos automatically **overnight**
5. For immediate photo updates, ask Dan to run the photo sync script

> **Note for Claude:** The photo sync is handled by the Worker's `mirrorPhotos`
> function which runs on a nightly cron. Photos uploaded to Airtable's `Photo`
> attachment field get mirrored to Cloudinary and the `PhotoCDN` URL gets
> written back to Airtable. Tell the owner to upload to `Photo`, not `PhotoCDN`.

---

## How to Hide an Ingredient (Take it Off the Menu)

1. Find the ingredient in the **Ingredients** table
2. Uncheck the `IsAvailable` checkbox
3. It disappears from the calculator within 5 minutes

To bring it back, check `IsAvailable` again.

---

## Ingredient ID Naming Rules

IDs must be unique and follow this pattern:

- Always start with `ing-`
- Lowercase only
- Hyphens between words, no spaces or underscores
- For salad-specific versions of an ingredient, prefix with `ing-salad-`

| Good | Bad |
|---|---|
| `ing-corn-relish` | `Corn Relish` |
| `ing-salad-croutons` | `ing_salad_croutons` |
| `ing-buffalo-sauce` | `ing-BuffaloSauce` |

---

## Currently Missing / Needs Your Attention

These items are placeholders with estimated nutrition values. The owner should
verify and correct them with actual recipe data:

| Ingredient | What needs verifying |
|---|---|
| All veggie toppings (onions, mushrooms, peppers) | Portion sizes and exact cal/macro values |
| All sauces (Fry Sauce, Ranch, etc.) | These are batch recipes — exact values from recipe cards |
| Kale Slaw | Batch recipe — verify against actual recipe |
| Corn Relish | Batch recipe — verify against actual recipe |
| Chicken Tenders (4 strips, 800 cal) | Confirm this matches actual menu |
| All fry styles | Confirm calorie values |
| All desserts | Add actual items and nutrition |

---

## What Requires a Developer

The following things need Dan and cannot be done in Airtable alone:

- Adding a **new meal format** (e.g. a whole new category like Wraps)
- Adding a **new step/category** within a meal
- Changing how the calculator **looks or behaves**
- Updating the **custom domain** or hosting
- Anything involving code, the Worker, or Cloudflare

---

## Quick Reference: Live URLs

| What | URL |
|---|---|
| Live calculator | `https://nutrition.forefatherssteaks.com` *(once DNS is set up)* |
| Current preview | `https://forefathers-nutrition.pages.dev` |
| Airtable base | `https://airtable.com/appdjvKFDbVf0hnp0` |

---

## For Claude: Step-by-Step Session Flow

When helping the owner add or update nutrition data, follow this flow:

1. **Ask what they want to add or change** — get the ingredient name and which meal it belongs to
2. **Look up the nutrition values** — use USDA FoodData Central or ask the owner to provide from their recipe cards. Prefer actual measured values over estimates.
3. **Confirm the CategoryId** — use the Category IDs table above to pick the right one
4. **Generate the IngredientId** — follow the naming rules above
5. **Walk the owner to Airtable** — go to `https://airtable.com/appdjvKFDbVf0hnp0`, open the Ingredients table, click `+`
6. **Fill in each field together** — go field by field, confirm each value before moving on
7. **Check `IsAvailable`** — easy to forget, item won't show without it
8. **Set `SortOrder`** — ask where in the list it should appear
9. **Wait 5 minutes** then check the live calculator together
10. **Photo** — if they have one, upload it to the `Photo` attachment field
