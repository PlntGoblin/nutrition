/**
 * Theme application — reads `data-theme` from the mount node (PRD §10.2)
 * and resolves it through this priority chain:
 *   1. Explicit user choice persisted in localStorage (highest)
 *   2. `data-theme="light"` or `"dark"` attribute on the host
 *   3. `data-theme="auto"` (default) → `prefers-color-scheme`
 *
 * The chosen value is written as `data-theme="dark"` (or absent for light)
 * on the host element, which the CSS variable system in tokens.css picks
 * up to swap palettes.
 *
 * Persistence: localStorage key `nc-theme` with values `"light" | "dark" | "auto"`.
 * Falls back to in-memory state when localStorage is unavailable
 * (private-mode Safari pre-iOS 11 — PRD §17.4).
 */

export type ThemeMode = "light" | "dark" | "auto";

const STORAGE_KEY = "nc-theme";

export function readStoredMode(): ThemeMode | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "auto") return v;
  } catch {
    // localStorage unavailable — return null and let caller fall back.
  }
  return null;
}

export function writeStoredMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage unavailable — silently no-op (PRD §17.4).
  }
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Apply a resolved theme to the host element. Pass "auto" to defer to
 * the OS preference at this moment.
 */
export function applyTheme(host: HTMLElement, mode: ThemeMode): void {
  const resolvedDark = mode === "dark" || (mode === "auto" && systemPrefersDark());
  if (resolvedDark) {
    host.setAttribute("data-theme", "dark");
  } else {
    host.removeAttribute("data-theme");
  }
}

/**
 * Read the host's `data-theme` configuration attribute (light/dark/auto)
 * to seed the initial state. Defaults to "auto" if unset or unknown.
 */
export function readHostMode(host: HTMLElement): ThemeMode {
  const raw = host.dataset.theme;
  if (raw === "light" || raw === "dark") return raw;
  return "auto";
}
