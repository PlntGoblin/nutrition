/**
 * One-time bulk insert: pushes the contents of `data/seed-ingredients.json`
 * into the client's Airtable base via the Airtable REST API.
 *
 * Run once after Airtable schema is created in Phase 6. Idempotent — safe to
 * re-run; uses ingredient `Name` as the upsert key.
 *
 * Phase 0 stub.
 */

export {};
