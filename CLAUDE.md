# Forefathers Steaks — Nutrition Calculator
## Complete Technical Handoff for Claude

This is the authoritative reference for understanding, operating, and extending the
Forefathers Steaks nutrition calculator. Read this entire file before making any
changes. Everything here is current as of May 2026.

---

## 0. Who This Project Belongs To

**Owner:** Matt Dishon — matt.dishon@forefatherssteaks.com
**Built by:** Dan Argaez (original developer, handed off May 2026)
**Repository:** https://github.com/PlntGoblin/nutrition

Matt has full admin access to every system this project uses:
- **Airtable** — all menu data lives here (invite sent to matt.dishon@forefatherssteaks.com)
- **Cloudinary** — photo CDN, admin access granted May 2026
- **Cloudflare** — hosts the Worker (API) and Pages (widget)
- **GitHub** — source code repository

If you are Claude helping Matt: you are the primary technical resource for this
project going forward. This file tells you everything you need. Start here every
session.

---

## 1. What This Project Is

An embeddable web widget that lets Forefathers Steaks customers build their meal
and see real-time calorie + macro breakdowns. It's deployed as a self-contained
JavaScript bundle that any webpage can load with two lines of HTML.

The widget is live at: **https://forefathers-nutrition.pages.dev**
GitHub: **https://github.com/PlntGoblin/nutrition**

---

## 2. Architecture — How Everything Connects

```
Airtable (database)
    ↓  every 5 min
Cloudflare Worker (API server at forefathers-nutrition-api.workers.dev)
    ↓  cached in KV store (key: menu-v1)
    ↓  fetched by the widget on load
Preact Widget (calculator.js + calculator.css)
    ↓  deployed to
Cloudflare Pages (forefathers-nutrition.pages.dev)
    ↓  embedded via <script> tag on
Any website (forefathersteaks.com or wherever they embed it)
```

**The golden rule:** Airtable is the single source of truth for all menu data.
The Worker fetches from Airtable and caches the result. The widget fetches from
the Worker. Never edit `data/seed-ingredients.json` to make production changes —
that file is only used for local development and automated tests.

---

## 3. Credentials & Secrets

All secrets live in `.env` at the project root. **Never commit this file to git.**
The `.gitignore` already excludes it.

```
AIRTABLE_TOKEN=<your Airtable Personal Access Token>
AIRTABLE_BASE_ID=<base ID — starts with "app">
AIRTABLE_TABLE_FORMATS=<table ID>
AIRTABLE_TABLE_CATEGORIES=<table ID>
AIRTABLE_TABLE_INGREDIENTS=<table ID>
AIRTABLE_TABLE_PORTIONS=<table ID>
AIRTABLE_TABLE_PRESETS=<table ID>
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
```

The actual values are in the `.env` file at the project root (not committed to git).

Worker secrets are also stored in Cloudflare — they were set via `wrangler secret put`.
If the `.env` is ever lost, the Worker still runs because Cloudflare holds its own copy.

### Service Logins (all under Matt's ownership)

| Service | How to log in | What it's for |
|---|---|---|
| **Airtable** | airtable.com → matt.dishon@forefatherssteaks.com | All menu data |
| **Cloudinary** | console.cloudinary.com → matt.dishon@forefatherssteaks.com | Ingredient photos CDN (admin access granted May 2026) |
| **Cloudflare** | dash.cloudflare.com → accept invite email → matt.dishon@forefatherssteaks.com | Hosts the Worker (API) and Pages (widget) — **Super Administrator** access granted May 2026 |
| **GitHub** | github.com/PlntGoblin/nutrition | Source code |

**Cloudinary media library direct link:**
`https://console.cloudinary.com/app/c-5bfeddf601a5bce26697a72d5a38e4/assets/media_library`
All ingredient photos are stored here under the account Matt now has admin access to.

---

## 4. Project Structure — What Each File Does

