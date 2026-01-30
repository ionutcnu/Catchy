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

import type { CatchyError, ErrorType, IgnoreRule, ToastPosition, ToastSize } from '@/types';
import { ErrorDrawer } from './components/ErrorDrawer';
import { errorHistoryManager } from './error-history-manager';
import { toastManager } from './toast-manager';

// Inline CatchySettings interface to avoid code-splitting issues
interface CatchySettings {
  enabled: boolean;
  perSiteSettings: {
    [hostname: string]: {
      enabled: boolean;
    };
  };
  errorTypes: {
    consoleError: boolean;
    uncaught: boolean;
    unhandledRejection: boolean;
    resource: boolean;
    network: boolean;
  };
  ignoreRules?: IgnoreRule[]; // Optional - planned feature not yet implemented
  theme: {
    position: ToastPosition;
    maxToasts: number;
    autoCloseMs: number;
    swipeToDismiss: boolean;
    persistPinnedToasts: boolean;
    toastSize: ToastSize;
    customWidth?: number;
    customHeight?: number;
    maxHistorySize: number;
    drawerShortcut: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: number;
    shadow: boolean;
    spacing: number;
  };
  rateLimit: {
    maxPerInterval: number;
    intervalMs: number;
  };
}

// Inlined from src/types/index.ts:123 to avoid code-splitting issues with Chrome content scripts.
// IMPORTANT: Any changes to these defaults must be kept in sync with the canonical definition.
const DEFAULT_SETTINGS: CatchySettings = {
  enabled: false,
  perSiteSettings: {},
  errorTypes: {
    consoleError: true,
    uncaught: true,
    unhandledRejection: true,
    resource: false,
    network: false,
  },
  // ignoreRules: [], // Planned feature - not yet implemented
  theme: {
    position: 'bottom-right',
    maxToasts: 5,
    autoCloseMs: 0,
    swipeToDismiss: true,
    persistPinnedToasts: false,
    toastSize: 'medium',
    customWidth: 400,
    customHeight: 100,
    maxHistorySize: 200,
    drawerShortcut: 'Alt+E',
    backgroundColor: '#dc2626',
    textColor: '#ffffff',
    borderRadius: 8,
    shadow: true,
    spacing: 12,
  },
  rateLimit: {
    maxPerInterval: 5,
    intervalMs: 4000,
  },
};

console.log('[Catchy Content] Content script loaded');

// Error drawer instance (initialized after toast manager)
let errorDrawer: ErrorDrawer | null = null;

/**
 * Cache the extension's enabled state and error type filters for quick checks
 * This prevents us from querying storage on every error
 */
let isGloballyEnabled = false; // Global master toggle (opt-in by default)
let isEnabledForCurrentSite = false; // Per-site toggle for current hostname (opt-in by default)
let enabledErrorTypes = {
  consoleError: true,
  uncaught: true,
  unhandledRejection: true,
  resource: false,
  network: false,
};
let drawerShortcut = 'Alt+E'; // Default keyboard shortcut for opening drawer
// let ignoreButtonThreshold = 3; // Show ignore button after X error occurrences (unused)

/**
 * Error ignore tracking (3 scopes: session, browser, permanent)
 */
// Commented out - currently unused
/* let sessionIgnoreList: Set<string> = new Set(); // Session-only ignores (clears on page reload)
let errorCountsPerTab: Map<string, number> = new Map(); // Error signature -> count
const TAB_ID = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; // Unique ID for this tab/page session
const ERROR_COUNTS_STORAGE_KEY = `catchy-error-counts-${TAB_ID}`;
const BROWSER_IGNORE_STORAGE_KEY = 'catchy-ignore-browser'; // sessionStorage key for browser-scope ignores
const MAX_SESSION_IGNORES = 1000; // Maximum number of errors to track in session ignore list
const MAX_ERROR_COUNTS = 1000; // Maximum number of error signatures to track counts for */

/**
 * Track if extension context has been invalidated
 * Once invalid, we stop trying chrome API calls to avoid error spam
 */
// let extensionContextInvalidated = false; // Commented out - currently unused

/**
 * Check if extension context is still valid
 * During development, extension reloads invalidate the old context
 */
// Commented out - currently unused
/* function isExtensionContextValid(): boolean {
  if (extensionContextInvalidated) {
    return false;
  }

  try {
    // Try to access chrome.runtime.id - if context is invalid, this will throw
    if (!chrome?.runtime?.id) {
      extensionContextInvalidated = true;
      return false;
    }
    return true;
  } catch {
    extensionContextInvalidated = true;
    return false;
  }
} */

