/**
 * Format selector — horizontal row of meal-format cards.
 * For Forefathers: Cheesesteak Regular, Cheesesteak Large, Low Carb Bowl.
 *
 * Phase 2: functional + minimal styling. Visual polish lands in Phase 3.
 */
import type { JSX } from "preact";
import { formats, selectedFormatId, setFormat } from "../lib/store";

export function FormatSelector(): JSX.Element {
  const list = formats.value;
  const activeId = selectedFormatId.value;

  return (
    <div class="nc-format-selector" role="radiogroup" aria-label="Choose your format">
      {list.map((fmt) => {
        const isActive = fmt.id === activeId;
        return (
          <button
            key={fmt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setFormat(fmt.id)}
            class={`nc-format-card${isActive ? " is-active" : ""}`}
          >
            <span class="nc-format-card__name">{fmt.name}</span>
            <span class="nc-format-card__cal">{fmt.baseCalories} cal base</span>
          </button>
        );
      })}
    </div>
  );
}
