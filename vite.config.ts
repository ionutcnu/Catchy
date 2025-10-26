import { defineConfig } from "vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import biome from "vite-plugin-biome";

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
  // Root directory for source files
  root: resolve(__dirname, "src"),

  // Build configuration
  build: {
    // Output directory (relative to project root, not src/)
    outDir: resolve(__dirname, "dist"),

    // Don't empty the output directory (we're building multiple times)
    emptyOutDir: true,

    // Don't use content hashing in filenames - Chrome needs exact names
    rollupOptions: {
      input: {
        // Background service worker
        background: resolve(__dirname, "src/background/index.ts"),

        // Content script (runs on web pages)
        content: resolve(__dirname, "src/content/index.ts"),

        // Injected script (runs in page context, not extension context)
        inject: resolve(__dirname, "src/content/inject.ts"),

        // Popup (shows when clicking extension icon)
        popup: resolve(__dirname, "src/popup/index.html"),

        // Options page (extension settings)
        options: resolve(__dirname, "src/options/index.html"),
      },
      output: {
        // Output each entry to its own directory
        entryFileNames: (chunkInfo) => {
          // Place files in their respective directories
          if (chunkInfo.name === "background") return "background/index.js";
          if (chunkInfo.name === "content") return "content/index.js";
          if (chunkInfo.name === "inject") return "content/inject.js";
          return "[name]/index.js";
        },
        chunkFileNames: "chunks/[name].js",
        assetFileNames: (assetInfo) => {
          // Keep HTML and CSS files organized
          if (assetInfo.name?.endsWith(".html")) {
            return "[name].html";
          }
          if (assetInfo.name?.endsWith(".css")) {
            return "styles/[name].css";
          }
          return "assets/[name].[ext]";
        },
      },
    },

    // Generate sourcemaps for debugging
    sourcemap: process.env.NODE_ENV === "development",

    // Target modern browsers (Chrome extensions use latest Chrome)
    target: "esnext",
  },

  // Plugin to copy static files
  plugins: [
    // Biome linting and formatting during development
    biome({
      mode: "check",
      applyFixes: false,
      failOnError: false,
    }),
    viteStaticCopy({
      targets: [
        // Copy manifest.json to dist root
        {
          src: resolve(__dirname, "manifest.json"),
          dest: "./",
        },
        // Copy all icons to dist/icons
        {
          src: resolve(__dirname, "public/icons/*"),
          dest: "./icons",
        },
      ],
    }),
  ],

  // Path resolution
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
