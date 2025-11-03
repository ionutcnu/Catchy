#!/usr/bin/env node

import puppeteer from "puppeteer";
import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createServer } from "http";
import { readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");
const distPath = resolve(projectRoot, "dist");

/**
 * Development launcher for Chrome extension
 *
 * This script:
 * 1. Ensures Chromium is installed via Puppeteer
 * 2. Builds the extension in development mode
 * 3. Launches Chromium with the extension pre-installed
 * 4. Watches for changes and rebuilds automatically
 */

console.log("🚀 Starting Catchy development environment...\n");

// Ensure Chromium is installed
async function ensureChromiumInstalled() {
  console.log("🔍 Checking Chromium installation...");

  try {
    // Try to get the browser executable path
    const browser = await puppeteer.launch({ headless: true });
    await browser.close();
    console.log("✅ Chromium is already installed");
    return true;
  } catch (error) {
    if (error.message.includes("Could not find Chrome")) {
      console.log("📥 Chromium not found. Installing via Puppeteer...");

      return new Promise((resolve, reject) => {
        const installProcess = spawn(
          "bunx",
          ["puppeteer", "browsers", "install", "chrome"],
          {
            cwd: projectRoot,
            stdio: "inherit",
          },
        );

        installProcess.on("close", (code) => {
          if (code === 0) {
            console.log("✅ Chromium installed successfully!\n");
            resolve(true);
          } else {
            console.error("❌ Failed to install Chromium");
            reject(new Error(`Installation process exited with code ${code}`));
          }
        });

        installProcess.on("error", (error) => {
          console.error(
            "❌ Error during Chromium installation:",
            error.message,
          );
          reject(error);
        });
      });
    } else {
      throw error;
    }
  }
}

// Check if dist directory exists and has content
function checkExtensionBuild() {
  if (!fs.existsSync(distPath)) {
    console.log("❌ Extension not built. Building now...");
    return false;
  }

  const files = fs.readdirSync(distPath);
  if (files.length === 0) {
    console.log("❌ Extension dist is empty. Building now...");
    return false;
  }

  console.log("✅ Extension build found in dist/");
  return true;
}

// Build the extension
function buildExtension() {
  return new Promise((resolve, reject) => {
    console.log("🔨 Building extension...");

    const buildProcess = spawn("bun", ["run", "build"], {
      cwd: projectRoot,
      stdio: "inherit",
    });

    buildProcess.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Extension built successfully!\n");
        resolve();
      } else {
        console.error("❌ Build failed");
        reject(new Error(`Build process exited with code ${code}`));
      }
    });
  });
}

// Start the development watcher
function startWatcher() {
  console.log("👀 Starting development watcher...");

  const watchProcess = spawn("bun", ["run", "dev"], {
    cwd: projectRoot,
    stdio: "pipe",
  });

  watchProcess.stdout.on("data", (data) => {
    const output = data.toString();
    if (output.includes("built in")) {
      console.log("🔄 Extension rebuilt");
    }
  });

  watchProcess.stderr.on("data", (data) => {
    const error = data.toString();
    // Filter out common non-error messages
    if (
      !error.includes("watching for file changes") &&
      !error.includes("vite")
    ) {
      console.error("⚠️  Build warning:", error.trim());
    }
  });

  return watchProcess;
}

