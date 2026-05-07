/**
 * Vite build config for the nutrition calculator widget.
 *
 * Outputs a single ESM bundle (calculator.js) plus a CSS bundle (calculator.css)
 * intended to be served from a CDN and embedded into a PopMenu page via the
 * 3-line snippet documented in PRD §10.1. An IIFE fallback build target lives
 * in `vite.iife.config.ts` and is only invoked if a host environment cannot
 * load ESM (extremely rare in 2026).
 */
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [preact(), tailwindcss()],
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: false,
    sourcemap: process.env.NODE_ENV !== "production",
    // Library mode: emit a single ESM bundle (calculator.js) + extracted CSS
    // (calculator.css). The widget mounts itself on import — no host-side
    // bootstrapping required (PRD §10.1).
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      formats: ["es"],
      fileName: () => "calculator.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: (info) => {
          if (info.name?.endsWith(".css")) return "calculator.css";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  server: {
    port: 5173,
    // `public/` is Vite's default publicDir — its contents serve at root.
    // So `public/embed.html` is reachable at `/embed.html` in dev.
    open: "/embed.html",
  },
  test: {
    environment: "jsdom",
    globals: true,
    // Vitest auto-discovers any *.test.ts and *.spec.ts under the project.
    // tests/e2e/ is Playwright territory — exclude it so Vitest doesn't
    // try to import @playwright/test fixtures into a node/jsdom runtime.
    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],
  },
});
