/**
 * Mobile bottom sheet — collapsed (peeks 64 px showing cal + protein + chevron),
 * expanded (80vh, backdrop blur, full nutrition + share/filters slot).
 *
 * Interaction model per PRD §8.4:
 *   - Tap chevron → toggle
 *   - Swipe up from collapsed → expand
 *   - Swipe down from expanded → collapse
 *   - Tap backdrop when expanded → collapse
 *
 * Pointer-event-based drag (no Motion gesture API needed). Uses
 * `setPointerCapture` so the gesture continues even if the finger leaves
 * the sheet element. Touch + mouse + pen all unified through pointer events.
 *
 * Visibility: sheet is positioned fixed at the bottom; CSS hides it on
 * desktop (≥720 px) where the hero rail totals are visible instead.
 *
 * iOS Safari quirks handled:
 *   - `100dvh` with `100vh` fallback (PRD §9 Phase 4 task 4)
 *   - `env(safe-area-inset-bottom)` so the peek bar sits above the home
 *     indicator on notched devices
 *   - `touch-action: none` on the drag region so the page doesn't try to
 *     pull-to-refresh during a swipe-up
 */
import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { selectionCount, totals } from "../lib/store";
import { TotalsPanel } from "./TotalsPanel";

const PEEK_PX = 64;
const SNAP_THRESHOLD_PX = 60;

type SheetState = "collapsed" | "expanded";

function fmt(n: number): string {
  return n < 10 && n > 0 ? n.toFixed(1).replace(/\.0$/, "") : Math.round(n).toString();
}

export function BottomSheet(): JSX.Element {
  const t = totals.value;
  const count = selectionCount.value;
  const [state, setState] = useState<SheetState>("collapsed");
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // ESC closes the expanded sheet — keyboard accessibility.
  useEffect(() => {
    if (state !== "expanded") return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") setState("collapsed");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  function onPointerDown(e: PointerEvent): void {
    dragStartY.current = e.clientY;
    setIsDragging(true);
    sheetRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent): void {
    if (dragStartY.current == null) return;
    const deltaY = e.clientY - dragStartY.current;
    // Clamp so we can't drag past either snap point.
    if (state === "collapsed") {
      // Negative = up (revealing more). Positive deltaY = no-op.
      setDragOffset(Math.min(0, deltaY));
    } else {
      // Positive = down (hiding). Negative deltaY = no-op.
      setDragOffset(Math.max(0, deltaY));
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (dragStartY.current == null) {
      setIsDragging(false);
      return;
    }
    const deltaY = e.clientY - dragStartY.current;
    if (state === "collapsed" && deltaY < -SNAP_THRESHOLD_PX) {
      setState("expanded");
    } else if (state === "expanded" && deltaY > SNAP_THRESHOLD_PX) {
      setState("collapsed");
    }
    dragStartY.current = null;
    setDragOffset(0);
    setIsDragging(false);
  }

  // Compute transform: at rest the sheet sits at translateY(calc(100% - 64px))
  // when collapsed, or translateY(0) when expanded. While dragging we add the
  // user's pointer offset on top.
  const baseTransform =
    state === "collapsed"
      ? `translateY(calc(100% - ${PEEK_PX}px))`
      : "translateY(0)";
  const transform = isDragging
    ? `translateY(calc(${
        state === "collapsed" ? `100% - ${PEEK_PX}px` : "0px"
      } + ${dragOffset}px))`
    : baseTransform;

  return (
    <>
      {state === "expanded" && (
        <div
          class="nc-sheet-backdrop"
          onClick={() => setState("collapsed")}
          aria-hidden="true"
        />
      )}
      <div
        ref={sheetRef}
        class={`nc-sheet${state === "expanded" ? " is-expanded" : ""}${
          isDragging ? " is-dragging" : ""
        }`}
        style={{ transform }}
        role="dialog"
        aria-modal={state === "expanded"}
        aria-label="Nutrition details"
      >
        {/* Peek bar — drag handle + summary + chevron */}
        <button
          type="button"
          class="nc-sheet__peek"
          onPointerDown={onPointerDown as unknown as JSX.PointerEventHandler<HTMLButtonElement>}
          onPointerMove={onPointerMove as unknown as JSX.PointerEventHandler<HTMLButtonElement>}
          onPointerUp={onPointerUp as unknown as JSX.PointerEventHandler<HTMLButtonElement>}
          onPointerCancel={onPointerUp as unknown as JSX.PointerEventHandler<HTMLButtonElement>}
          onClick={(e) => {
            // Only treat as click if no significant drag happened.
            if (dragStartY.current == null) {
              setState((s) => (s === "collapsed" ? "expanded" : "collapsed"));
              e.preventDefault();
            }
          }}
          aria-expanded={state === "expanded"}
        >
          <span class="nc-sheet__handle" aria-hidden="true" />
          <span class="nc-sheet__peek-stats">
            <span class="nc-sheet__peek-cal">
              <strong>{Math.round(t.calories)}</strong> cal
            </span>
            <span class="nc-sheet__peek-pro">
              <strong>{fmt(t.protein_g)}g</strong> protein
            </span>
            <span class="nc-sheet__peek-count">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </span>
          <span class="nc-sheet__chev" aria-hidden="true">
            {state === "expanded" ? "▾" : "▴"}
          </span>
        </button>

        {/* Body — only meaningful when expanded; rendered always for layout
            stability and to avoid focus loss on toggle. */}
        <div class="nc-sheet__body">
          <TotalsPanel variant="full" />
        </div>
      </div>
    </>
  );
}