```
nutrition-calculator/
├── CLAUDE.md                ← You are here. Read first, always.
├── OWNER-GUIDE.md           ← Non-technical guide for the owner using Airtable
├── DECISIONS.md             ← Architecture decisions log — read before changing patterns
│
├── src/
│   ├── index.tsx            ← Widget entry point; mounts the Preact app
│   ├── app.tsx              ← Root component: landing view vs. builder view
│   ├── types.ts             ← All TypeScript interfaces (MealFormat, Ingredient, etc.)
│   │
│   ├── components/
│   │   ├── IngredientCard.tsx   ← One ingredient row: photo, name, scaled nutrition
│   │   ├── IngredientGrid.tsx   ← List of cards for one category; passes sizeMul down
│   │   ├── TotalsPanel.tsx      ← Running calorie/macro counter (hero rail)
│   │   ├── MealSummary.tsx      ← "Your Full Meal" modal with all added items
│   │   ├── MealTray.tsx         ← Persistent floating tray showing meal item count
│   │   ├── FormatSelector.tsx   ← Landing page: pick your meal type
│   │   ├── SizePicker.tsx       ← Size toggle: Mini/Reg/Large or Half/Whole salad
│   │   ├── NutritionPrefsModal  ← Allergen/diet filter modal
│   │   ├── AllergenWarning.tsx  ← Banner when selected items violate active filters
│   │   ├── BottomSheet.tsx      ← Mobile bottom sheet for nutrition details
│   │   ├── PresetGallery.tsx    ← "Popular builds" gallery
│   │   ├── ShareButton.tsx      ← Copies a shareable URL for the current build
│   │   ├── DisclaimerFooter.tsx ← Allergen statement at the bottom
│   │   └── PortionStepper.tsx   ← Light / Regular / Extra buttons per ingredient
│   │
│   ├── lib/
│   │   ├── store.ts         ← ALL global state (Preact signals). Read this first.
│   │   ├── nutrition.ts     ← Pure math: calculateTotals(), DAILY_VALUES
│   │   ├── filters.ts       ← Allergen/diet filtering logic
│   │   ├── api.ts           ← fetchMenu() — calls the Worker endpoint
│   │   ├── url-state.ts     ← Encode/decode build state in URL hash
│   │   ├── analytics.ts     ← track() helper for event tracking
│   │   └── use-animated-number.ts ← Hook for smooth calorie counter animation
│   │
│   └── styles/
│       ├── tokens.css       ← CSS custom properties (colors, fonts, spacing)
│       ├── base.css         ← All component styles (BEM, scoped to [data-nc-root])
│       ├── animations.css   ← Keyframe animations
│       └── print.css        ← Print styles
│
├── worker/
│   ├── src/index.ts         ← Cloudflare Worker: fetches Airtable, caches in KV
│   └── wrangler.toml        ← Worker config: KV binding, cron schedule
│
├── data/
│   ├── seed-ingredients.json ← Local copy of menu data. Used ONLY for tests.
│   └── airtable-schema.md   ← Human-readable schema reference
│
├── tests/
│   ├── store.test.ts        ← 79 tests covering all selection/mutation logic
│   ├── nutrition.test.ts    ← Math correctness tests
│   ├── filters.test.ts      ← Allergen/diet filter tests
│   └── url-state.test.ts    ← URL hash encode/decode tests
│
├── public/
│   ├── embed.html           ← Example embed page (the actual customer-facing host)
│   └── index.html           ← Dev preview page
│
└── .env                     ← Secrets. Never commit. See Section 3.
```

---

## 5. The Data Model

### Formats (meal types)

Each format has:
- `id` — e.g. `fmt-cheesesteak-reg`, `fmt-salad`, `fmt-sides`
- `sizeMultiplier` — scales every ingredient's nutrition contribution:
  - Mini Cheesesteak: **0.6×**
  - Regular Cheesesteak: **1.0×**
  - Large Cheesesteak: **1.5×**
  - Bowl: **1.0×**
  - Half Salad: **0.6×**
  - Whole Salad: **1.0×**
  - Tenders, Fries, Desserts: **1.0×**
- `baseCalories` / `baseProtein_g` / `baseCarbs_g` / `baseFat_g` / `baseSodium_mg`
  — calories baked into the format itself (e.g. the bread roll contribution)
- `includedCategoryIds` — which step sections appear in the builder for this format

### Ingredients

The nutrition fields (`Calories`, `Protein_g`, etc.) represent a **standard single
portion at 1.0× scale**. The format's `sizeMultiplier` is applied on top.

**Add to Meal gating rules** (enforced by `isReadyToAdd` computed signal in store.ts):
- Cheesesteak + Bowl: requires `cat-cheesesteak-base` AND `cat-protein` to be selected
- Salad: requires `cat-salad-base` (greens) AND `cat-salad-protein` to be selected
- Everything else: any single selection unlocks "Add to Meal"

