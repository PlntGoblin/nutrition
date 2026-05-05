/**
 * Root component.
 *
 * Phase 0 stub — renders a minimal placeholder so the embed harness shows
 * something is alive. Real composition (FormatSelector, IngredientGrid,
 * TotalsPanel, BottomSheet, etc.) lands in Phase 2 per PRD §9.
 */
import type { JSX } from "preact";

interface AppProps {
  host: HTMLElement;
}

export function App(_props: AppProps): JSX.Element {
  return (
    <div class="nc-root">
      <p class="nc-stub">Nutrition Calculator — Phase 0 scaffold ready.</p>
    </div>
  );
}
