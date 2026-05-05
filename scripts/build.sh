#!/usr/bin/env bash
# Production build — outputs `dist/calculator.js` and `dist/calculator.css`.
# Phase 0 stub.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
echo "Bundle sizes (gzipped):"
gzip -9 -c dist/calculator.js | wc -c | awk '{printf "  JS:  %d bytes\n", $1}'
gzip -9 -c dist/calculator.css | wc -c | awk '{printf "  CSS: %d bytes\n", $1}'