### Cheese — special slot cap

The cheese category (`cat-cheese`) uses a slot-based cap of **4 total slots**
(not 4 distinct cheeses). Each cheese normally costs 1 slot; setting Extra costs 2.
`ing-no-cheese` is mutually exclusive — selecting it clears all real cheeses, and
selecting any real cheese while `ing-no-cheese` is active removes it first.

---

## 6. The KV Cache — Most Important Operational Fact

The Worker stores the built menu payload in Cloudflare KV under the key **`menu-v1`**.
It serves from this cache for **5 minutes** before re-fetching Airtable.

**Whenever you change something in Airtable and need it live immediately**, bust the
cache with:

```bash
npx wrangler kv key delete --binding=MENU_CACHE --remote menu-v1
```

Without this, the old data serves for up to 5 more minutes. After the delete, the
next request to the Worker fetches fresh from Airtable.

---

## 7. Common Tasks — Exact Commands

### Add or edit an ingredient
→ Go to Airtable. No code needed. Wait 5 min or bust KV cache (Section 6).

### Fix a calorie / macro value
→ Edit the field in Airtable's **Ingredients** table. Bust cache if urgent.

### Change a format's size multiplier
1. Update the `SizeMultiplier` field in Airtable's **Formats** table
2. Also update `data/seed-ingredients.json` to keep tests in sync:
   ```json
   { "id": "fmt-salad", "sizeMultiplier": 1.0, ... }
   ```
3. Also update the assertion in `tests/nutrition.test.ts` if it references the old value
4. Bust KV cache
5. Run tests: `npm test`

### Hide an ingredient (seasonal / out of stock)
→ Uncheck `IsAvailable` in Airtable. Bust cache if urgent. Re-check to restore.

### Add a new sauce or topping to an existing category
→ Add a row in Airtable Ingredients with the correct `CategoryId` and `SortOrder`.

### Add or update a photo for an ingredient
See **Section 19** for the full photo guide. Short version:
- **Easiest / next-day:** Upload to the `Photo` field in Airtable → syncs overnight
- **Immediate:** Upload to Cloudinary directly, copy the URL, paste into `PhotoCDN`
  field in Airtable, bust KV cache

### Add a new meal format (e.g. Wraps)
This requires code changes. Steps:
1. Add the format row in Airtable's **Formats** table with a new `FormatId`
2. Add category rows in **Categories** for each step in that format
3. If the format needs a custom "Add to Meal" gate, update `isReadyToAdd`
   in `src/lib/store.ts`
4. If it needs a size picker, add it to the `SIZE_IDS` set in `SizePicker.tsx`
5. Build + deploy the widget (see Section 8)

### Clear the allergen disclaimer / update legal text
→ Edit `src/components/DisclaimerFooter.tsx` directly, then rebuild + deploy.

### Update the embed snippet
→ Edit `public/embed.html`. The `<script>` tag points to the deployed JS bundle URL.

---

## 8. How to Build & Deploy

### Build the widget (generates `dist/calculator.js` + `dist/calculator.css`)
```bash
npm run build
```

### Deploy the widget to Cloudflare Pages
```bash
npx wrangler pages deploy dist --project-name forefathers-nutrition
```
This outputs a preview URL like `https://[hash].forefathers-nutrition.pages.dev`.
The production URL `https://forefathers-nutrition.pages.dev` updates automatically
via GitHub Actions on every push to `main`.

### Deploy the Worker (API server)
```bash
cd worker && npx wrangler deploy
```
Only needed when `worker/src/index.ts` changes (CORS updates, photo overrides,
schema mapping changes, etc.).

### Push to GitHub (triggers auto-deploy)
```bash
git add <files>
git commit -m "description"
git push origin main
```

### Run the test suite
```bash
npm test              # all 106 unit tests
npm run test:watch    # watch mode during development
```
All 106 tests must pass before any commit. If they don't, fix before pushing.

---

## 9. The CSS System

### Everything is scoped to `[data-nc-root]`
All styles are prefixed with `[data-nc-root]` so the widget can safely embed on
any host website without CSS leaking in either direction.

### BEM naming convention
```
nc-component           ← block
nc-component__element  ← element
nc-component--modifier ← modifier
is-state               ← state class (is-selected, is-expanded, is-blocked)
```