/**
 * Generate error signature for deduplication and ignore matching
 * Format: type::message (ignores file/line variations)
 */
// Commented out - currently unused
// function getErrorSignature(error: { type: string; message: string }): string {
//   return `${error.type}::${error.message}`;
// }

/**
 * Check if error should be shown (not in any ignore list)
 */
// Commented out - currently unused
/* function shouldShowError(signature: string): boolean {
  // Check session ignores
  if (sessionIgnoreList.has(signature)) {
    if (import.meta.env.DEV) {
      console.log('[Catchy Content] Error blocked by session ignore:', signature);
    }
    return false;
  }

  // Check browser-scope ignores (sessionStorage)
  try {
    const browserIgnores = sessionStorage.getItem(BROWSER_IGNORE_STORAGE_KEY);
    if (browserIgnores) {
      const ignoreList: string[] = JSON.parse(browserIgnores);
      if (ignoreList.includes(signature)) {
        if (import.meta.env.DEV) {
          console.log('[Catchy Content] Error blocked by browser ignore:', signature);
        }
        return false;
      }
    }
  } catch (error) {
    console.error('[Catchy Content] Failed to check browser ignores:', error);
  }

  // TODO: Check permanent ignores (ignoreRules) - will implement when adding ignore button

  if (import.meta.env.DEV) {
    console.log('[Catchy Content] Error NOT ignored, will show:', signature);
  }
  return true; // Not ignored
} */

/**
 * Add error signature to session ignore list with size limiting
 * Prevents unbounded growth by removing oldest entries when limit is reached
 */
// Commented out - currently unused
/* function addToSessionIgnoreList(signature: string): void {
  // Check if at capacity
  if (sessionIgnoreList.size >= MAX_SESSION_IGNORES) {
    // Remove oldest entry (first item in Set)
    const firstItem = sessionIgnoreList.values().next().value;
    if (firstItem) {
      sessionIgnoreList.delete(firstItem);
      if (import.meta.env.DEV) {
        console.log('[Catchy Content] Session ignore list at capacity, removed oldest:', firstItem);
      }
    }
  }

  // Add new signature
  sessionIgnoreList.add(signature);

  // Warn when approaching capacity (at 90%)
  if (sessionIgnoreList.size >= MAX_SESSION_IGNORES * 0.9 && import.meta.env.DEV) {
    console.warn(
      `[Catchy Content] Session ignore list is at ${sessionIgnoreList.size}/${MAX_SESSION_IGNORES} (${Math.round((sessionIgnoreList.size / MAX_SESSION_IGNORES) * 100)}%)`
    );
  }
} */

/**
 * Load error counts from storage for this tab
 */
// Commented out - currently unused
/* async function loadErrorCounts() {
  if (!isExtensionContextValid()) {
    // Silently skip if context is invalid
    return;
  }

  try {
    const result = await chrome.storage.local.get([ERROR_COUNTS_STORAGE_KEY]);
    const counts = result[ERROR_COUNTS_STORAGE_KEY] || {};
    errorCountsPerTab = new Map(Object.entries(counts));
    console.log('[Catchy Content] Loaded error counts:', errorCountsPerTab.size, 'entries');
  } catch (error) {
    // Check if this is the context invalidation error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Extension context invalidated')) {
      extensionContextInvalidated = true;
      if (import.meta.env.DEV) {
        console.warn('[Catchy Content] Extension context invalidated during load');
      }
    } else {
      console.error('[Catchy Content] Failed to load error counts:', error);
    }
  }
} */

/**
 * Save error counts to storage for persistence across page reloads
 */
// Commented out - currently unused
/* async function saveErrorCounts() {
  if (!isExtensionContextValid()) {
    // Silently skip if context is invalid - this is normal during development
    return;
  }

  try {
    const counts = Object.fromEntries(errorCountsPerTab);
    await chrome.storage.local.set({ [ERROR_COUNTS_STORAGE_KEY]: counts });
  } catch (error) {
    // Check if this is the context invalidation error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Extension context invalidated')) {
      extensionContextInvalidated = true;
      // Only log in dev mode to avoid console spam
      if (import.meta.env.DEV) {
        console.warn('[Catchy Content] Extension context invalidated - storage operations disabled');
      }
    } else {
      // Log other errors normally
      console.error('[Catchy Content] Failed to save error counts:', error);
    }
  }
} */

