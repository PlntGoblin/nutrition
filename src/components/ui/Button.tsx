/**
 * Button primitive — shadcn-style, theme-token-driven.
 * Phase 0 stub — fleshed out in Phase 3 per PRD §9.
 */
import type { JSX } from "preact";

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>): JSX.Element {
  return <button type="button" {...props} />;
}
