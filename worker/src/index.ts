/**
 * Cloudflare Worker — proxies Airtable for the nutrition-calculator widget.
 *
 * Phase 0 stub. Phase 6 implements:
 *   - Single endpoint: GET /menu
 *   - Reads Airtable via PAT (Worker secret, never exposed to the browser).
 *   - Sanitizes all string fields (DOMPurify or regex stripper) per §18.2.
 *   - Validates response shape; falls back to last-known-good cache in
 *     Cloudflare KV per §17.1.
 *   - CORS: strict allowlist (PopMenu domain + popmenucloud.com); 403 otherwise.
 *   - GET-only: 405 on POST/PUT/PATCH/DELETE per §18.4.
 *   - Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=86400.
 *   - Returns PhotoCDN URLs for ingredients, never raw Airtable attachments (§6.5).
 *   - Rate limit: 60 req/IP/min via Cloudflare-native rules.
 *
 * Phase 6 also implements the nightly cron (`scripts/mirror-images.ts`) that
 * mirrors Airtable photo attachments to Cloudinary — mandatory because
 * Airtable signed URLs expire silently within hours.
 */

export default {
  async fetch(_request: Request): Promise<Response> {
    return new Response("Phase 0 stub — Worker not yet implemented", {
      status: 501,
      headers: { "content-type": "text/plain" },
    });
  },
};