/**
 * Increment error count for a signature
 * Implements size limiting to prevent unbounded growth
 */
// Commented out - currently unused
/* function incrementErrorCount(signature: string): number {
  const currentCount = errorCountsPerTab.get(signature) || 0;
  const newCount = currentCount + 1;

  // Check if at capacity and this is a new signature
  if (!errorCountsPerTab.has(signature) && errorCountsPerTab.size >= MAX_ERROR_COUNTS) {
    // Remove oldest entry (first item in Map)
    const firstKey = errorCountsPerTab.keys().next().value;
    if (firstKey) {
      errorCountsPerTab.delete(firstKey);
      if (import.meta.env.DEV) {
        console.log('[Catchy Content] Error counts at capacity, removed oldest:', firstKey);
      }
    }
  }

  errorCountsPerTab.set(signature, newCount);
  saveErrorCounts(); // Persist to storage

  // Warn when approaching capacity (at 90%)
  if (errorCountsPerTab.size >= MAX_ERROR_COUNTS * 0.9 && import.meta.env.DEV) {
    console.warn(
      `[Catchy Content] Error counts map is at ${errorCountsPerTab.size}/${MAX_ERROR_COUNTS} (${Math.round((errorCountsPerTab.size / MAX_ERROR_COUNTS) * 100)}%)`
    );
  }

  return newCount;
} */

/**
 * Load settings from Chrome storage and update our cache
 * This runs once when the content script first loads
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['settings']);
    const settings = result.settings || DEFAULT_SETTINGS;

    // Update global enabled state
    isGloballyEnabled = settings.enabled ?? DEFAULT_SETTINGS.enabled;

    // Check per-site settings for current hostname
    const currentHostname = window.location.hostname;
    const perSiteSettings = settings.perSiteSettings || {};

    // Determine if enabled for this site based on global + per-site settings
    if (isGloballyEnabled) {
      // Global mode ON: All sites enabled by default, unless explicitly disabled
      if (perSiteSettings[currentHostname]) {
        // Site has explicit setting - respect it if boolean, otherwise default to true
        const siteEnabled = perSiteSettings[currentHostname].enabled;
        isEnabledForCurrentSite = typeof siteEnabled === 'boolean' ? siteEnabled : true;
      } else {
        // No per-site setting - enabled by default when global is ON
        isEnabledForCurrentSite = true;
      }
    } else {
      // Global mode OFF: Opt-in mode - only explicitly enabled sites work
      if (perSiteSettings[currentHostname]) {
        // Site has explicit setting - respect it if boolean, otherwise default to false
        const siteEnabled = perSiteSettings[currentHostname].enabled;
        isEnabledForCurrentSite = typeof siteEnabled === 'boolean' ? siteEnabled : false;
      } else {
        // No per-site setting - disabled by default when global is OFF
        isEnabledForCurrentSite = false;
      }
    }

    // Update enabled error types if available - merge with defaults to preserve missing keys
    if (settings.errorTypes) {
      enabledErrorTypes = {
        ...enabledErrorTypes,
        ...settings.errorTypes,
      };
    }

    // Apply toast position if set
    if (settings.theme?.position) {
      toastManager.setPosition(settings.theme.position);
    }

    // Apply swipe-to-dismiss setting
    if (settings.theme?.swipeToDismiss !== undefined) {
      toastManager.setSwipeToDismiss(settings.theme.swipeToDismiss);
    }

    // Apply persist pinned toasts setting
    if (settings.theme?.persistPinnedToasts !== undefined) {
      toastManager.setPersistPinnedToasts(settings.theme.persistPinnedToasts);
    }

    // Apply max toasts setting
    if (settings.theme?.maxToasts !== undefined) {
      toastManager.setMaxToasts(settings.theme.maxToasts);
    }

    // Apply toast size setting
    if (settings.theme?.toastSize) {
      toastManager.setToastSize(settings.theme.toastSize);
    }

    // Apply custom width/height if size is custom
    if (settings.theme?.customWidth !== undefined) {
      toastManager.setCustomWidth(settings.theme.customWidth);
    }
    if (settings.theme?.customHeight !== undefined) {
      toastManager.setCustomHeight(settings.theme.customHeight);
    }

    // Apply max history size setting
    if (settings.theme?.maxHistorySize !== undefined) {
      errorHistoryManager.setMaxSize(settings.theme.maxHistorySize);
    }

    // Apply drawer shortcut setting
    if (settings.theme?.drawerShortcut) {
      drawerShortcut = settings.theme.drawerShortcut;
    }

    console.log(
      '[Catchy Content] Settings loaded, globally enabled:',
      isGloballyEnabled,
      'enabled for',
      `${window.location.hostname}:`,
      isEnabledForCurrentSite,
      'position:',
      settings.theme?.position,
      'maxToasts:',
      settings.theme?.maxToasts,
      'toastSize:',
      settings.theme?.toastSize,
      'maxHistorySize:',
      settings.theme?.maxHistorySize,
      'errorTypes:',
      enabledErrorTypes
    );
  } catch (error) {
    console.error('[Catchy Content] Failed to load settings:', error);
    // On error, default to disabled (opt-in model)
    isGloballyEnabled = false;
    isEnabledForCurrentSite = false;
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
 * Helper function to parse and check if keyboard shortcut matches
 * Supports formats like "Alt+E", "Ctrl+Shift+H", etc.
 */
function checkShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split('+').map((p) => p.trim().toLowerCase());
  const key = parts[parts.length - 1]; // Last part is the key
  const modifiers = parts.slice(0, -1); // Everything before is modifiers

  // Check if the pressed key matches
  if (event.key.toLowerCase() !== key) {
    return false;
  }

  // Check modifiers
  const hasAlt = modifiers.includes('alt');
  const hasCtrl = modifiers.includes('ctrl') || modifiers.includes('control');
  const hasShift = modifiers.includes('shift');
  const hasMeta =
    modifiers.includes('meta') || modifiers.includes('cmd') || modifiers.includes('command');

  return (
    event.altKey === hasAlt &&
    event.ctrlKey === hasCtrl &&
    event.shiftKey === hasShift &&
    event.metaKey === hasMeta
  );
}

/**
 * Helper function to check if an error type is enabled
 * Maps ErrorType to the corresponding setting key
 */
function isErrorTypeAllowed(errorType: string): boolean {
  const typeMap: Record<string, keyof typeof enabledErrorTypes> = {
    'console.error': 'consoleError',
    uncaught: 'uncaught',
    unhandledrejection: 'unhandledRejection',
    resource: 'resource',
    network: 'network',
  };

  const settingKey = typeMap[errorType];
  if (!settingKey) {
    console.warn('[Catchy Content] Unknown error type:', errorType);
    return true; // Default to showing unknown types
  }

  return enabledErrorTypes[settingKey];
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
    // Check 1: Global toggle - if globally disabled, ignore all errors
    if (!isGloballyEnabled) {
      console.log('[Catchy Content] Globally disabled, ignoring error');
      return;
    }

    // Check 2: Per-site toggle - if disabled for this site, ignore
    if (!isEnabledForCurrentSite) {
      console.log('[Catchy Content] Disabled for', window.location.hostname, ', ignoring error');
      return;
    }

    // Check 3: Error type filter
    const errorType = event.data.error.type;
    const isErrorTypeEnabled = isErrorTypeAllowed(errorType);

    if (!isErrorTypeEnabled) {
      console.log('[Catchy Content] Error type disabled:', errorType);
      return;
    }

    showToast(event.data.error);
  }
});

/**
 * Handle error ignore action from Toast component
 */
// Commented out - currently unused
/* function handleErrorIgnore(
  toastId: string,
  signature: string,
  scope: 'session' | 'browser' | 'permanent'
): void {
  console.log('[Catchy Content] === IGNORING ERROR ===');
  console.log('[Catchy Content] Scope:', scope);
  console.log('[Catchy Content] Signature to ignore:', signature);
  console.log('[Catchy Content] Signature length:', signature.length);
  console.log('[Catchy Content] Signature characters:', signature.split('').map(c => c.charCodeAt(0)));

  if (scope === 'session') {
    // Add to session ignore list (clears on page reload)
    addToSessionIgnoreList(signature);
    console.log('[Catchy Content] ✓ Added to session ignore list');
    console.log('[Catchy Content] Total session ignores:', sessionIgnoreList.size);
    console.log('[Catchy Content] List contents:', Array.from(sessionIgnoreList));
  } else if (scope === 'browser') {
    // Add to browser-scope ignore list (sessionStorage - clears on browser close)
    try {
      const existing = sessionStorage.getItem(BROWSER_IGNORE_STORAGE_KEY);
      const ignoreList: string[] = existing ? JSON.parse(existing) : [];
      if (!ignoreList.includes(signature)) {
        ignoreList.push(signature);
        sessionStorage.setItem(BROWSER_IGNORE_STORAGE_KEY, JSON.stringify(ignoreList));
        console.log('[Catchy Content] Added to browser ignore list. Total browser ignores:', ignoreList.length);
      }
    } catch (error) {
      console.error('[Catchy Content] Failed to save browser ignore:', error);
    }
  } else if (scope === 'permanent') {
    // Add to permanent ignore list (chrome.storage.sync ignoreRules)
    // TODO: Implement permanent ignore rules
    // For now, just use browser scope as fallback
    console.log('[Catchy Content] Permanent ignore not yet implemented, using browser scope:', signature);
    handleErrorIgnore(toastId, signature, 'browser');
  }

  // Remove from error counts since it's now ignored
  errorCountsPerTab.delete(signature);
  saveErrorCounts();
  console.log('[Catchy Content] Removed error count for ignored signature');
} */

