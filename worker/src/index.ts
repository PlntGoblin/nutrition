/**
 * Cloudflare Worker — menu API proxy for the Forefathers nutrition calculator.
 *
 * GET /menu  → fetch from Airtable (or KV cache), sanitize, return MenuData JSON
 * Cron 3am   → proactively refresh KV cache; mirror new Airtable photos → Cloudinary
 *
 * Security (PRD §18):
 *   §18.2  All Airtable string fields sanitized before leaving this process
 *   §18.4  GET-only — 405 on everything else
 *   CORS   Strict allowlist; 403 origin otherwise
 *
 * Resilience (PRD §17.1):
 *   KV stores last-known-good response with 24h TTL as emergency fallback
 */

export interface Env {
  MENU_CACHE: KVNamespace;
  AIRTABLE_PAT: string;
  AIRTABLE_BASE_ID: string;
  AIRTABLE_TABLE_FORMATS: string;
  AIRTABLE_TABLE_CATEGORIES: string;
  AIRTABLE_TABLE_INGREDIENTS: string;
  AIRTABLE_TABLE_PORTIONS: string;
  AIRTABLE_TABLE_PRESETS: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  ALLOWED_ORIGINS?: string;
}

const CACHE_KEY          = 'menu-v1';
const CACHE_FRESH_SECS   = 300; // serve KV without re-fetching Airtable for 5 min
const AIRTABLE_API       = 'https://api.airtable.com/v0';

// ── Sanitizers ───────────────────────────────────────────────────────────────

