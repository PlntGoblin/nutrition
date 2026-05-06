import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { formats, selectedFormatId } from "../lib/store";
import { track } from "../lib/analytics";

interface Props {
  onSelect: (id: string) => void;
}

interface SubItem {
  label: string;
  formatId: string;
  representativeCal: number;
  calLabel: string;
}

interface LandingItem {
  label: string;
  formatId: string | null;
  available: boolean;
  representativeCal: number;
  calLabel: string;
  subItems?: SubItem[];
  cycleFormatId?: string; // photo shown when this group is active in the cycle
}

const LANDING_ITEMS: LandingItem[] = [
  { label: "Cheesesteak", formatId: "fmt-cheesesteak-reg", available: true, representativeCal: 0, calLabel: "" },
  { label: "Salad",       formatId: "fmt-salad",           available: true, representativeCal: 0, calLabel: "" },
  {
    label: "Sides",
    formatId: null,
    available: true,
    representativeCal: 0,
    calLabel: "",
    cycleFormatId: "fmt-tenders",
    subItems: [
      { label: "Chicken Tenders",   formatId: "fmt-tenders",         representativeCal: 800, calLabel: "4 strips" },
      { label: "Fries",             formatId: "fmt-fries",           representativeCal: 330, calLabel: "regular"  },
      { label: "Sweet Potato Fries",formatId: "fmt-sweet-potato-fries", representativeCal: 340, calLabel: "regular" },
      { label: "50/50 Fries",       formatId: "fmt-5050-fries",      representativeCal: 335, calLabel: "regular"  },
    ],
  },
  { label: "Desserts", formatId: "fmt-desserts", available: true, representativeCal: 0, calLabel: "" },
];

// Flat list used for the auto-cycling hero image — groups contribute their cycleFormatId
const CYCLE_ITEMS = LANDING_ITEMS
  .filter(i => i.available && (i.formatId || i.cycleFormatId))
  .map(i => ({ label: i.label, formatId: (i.formatId ?? i.cycleFormatId)! }));

const CYCLE_MS = 8000;

export function FormatSelector({ onSelect }: Props): JSX.Element {
  const [hoveredId,   setHoveredId]   = useState<string | null>(null);
  const [cycleIdx,    setCycleIdx]    = useState(0);
  const [sidesOpen,   setSidesOpen]   = useState(false);
  const isHovering  = useRef(false);
  const cycleIdxRef = useRef(0);
  const fmtList     = formats.value;

  // Initialise hero to cheesesteak on mount
  useEffect(() => {
    const first = CYCLE_ITEMS[0];
    if (first?.formatId) selectedFormatId.value = first.formatId;
  }, []);

  // Auto-advance hero image while not hovering
  useEffect(() => {
    const id = setInterval(() => {
      if (isHovering.current) return;
      const next = (cycleIdxRef.current + 1) % CYCLE_ITEMS.length;
      cycleIdxRef.current = next;
      setCycleIdx(next);
      const item = CYCLE_ITEMS[next];
      if (item?.formatId) selectedFormatId.value = item.formatId;
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
    const item = CYCLE_ITEMS[cycleIdxRef.current];
    if (item?.formatId) selectedFormatId.value = item.formatId;
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
            // ── Unavailable item ──────────────────────────────────────────
            if (!item.available) {
              return (
                <div key={item.label} class="nc-format-row nc-format-row--soon" aria-disabled="true">
                  <span class="nc-format-row__name">{item.label}</span>
                  <span class="nc-format-row__soon">Coming Soon</span>
                </div>
              );
            }

            // ── Group item (Sides) ────────────────────────────────────────
            if (item.subItems) {
              const groupActive = item.subItems.some(s => s.formatId === displayId);
              return (
                <div key={item.label} class="nc-format-group">
                  <button
                    type="button"
                    class={`nc-format-row nc-format-row--group${groupActive ? " is-active" : ""}`}
                    aria-expanded={sidesOpen}
                    onMouseEnter={() => handleEnter(item.cycleFormatId!)}
                    onClick={() => setSidesOpen(o => !o)}
                  >
                    <span class="nc-format-row__name">{item.label}</span>
                    <span class={`nc-format-row__chevron${sidesOpen ? " is-open" : ""}`} aria-hidden="true">›</span>
                  </button>

                  <div class={`nc-format-sublist${sidesOpen ? " is-open" : ""}`} aria-hidden={!sidesOpen}>
                    <div class="nc-format-sublist__inner">
                      {item.subItems.map(sub => {
                        const isActive = sub.formatId === displayId;
                        return (
                          <button
                            key={sub.label}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            class={`nc-format-row nc-format-row--sub${isActive ? " is-active" : ""}`}
                            onMouseEnter={() => handleEnter(sub.formatId)}
                            onClick={() => {
                              track("format_selected", { id: sub.formatId, name: sub.label });
                              onSelect(sub.formatId);
                            }}
                          >
                            <span class="nc-format-row__name">{sub.label}</span>
                            {sub.representativeCal > 0 && (
                              <span class="nc-format-row__cal">
                                {sub.representativeCal} cal
                                {sub.calLabel && <span class="nc-format-row__cal-sub"> · {sub.calLabel}</span>}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // ── Regular item ─────────────────────────────────────────────
            const isActive = item.formatId === displayId;
            return (
              <button
                key={item.label}
                type="button"
                role="radio"
                aria-checked={isActive}
                class={`nc-format-row${isActive ? " is-active" : ""}`}
                onMouseEnter={() => handleEnter(item.formatId!)}
                onClick={() => {
                  track("format_selected", { id: item.formatId!, name: item.label });
                  onSelect(item.formatId!);
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
