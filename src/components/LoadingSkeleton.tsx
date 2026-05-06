/**
 * Loading skeleton — shown while `fetchMenu()` is in flight.
 *
 * Mirrors the final layout shape (hero band + format list + ingredient grid)
 * so the visual handoff to the loaded UI is seamless. Animated shimmer is
 * disabled under `prefers-reduced-motion: reduce` via the global override.
 *
 * In dev mode this is rarely seen because the seed JSON imports
 * synchronously; matters in production once the Cloudflare Worker is in the
 * loop.
 */
import type { JSX } from "preact";

function Block({ width, height }: { width: string; height: string }): JSX.Element {
  return <span class="nc-skeleton__block" style={{ width, height }} />;
}

export function LoadingSkeleton(): JSX.Element {
  return (
    <div class="nc-shell nc-skeleton" aria-busy="true" aria-label="Loading menu">
      <header class="nc-hero">
        <div class="nc-hero__inner">
          <div class="nc-hero__copy">
            <Block width="80px" height="12px" />
            <Block width="60%" height="64px" />
            <Block width="100%" height="48px" />
            <Block width="120px" height="14px" />
          </div>
          <div class="nc-hero__rail">
            <div class="nc-hero-totals__top">
              <Block width="120px" height="120px" />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Block width="160px" height="40px" />
                <Block width="200px" height="20px" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="nc-body">
        <div class="nc-format-section">
          <Block width="100px" height="12px" />
          {[0, 1, 2].map((i) => (
            <Block key={i} width="100%" height="56px" />
          ))}
        </div>

        <div class="nc-sections">
          {[0, 1].map((s) => (
            <section key={s} class="nc-section">
              <div class="nc-section__header" style={{ gap: "12px" }}>
                <Block width="60px" height="12px" />
                <Block width="220px" height="48px" />
              </div>
              <div class="nc-list">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <Block width="48px" height="48px" style={{ borderRadius: "50%", flexShrink: "0" }} />
                    <Block width="38%" height="16px" />
                    <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
                      <Block width="36px" height="18px" />
                      <Block width="28px" height="12px" />
                      <Block width="28px" height="12px" />
                      <Block width="28px" height="12px" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
