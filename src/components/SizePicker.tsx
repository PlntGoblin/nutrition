import type { JSX } from "preact";
import { selectedFormatId, setFormat } from "../lib/store";
import { track } from "../lib/analytics";

const CHEESESTEAK_SIZES = [
  { label: "Mini",    desc: "0.6× regular", id: "fmt-cheesesteak-mini", initial: "M", bg: "#6B6B6B", photo: "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778041490/5bc3ae18-2d2e-4d63-afae-28488ff9bed2_bhbn47.webp" },
  { label: "Regular", desc: "Regular",      id: "fmt-cheesesteak-reg",  initial: "R", bg: "#C8102E", photo: "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778040860/f1194b73-e385-4bcb-b9b8-732a8720aa73_eoxt1x.webp" },
  { label: "Large",   desc: "1.5× regular", id: "fmt-cheesesteak-lg",   initial: "L", bg: "#4A4A4A", photo: "https://res.cloudinary.com/dtvcknkm6/image/upload/v1778041491/9771bd8f-739f-47d1-95ff-edd086da59bd_bnewdy.webp" },
] as const;

const SALAD_SIZES = [
  { label: "Half",  desc: "", id: "fmt-salad-half",  initial: "½", bg: "#2A7A40" },
  { label: "Whole", desc: "", id: "fmt-salad",       initial: "W", bg: "#2A7A40" },
] as const;

const ALL_SIZES = [...CHEESESTEAK_SIZES, ...SALAD_SIZES];
const SIZE_IDS  = new Set(ALL_SIZES.map(s => s.id));

export function SizePicker(): JSX.Element | null {
  const fmtId = selectedFormatId.value;
  if (!fmtId || !SIZE_IDS.has(fmtId)) return null;

  const isCheeseteak = CHEESESTEAK_SIZES.some(s => s.id === fmtId);
  const sizes = isCheeseteak ? CHEESESTEAK_SIZES : SALAD_SIZES;

  return (
    <section class="nc-section" aria-labelledby="nc-size-title">
      <header class="nc-section__header">
        <h2 id="nc-size-title" class="nc-section__title">Choose Your Size</h2>
      </header>
      <div class="nc-list nc-list--size" role="radiogroup" aria-label="Size selection">
        {sizes.map(size => {
          const isActive = fmtId === size.id;
          return (
            <button
              key={size.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              class={`nc-row${isActive ? " is-selected" : ""}`}
              onClick={() => {
                setFormat(size.id);
                track("size_selected", { id: size.id, label: size.label });
              }}
            >
              <span class="nc-row__select" aria-hidden="true">
                <span class="nc-row__select-check">✓</span>
              </span>
              <div class="nc-row__photo" style={`background:${size.bg}`}>
                {"photo" in size && size.photo
                  ? <img src={size.photo} alt={size.label} class="nc-row__photo-img" />
                  : <span class="nc-row__initial">{size.initial}</span>
                }
              </div>
              <div class="nc-row__info">
                <span class="nc-row__name">{size.label}</span>
                {size.desc && <span class="nc-row__allergens">{size.desc}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
