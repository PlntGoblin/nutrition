/**
 * Widget entry point.
 *
 * Mounts the Preact app into a host element matching `#nutrition-calculator`
 * (the mount node specified in the 3-line embed snippet — PRD §10.1).
 * Reads `data-*` configuration attributes from the mount node per §10.2.
 *
 * No side effects beyond mounting. If the mount node is missing, we log a
 * single warning and exit silently — the host page is allowed to load this
 * script without the mount div present (e.g., on pages where the calculator
 * is not embedded).
 */
import { render } from "preact";
import { App } from "./app";
import "./styles/base.css";

const MOUNT_SELECTOR = "#nutrition-calculator";

function mount(): void {
  const host = document.querySelector<HTMLElement>(MOUNT_SELECTOR);
  if (!host) {
    console.warn(
      `[nutrition-calculator] No element matching ${MOUNT_SELECTOR}; widget will not mount.`,
    );
    return;
  }
  host.setAttribute("data-nc-root", "");
  render(<App host={host} />, host);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
