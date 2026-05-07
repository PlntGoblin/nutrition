import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { effect } from "@preact/signals";
import { fetchMenu } from "./lib/api";
import {
  categories,
  clearSelections,
  formats,
  isLoading,
  loadError,
  menuData,
  selectedFormatId,
  selections,
  setFormat,
  setMenu,
} from "./lib/store";
import { writeHash, decodeBuild } from "./lib/url-state";
import { AllergenWarning } from "./components/AllergenWarning";
import { BottomSheet } from "./components/BottomSheet";
import { DisclaimerFooter } from "./components/DisclaimerFooter";
import { FormatSelector } from "./components/FormatSelector";
import { IngredientGrid } from "./components/IngredientGrid";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { NutritionPrefsModal } from "./components/NutritionPrefsModal";
import { PresetGallery } from "./components/PresetGallery";
import { ShareButton } from "./components/ShareButton";
import { SizePicker } from "./components/SizePicker";
import { TotalsPanel } from "./components/TotalsPanel";

interface AppProps { host: HTMLElement; }

const HASH_DEBOUNCE_MS = 500;

export function App(_props: AppProps): JSX.Element {
  const hasHydrated   = useRef(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [prefsOpen,   setPrefsOpen]   = useState(false);

  const openBuilder = (formatId?: string) => {
    if (formatId) setFormat(formatId);
    clearSelections();
    setBuilderOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeBuilder = () => {
    setBuilderOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  useEffect(() => {
    isLoading.value = true;
    loadError.value = null;
    fetchMenu()
      .then((data) => {
        setMenu(data);
        const decoded = decodeBuild(window.location.hash, data);
        if (decoded.formatId) {
          setFormat(decoded.formatId);
          if (Object.keys(decoded.selections).length > 0) {
            selections.value = decoded.selections;
            setBuilderOpen(true);
          }
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

  useEffect(() => {
    let timer: number | null = null;
    const dispose = effect(() => {
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
        <button type="button" onClick={() => window.location.reload()}>Tap to retry</button>
      </div>
    );
  }

  if (!menuData.value) return <LoadingSkeleton />;

  // ── Builder view ──────────────────────────────────────────────────────────
  if (builderOpen) {
    const fmt = formats.value.find(f => f.id === selectedFormatId.value);
    const included = new Set(fmt?.includedCategoryIds ?? []);
    const sortedCats = [...categories.value]
      .filter(cat => included.has(cat.id))
      .sort((a, b) => a.step - b.step);

    return (
      <div class="nc-shell">
        <header class="nc-hero">
          <div class="nc-hero__inner">
            <div class="nc-hero__copy">
              <button type="button" class="nc-back-btn" onClick={closeBuilder}>
                ← All Meals
              </button>
              <h1 class="nc-hero__title">{fmt?.name ?? "Your Build"}</h1>
              <div class="nc-hero__actions">
                <ShareButton />
                <a
                  href="#nc-disclaimer"
                  class="nc-hero__allergen-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("nc-disclaimer")?.scrollIntoView({ behavior: "smooth" });
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
          <AllergenWarning />

          <div class="nc-body-tools">
            <button
              type="button"
              class="nc-prefs-trigger"
              onClick={() => setPrefsOpen(true)}
            >
              Nutrition Preferences
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="nc-sections">
            <SizePicker />
            {sortedCats.map((cat) => (
              <section
                key={cat.id}
                id={`nc-section-${cat.id}`}
                class="nc-section"
                aria-labelledby={`nc-section-${cat.id}-h`}
              >
                <header class="nc-section__header">
                  <p class="nc-eyebrow">Step {cat.step}</p>
                  <h2 id={`nc-section-${cat.id}-h`} class="nc-section__title">{cat.name}</h2>
                  {cat.helpText && <p class="nc-section__help">{cat.helpText}</p>}
                </header>
                <IngredientGrid categoryId={cat.id} />
              </section>
            ))}
          </div>

          <div id="nc-disclaimer"><DisclaimerFooter /></div>
        </main>

        <BottomSheet />
        <NutritionPrefsModal isOpen={prefsOpen} onClose={() => setPrefsOpen(false)} />
      </div>
    );
  }

  // ── Landing view ──────────────────────────────────────────────────────────
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
            <a
              href="#nc-disclaimer"
              class="nc-hero__allergen-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("nc-disclaimer")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Allergen Statement
            </a>
          </div>
          <div class="nc-hero__rail">
            <TotalsPanel variant="hero" animationDuration={0} />
          </div>
        </div>
      </header>

      <main class="nc-body">
        <FormatSelector onSelect={(id) => openBuilder(id)} />
        <div id="nc-disclaimer"><DisclaimerFooter /></div>
      </main>
    </div>
  );
}
