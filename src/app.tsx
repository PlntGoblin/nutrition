/**
 * Root component — Phase 5 layout.
 *
 * Adds: filter chips, allergen-violation warning, share button, URL-hash
 * round-trip (decode on mount, debounced encode on selection change).
 *
 * Hero structure preserved from Phase 3; format selector + filter chips
 * + stepper + sections layered under it; bottom sheet for mobile.
 */
import type { JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { effect } from "@preact/signals";
import { fetchMenu } from "./lib/api";
import {
  categories,
  isLoading,
  loadError,
  menuData,
  selectedFormatId,
  selections,
  setMenu,
  setFormat,
} from "./lib/store";
import { writeHash, decodeBuild } from "./lib/url-state";
import { AllergenWarning } from "./components/AllergenWarning";
import { BottomSheet } from "./components/BottomSheet";
import { CategoryStepper } from "./components/CategoryStepper";
import { DisclaimerFooter } from "./components/DisclaimerFooter";
import { FilterChips } from "./components/FilterChips";
import { FormatSelector } from "./components/FormatSelector";
import { IngredientGrid } from "./components/IngredientGrid";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { ShareButton } from "./components/ShareButton";
import { TotalsPanel } from "./components/TotalsPanel";

interface AppProps {
  host: HTMLElement;
}

const HASH_DEBOUNCE_MS = 500;

export function App(_props: AppProps): JSX.Element {
  // Track whether we've finished the initial "decode hash" pass; we don't
  // want to write to the hash before that (would erase the incoming state).
  const hasHydrated = useRef(false);

  useEffect(() => {
    isLoading.value = true;
    loadError.value = null;
    fetchMenu()
      .then((data) => {
        setMenu(data);
        // Hydrate from URL hash if present.
        const decoded = decodeBuild(window.location.hash, data);
        if (decoded.formatId) {
          setFormat(decoded.formatId);
        }
        if (Object.keys(decoded.selections).length > 0) {
          selections.value = decoded.selections;
        }
        hasHydrated.current = true;
      })
      .catch((err: unknown) => {
        loadError.value = err instanceof Error ? err : new Error(String(err));
      })
      .finally(() => {
        isLoading.value = false;
      });
  }, []);

  // Debounced URL-hash writes when selections or format change.
  useEffect(() => {
    let timer: number | null = null;
    const dispose = effect(() => {
      // Subscribe to both signals.
      const fmt = selectedFormatId.value;
      const sel = selections.value;
      if (!hasHydrated.current) return;
      if (timer != null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        writeHash({ formatId: fmt, selections: sel });
      }, HASH_DEBOUNCE_MS);
    });
    return () => {
      dispose();
      if (timer != null) window.clearTimeout(timer);
    };
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
      <header class="nc-hero">
        <div class="nc-hero__inner">
          <div class="nc-hero__copy">
            <p class="nc-eyebrow">Calculate</p>
            <h1 class="nc-hero__title">Nutrition</h1>
            <p class="nc-hero__lede">
              Build your calorie, carb and nutrition information based on your
              selected meal below using the nutrition calculator.
            </p>
            <div class="nc-hero__actions">
              <ShareButton />
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
          </div>
          <div class="nc-hero__rail">
            <TotalsPanel variant="hero" />
          </div>
        </div>
      </header>

      <main class="nc-body">
        <FormatSelector />

        <FilterChips />

        <AllergenWarning />

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

      <BottomSheet />
    </div>
  );
}
