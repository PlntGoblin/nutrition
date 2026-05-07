import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { formats, selectedFormatId } from "../lib/store";
import { track } from "../lib/analytics";

interface Props {
  onSelect: (id: string) => void;
}

interface LandingItem {
  label: string;
  formatId: string;
  available: boolean;
}

const LANDING_ITEMS: LandingItem[] = [
  { label: "Cheesesteak", formatId: "fmt-cheesesteak-reg", available: true },
  { label: "Salad",       formatId: "fmt-salad",           available: true },
  { label: "Sides",       formatId: "fmt-sides",           available: true },
  { label: "Desserts",    formatId: "fmt-desserts",        available: true },
];

const CYCLE_ITEMS = [
  { label: "Cheesesteak", formatId: "fmt-cheesesteak-reg" },
  { label: "Salad",       formatId: "fmt-salad"           },
  { label: "Sides",       formatId: "fmt-sides"           },
  { label: "Desserts",    formatId: "fmt-desserts"        },
];

const CYCLE_MS = 8000;

export function FormatSelector({ onSelect }: Props): JSX.Element {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cycleIdx,  setCycleIdx]  = useState(0);
  const isHovering  = useRef(false);
  const cycleIdxRef = useRef(0);
  const fmtList     = formats.value;

  useEffect(() => {
    selectedFormatId.value = CYCLE_ITEMS[0].formatId;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (isHovering.current) return;
      const next = (cycleIdxRef.current + 1) % CYCLE_ITEMS.length;
      cycleIdxRef.current = next;
      setCycleIdx(next);
      selectedFormatId.value = CYCLE_ITEMS[next].formatId;
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const displayId = hoveredId ?? CYCLE_ITEMS[cycleIdx]?.formatId ?? "fmt-cheesesteak-reg";

  const handleEnter = (formatId: string) => {
    isHovering.current = true;
    setHoveredId(formatId);
    selectedFormatId.value = formatId;
  };

  const handleLeave = () => {
    isHovering.current = false;
    setHoveredId(null);
    selectedFormatId.value = CYCLE_ITEMS[cycleIdxRef.current].formatId;
  };

  return (
    <section class="nc-format-section" aria-labelledby="nc-format-eyebrow">
      <p id="nc-format-eyebrow" class="nc-eyebrow">Select Your Meal</p>

      <div class="nc-format-landing">
        {/* Left — meal list */}
        <div
          class="nc-format-landing__list"
          role="radiogroup"
          aria-label="Choose your meal"
          onMouseLeave={handleLeave}
        >
          {LANDING_ITEMS.map((item) => {
            if (!item.available) {
              return (
                <div key={item.label} class="nc-format-row nc-format-row--soon" aria-disabled="true">
                  <span class="nc-format-row__name">{item.label}</span>
                  <span class="nc-format-row__soon">Coming Soon</span>
                </div>
              );
            }

            const isActive = item.formatId === displayId;
            return (
              <button
                key={item.label}
                type="button"
                role="radio"
                aria-checked={isActive}
                class={`nc-format-row${isActive ? " is-active" : ""}`}
                onMouseEnter={() => handleEnter(item.formatId)}
                onClick={() => {
                  track("format_selected", { id: item.formatId, name: item.label });
                  onSelect(item.formatId);
                }}
              >
                <span class="nc-format-row__name">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right — hover/cycle photo panel */}
        <div class="nc-format-landing__photo" aria-hidden="true">
          <div class="nc-format-landing__img-wrap">
            {fmtList.map(fmt => (
              <img
                key={fmt.id}
                src={fmt.heroImage}
                alt=""
                loading="lazy"
                class={`nc-format-landing__img${displayId === fmt.id ? " is-visible" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
