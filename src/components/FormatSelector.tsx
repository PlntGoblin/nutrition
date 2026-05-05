/**
 * Format selector — vertical typographic list (Chipotle-style).
 * Each row is a big display-style headline with the format name + base
 * calorie count. Selected row gets a brand-color underline.
 *
 * For Forefathers: Cheesesteak (Regular), Cheesesteak (Large), Low Carb Bowl.
 */
import type { JSX } from "preact";
import { formats, selectedFormatId, setFormat } from "../lib/store";
import { track } from "../lib/analytics";

export function FormatSelector(): JSX.Element {
  const list = formats.value;
  const activeId = selectedFormatId.value;

  return (
    <section class="nc-format-section" aria-labelledby="nc-format-eyebrow">
      <p id="nc-format-eyebrow" class="nc-eyebrow">Select your meal</p>
      <div
        class="nc-format-list"
        role="radiogroup"
        aria-label="Choose your format"
      >
        {list.map((fmt) => {
          const isActive = fmt.id === activeId;
          return (
            <button
              key={fmt.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => {
                setFormat(fmt.id);
                track("format_selected", { id: fmt.id, name: fmt.name });
              }}
              class={`nc-format-row${isActive ? " is-active" : ""}`}
            >
              <span class="nc-format-row__name">{fmt.name}</span>
              <span class="nc-format-row__cal">{fmt.baseCalories} cal base</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