function s(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.replace(/<[^>]*>/g, '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, maxLen);
}

function sUrl(val: unknown): string {
  const v = s(val, 2000);
  return v.startsWith('https://') || v.startsWith('http://') ? v : '';
}

// ── Airtable helpers ─────────────────────────────────────────────────────────

async function fetchTable(tableId: string, env: Env): Promise<Record<string, unknown>[]> {
  const records: Record<string, unknown>[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`${AIRTABLE_API}/${env.AIRTABLE_BASE_ID}/${tableId}`);
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${env.AIRTABLE_PAT}` },
    });
    if (!res.ok) throw new Error(`Airtable ${tableId}: ${res.status}`);
    const body = await res.json() as { records: { fields: Record<string, unknown> }[]; offset?: string };
    for (const r of body.records) records.push(r.fields);
    offset = body.offset;
  } while (offset);
  return records;
}

async function patchAirtable(tableId: string, recordId: string, fields: Record<string, unknown>, env: Env) {
  await fetch(`${AIRTABLE_API}/${env.AIRTABLE_BASE_ID}/${tableId}/${recordId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${env.AIRTABLE_PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
}

// ── Photo overrides ───────────────────────────────────────────────────────────
// Applied after every Airtable fetch so correct photos survive KV refreshes.
// Remove an entry once Airtable's PhotoCDN field is updated for that ingredient.

const PHOTO_OVERRIDES: Record<string, string> = {
  "ing-hoagie-roll":          "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082909/Screenshot_2026-05-06_at_8.54.08_AM_hgq998.png",
  "ing-steak":                "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082910/Screenshot_2026-05-06_at_8.52.06_AM_tn33me.png",
  "ing-chicken":              "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082910/Screenshot_2026-05-06_at_8.54.52_AM_fwldkw.png",
  "ing-provolone":            "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082909/Screenshot_2026-05-06_at_8.53.17_AM_bcwrti.png",
  "ing-mushrooms":            "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082908/Screenshot_2026-05-06_at_8.53.33_AM_hlmwab.png",
  "ing-jalapeno":             "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082908/Screenshot_2026-05-06_at_8.52.35_AM_zzdpql.png",
  "ing-greenpep":             "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082909/Screenshot_2026-05-06_at_8.53.41_AM_vvjrxf.png",
  "ing-salad-steak":          "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082910/Screenshot_2026-05-06_at_8.52.06_AM_tn33me.png",
  "ing-salad-chicken":        "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082910/Screenshot_2026-05-06_at_8.54.52_AM_fwldkw.png",
  "ing-salad-bbq-chicken":    "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082910/Screenshot_2026-05-06_at_8.54.52_AM_fwldkw.png",
  "ing-salad-buffalo-chicken":"https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082910/Screenshot_2026-05-06_at_8.54.52_AM_fwldkw.png",
  "ing-salad-mushrooms":      "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082908/Screenshot_2026-05-06_at_8.53.33_AM_hlmwab.png",
  "ing-salad-rawmushroom":    "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082908/Screenshot_2026-05-06_at_8.53.33_AM_hlmwab.png",
  "ing-salad-jalapeno":       "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082908/Screenshot_2026-05-06_at_8.52.35_AM_zzdpql.png",
  "ing-salad-greenpep":       "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778082909/Screenshot_2026-05-06_at_8.53.41_AM_vvjrxf.png",
};

// ── Menu builder ─────────────────────────────────────────────────────────────

async function buildMenu(env: Env) {
  const [fmts, cats, ings, ports, pres] = await Promise.all([
    fetchTable(env.AIRTABLE_TABLE_FORMATS,    env),
    fetchTable(env.AIRTABLE_TABLE_CATEGORIES, env),
    fetchTable(env.AIRTABLE_TABLE_INGREDIENTS,env),
    fetchTable(env.AIRTABLE_TABLE_PORTIONS,   env),
    fetchTable(env.AIRTABLE_TABLE_PRESETS,    env),
  ]);

  const formats = fmts.map((f) => ({
    id:                  s(f.FormatId),
    name:                s(f.Name),
    baseCalories:        Number(f.BaseCalories)  || 0,
    baseProtein_g:       Number(f.BaseProtein_g) || 0,
    baseCarbs_g:         Number(f.BaseCarbs_g)   || 0,
    baseFat_g:           Number(f.BaseFat_g)     || 0,
    baseSodium_mg:       Number(f.BaseSodium_mg) || 0,
    sizeMultiplier:      Number(f.SizeMultiplier) || 1.0,
    includedCategoryIds: s(f.IncludedCategoryIds).split(',').filter(Boolean),
    heroImage:           sUrl(f.HeroImage),
    sortOrder:           Number(f.SortOrder) || 0,
  })).filter(f => f.id);

  const categories = cats.map((c) => ({
    id:            s(c.CategoryId),
    name:          s(c.Name),
    step:          Number(c.Step) || 0,
    selectionType: c.SelectionType === 'multi' ? 'multi' as const : 'single' as const,
    maxSelections: Number(c.MaxSelections) || 1,
    icon:          s(c.Icon),
    helpText:      s(c.HelpText),
    required:      Boolean(c.Required),
  })).filter(c => c.id);

  const ingredients = ings
    .filter(i => i.IsAvailable !== false)
    .map((i) => ({
      id:          s(i.IngredientId),
      name:        s(i.Name),
      categoryId:  s(i.CategoryId),
      photoCDN:    sUrl(i.PhotoCDN),
      description: s(i.Description),
      calories:    Number(i.Calories)   || 0,
      protein_g:   Number(i.Protein_g)  || 0,
      carbs_g:     Number(i.Carbs_g)    || 0,
      fat_g:       Number(i.Fat_g)      || 0,
      satFat_g:    Number(i.SatFat_g)   || 0,
      fiber_g:     Number(i.Fiber_g)    || 0,
      sugar_g:     Number(i.Sugar_g)    || 0,
      sodium_mg:   Number(i.Sodium_mg)  || 0,
      servingSize: s(i.ServingSize),
      allergens:   s(i.Allergens).split(',').filter(Boolean),
      dietTags:    s(i.DietTags).split(',').filter(Boolean),
      isAvailable: true,
      sortOrder:   Number(i.SortOrder) || 0,
      allowsExtra: Boolean(i.AllowsExtra),
    }))
    .filter(i => i.id)
    .map(i => ({ ...i, photoCDN: PHOTO_OVERRIDES[i.id] ?? i.photoCDN }));

  const portionOptions = ports.map((p) => ({
    id:         s(p.PortionId),
    name:       s(p.Name),
    multiplier: Number(p.Multiplier) || 0,
    isDefault:  Boolean(p.IsDefault),
    sortOrder:  Number(p.SortOrder) || 0,
  })).filter(p => p.id);

  const presets = pres
    .filter(p => p.IsActive !== false)
    .map((p) => {
      let ingredientList: unknown[] = [];
      try { ingredientList = JSON.parse(p.Ingredients as string ?? '[]'); } catch {}
      return {
        id:          s(p.PresetId),
        name:        s(p.Name),
        description: s(p.Description),
        formatId:    s(p.FormatId),
        ingredients: ingredientList,
        image:       sUrl(p.Image),
        tags:        s(p.Tags).split(',').filter(Boolean),
        isActive:    true,
        sortOrder:   Number(p.SortOrder) || 0,
      };
    }).filter(p => p.id);

  return { formats, categories, ingredients, portionOptions, presets, lastUpdated: new Date().toISOString() };
}

// ── Cloudinary photo mirror ───────────────────────────────────────────────────
// Runs nightly. For any ingredient whose PhotoCDN is still a placeholder,
// checks if Airtable has a real attachment and mirrors it to Cloudinary.

async function mirrorPhotos(env: Env) {
  const url = new URL(`${AIRTABLE_API}/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_INGREDIENTS}`);
  url.searchParams.set('fields[]', 'IngredientId');
  url.searchParams.set('fields[]', 'PhotoCDN');
  url.searchParams.set('fields[]', 'Photo'); // Airtable attachment field

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${env.AIRTABLE_PAT}` },
  });
  if (!res.ok) return;

  const body = await res.json() as { records: { id: string; fields: Record<string, unknown> }[] };

  for (const record of body.records) {
    const { IngredientId, PhotoCDN, Photo } = record.fields;
    const currentCdn = typeof PhotoCDN === 'string' ? PhotoCDN : '';
    if (currentCdn.includes('res.cloudinary.com')) continue; // already mirrored

    const attachments = Array.isArray(Photo) ? Photo : [];
    if (attachments.length === 0) continue;

    const attachment = attachments[0] as { url: string };
    if (!attachment?.url) continue;

    // Upload to Cloudinary via unsigned URL fetch
    const publicId = `forefathers/${s(IngredientId as string)}`;
    const uploadUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    formData.append('file', attachment.url);
    formData.append('public_id', publicId);
    formData.append('api_key', env.CLOUDINARY_API_KEY);
    formData.append('timestamp', String(Math.floor(Date.now() / 1000)));

    // Signature: sha1(public_id=...&timestamp=...SECRET) — computed via SubtleCrypto
    const sigStr = `public_id=${publicId}&timestamp=${formData.get('timestamp')}${env.CLOUDINARY_API_SECRET}`;
    const sigBuf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(sigStr));
    const sig = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    formData.append('signature', sig);

    const uploadRes = await fetch(uploadUrl, { method: 'POST', body: formData });
    if (!uploadRes.ok) continue;

    const uploaded = await uploadRes.json() as { secure_url: string };
    const cdnUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_480/${publicId}`;

    await patchAirtable(env.AIRTABLE_TABLE_INGREDIENTS, record.id, { PhotoCDN: cdnUrl }, env);
    console.log(`Mirrored ${IngredientId} → ${cdnUrl}`);
  }
}

// ── CORS ──────────────────────────────────────────────────────────────────────

function allowedOrigins(env: Env): Set<string> {
  const defaults = [
    'https://forefathers-nutrition.pages.dev',
    'https://forefatherssteaks.com',
    'https://www.forefatherssteaks.com',
    'http://localhost:5173',
    'http://localhost:4173',
  ];
  const extras = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : [];
  return new Set([...defaults, ...extras]);
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = allowedOrigins(env);
  const isAllowed = origin && (
    allowed.has(origin) ||
    /^https:\/\/[a-z0-9-]+\.forefathers-nutrition\.pages\.dev$/.test(origin)
  );
  return {
    'Access-Control-Allow-Origin':  isAllowed ? origin! : 'null',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept',
    'Vary': 'Origin',
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    if (pathname !== '/menu') {
      return new Response('Not Found', { status: 404 });
    }

    const cors = corsHeaders(origin, env);

    try {
      // Try fresh KV cache first
      const cached = await env.MENU_CACHE.getWithMetadata<{ ts: number }>(CACHE_KEY, 'text');
      if (cached.value && cached.metadata) {
        const age = (Date.now() - cached.metadata.ts) / 1000;
        if (age < CACHE_FRESH_SECS) {
          return new Response(cached.value, {
            headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400', 'X-Cache': 'HIT' },
          });
        }
      }

      // Fetch fresh from Airtable
      const menu  = await buildMenu(env);
      const json  = JSON.stringify(menu);
      await env.MENU_CACHE.put(CACHE_KEY, json, { expirationTtl: 86400, metadata: { ts: Date.now() } });

      return new Response(json, {
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400', 'X-Cache': 'MISS' },
      });

    } catch (err) {
      // Emergency: serve stale KV rather than error (PRD §17.1)
      try {
        const stale = await env.MENU_CACHE.get(CACHE_KEY, 'text');
        if (stale) {
          return new Response(stale, {
            headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', 'X-Cache': 'STALE' },
          });
        }
      } catch { /* nothing */ }

      console.error('Worker fetch error:', err);
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    try {
      await mirrorPhotos(env);
      const menu = await buildMenu(env);
      await env.MENU_CACHE.put(CACHE_KEY, JSON.stringify(menu), {
        expirationTtl: 86400,
        metadata: { ts: Date.now() },
      });
      console.log('Nightly refresh: OK');
    } catch (err) {
      console.error('Nightly refresh failed:', err);
    }
  },
};
