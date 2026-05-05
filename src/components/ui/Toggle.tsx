/**
 * Toggle primitive — used by FilterChips and the dark-mode switch.
 * Phase 0 stub.
 */
import type { JSX } from "preact";

export function Toggle(props: JSX.HTMLAttributes<HTMLButtonElement>): JSX.Element {
  return <button type="button" role="switch" {...props} />;
}
