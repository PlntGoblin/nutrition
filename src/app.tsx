/**
 * Root component — Phase 3 layout.
 *
 * Mirrors the structural pattern Chipotle's calculator uses (hero band with
 * eyebrow + giant display title + inline horizontal totals; vertical
 * typographic format list; large category sections below) and adapts it for
 * Forefathers' brand voice — red script-style headers, deep contrast type,
 * generous whitespace.
 *
 * The hero is sticky at the top of the widget so guests always see their
 * live totals as they scroll through the build steps. This replaces the
 * Phase 2 right-rail card.
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
import { DisclaimerFooter } from "./components/DisclaimerFooter";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { BottomSheet } from "./components/BottomSheet";

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
    return <LoadingSkeleton />;
  }

  const sortedCategories = [...categories.value].sort((a, b) => a.step - b.step);

  return (
    <div class="nc-shell">
      {/* Sticky hero — title on the left, live totals on the right. */}
      <header class="nc-hero">
        <div class="nc-hero__inner">
          <div class="nc-hero__copy">
            <p class="nc-eyebrow">Calculate</p>
            <h1 class="nc-hero__title">Nutrition</h1>
            <p class="nc-hero__lede">
              Build your calorie, carb and nutrition information based on your
              selected meal below using the nutrition calculator.
            </p>
            <a
              href="#nc-disclaimer"
              class="nc-hero__allergen-link"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("nc-disclaimer")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Allergen Statement
            </a>
          </div>
          <div class="nc-hero__rail">
            <TotalsPanel variant="hero" />
          </div>
        </div>
      </header>

      <main class="nc-body">
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
                <p class="nc-eyebrow">Step {cat.step}</p>
                <h2 id={`nc-section-${cat.id}-h`} class="nc-section__title">
                  {cat.name}
                </h2>
                {cat.helpText && <p class="nc-section__help">{cat.helpText}</p>}
              </header>
              <IngredientGrid categoryId={cat.id} />
            </section>
          ))}
        </div>

        <div id="nc-disclaimer">
          <DisclaimerFooter />
        </div>
      </main>

      {/* Mobile-only sticky bottom sheet — hidden via CSS on desktop. */}
      <BottomSheet />
    </div>
  );
}
