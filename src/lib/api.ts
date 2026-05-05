/**
 * Menu data fetch — single function `fetchMenu()` returning the full menu
 * payload the widget needs to render.
 *
 * Two modes:
 *   - Dev / `VITE_API_URL` unset → returns the local `data/seed-ingredients.json`
 *     directly (no network, instant response).
 *   - Production → `GET ${VITE_API_URL}/menu`. The Cloudflare Worker is
 *     responsible for sanitization, last-known-good caching (PRD §17.1),
 *     and CORS — see `worker/src/index.ts`.
 *
 * Phase 1 scope: dual-mode dispatch only. The retry-banner / fallback UX
 * (PRD §17.5) wires up in Phase 8 once we have a real Worker to talk to.
 */
import seedJson from "../../data/seed-ingredients.json";
import type { MenuData } from "../types";

const apiUrl = import.meta.env.VITE_API_URL?.trim();

export async function fetchMenu(): Promise<MenuData> {
  if (!apiUrl) {
    return seedJson as unknown as MenuData;
  }
  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/menu`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Menu fetch failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as MenuData;
  return json;
}

export function isUsingSeedData(): boolean {
  return !apiUrl;
}
