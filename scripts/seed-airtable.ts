/**
 * One-time seeder: creates all 5 Airtable tables and loads every record from
 * data/seed-ingredients.json. Safe to re-run only on a fresh base — records
 * are inserted, not upserted, so a second run will duplicate data.
 *
 * Usage:
 *   npm run seed
 *
 * Requires AIRTABLE_TOKEN in .env (Personal Access Token with
 * data.records:write + schema.bases:write on the Forefathers base).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(__dir, '../data/seed-ingredients.json'), 'utf-8'));

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? 'appdjvKFDbVf0hnp0';
const TOKEN   = process.env.AIRTABLE_TOKEN;
const API     = 'https://api.airtable.com/v0';
const META    = 'https://api.airtable.com/v0/meta';

if (!TOKEN) {
  console.error('❌  AIRTABLE_TOKEN is not set. Add it to your .env file and retry.');
  process.exit(1);
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

async function at(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url}\n→ ${res.status}: ${text}`);
  return JSON.parse(text) as Record<string, unknown>;
}

async function createTable(name: string, fields: unknown[]): Promise<string> {
  process.stdout.write(`  ${name}... `);
  const { id } = await at('POST', `${META}/bases/${BASE_ID}/tables`, { name, fields });
  console.log(`✓  ${id}`);
  return id as string;
}

async function insertRecords(tableId: string, records: Record<string, unknown>[]) {
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10).map(fields => ({ fields }));
    await at('POST', `${API}/${BASE_ID}/${tableId}`, { records: batch });
    if (i + 10 < records.length) await new Promise(r => setTimeout(r, 250));
  }
  console.log(`     → ${records.length} records written`);
}

// ── Field-type shorthands ────────────────────────────────────────────────────

const txt  = { type: 'singleLineText' } as const;
const long = { type: 'multilineText'  } as const;
const url_ = { type: 'url'            } as const;
const chk  = { type: 'checkbox', options: { icon: 'check', color: 'greenBright' } } as const;
const num  = (precision = 2) => ({ type: 'number', options: { precision } } as const);

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌱  Seeding Airtable base ${BASE_ID}\n`);

  // 1. MealFormats
  const fmtId = await createTable('MealFormats', [
    { name: 'Name',                ...txt   },
    { name: 'FormatId',            ...txt   },
    { name: 'BaseCalories',        ...num(0) },
    { name: 'BaseProtein_g',       ...num() },
    { name: 'BaseCarbs_g',         ...num() },
    { name: 'BaseFat_g',           ...num() },
    { name: 'BaseSodium_mg',       ...num(0) },
    { name: 'SizeMultiplier',      ...num() },
    { name: 'IncludedCategoryIds', ...txt   },
    { name: 'HeroImage',           ...url_  },
    { name: 'SortOrder',           ...num(0) },
  ]);
  await insertRecords(fmtId, seed.formats.map((f: any) => ({
    Name:                f.name,
    FormatId:            f.id,
    BaseCalories:        f.baseCalories,
    BaseProtein_g:       f.baseProtein_g,
    BaseCarbs_g:         f.baseCarbs_g,
    BaseFat_g:           f.baseFat_g,
    BaseSodium_mg:       f.baseSodium_mg,
    SizeMultiplier:      f.sizeMultiplier ?? 1.0,
    IncludedCategoryIds: f.includedCategoryIds.join(','),
    HeroImage:           f.heroImage,
    SortOrder:           f.sortOrder,
  })));

  // 2. Categories
  const catId = await createTable('Categories', [
    { name: 'Name',          ...txt   },
    { name: 'CategoryId',    ...txt   },
    { name: 'Step',          ...num(0) },
    { name: 'SelectionType', ...txt   },
    { name: 'MaxSelections', ...num(0) },
    { name: 'Icon',          ...txt   },
    { name: 'HelpText',      ...txt   },
    { name: 'Required',      ...chk   },
  ]);
  await insertRecords(catId, seed.categories.map((c: any) => ({
    Name:          c.name,
    CategoryId:    c.id,
    Step:          c.step,
    SelectionType: c.selectionType,
    MaxSelections: c.maxSelections,
    Icon:          c.icon,
    HelpText:      c.helpText,
    Required:      c.required,
  })));

  // 3. Ingredients
  const ingId = await createTable('Ingredients', [
    { name: 'Name',         ...txt   },
    { name: 'IngredientId', ...txt   },
    { name: 'CategoryId',   ...txt   },
    { name: 'PhotoCDN',     ...url_  },
    { name: 'Description',  ...txt   },
    { name: 'Calories',     ...num(0) },
    { name: 'Protein_g',    ...num() },
    { name: 'Carbs_g',      ...num() },
    { name: 'Fat_g',        ...num() },
    { name: 'SatFat_g',     ...num() },
    { name: 'Fiber_g',      ...num() },
    { name: 'Sugar_g',      ...num() },
    { name: 'Sodium_mg',    ...num(0) },
    { name: 'ServingSize',  ...txt   },
    { name: 'Allergens',    ...txt   },
    { name: 'DietTags',     ...txt   },
    { name: 'IsAvailable',  ...chk   },
    { name: 'SortOrder',    ...num(0) },
    { name: 'AllowsExtra',  ...chk   },
  ]);
  await insertRecords(ingId, seed.ingredients.map((i: any) => ({
    Name:         i.name,
    IngredientId: i.id,
    CategoryId:   i.categoryId,
    PhotoCDN:     i.photoCDN,
    Description:  i.description,
    Calories:     i.calories,
    Protein_g:    i.protein_g,
    Carbs_g:      i.carbs_g,
    Fat_g:        i.fat_g,
    SatFat_g:     i.satFat_g,
    Fiber_g:      i.fiber_g,
    Sugar_g:      i.sugar_g,
    Sodium_mg:    i.sodium_mg,
    ServingSize:  i.servingSize,
    Allergens:    i.allergens.join(','),
    DietTags:     i.dietTags.join(','),
    IsAvailable:  i.isAvailable,
    SortOrder:    i.sortOrder,
    AllowsExtra:  i.allowsExtra,
  })));

  // 4. PortionOptions
  const portId = await createTable('PortionOptions', [
    { name: 'Name',      ...txt   },
    { name: 'PortionId', ...txt   },
    { name: 'Multiplier',...num() },
    { name: 'IsDefault', ...chk   },
    { name: 'SortOrder', ...num(0) },
  ]);
  await insertRecords(portId, seed.portionOptions.map((p: any) => ({
    Name:      p.name,
    PortionId: p.id,
    Multiplier:p.multiplier,
    IsDefault: p.isDefault,
    SortOrder: p.sortOrder,
  })));

  // 5. Presets
  const preId = await createTable('Presets', [
    { name: 'Name',        ...txt   },
    { name: 'PresetId',    ...txt   },
    { name: 'Description', ...long  },
    { name: 'FormatId',    ...txt   },
    { name: 'Ingredients', ...long  },
    { name: 'Image',       ...url_  },
    { name: 'Tags',        ...txt   },
    { name: 'IsActive',    ...chk   },
    { name: 'SortOrder',   ...num(0) },
  ]);
  await insertRecords(preId, seed.presets.map((p: any) => ({
    Name:        p.name,
    PresetId:    p.id,
    Description: p.description,
    FormatId:    p.formatId,
    Ingredients: JSON.stringify(p.ingredients),
    Image:       p.image,
    Tags:        p.tags.join(','),
    IsActive:    p.isActive,
    SortOrder:   p.sortOrder,
  })));

  console.log('\n✅  All 5 tables seeded successfully!\n');
  console.log('👉  Go to Airtable and delete the empty "Table 1" — it\'s the default placeholder.\n');
  console.log('── Table IDs (copy these — you\'ll need them for the Cloudflare Worker) ──');
  console.log(`AIRTABLE_TABLE_FORMATS=${fmtId}`);
  console.log(`AIRTABLE_TABLE_CATEGORIES=${catId}`);
  console.log(`AIRTABLE_TABLE_INGREDIENTS=${ingId}`);
  console.log(`AIRTABLE_TABLE_PORTIONS=${portId}`);
  console.log(`AIRTABLE_TABLE_PRESETS=${preId}`);
}

main().catch(err => {
  console.error('\n❌ ', err.message);
  process.exit(1);
});
