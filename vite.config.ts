import { defineConfig } from "vite";
import { resolve } from "path";
import biome from "vite-plugin-biome";
import react from "@vitejs/plugin-react";

/**
 * Vite configuration for building the Chrome extension
 *
 * Key concepts:
 * - Chrome extensions need multiple entry points (background, content, popup, options)
 * - Each entry point is built separately as its own bundle
 * - We copy static files (manifest.json, icons, HTML) to the dist folder
 * - No code splitting or hashing - Chrome extensions need predictable file names
 */
export default defineConfig({
  // Use relative paths for Chrome extension
  base: './',

  // Root directory for source files
  root: resolve(__dirname, "src"),

  // Build configuration
  build: {
    // Output directory (relative to project root, not src/)
    outDir: resolve(__dirname, "dist"),

    // Don't empty the output directory (we're building multiple times)
    emptyOutDir: true,

    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
        inject: resolve(__dirname, "src/content/inject.ts"),
        popup: resolve(__dirname, "src/popup/index.html"),
        options: resolve(__dirname, "src/options/index.html"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") return "background/index.js";
          if (chunkInfo.name === "content") return "content/index.js";
          if (chunkInfo.name === "inject") return "content/inject.js";
          return "[name]/index.js";
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".html")) return "[name].html";
          if (assetInfo.name?.endsWith(".css")) return "styles/[name].css";
          return "assets/[name].[ext]";
        },
        format: "es",
        // Prevent Vite from creating shared chunks - inline everything
        manualChunks(id, { getModuleInfo }) {
          // Don't create vendor chunks - keep everything together
          return null;
        },
      },
    },

    // Generate sourcemaps for debugging
    sourcemap: process.env.NODE_ENV === "development",

    // Target modern browsers (Chrome extensions use latest Chrome)
    target: "esnext",
  },

  // Plugins
  plugins: [
    // React support for JSX/TSX
    react(),
    // Biome linting and formatting during development
    biome({
      mode: "check",
      applyFixes: false,
      failOnError: false,
    }),
  ],

  // Path resolution
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