### The `!important` rule
The host website may have CSS like `[data-nc-root] button { ... }` that has high
specificity. Any button style that needs to reliably win **must use `!important`**.
This is intentional, not sloppy. The brand color is `--color-brand: #C8102E`.

### Design tokens
All colors, fonts, and spacing live in `src/styles/tokens.css` as CSS custom
properties. Change a color there and it updates everywhere. Dark mode is handled
by a `[data-nc-theme="dark"]` attribute toggle.

### Mobile breakpoint
```css
@media (max-width: 719px) { ... }   /* mobile: everything ≤ 719px */
@media (min-width: 720px) { ... }   /* desktop: everything ≥ 720px */
```
On mobile, the hero header collapses: title and actions are hidden, only the back
arrow + compact "Add to Meal" button + scaled totals row show.

---

## 10. The State System (store.ts)

The entire widget state lives in `src/lib/store.ts` as Preact signals. This is the
most important file in the frontend codebase.

### Key signals
| Signal | What it holds |
|---|---|
| `menuData` | The full menu payload from the Worker |
| `selectedFormatId` | Which format (meal type) is active |
| `selections` | `{ [ingredientId]: { ingredientId, portionMultiplier } }` |
| `activeFilters` | `{ diets: [], excludeAllergens: [] }` |
| `meal` | Array of `MealItem` objects (the multi-item bag) |
| `mealSummaryOpen` | Boolean — controls the "Your Full Meal" modal |

### Key computed signals
| Signal | What it computes |
|---|---|
| `totals` | Running nutrition total for the current build |
| `mealTotals` | Sum of nutrition across all items in the meal bag |
| `isReadyToAdd` | Whether "Add to Meal" button should be enabled |
| `allergenViolations` | Which selected ingredients conflict with active filters |

### Mutation rules
Components **never** write to signals directly. They call the exported functions:
`selectIngredient`, `deselectIngredient`, `toggleIngredientInCategory`, `setPortion`,
`addToMeal`, `removeFromMeal`, `clearMeal`, `setDietFilters`, `setAllergenExclusions`.

---

## 11. How Nutrition Math Works

```
totalCalories = format.baseCalories + Σ (ingredient.calories × portionMul × sizeMul)
```

- `format.baseCalories` = calories from the bread roll or base (0 for salads/bowl)
- `ingredient.calories` = calories at standard 1× portion and 1× size
- `portionMul` = 0.6 (Light), 1.0 (Regular), 1.5 (Extra) — set by the customer
- `sizeMul` = the format's `sizeMultiplier` (Mini=0.6, Regular=1.0, Large=1.5, etc.)

**The ingredient cards display values already scaled by `sizeMul`**, so the number
on the card always matches what the totals panel adds. This was a deliberate fix —
the raw values never show to the customer.

The pure math function is `calculateTotals()` in `src/lib/nutrition.ts`.
It has no side effects and is fully unit-tested in `tests/nutrition.test.ts`.

---

## 12. URL Share Links

When a customer builds a meal, the URL hash updates automatically, e.g.:
`#f=fmt-cheesesteak-reg&i=ing-steak,ing-provolone&p=ing-provolone:2`

- `f=` — the format ID
- `i=` — comma-separated ingredient IDs
- `p=` — portion overrides (`ingredientId:multiplier`)

Sharing that URL opens the exact same build. `src/lib/url-state.ts` handles
encode/decode. Unknown ingredient IDs are silently dropped (defense against stale URLs).
The hash is capped at 500 characters.

---

## 13. Gotchas & Things That Bit Us

**KV cache:** The most common "why isn't my Airtable change showing?" answer is
the KV cache. Always delete `menu-v1` after important Airtable updates.

**Photo sync is nightly:** If you upload a photo to Airtable and it doesn't appear
immediately, that's by design. Immediate fix = add to `PHOTO_OVERRIDES` in the Worker.

**CSS specificity:** The host website's CSS can override widget buttons. Any
styled button that doesn't look right probably needs `!important` on its key
properties. This is the established pattern in `base.css`.

**`seed-ingredients.json` is NOT the production database.** It's a local snapshot
for running tests. If you make a change in Airtable and don't update `seed-ingredients.json`,
the tests will diverge from production. Keep them in sync whenever you change
format-level things (like `sizeMultiplier`).

