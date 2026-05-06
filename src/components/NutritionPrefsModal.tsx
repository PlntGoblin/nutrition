import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { AllergenTag, DietTag } from "../types";
import { activeFilters, setAllergenExclusions, setDietFilters } from "../lib/store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface PrefChip {
  id: string;
  label: string;
  type: "diet" | "allergen";
  diets?: DietTag[];
  allergens?: AllergenTag[];
}

interface PrefGroup {
  icon: string;
  iconBg: string;
  label: string;
  warning?: string;
  chips: PrefChip[];
}

const GROUPS: PrefGroup[] = [
  {
    icon: "V",
    iconBg: "#2A9D55",
    label: "Plant Based",
    chips: [
      { id: "vegetarian", label: "Vegetarian", type: "diet", diets: ["vegetarian"] },
      { id: "vegan",      label: "Vegan",       type: "diet", diets: ["vegan"]       },
    ],
  },
  {
    icon: "L",
    iconBg: "#6B6B6B",
    label: "Lifestyle",
    chips: [
      { id: "highprotein", label: "High Protein", type: "diet", diets: ["highprotein"] },
      { id: "keto",        label: "Keto",          type: "diet", diets: ["keto"]         },
      { id: "lowcarb",     label: "Low Carb",      type: "diet", diets: ["lowcarb"]      },
    ],
  },
  {
    icon: "!",
    iconBg: "#C8102E",
    label: "I'm Avoiding",
    warning: "Tagged items will be flagged in your build.",
    chips: [
      { id: "no-gluten", label: "Gluten", type: "allergen", allergens: ["gluten"]              },
      { id: "no-dairy",  label: "Dairy",  type: "allergen", allergens: ["dairy"]               },
      { id: "no-eggs",   label: "Eggs",   type: "allergen", allergens: ["eggs"]                },
      { id: "no-soy",    label: "Soy",    type: "allergen", allergens: ["soy"]                 },
      { id: "no-nuts",   label: "Nuts",   type: "allergen", allergens: ["peanuts", "treenuts"] },
      { id: "no-sesame", label: "Sesame", type: "allergen", allergens: ["sesame"]              },
    ],
  },
];

export function NutritionPrefsModal({ isOpen, onClose }: Props): JSX.Element | null {
  const [pendingDiets, setPendingDiets] = useState<DietTag[]>([]);
  const [pendingAllergens, setPendingAllergens] = useState<AllergenTag[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPendingDiets([...activeFilters.value.diets]);
      setPendingAllergens([...activeFilters.value.excludeAllergens]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function toggleDiet(diets: DietTag[]) {
    const allActive = diets.every(d => pendingDiets.includes(d));
    setPendingDiets(prev =>
      allActive ? prev.filter(d => !diets.includes(d)) : [...new Set([...prev, ...diets])]
    );
  }

  function toggleAllergen(allergens: AllergenTag[]) {
    const allActive = allergens.every(a => pendingAllergens.includes(a));
    setPendingAllergens(prev =>
      allActive ? prev.filter(a => !allergens.includes(a)) : [...new Set([...prev, ...allergens])]
    );
  }

  function apply() {
    setDietFilters(pendingDiets);
    setAllergenExclusions(pendingAllergens);
    onClose();
  }

  return (
    <div
      class="nc-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div class="nc-modal" role="dialog" aria-modal="true" aria-labelledby="nc-modal-title">
        <div class="nc-modal__header">
          <span class="nc-modal__title" id="nc-modal-title">Nutrition Preferences</span>
          <button type="button" class="nc-modal__close" aria-label="Close" onClick={onClose}>×</button>
        </div>

        <div class="nc-modal__body">
          {GROUPS.map(group => (
            <div key={group.label} class="nc-pref-group">
              <div class="nc-pref-group__head">
                <span class="nc-pref-group__icon" style={`background:${group.iconBg}`}>
                  {group.icon}
                </span>
                <span class="nc-pref-group__label">{group.label}</span>
              </div>
              {group.warning && (
                <p class="nc-pref-group__warning">{group.warning}</p>
              )}
              <div class="nc-pref-chips">
                {group.chips.map(chip => {
                  const isActive = chip.type === "diet"
                    ? chip.diets!.every(d => pendingDiets.includes(d))
                    : chip.allergens!.every(a => pendingAllergens.includes(a));
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      class={`nc-pref-chip${isActive ? " is-active" : ""}`}
                      aria-pressed={isActive}
                      onClick={() =>
                        chip.type === "diet"
                          ? toggleDiet(chip.diets!)
                          : toggleAllergen(chip.allergens!)
                      }
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div class="nc-modal__footer">
          <button type="button" class="nc-modal__apply" onClick={apply}>Apply</button>
        </div>
      </div>
    </div>
  );
}
