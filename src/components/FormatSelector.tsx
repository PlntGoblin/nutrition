import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { formats, selectedFormatId } from "../lib/store";
import { track } from "../lib/analytics";

interface Props {
  onSelect: (id: string) => void;
}

interface LandingItem {
  label: string;
  formatId: string | null;
  available: boolean;
  representativeCal: number;
  calLabel: string;
}

const LANDING_ITEMS: LandingItem[] = [
  { label: "Cheesesteak",     formatId: "fmt-cheesesteak-reg", available: true, representativeCal: 0,   calLabel: "" },
  { label: "Salad",           formatId: "fmt-salad",           available: true, representativeCal: 0,   calLabel: "" },
  { label: "Chicken Tenders", formatId: "fmt-tenders",         available: true, representativeCal: 800, calLabel: "4 strips" },
  { label: "Fries",           formatId: "fmt-fries",           available: true, representativeCal: 330, calLabel: "regular" },
  { label: "Desserts",        formatId: "fmt-desserts",        available: true, representativeCal: 0,   calLabel: "" },
];

const AVAILABLE = LANDING_ITEMS.filter(i => i.available && i.formatId);
const CYCLE_MS = 8000;

export function FormatSelector({ onSelect }: Props): JSX.Element {
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [cycleIdx,  setCycleIdx]    = useState(0);
  const isHovering  = useRef(false);
  const cycleIdxRef = useRef(0);
  const fmtList     = formats.value;

  // Initialize header to cheesesteak on mount
  useEffect(() => {
    const first = AVAILABLE[0];
    if (first?.formatId) selectedFormatId.value = first.formatId;
  }, []);

  // Auto-advance every CYCLE_MS when not hovering
  useEffect(() => {
    const id = setInterval(() => {
      if (isHovering.current) return;
      const next = (cycleIdxRef.current + 1) % AVAILABLE.length;
      cycleIdxRef.current = next;
      setCycleIdx(next);
      const item = AVAILABLE[next];
      if (item?.formatId) selectedFormatId.value = item.formatId;
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const displayId  = hoveredId ?? AVAILABLE[cycleIdx]?.formatId ?? LANDING_ITEMS[0].formatId;
  const displayFmt = fmtList.find(f => f.id === displayId);

  const handleEnter = (formatId: string | null) => {
    if (!formatId) return;
    isHovering.current = true;
    setHoveredId(formatId);
    selectedFormatId.value = formatId;
  };

  const handleLeave = () => {
    isHovering.current = false;
    setHoveredId(null);
    const item = AVAILABLE[cycleIdxRef.current];
    if (item?.formatId) selectedFormatId.value = item.formatId;
  };

  return (
    <section class="nc-format-section" aria-labelledby="nc-format-eyebrow">
      <p id="nc-format-eyebrow" class="nc-eyebrow">Select Your Meal</p>

      <div class="nc-format-landing">
        {/* Left — curated meal list */}
        <div
          class="nc-format-landing__list"
          role="radiogroup"
          aria-label="Choose your meal"
          onMouseLeave={handleLeave}
        >
          {LANDING_ITEMS.map((item) => {
            const isActive = item.formatId === displayId;
            if (!item.available) {
              return (
                <div
                  key={item.label}
                  class="nc-format-row nc-format-row--soon"
                  aria-disabled="true"
                >
                  <span class="nc-format-row__name">{item.label}</span>
                  <span class="nc-format-row__soon">Coming Soon</span>
                </div>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                role="radio"
                aria-checked={isActive}
                class={`nc-format-row${isActive ? " is-active" : ""}`}
                onMouseEnter={() => handleEnter(item.formatId)}
                onClick={() => {
                  if (!item.formatId) return;
                  track("format_selected", { id: item.formatId, name: item.label });
                  onSelect(item.formatId);
                }}
              >
                <span class="nc-format-row__name">{item.label}</span>
                {item.representativeCal > 0 && (
                  <span class="nc-format-row__cal">
                    {item.representativeCal} cal
                    {item.calLabel && <span class="nc-format-row__cal-sub"> · {item.calLabel}</span>}
                  </span>
                )}
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
