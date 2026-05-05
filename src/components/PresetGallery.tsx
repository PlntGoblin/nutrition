/**
 * Popular Builds gallery — renders the active PresetBowls as inviting
 * starting-point cards (PRD §4.2 #16). Tapping a preset pre-fills the
 * entire build (format + ingredients with their stored multipliers).
 *
 * Visibility: only shown when the user has zero current selections —
 * i.e., the empty state. As soon as they tap any ingredient, the gallery
 * collapses.
 */
import type { JSX } from "preact";
import {
  presets,
  selectionCount,
  selections,
  setFormat,
} from "../lib/store";
import type { PresetBowl, Selection } from "../types";

function applyPreset(preset: PresetBowl): void {
  setFormat(preset.formatId);
  const next: Record<string, Selection> = {};
  for (const item of preset.ingredients) {
    next[item.ingredientId] = {
      ingredientId: item.ingredientId,
      portionMultiplier: item.portionMultiplier,
    };
  }
  selections.value = next;
}

export function PresetGallery(): JSX.Element | null {
  if (selectionCount.value > 0) return null;

  const list = presets.value
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (list.length === 0) return null;

  return (
    <section class="nc-presets" aria-labelledby="nc-presets-eyebrow">
      <header class="nc-presets__head">
        <p id="nc-presets-eyebrow" class="nc-eyebrow">Popular builds</p>
        <h2 class="nc-presets__title">Start with a chef pick</h2>
        <p class="nc-presets__lede">
          Tap one to pre-fill your build. You can customize from there.
        </p>
      </header>
      <div class="nc-presets__grid" role="list">
        {list.map((preset) => (
          <button
            key={preset.id}
            type="button"
            class="nc-preset-card"
            role="listitem"
            onClick={() => applyPreset(preset)}
          >
            <div class="nc-preset-card__photo">
              <img
                src={preset.image}
                alt=""
                loading="lazy"
                width={400}
                height={300}
              />
            </div>
            <div class="nc-preset-card__body">
              <h3 class="nc-preset-card__name">{preset.name}</h3>
              <p class="nc-preset-card__desc">{preset.description}</p>
              {preset.tags.length > 0 && (
                <ul class="nc-preset-card__tags">
                  {preset.tags.slice(0, 3).map((tag) => (
                    <li key={tag} class="nc-preset-card__tag">
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