// Launch Chromium with extension
async function launchChromium() {
  console.log("🌐 Launching Chromium with extension...\n");

  try {
    const browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      defaultViewport: null,
      args: [
        `--disable-extensions-except=${distPath}`,
        `--load-extension=${distPath}`,
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-default-apps",
        "--disable-popup-blocking",
        "--disable-translate",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--disable-ipc-flooding-protection",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--window-size=1200,800",
        "--window-position=100,100",
      ],
    });

    // Start local test server
    const testServer = await startTestServer();

    // Open a test page
    const page = await browser.newPage();
    await page.goto(`http://localhost:${testServer.port}`);

    console.log("✅ Chromium launched successfully!");
    console.log("📝 Your extension is loaded and ready for testing");
    console.log("🔧 DevTools are open for debugging");
    console.log(
      "👀 File watcher is active - changes will rebuild automatically\n",
    );
    console.log("💡 Tips:");
    console.log("  - Go to chrome://extensions/ to manage your extension");
    console.log(
      "  - Use chrome://inspect/#extensions to debug background scripts",
    );
    console.log(
      "  - Right-click on any page to see if your extension is working",
    );
    console.log(
      "  - Use the test page buttons to trigger various error scenarios\n",
    );
    console.log(
      "🎯 Test page loaded with buttons to trigger different error types",
    );
    console.log("🚦 Press Ctrl+C to stop the development environment");

    return { browser, testServer };
  } catch (error) {
    console.error("❌ Failed to launch Chromium:", error.message);

    if (error.message.includes("Could not find Chrome")) {
      console.log("\n💡 Try running: bunx puppeteer browsers install chrome");
      console.log("Or check if the installation completed successfully.");
    }

    throw error;
  }
}

// Start local test server for serving the test page
function startTestServer() {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      const testDir = resolve(projectRoot, "test");
      let filePath;

      if (req.url === "/" || req.url === "/index.html") {
        filePath = resolve(testDir, "index.html");
      } else {
        filePath = resolve(testDir, req.url.slice(1));
      }

      try {
        // Security check - ensure file is within test directory
        if (!filePath.startsWith(testDir)) {
          res.writeHead(403, { "Content-Type": "text/plain" });
          res.end("Forbidden");
          return;
        }

        const content = await readFile(filePath);

        // Simple MIME type detection
        let mimeType = "text/plain";
        if (filePath.endsWith(".html")) mimeType = "text/html";
        else if (filePath.endsWith(".js")) mimeType = "application/javascript";
        else if (filePath.endsWith(".css")) mimeType = "text/css";
        else if (filePath.endsWith(".json")) mimeType = "application/json";
        else if (filePath.endsWith(".svg")) mimeType = "image/svg+xml";
        else if (filePath.endsWith(".ico")) mimeType = "image/x-icon";

        res.writeHead(200, {
          "Content-Type": mimeType,
          "Cache-Control": "no-cache",
        });
        res.end(content);
      } catch (error) {
        if (error.code === "ENOENT") {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not Found");
        } else {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal Server Error: " + error.message);
        }
      }
    });

    server.listen(0, "localhost", () => {
      const port = server.address().port;
      console.log(`🌐 Test server started at http://localhost:${port}`);
      resolvePromise({ server, port });
    });

    server.on("error", reject);
  });
}

// Main execution
async function main() {
  try {
    // Ensure Chromium is installed
    await ensureChromiumInstalled();

    // Build extension if needed
    if (!checkExtensionBuild()) {
      await buildExtension();
    }

    // Start file watcher
    const watchProcess = startWatcher();

    // Small delay to let watcher start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Launch Chromium
    const { browser, testServer } = await launchChromium();

    // Handle cleanup
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down development environment...");

      try {
        console.log("  - Closing Chromium...");
        await browser.close();

        console.log("  - Stopping test server...");
        testServer.server.close();

        console.log("  - Stopping file watcher...");
        watchProcess.kill();

        console.log("✅ Cleanup complete. Goodbye!");
        process.exit(0);
      } catch (error) {
        console.error("Error during cleanup:", error.message);
        process.exit(1);
      }
    });

    // Keep process alive
    process.on("SIGTERM", async () => {
      await browser.close();
      testServer.server.close();
      watchProcess.kill();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start development environment:", error.message);

    if (error.message.includes("ENOENT") && error.message.includes("bun")) {
      console.log(
        "\n💡 Make sure you have bun installed and available in your PATH",
      );
    }

    process.exit(1);
  }
}

// Run the script
main();
