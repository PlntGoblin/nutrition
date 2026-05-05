/**
 * Share button — copies the current URL (with hash-encoded build) to
 * clipboard, with three layers of fallback:
 *
 *   1. Web Share API (`navigator.share`) on supporting devices — opens
 *      the native share sheet with the URL.
 *   2. Clipboard API (`navigator.clipboard.writeText`) — copies the URL
 *      and shows a toast.
 *   3. `prompt()` showing the URL for manual copy — last resort for
 *      private-mode Safari pre-iOS 11 / clipboard-API-disabled contexts
 *      (PRD §17.4).
 *
 * Toast confirmation auto-dismisses after 2 s.
 */
import type { JSX } from "preact";
import { useState } from "preact/hooks";

export function ShareButton(): JSX.Element {
  const [toast, setToast] = useState<string | null>(null);

  async function handleShare(): Promise<void> {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: "My nutrition build",
      text: "Check out the nutrition info for the cheesesteak I built.",
      url,
    };

    // 1. Native Web Share if available (mobile-first; URLs can be filtered
    //    by canShare on some platforms — guard against non-share-capable
    //    Web Share implementations).
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" || navigator.canShare(shareData))
    ) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard.
      }
    }

    // 2. Clipboard API.
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText
    ) {
      try {
        await navigator.clipboard.writeText(url);
        setToast("Link copied!");
        window.setTimeout(() => setToast(null), 2000);
        return;
      } catch {
        // Permission denied or other failure — fall through to prompt.
      }
    }

    // 3. Last-resort prompt — synchronous, blocks the page, but
    //    guaranteed to work everywhere.
    if (typeof window !== "undefined") {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div class="nc-share">
      <button type="button" class="nc-share__btn" onClick={handleShare}>
        <span aria-hidden="true">↗</span>
        <span>Share build</span>
      </button>
      {toast && (
        <span class="nc-share__toast" role="status" aria-live="polite">
          {toast}
        </span>
      )}
    </div>
  );
}
