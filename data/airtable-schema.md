# Airtable Schema — Forefathers Steaks Nutrition

> Human-readable mirror of the schema defined in PRD §6. The Cloudflare
> Worker reads from a view named `API_PublicMenu` filtered to
> `IsAvailable = TRUE` and sorted by `SortOrder`.

## Tables

### `Categories`
| Field | Type | Notes |
|---|---|---|
| `Name` | Single line text | "Protein", "Cheese", "Veggies", "Sauces" |
| `Step` | Number | 1=Protein, 2=Cheese, 3=Veggies, 4=Sauces |
| `SelectionType` | Single select | `single` (Protein, Cheese) / `multi` (Veggies, Sauces) |
| `MaxSelections` | Number | Veggies = 4, Sauces = 2, others null |
| `Icon` | Single line text | Lucide icon name |
| `HelpText` | Long text | Optional subtext |
| `Required` | Checkbox | Protein required; others optional |

### `Ingredients`
See PRD §6 Table 2. `PhotoCDN` is the Cloudinary URL that the widget reads;
raw Airtable `Photo` attachments are never linked from the widget.

### `MealFormats`
| Format | Notes |
|---|---|
| Cheesesteak (Regular) | Bread roll base, ~10" |
| Cheesesteak (Large) | Bread roll base, ~12" |
| Low Carb Bowl | Cabbage-kale slaw base, no bread |

### `PortionOptions`
| Name | Multiplier |
|---|---|
| None | 0 |
| Light | 0.5 |
| Regular | 1.0 |
| Extra | 1.5 |
| Double | 2.0 |

(`Double Cheese for Additional $1.00` from the menu maps to Double on the cheese category.)

### `PresetBowls` (Popular Builds)
The three menu salads modeled as preset starting points the guest can customize:
- Buffalo Chicken Salad
- BBQ Chicken Salad
- Steak Salad

## Allergen tags reference

| Ingredient | Allergens |
|---|---|
| Provolone, Mozzarella, Cheese Wiz, White American | dairy |
| Spicy Blue Cheese, Drizzle of Cheese Wiz, Jalapeño Cilantro Ranch | dairy |
| Cheesesteak roll | gluten, possibly egg |
| Fry Sauce | eggs |
| Veggies (all) | none |
| Marinara | none (verify with client) |

> Engineering does NOT edit allergen tags. The client's manager signs off on
> these in writing before launch (PRD §18.7).
