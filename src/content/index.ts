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
 * 3. Shows toast notifications using Shadow DOM when errors are captured
 */

import { toastManager } from './toast-manager';
import type { ErrorType } from '@/types';

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

    // Apply toast position if set
    if (settings.theme?.position) {
      toastManager.setPosition(settings.theme.position);
    }

    console.log('[Catchy Content] Settings loaded, enabled:', isExtensionEnabled, 'position:', settings.theme?.position);
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
 * Uses Shadow DOM-based ToastManager for proper isolation and theming
 */
function showToast(error: {
  type: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  timestamp: number;
}) {
  toastManager.showToast({
    type: error.type as ErrorType,
    message: error.message,
    file: error.file,
    line: error.line,
    column: error.column,
    timestamp: error.timestamp,
  });

  if (import.meta.env.DEV) {
    console.log('[Catchy Content] Toast displayed via ToastManager');
  }
}

/**
 * Listen for settings changes in Chrome storage
 * When user toggles extension on/off or changes position, this updates immediately
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.settings) {
    const newSettings = changes.settings.newValue;

    // Update our cached state
    const wasEnabled = isExtensionEnabled;
    isExtensionEnabled = newSettings.enabled;

    // Update toast position if changed
    if (newSettings.theme?.position) {
      toastManager.setPosition(newSettings.theme.position);
      console.log('[Catchy Content] Position changed to:', newSettings.theme.position);
    }

    console.log('[Catchy Content] Settings changed: enabled', wasEnabled, '->', isExtensionEnabled);
  }
});

/**
 * Initialize extension when DOM is ready
 */
async function initializeExtension() {
  // CRITICAL: Load settings FIRST before initializing ToastManager
  // This ensures the position is set before the container is created
  await loadSettings();

  // Initialize ToastManager with Shadow DOM (will use the position from settings)
  toastManager.initialize();

  // Inject the script
  injectScript();
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  // DOM is already ready
  initializeExtension();
}
