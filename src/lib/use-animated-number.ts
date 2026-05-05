/**
 * Spring-ish animated number hook for the live calorie counter.
 *
 * Easing: cubic ease-out, 400 ms. PRD §5.4 spec is 300–500 ms for animation
 * duration; this lands at the bottom of that range so updates feel snappy
 * but still organic.
 *
 * Honors `prefers-reduced-motion: reduce` (PRD §8.5) — when set, the hook
 * snaps to the target value without animating.
 *
 * Implementation note: rAF-based rather than imported from Motion's
 * `animate()`. Motion stays reserved for the macro donut + selection
 * feedback, where its spring physics + path animation are higher leverage.
 * A 30-line hook here keeps the bundle leaner.
 */
import { useEffect, useRef, useState } from "preact/hooks";

const DEFAULT_DURATION = 400;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useAnimatedNumber(
  target: number,
  duration = DEFAULT_DURATION,
): number {
  const [value, setValue] = useState(target);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef<number>(target);
  const startRef = useRef<number>(0);
  const valueRef = useRef<number>(target);
  valueRef.current = value;

  useEffect(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }

    fromRef.current = valueRef.current;
    startRef.current = performance.now();

    const tick = (now: number): void => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const eased = easeOutCubic(t);
      const next = fromRef.current + (target - fromRef.current) * eased;
      setValue(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, duration]);

  return value;
}
