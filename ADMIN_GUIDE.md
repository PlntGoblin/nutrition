# Manager Guide — Forefathers Steaks Nutrition Calculator

> Phase 0 stub. The full guide (with screenshots) lands in Phase 8 per
> PRD §9. Until then, this file is a placeholder so downstream phases can
> link to it without 404s.

## What this document covers (when complete)

1. How to log into the Airtable base
2. How to add or edit an ingredient (name, calories, allergens, photo)
3. How to mark an ingredient as 86'd (`IsAvailable` checkbox)
4. How to publish a new Popular Build
5. How long changes take to appear on the live site (cache TTL: 5–10 min)
6. Who to call if something looks wrong on the live calculator

## Important: allergen accuracy is a health-risk issue

Per PRD §18.7, only the client and a designated reviewer mark allergens.
Engineering does NOT edit allergen tags. The disclaimer footer on the live
calculator surfaces the `LastUpdated` date for each ingredient so guests know
how fresh the information is.
