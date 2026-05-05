/**
 * Tailwind v4 uses CSS-first configuration via `@theme` blocks in the CSS
 * itself (see `src/styles/tokens.css`). This file exists per PRD §7's required
 * file layout and to provide a fallback content-scan path for editor tooling
 * that still expects a JS/TS Tailwind config. See DECISIONS.md for the v4
 * migration note.
 */
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{ts,tsx,html}",
    "./public/**/*.html",
  ],
} satisfies Config;
