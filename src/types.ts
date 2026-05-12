/**
 * Shared TypeScript types for menu data and widget state.
 *
 * Mirrors the Airtable schema in PRD §6 with three intentional changes:
 *   1. Field names are camelCase here, snake_case-ish in Airtable. The Worker
 *      will normalize on read.
 *   2. `photoCDN` is a single string (Cloudinary URL) — never an Airtable
 *      attachment array (PRD §6.5).
 *   3. Categories link to ingredients via `categoryId` rather than the bidirectional
 *      links Airtable produces, so the widget never has to traverse link arrays.
 */

// === Tag enums =============================================================

export type AllergenTag =
  | "gluten"
  | "dairy"
  | "soy"
  | "eggs"
  | "peanuts"
  | "treenuts"
  | "fish"
  | "shellfish"
  | "sesame";

export type DietTag =
  | "vegan"
  | "vegetarian"
  | "glutenfree"
  | "dairyfree"
  | "keto"
  | "paleo"
  | "lowcarb"
  | "highprotein";

export type SelectionType = "single" | "multi" | "optional";

// === Schema records ========================================================

export interface Category {
  id: string;
  name: string;
  step: number;
  selectionType: SelectionType;
  /** null → unlimited. Forefathers: Veggies = 4, Sauces = 2. */
  maxSelections: number | null;
  /** Lucide icon name; renderer maps to actual SVG. */
  icon: string;
  helpText?: string;
  required: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  categoryId: string;
  /** Cloudinary URL in production; placehold.co URL during dev/Phase 1. */
  photoCDN: string;
  description?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  satFat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  servingSize: string;
  allergens: AllergenTag[];
  dietTags: DietTag[];
  isAvailable: boolean;
  sortOrder: number;
  /** Whether this ingredient supports portion = Light/Extra. */
  allowsExtra: boolean;
}

export interface MealFormat {
  id: string;
  name: string;
  baseCalories: number;
  baseProtein_g: number;
  baseCarbs_g: number;
  baseFat_g: number;
  baseSodium_mg: number;
  /**
   * Portion-size multiplier applied to every selected ingredient's nutrition
   * (PRD §5.3 client-side math layer). For Forefathers: Mini = 0.6× Regular,
   * Large = 1.5× Regular, and Whole Salad = 1.5× Half Salad.
   * Optional; defaults to 1.0 when absent.
   */
  sizeMultiplier?: number;
  /** IDs of categories that apply to this format. */
  includedCategoryIds: string[];
  heroImage: string;
  sortOrder: number;
}

export interface PortionOption {
  id: string;
  name: string;
  multiplier: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface PresetBowl {
  id: string;
  name: string;
  description: string;
  formatId: string;
  ingredients: Array<{ ingredientId: string; portionMultiplier: number }>;
  image: string;
  tags: string[];
  isActive: boolean;
  sortOrder: number;
}

// === Aggregate payload (what the Worker returns; what api.fetchMenu resolves to) ===

export interface MenuData {
  formats: MealFormat[];
  categories: Category[];
  ingredients: Ingredient[];
  portionOptions: PortionOption[];
  presets: PresetBowl[];
  lastUpdated: string;
}

// === Widget state ==========================================================

export interface Selection {
  ingredientId: string;
  /** Multiplier applied to ingredient nutrition (e.g. 0.6 = Light, 1.5 = Extra). */
  portionMultiplier: number;
}

export interface ActiveFilters {
  diets: DietTag[];
  excludeAllergens: AllergenTag[];
}

export interface BuildState {
  formatId: string | null;
  selections: Record<string, Selection>;
  activeFilters: ActiveFilters;
}

// === Computed totals =======================================================

export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  satFat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
}

// === Meal builder ==========================================================

export interface MealItem {
  id: string;
  formatId: string;
  formatName: string;
  selections: Record<string, Selection>;
  nutrition: NutritionTotals;
}