**Meal item IDs use `Date.now() + counter`** to prevent collisions when "Add to Meal"
is tapped twice in the same millisecond. Don't simplify this back to `Date.now()` alone.

**`isReadyToAdd` is format-aware.** Adding a new format to the app requires thinking
about its gate condition and updating the `isReadyToAdd` computed in `store.ts` and
the corresponding tests in `tests/store.test.ts`.

**No Cheese exclusivity:** `ing-no-cheese` is handled specially in
`toggleIngredientInCategory`. Selecting it clears all real cheeses. Selecting any
real cheese while No Cheese is active drops No Cheese first, then runs normal
slot-cap logic. The slot cap is 4 total portion-slots, not 4 distinct cheeses.

---

## 14. Things That Only Require Airtable (No Code)

- Add, edit, or hide any ingredient
- Change any nutrition value (calories, macros, sodium, etc.)
- Change an ingredient's name or description
- Add or remove allergen tags
- Add or remove diet tags (glutenfree, vegan, keto, etc.)
- Change the display order of ingredients (SortOrder field)
- Add a photo (uploads sync overnight)
- Add a preset/popular build

## Things That Require Code Changes

- Add a new meal format or a new step/category within a format
- Change the visual design, layout, or colors
- Change the "Add to Meal" gating logic for a format
- Update CORS allowed origins
- Change the size picker options
- Update the allergen/disclaimer legal text
- Add a new diet filter tag
- Change the 5-minute cache freshness window
- Update the embed snippet or hosting

---

## 15. Cloudflare Access — What Matt Can Do

Matt received an invite email from Cloudflare in May 2026 and has been granted
**Super Administrator** access to Dan.argaez@gmail.com's Cloudflare account.
This is the highest access level — Matt can do everything in the account.

**To log in:** Accept the invite email → go to dash.cloudflare.com →
sign in with matt.dishon@forefatherssteaks.com.

### What Matt can do directly in the Cloudflare dashboard (no code needed)

| Task | Where in dashboard |
|---|---|
| View the live nutrition calculator URL | Pages → forefathers-nutrition |
| See all deployments and deployment history | Pages → forefathers-nutrition → Deployments |
| View Worker logs (for debugging API issues) | Workers & Pages → forefathers-nutrition-api → Logs |
| Delete the KV cache manually | Workers & Pages → KV → MENU_CACHE → View → delete `menu-v1` |
| Check Worker analytics (requests, errors) | Workers & Pages → forefathers-nutrition-api → Metrics |
| Set a custom domain for the calculator | Pages → forefathers-nutrition → Custom domains |
| Manage billing | Billing (left sidebar) |

### Connecting Wrangler CLI to Matt's machine

The Wrangler CLI is the terminal tool Claude uses to deploy the Worker and widget,
and to bust the KV cache from the command line. It needs to be authenticated once
on Matt's computer before Claude can use it.

**One-time setup — run this once:**
```bash
npx wrangler login
```
This opens a browser window → log in with matt.dishon@forefatherssteaks.com →
authorize Wrangler → done. From that point on, all `wrangler` commands run as Matt.

**Once authenticated, Claude can run any of these on Matt's machine:**
```bash
# Deploy the widget (after code changes)
npx wrangler pages deploy dist --project-name forefathers-nutrition

# Deploy the Worker (after Worker code changes)
cd worker && npx wrangler deploy

# Bust the KV cache (force Airtable refresh immediately)
npx wrangler kv key delete --binding=MENU_CACHE --remote menu-v1

# Check what's in the KV cache
npx wrangler kv key get --binding=MENU_CACHE --remote menu-v1

# View live Worker logs
npx wrangler tail forefathers-nutrition-api
```

### How to set a custom domain for the calculator

Currently the calculator lives at `forefathers-nutrition.pages.dev`. To put it
on a proper domain like `nutrition.forefatherssteaks.com`:

1. Go to **dash.cloudflare.com**
2. Click **Workers & Pages** → **forefathers-nutrition**
3. Click the **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter the subdomain (e.g. `nutrition.forefatherssteaks.com`)
6. Cloudflare will ask you to add a DNS record — if `forefatherssteaks.com` is
   already on Cloudflare, it adds it automatically. If it's with another registrar,
   you'll need to add a CNAME record pointing to `forefathers-nutrition.pages.dev`
7. SSL/HTTPS is handled automatically by Cloudflare — no extra setup needed

