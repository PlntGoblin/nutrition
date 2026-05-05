/**
 * URL-hash build encoding/decoding.
 *
 * Phase 0 stub. Phase 5 implements:
 *   - encodeBuild(state) → compact hash like `#bowl=ck-d,wr,bl,gu`
 *   - decodeBuild(hash) → state, with strict whitelist validation against
 *     loaded menu IDs (PRD §18.3). Unknown IDs silently dropped.
 *   - 500-character cap on encoded hash; longer payloads truncated.
 *   - Known-multiplier validation on portion values; unknown → 1.0.
 *   - Debounced (500 ms) URL writes on selection change.
 */

export {};
