# Forefathers Steaks — Nutrition Calculator

An embeddable, build-your-own nutrition calculator widget for
[Forefathers Steaks](https://www.forefatherssteaks.com/), built per
[`../PRD.md`](../PRD.md) (v2.0).

## Stack

- **Preact 10 + @preact/signals** — ~10 KB framework, fine-grained reactivity
- **Tailwind CSS v4** — CSS-first config via `@theme` in `src/styles/tokens.css`
- **Motion** (motion.dev) — spring-physics animated counters and macro ring
- **Vite 6** — single ESM bundle output to `dist/calculator.js` + `dist/calculator.css`
- **Vitest** — unit tests; **Playwright** — E2E (browsers installed in Phase 8)
- **Cloudflare Worker + KV** — Airtable proxy with last-known-good cache
- **Cloudinary free tier** — mandatory image mirror (PRD §6.5)
- **Cloudflare Web Analytics** — cookieless events ($0/mo, replaces Plausible)

> **Total recurring cost target: $0/month** at the scale of a single steakhouse.

## Quick start

```bash
npm install
npm run dev          # → http://localhost:5173/public/embed.html
npm run build        # → dist/calculator.js + dist/calculator.css
npm test             # vitest
npm run typecheck    # tsc --noEmit
```

## Embedding (production)

The 3-line snippet pasted into PopMenu's Custom HTML block (PRD §10.1):

```html
<link rel="stylesheet" href="https://cdn.[yourdomain].com/calculator.css">
<div id="nutrition-calculator" data-theme="auto"></div>
<script src="https://cdn.[yourdomain].com/calculator.js" defer></script>
```

Configurable via `data-*` attributes on the mount div — see PRD §10.2.

## Project layout

See `../PRD.md` §7 for the canonical file structure. Major directories:

- `src/` — widget source (components, lib, styles, types)
- `data/` — seed JSON + human-readable Airtable schema
- `worker/` — Cloudflare Worker (Airtable proxy)
- `scripts/` — seed/build/deploy/Cloudinary-mirror scripts
- `tests/` — Vitest unit tests + Playwright E2E

## Build phases

This project is built in eight phases (plus a 8.5 polish buffer) per PRD §9.
Status:

- [x] **Phase 0** — Setup & scaffolding
- [x] **Phase 1** — Data layer & seed data
- [ ] Phase 2 — Core builder UI
- [ ] Phase 3 — Visual polish & theming
- [ ] Phase 4 — Mobile UX (bottom sheet)
- [ ] Phase 5 — Filters, allergens, share URL
- [ ] Phase 6 — Cloudflare Worker + Airtable + Cloudinary mirror
- [ ] Phase 7 — Premium features (P1)
- [ ] Phase 8 — Performance + accessibility + final polish
- [ ] Phase 8.5 — Bug fix, polish & stakeholder sign-off

## Decisions log

See [`DECISIONS.md`](./DECISIONS.md) for every non-obvious architectural choice.

## Manager guide

See [`ADMIN_GUIDE.md`](./ADMIN_GUIDE.md) for how to update ingredients without
calling engineering.