**Important after setting a custom domain:** The Worker has a CORS allowlist that
controls which websites can call the nutrition API. The new domain needs to be added
to the allowlist in `worker/src/index.ts`. Ask Claude to do this — it's a one-line
change followed by a Worker deploy.

---

## 16. If Something Is Broken


### Widget shows loading spinner forever
→ The Worker may be down or returning an error. Check:
```bash
curl https://forefathers-nutrition-api.workers.dev/menu | head -c 200
```
If it returns `{"formats":...}` the Worker is fine and the issue is elsewhere.
If it returns an error, check Cloudflare Worker logs.

### Airtable change isn't showing up
→ Bust the KV cache (Section 6) and wait 10 seconds, then reload.

### Math looks wrong for a specific size
→ Check the `SizeMultiplier` in Airtable's **Formats** table for that format.
Also check `data/seed-ingredients.json` matches if tests are failing.

### A button isn't styled correctly
→ The host page CSS is probably winning the specificity war. Add `!important`
to the relevant rules in `src/styles/base.css` for the affected element.

### Tests are failing
```bash
npm test -- --reporter=verbose
```
Fix all failures before deploying. The 106 tests cover every core mutation path.

### "Add to Meal" button not appearing
→ Check `isReadyToAdd` logic in `src/lib/store.ts`. For cheesesteak/bowl: need
base + protein. For salad: need greens + protein. For sides: need any selection.

---

## 17. Key IDs Reference

### Format IDs
| ID | Meal |
|---|---|
| `fmt-cheesesteak-mini` | Mini Cheesesteak |
| `fmt-cheesesteak-reg` | Regular Cheesesteak |
| `fmt-cheesesteak-lg` | Large Cheesesteak |
| `fmt-bowl` | Low Carb Bowl |
| `fmt-salad-half` | Half Salad |
| `fmt-salad` | Whole Salad |
| `fmt-tenders` | Chicken Tenders |
| `fmt-fries` | Fries |
| `fmt-sides` | Sides (combined) |
| `fmt-desserts` | Desserts |
| `fmt-sweet-potato-fries` | Sweet Potato Fries |
| `fmt-5050-fries` | 50/50 Fries |

### Category IDs
| ID | What it is |
|---|---|
| `cat-cheesesteak-base` | Bread base (Hoagie Roll / Low Carb Bowl) |
| `cat-protein` | Protein (Steak / Chicken) |
| `cat-cheese` | Cheese (slot-capped, max 4 slots) |
| `cat-veggies` | Veggies (max 4 selections) |
| `cat-sauces` | Sauces (max 2 selections) |
| `cat-salad-base` | Salad greens |
| `cat-salad-protein` | Salad protein |
| `cat-salad-toppings` | Salad toppings |
| `cat-salad-dressing` | Salad dressing |
| `cat-sides-type` | Side item type |
| `cat-sides-sauce` | Sauces on Side |
| `cat-tenders-sauce` | Tender dipping sauce |
| `cat-fries-style` | Fry style |
| `cat-fries-sauce` | Fry sauce |
| `cat-desserts` | Desserts |

### Special Ingredient IDs
| ID | Why it matters |
|---|---|
| `ing-no-cheese` | Triggers cheese exclusivity logic — not a normal toggle |
| `ing-hoagie-roll` | Required base for cheesesteak isReadyToAdd gate |
| `ing-kale-slaw-base` | Required base for bowl isReadyToAdd gate |

---

## 18. Airtable Direct API (for urgent updates without the UI)

If you need to update a value programmatically (e.g. the owner calls and needs an
ingredient changed immediately and Airtable is being slow), you can PATCH directly:

Read the actual values from `.env` first, then:

```bash
# Load from .env
source .env

# Find a record's Airtable record ID:
curl -s "https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_INGREDIENTS}" \
  -H "Authorization: Bearer ${AIRTABLE_TOKEN}" \
  | python3 -c "import json,sys; [print(r['id'], r['fields'].get('IngredientId')) for r in json.load(sys.stdin)['records']]"

# Then PATCH the record (replace recXXXX with the actual record ID from above):
curl -X PATCH "https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_INGREDIENTS}/recXXXXXXXXXXXXX" \
  -H "Authorization: Bearer ${AIRTABLE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"Calories":250}}'

# Then bust the cache:
npx wrangler kv key delete --binding=MENU_CACHE --remote menu-v1
```

