/**
 * Slider primitive — used by PortionStepper for None/Light/Regular/Extra.
 * Phase 0 stub.
 */
import type { JSX } from "preact";

export function Slider(props: JSX.HTMLAttributes<HTMLInputElement>): JSX.Element {
  return <input type="range" {...props} />;
}
