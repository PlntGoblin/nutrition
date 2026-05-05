/**
 * Cookieless analytics wrapper.
 *
 * DECISION (see DECISIONS.md): using Cloudflare Web Analytics in place of
 * Plausible to keep the stack at $0/month for the small-business client.
 * The event API surface is identical from this module's caller perspective;
 * the swap is internal to this file.
 *
 * Each event is tied to a specific decision it informs, per PRD §9 Phase 7
 * task 5 — no analytics-for-the-sake-of-analytics.
 *
 * Phase 0 stub — real implementation in Phase 7.
 */

export {};