Table IDs for the PATCH URL:
- Formats: `tblKCF0wa38b12apB`
- Categories: `tblw764rCIRjuJ582`
- Ingredients: `tblG6VyMQAPuJx98c`
- Portions: `tbl3aHmdsRy6kd3Zm`
- Presets: `tblbwezA0NUlhpp9J`

---

## 19. Photo Management — Complete Guide for Matt

Matt has **admin access** to the Cloudinary account at:
`https://console.cloudinary.com/app/c-5bfeddf601a5bce26697a72d5a38e4/assets/media_library`

Log in with **matt.dishon@forefatherssteaks.com**.

All ingredient photos displayed in the nutrition calculator live in this Cloudinary
media library. The calculator reads photo URLs from the `PhotoCDN` field in Airtable.

---

### Method A — Overnight (Easiest, No Technical Steps)

This is the recommended method for adding new photos or swapping existing ones.

1. Go to **airtable.com** → open the **Forefathers** base → **Ingredients** table
2. Find the ingredient you want to add a photo for (search by name)
3. Click into that ingredient's row to open it
4. Find the **Photo** field (attachment field — looks like a paperclip)
5. Click it and upload your image file (JPG or PNG, square crop, at least 400×400px)
6. That's it — the system does the rest automatically overnight

**What happens behind the scenes:** Every night at 3am, the Cloudflare Worker runs a
job that scans every ingredient's `Photo` attachment in Airtable, uploads the image to
Cloudinary, and writes the resulting `PhotoCDN` URL back to Airtable. The next time
the calculator loads after that, it shows the new photo.

---

### Method B — Immediate (Same Day, A Few More Steps)

Use this when you need the photo live right now, not tomorrow.

**Step 1 — Upload to Cloudinary**
1. Go to `https://console.cloudinary.com/app/c-5bfeddf601a5bce26697a72d5a38e4/assets/media_library`
2. Log in as matt.dishon@forefatherssteaks.com
3. Click **Upload** (top right)
4. Upload your photo (JPG or PNG, square, at least 400×400px)
5. Once uploaded, click on the photo to open it
6. Find the **URL** or **Copy URL** option — copy the full `https://res.cloudinary.com/...` URL

**Step 2 — Paste the URL into Airtable**
1. Go to **airtable.com** → **Ingredients** table
2. Find the ingredient
3. Click into the **PhotoCDN** field (this is the one the website reads directly)
4. Paste the Cloudinary URL you copied
5. Click out — Airtable saves automatically

**Step 3 — Clear the cache so the website picks it up**

Ask Claude to run:
```bash
npx wrangler kv key delete --binding=MENU_CACHE --remote menu-v1
```
Or if you're comfortable with a terminal, run that command from the project folder.

**Step 4 — Reload the calculator**
Wait about 10 seconds, then open the calculator. The new photo should appear.

---

### Photo Tips

**Best photo format:**
- Square crop (1:1 ratio) — the calculator displays photos in a circle
- At least 400×400px — larger is fine, Cloudinary handles resizing
- JPG or PNG — either works
- Clean background or food-focused — the photo shows at about 48×48px on screen,
  so simple and clear reads better than busy backgrounds

**Naming doesn't matter** — Cloudinary assigns its own URL regardless of filename.

**What if the photo isn't showing after the cache clear?**
Check the `PhotoCDN` field in Airtable for that ingredient — make sure it has a
URL that starts with `https://res.cloudinary.com/`. If it's blank, the photo upload
didn't complete. Re-do Method B Step 1–2.

**What if you want to remove a photo?**
Clear the `PhotoCDN` field in Airtable. The ingredient card will show a colored
initial circle (first letter of the ingredient name) instead. Bust the cache.

---

### Current Photo Status

Some ingredients use placeholder initials (no real photo yet). To see which ones,
look in the Airtable **Ingredients** table for rows where `PhotoCDN` is blank or
doesn't contain `res.cloudinary.com`. Those are the candidates for new photos.

Priority items to photograph (as of handoff):
- Salad toppings (corn relish, mozzarella jalapeño, tortilla strips)
- All dressings (ranch, buffalo, BBQ, blue cheese, cilantro ranch)
- Sauces on Side (fry sauce, jalapeño cilantro ranch, cheese whiz, spicy blue cheese,
  buffalo, ranch, ketchup)
- Desserts (once menu items are confirmed)
