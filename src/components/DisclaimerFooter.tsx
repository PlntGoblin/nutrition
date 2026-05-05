/**
 * Disclaimer footer — FDA-aligned language about estimate variance, allergen
 * cross-contact warning for severe allergies, and the menu's LastUpdated
 * date so guests know how fresh the data is (PRD §18.7).
 *
 * This is a non-negotiable shipping requirement — nutrition/allergen accuracy
 * is a health-risk surface and the disclaimer mitigates liability.
 */
import type { JSX } from "preact";
import { menuData } from "../lib/store";

export function DisclaimerFooter(): JSX.Element {
  const lastUpdated = menuData.value?.lastUpdated;
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <footer class="nc-disclaimer">
      <p>
        Nutrition and allergen information is provided as a guide and may not
        reflect ingredient changes or cross-contact during preparation. Values
        are estimates and may vary by preparation. If you have a severe
        allergy, please speak with a manager before ordering.
      </p>
      {formattedDate && (
        <p class="nc-disclaimer__updated">Last updated: {formattedDate}</p>
      )}
    </footer>
  );
}
