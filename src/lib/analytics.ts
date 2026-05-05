/**
 * Cookieless analytics wrapper.
 *
 * Default provider: Cloudflare Web Analytics (free; replaces Plausible per
 * DECISIONS.md). The widget calls `track(event, props?)` from interaction
 * sites; this module decides whether/where to send.
 *
 * Per PRD §9 Phase 7 task 5, every event is tied to a specific decision it
 * informs. The list below is the authoritative event vocabulary — adding
 * a new event without a corresponding decision is a smell.
 *
 *   format_selected     → which format is most popular? Reorder selector.
 *   ingredient_added    → which ingredients are most popular? Promote in
 *                         Popular Builds + seasonal R&D.
 *   ingredient_removed  → which selected items are most often removed?
 *                         Indicates default-portion mismatch.
 *   filter_applied      → which dietary needs are most common? Inform
 *                         menu development for that audience.
 *   share_clicked       → are people actually sharing builds?
 *                         Validates the feature.
 *   preset_loaded       → which presets get the most use? Inform the
 *                         chef which builds to feature.
 *   build_completed     → drop-off vs. completion rate; flow optimization.
 *
 * No PII, no individual user tracking. Events fire-and-forget; no
 * promises, no callbacks — analytics never blocks the UI.
 */

export type AnalyticsEvent =
  | "format_selected"
  | "ingredient_added"
  | "ingredient_removed"
  | "filter_applied"
  | "share_clicked"
  | "preset_loaded"
  | "build_completed";

interface CFAnalytics {
  beam: (event: string, props?: Record<string, string | number | boolean>) => void;
}

declare global {
  interface Window {
    cfa?: CFAnalytics;
  }
}

export function track(
  event: AnalyticsEvent,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  try {
    // Cloudflare Web Analytics exposes window.cfa.beam when the embed
    // script is present on the host page. If absent, this is a silent
    // no-op — analytics is never required for the widget to work.
    window.cfa?.beam(event, props);
  } catch {
    // Never let analytics errors surface to users.
  }
}
