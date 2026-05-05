/**
 * Dark-mode toggle.
 *
 * Cycles through Auto → Light → Dark → Auto. The current mode is
 * persisted to localStorage; the resolved palette is reflected on the
 * host element via data-theme.
 *
 * Lives in the disclaimer footer area per PRD §9 Phase 7 task 4.
 */
import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  applyTheme,
  readHostMode,
  readStoredMode,
  systemPrefersDark,
  writeStoredMode,
  type ThemeMode,
} from "../lib/theme";

function resolvedLabel(mode: ThemeMode): string {
  if (mode === "auto") return systemPrefersDark() ? "Dark (auto)" : "Light (auto)";
  return mode === "dark" ? "Dark" : "Light";
}

function nextMode(current: ThemeMode): ThemeMode {
  if (current === "auto") return "light";
  if (current === "light") return "dark";
  return "auto";
}

export function ThemeToggle(): JSX.Element | null {
  const [mode, setMode] = useState<ThemeMode | null>(null);

  // Initial seed: localStorage > host data-theme > "auto".
  useEffect(() => {
    const host = document.querySelector<HTMLElement>("[data-nc-root]");
    if (!host) return;
    const stored = readStoredMode();
    const initial: ThemeMode = stored ?? readHostMode(host);
    setMode(initial);
    applyTheme(host, initial);
  }, []);

  // Re-apply when the OS preference flips while in "auto" mode.
  useEffect(() => {
    if (mode !== "auto" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function update(): void {
      const host = document.querySelector<HTMLElement>("[data-nc-root]");
      if (host) applyTheme(host, "auto");
    }
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [mode]);

  if (mode === null) return null;

  function handleClick(): void {
    const next = nextMode(mode!);
    setMode(next);
    writeStoredMode(next);
    const host = document.querySelector<HTMLElement>("[data-nc-root]");
    if (host) applyTheme(host, next);
  }

  return (
    <button
      type="button"
      class="nc-theme-toggle"
      onClick={handleClick}
      aria-label={`Theme: ${resolvedLabel(mode)}. Click to change.`}
    >
      <span aria-hidden="true">
        {mode === "dark" ? "☾" : mode === "light" ? "☀" : "◐"}
      </span>
      <span>{resolvedLabel(mode)}</span>
    </button>
  );
}
