/**
 * Playwright end-to-end smoke test — guest builds a 5-ingredient bowl, sees
 * macros update, copies share link, opens it in a new context, sees the
 * identical build (PRD Definition of Done §16).
 *
 * Phase 0 stub. Browsers are not installed yet (`npx playwright install`
 * runs in Phase 8 prep). The Vitest runner skips this directory; it's only
 * picked up by `npm run test:e2e`.
 */
import { test, expect } from "@playwright/test";

test.skip("basic build flow (phase 0 placeholder)", async ({ page }) => {
  await page.goto("/public/embed.html");
  await expect(page.locator("[data-nc-root]")).toBeVisible();
});
