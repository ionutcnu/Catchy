/**
 * Content Script (bridge between page and extension)
 *
 * Content scripts run in an "isolated world" - they can:
 * - Access the page's DOM (but not its JavaScript variables)
 * - Use Chrome extension APIs (chrome.runtime, chrome.storage, etc.)
 *
 * This script:
 * 1. Injects inject.ts into the page's context
 * 2. Listens for errors from inject.ts via window.postMessage
 * 3. Shows toast notifications when errors are captured
 */

console.log('[Catchy Content] Content script loaded');

/**
 * Cache the extension's enabled state for quick checks
 * This prevents us from querying storage on every error
 */
let isExtensionEnabled = true; // Default to true until we load settings

/**
 * Load settings from Chrome storage and update our cache
 * This runs once when the content script first loads
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['settings']);
    const settings = result.settings || { enabled: true };

    // Update our cached state
    isExtensionEnabled = settings.enabled;

    console.log('[Catchy Content] Settings loaded, enabled:', isExtensionEnabled);
  } catch (error) {
    console.error('[Catchy Content] Failed to load settings:', error);
    // On error, default to enabled
    isExtensionEnabled = true;
  }
}

/**
 * Step 1: Inject the error catcher into the page
 * We create a <script> tag that loads inject.js
 */
function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content/inject.js');
  // Note: inject.js is built as IIFE, not a module, so no type="module"
  script.onload = () => {
    // Remove script tag after it executes (cleanup)
    script.remove();
  };

  // Inject at the very beginning of the page
  (document.head || document.documentElement).appendChild(script);
  console.log('[Catchy Content] Inject script added to page');
}

/**
 * Step 2: Listen for errors from inject script
 * inject.ts uses window.postMessage to send errors here
 */
window.addEventListener('message', (event) => {
  // Security: Only accept messages from our inject script
  if (event.source !== window) return;
  if (event.data?.source !== 'catchy-inject') return;

  console.log('[Catchy Content] Error received from inject:', event.data);

  // Handle the error
  if (event.data.type === 'ERROR_CAPTURED') {
    // ⚡ FIX: Check if extension is enabled before showing toast
    if (!isExtensionEnabled) {
      console.log('[Catchy Content] Extension disabled, ignoring error');
      return;
    }

    showToast(event.data.error);
  }
});

/**
 * Step 3: Show a toast notification for the error
 * For now, this is a simple implementation
 * Later, we'll create a proper Shadow DOM toast component
 */
function showToast(error: {
  type: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
}) {
  // Create a simple toast div
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 999999;
    max-width: 400px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  `;

  // Build toast content
  const title = document.createElement('strong');
  title.textContent = `[${error.type}] `;
  title.style.display = 'block';
  title.style.marginBottom = '8px';

  const message = document.createElement('div');
  message.textContent = error.message;
  message.style.cssText = `
    white-space: pre-wrap;
    word-break: break-word;
  `;

  toast.appendChild(title);
  toast.appendChild(message);

  // Add file/line info if available
  if (error.file) {
    const location = document.createElement('div');
    location.textContent = `${error.file}:${error.line || '?'}`;
    location.style.cssText = `
      margin-top: 8px;
      opacity: 0.8;
      font-size: 12px;
    `;
    toast.appendChild(location);
  }

  // Add to page
  document.body.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 5000);

  console.log('[Catchy Content] Toast displayed');
}

/**
 * Listen for settings changes in Chrome storage
 * When user toggles extension on/off, this updates our cache immediately
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.settings) {
    const newSettings = changes.settings.newValue;

    // Update our cached state
    const wasEnabled = isExtensionEnabled;
    isExtensionEnabled = newSettings.enabled;

    console.log('[Catchy Content] Settings changed: enabled', wasEnabled, '->', isExtensionEnabled);
  }
});

// Load settings and inject the script as soon as possible
loadSettings();
injectScript();
