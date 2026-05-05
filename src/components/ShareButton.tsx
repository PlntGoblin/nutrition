/**
 * Share button — copies the current URL (with hash-encoded build) to
 * clipboard, with Web Share API on supporting devices and a prompt()
 * fallback when clipboard API is unavailable (PRD §17.4).
 * Phase 0 stub — real implementation in Phase 5 per PRD §9.
 */
import type { JSX } from "preact";

export function ShareButton(): JSX.Element {
  return <button type="button" data-component="ShareButton" />;
}
