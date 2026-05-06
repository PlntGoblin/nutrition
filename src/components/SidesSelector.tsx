import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { formats, selectedFormatId } from "../lib/store";
import { track } from "../lib/analytics";

interface Props {
  onSelect: (id: string) => void;
  onBack: () => void;
}

const SIDES_ITEMS = [
  { label: "Chicken Tenders",    formatId: "fmt-tenders",            representativeCal: 800, calLabel: "4 strips" },
  { label: "Fries",              formatId: "fmt-fries",              representativeCal: 330, calLabel: "regular"  },
  { label: "Sweet Potato Fries", formatId: "fmt-sweet-potato-fries", representativeCal: 340, calLabel: "regular"  },
  { label: "50/50 Fries",        formatId: "fmt-5050-fries",         representativeCal: 335, calLabel: "regular"  },
];

const CYCLE_MS = 8000;

export function SidesSelector({ onSelect, onBack }: Props): JSX.Element {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cycleIdx,  setCycleIdx]  = useState(0);
  const isHovering  = useRef(false);
  const cycleIdxRef = useRef(0);
  const fmtList     = formats.value;

  useEffect(() => {
    selectedFormatId.value = SIDES_ITEMS[0].formatId;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (isHovering.current) return;
      const next = (cycleIdxRef.current + 1) % SIDES_ITEMS.length;
      cycleIdxRef.current = next;
      setCycleIdx(next);
      selectedFormatId.value = SIDES_ITEMS[next].formatId;
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const displayId = hoveredId ?? SIDES_ITEMS[cycleIdx]?.formatId;

  const handleEnter = (formatId: string) => {
    isHovering.current = true;
    setHoveredId(formatId);
    selectedFormatId.value = formatId;
  };

  const handleLeave = () => {
    isHovering.current = false;
    setHoveredId(null);
    selectedFormatId.value = SIDES_ITEMS[cycleIdxRef.current].formatId;
  };

  return (
    <section class="nc-format-section" aria-labelledby="nc-sides-eyebrow">
      <p id="nc-sides-eyebrow" class="nc-eyebrow">Select Your Side</p>

      <div class="nc-format-landing">
        {/* Left — sides list */}
        <div
          class="nc-format-landing__list"
          role="radiogroup"
          aria-label="Choose your side"
          onMouseLeave={handleLeave}
        >
          {SIDES_ITEMS.map((item) => {
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
