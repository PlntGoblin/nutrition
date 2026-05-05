/**
 * Root component — composes the Phase 2 builder UI.
 *
 * Layout: format selector + category stepper across the top, scrollable
 * category sections in the main column, totals panel on the right (desktop)
 * stacked below on mobile. The mobile bottom-sheet split lands in Phase 4.
 *
 * Loads menu data on mount via `fetchMenu()` (returns seed JSON in dev,
 * Cloudflare Worker payload in prod).
 */
import type { JSX } from "preact";
import { useEffect } from "preact/hooks";
import { fetchMenu } from "./lib/api";
import {
  categories,
  isLoading,
  loadError,
  menuData,
  setMenu,
} from "./lib/store";
import { CategoryStepper } from "./components/CategoryStepper";
import { FormatSelector } from "./components/FormatSelector";
import { IngredientGrid } from "./components/IngredientGrid";
import { TotalsPanel } from "./components/TotalsPanel";

interface AppProps {
  host: HTMLElement;
}

export function App(_props: AppProps): JSX.Element {
  useEffect(() => {
    isLoading.value = true;
    loadError.value = null;
    fetchMenu()
      .then((data) => setMenu(data))
      .catch((err: unknown) => {
        loadError.value = err instanceof Error ? err : new Error(String(err));
      })
      .finally(() => {
        isLoading.value = false;
      });
  }, []);

  if (loadError.value) {
    return (
      <div class="nc-error">
        <p>We're having trouble loading the menu.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Tap to retry
        </button>
      </div>
    );
  }

  if (!menuData.value) {
    return <div class="nc-loading">Loading menu…</div>;
  }

  const sortedCategories = [...categories.value].sort((a, b) => a.step - b.step);

  return (
    <div class="nc-layout">
      <div class="nc-main">
        <header class="nc-header">
          <h1 class="nc-header__title">Build your cheesesteak</h1>
        </header>
        <FormatSelector />
        <CategoryStepper />

        <div class="nc-sections">
          {sortedCategories.map((cat) => (
            <section
              key={cat.id}
              id={`nc-section-${cat.id}`}
              class="nc-section"
              aria-labelledby={`nc-section-${cat.id}-h`}
            >
              <header class="nc-section__header">
                <h2 id={`nc-section-${cat.id}-h`} class="nc-section__title">
                  Step {cat.step} — {cat.name}
                </h2>
                {cat.helpText && <p class="nc-section__help">{cat.helpText}</p>}
              </header>
              <IngredientGrid categoryId={cat.id} />
            </section>
          ))}
        </div>
      </div>

      <TotalsPanel />
    </div>
  );
}