/**
 * Step 3: Show a toast notification for the error
 * Uses Shadow DOM-based ToastManager for proper isolation and theming
 * Also adds the error to the history manager
 */
function showToast(error: {
  type: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  timestamp: number;
  stack?: string;
}) {
  // Create a complete CatchyError object
  const catchyError: CatchyError = {
    id: `error-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    type: error.type as ErrorType,
    message: error.message,
    file: error.file,
    line: error.line,
    column: error.column,
    timestamp: error.timestamp,
    url: window.location.href,
    stack: error.stack,
    count: 1,
  };

  // Add to error history
  errorHistoryManager.add(catchyError);

  // Show toast notification
  toastManager.showToast({
    type: catchyError.type,
    message: catchyError.message,
    file: catchyError.file,
    line: catchyError.line,
    column: catchyError.column,
    timestamp: catchyError.timestamp,
  });

  if (import.meta.env.DEV) {
    console.log('[Catchy Content] Error added to history and toast displayed');
  }
}

/**
 * Listen for settings changes in Chrome storage
 * When user toggles extension on/off or changes position, this updates immediately
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.settings) {
    const newSettings = changes.settings.newValue;

    // Update global enabled state
    const wasGloballyEnabled = isGloballyEnabled;
    isGloballyEnabled = newSettings.enabled ?? DEFAULT_SETTINGS.enabled;

    // Update per-site settings for current hostname
    const currentHostname = window.location.hostname;
    const perSiteSettings = newSettings.perSiteSettings || {};
    const wasEnabledForSite = isEnabledForCurrentSite;

    // Determine if enabled for this site based on global + per-site settings
    if (isGloballyEnabled) {
      // Global mode ON: All sites enabled by default, unless explicitly disabled
      if (perSiteSettings[currentHostname]) {
        // Site has explicit setting - respect it if boolean, otherwise default to true
        const siteEnabled = perSiteSettings[currentHostname].enabled;
        isEnabledForCurrentSite = typeof siteEnabled === 'boolean' ? siteEnabled : true;
      } else {
        isEnabledForCurrentSite = true;
      }
    } else {
      // Global mode OFF: Opt-in mode - only explicitly enabled sites work
      if (perSiteSettings[currentHostname]) {
        // Site has explicit setting - respect it if boolean, otherwise default to false
        const siteEnabled = perSiteSettings[currentHostname].enabled;
        isEnabledForCurrentSite = typeof siteEnabled === 'boolean' ? siteEnabled : false;
      } else {
        isEnabledForCurrentSite = false;
      }
    }

    // Update enabled error types if changed - merge with defaults to preserve missing keys
    if (newSettings.errorTypes) {
      enabledErrorTypes = {
        ...enabledErrorTypes,
        ...newSettings.errorTypes,
      };
      console.log('[Catchy Content] Error types changed:', enabledErrorTypes);
    }

    // Update toast position if changed
    if (newSettings.theme?.position) {
      toastManager.setPosition(newSettings.theme.position);
      console.log('[Catchy Content] Position changed to:', newSettings.theme.position);
    }

    // Update swipe-to-dismiss if changed
    if (newSettings.theme?.swipeToDismiss !== undefined) {
      toastManager.setSwipeToDismiss(newSettings.theme.swipeToDismiss);
      console.log(
        '[Catchy Content] Swipe-to-dismiss changed to:',
        newSettings.theme.swipeToDismiss
      );
    }

    // Update persist pinned toasts if changed
    if (newSettings.theme?.persistPinnedToasts !== undefined) {
      toastManager.setPersistPinnedToasts(newSettings.theme.persistPinnedToasts);
      console.log(
        '[Catchy Content] Persist pinned toasts changed to:',
        newSettings.theme.persistPinnedToasts
      );
    }

    // Update max toasts if changed
    if (newSettings.theme?.maxToasts !== undefined) {
      toastManager.setMaxToasts(newSettings.theme.maxToasts);
      console.log('[Catchy Content] Max toasts changed to:', newSettings.theme.maxToasts);
    }

    // Update toast size if changed
    if (newSettings.theme?.toastSize) {
      toastManager.setToastSize(newSettings.theme.toastSize);
      console.log('[Catchy Content] Toast size changed to:', newSettings.theme.toastSize);
    }

    // Update custom width/height if changed
    if (newSettings.theme?.customWidth !== undefined) {
      toastManager.setCustomWidth(newSettings.theme.customWidth);
      console.log('[Catchy Content] Custom width changed to:', newSettings.theme.customWidth);
    }
    if (newSettings.theme?.customHeight !== undefined) {
      toastManager.setCustomHeight(newSettings.theme.customHeight);
      console.log('[Catchy Content] Custom height changed to:', newSettings.theme.customHeight);
    }

    // Update max history size if changed
    if (newSettings.theme?.maxHistorySize !== undefined) {
      errorHistoryManager.setMaxSize(newSettings.theme.maxHistorySize);
      console.log(
        '[Catchy Content] Max history size changed to:',
        newSettings.theme.maxHistorySize
      );
    }

    // Update drawer shortcut if changed
    if (newSettings.theme?.drawerShortcut) {
      drawerShortcut = newSettings.theme.drawerShortcut;
      console.log('[Catchy Content] Drawer shortcut changed to:', newSettings.theme.drawerShortcut);
    }

    console.log(
      '[Catchy Content] Settings changed - globally:',
      wasGloballyEnabled,
      '->',
      isGloballyEnabled,
      ', for',
      `${window.location.hostname}:`,
      wasEnabledForSite,
      '->',
      isEnabledForCurrentSite
    );
  }

  // Update dark mode for error drawer if changed
  if (areaName === 'sync' && changes.darkMode) {
    const newDarkMode = changes.darkMode.newValue;
    console.log(
      '[Catchy Content] Dark mode storage changed to:',
      newDarkMode,
      'errorDrawer exists:',
      !!errorDrawer
    );
    if (errorDrawer) {
      errorDrawer.setDarkMode(newDarkMode);
      console.log('[Catchy Content] Dark mode applied to drawer');
    } else {
      console.warn('[Catchy Content] Error drawer not initialized yet, cannot apply dark mode');
    }
  }
});

/**
 * Listen for messages from popup or background script
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OPEN_DRAWER') {
    if (errorDrawer) {
      errorDrawer.open();
      console.log('[Catchy Content] Error drawer opened via message from popup');
      sendResponse({ success: true });
    } else {
      console.warn('[Catchy Content] Error drawer not initialized yet');
      sendResponse({ success: false, error: 'Drawer not initialized' });
    }
    return true; // Keep message channel open for async response
  }
  return false; // Let other listeners handle other message types
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

  // Load pinned toasts if persistence is enabled
  toastManager.loadPinnedToasts();

  // Initialize Error Drawer (uses the same shadow root as toast manager)
  const shadowHost = document.getElementById('catchy-toast-host');
  if (shadowHost?.shadowRoot) {
    errorDrawer = new ErrorDrawer(shadowHost.shadowRoot, errorHistoryManager);
    errorDrawer.initialize();

    // Check dark mode setting and apply to drawer
    chrome.storage.sync.get(['darkMode'], (result) => {
      if (result.darkMode && errorDrawer) {
        errorDrawer.setDarkMode(result.darkMode);
      }
    });

    console.log('[Catchy Content] Error drawer initialized');
  }

  // Add keyboard shortcut to toggle drawer (configurable, default: Alt+E)
  document.addEventListener('keydown', (event) => {
    if (checkShortcut(event, drawerShortcut)) {
      event.preventDefault();
      if (errorDrawer) {
        errorDrawer.toggle();
        console.log('[Catchy Content] Error drawer toggled via keyboard shortcut:', drawerShortcut);
      }
    }
  });

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
