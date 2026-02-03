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
  enabled: true,
  perSiteSettings: {},
  errorTypes: {
    consoleError: true,
    uncaught: true,
    unhandledRejection: true,
  },
  // ignoreRules: [], // Planned feature - not yet implemented
  theme: {
    position: 'bottom-right',
    maxToasts: 5,
    autoCloseMs: 5000,
    swipeToDismiss: true,
    persistPinnedToasts: true,
    toastSize: 'medium',
    customWidth: 400,
    customHeight: 100,
    maxHistorySize: 25,
    drawerShortcut: '`',
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
let drawerShortcut = DEFAULT_SETTINGS.theme.drawerShortcut; // Default keyboard shortcut for opening drawer
// let ignoreButtonThreshold = 3; // Show ignore button after X error occurrences (unused)

/**
 * Extension initialization state
 * Prevents processing errors before permanent ignores are loaded
 */
let isInitialized = false;

/**
 * Error ignore tracking (2 scopes: session, permanent)
 * - Session: In-memory Set, clears on page reload
 * - Permanent: chrome.storage.local, persists across browser restarts
 */
const sessionIgnoreList: Set<string> = new Set(); // Session-only ignores (clears on page reload)
const permanentIgnoreList: Set<string> = new Set(); // Permanent ignores (cached from chrome.storage.local)
const MAX_SESSION_IGNORES = 1000; // Maximum number of errors to track in session ignore list

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
function getErrorSignature(error: { type: string; message: string }): string {
  return `${error.type}::${error.message}`;
}

/**
 * Check if error should be shown (not in session or permanent ignore list)
 */
function shouldShowError(signature: string): boolean {
  // Check session ignores (cleared on page reload)
  if (sessionIgnoreList.has(signature)) {
    if (import.meta.env.DEV) {
      console.log('[Catchy Content] Error blocked by session ignore:', signature);
    }
    return false;
  }

  // Check permanent ignores (chrome.storage.local) - synchronous check using cached value
  if (permanentIgnoreList.has(signature)) {
    if (import.meta.env.DEV) {
      console.log('[Catchy Content] Error blocked by permanent ignore:', signature);
    }
    return false;
  }

  if (import.meta.env.DEV) {
    console.log('[Catchy Content] Error NOT ignored, will show:', signature);
  }
  return true; // Not ignored
}

/**
 * Add error signature to session ignore list with size limiting
 * Prevents unbounded growth by removing oldest entries when limit is reached
 */
function addToSessionIgnoreList(signature: string): void {
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
}

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
 * Load permanent ignore list from chrome.storage.local
 * This caches the list in memory for fast checks
 */
async function loadPermanentIgnores() {
  try {
    const result = await chrome.storage.local.get(['ignoredErrorSignatures']);
    const ignoreList: string[] = result.ignoredErrorSignatures || [];

    // Clear and populate the in-memory cache
    permanentIgnoreList.clear();
    for (const signature of ignoreList) {
      permanentIgnoreList.add(signature);
    }

    if (import.meta.env.DEV) {
      console.log('[Catchy Content] Loaded permanent ignores:', ignoreList.length);
    }
  } catch (error) {
    console.error('[Catchy Content] Failed to load permanent ignores:', error);
  }
}

/**
 * Load settings from Chrome storage and update our cache
 * This runs once when the content script first loads
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['settings']);
    const settings = result.settings || DEFAULT_SETTINGS;

    // Migrate old backgroundColor/textColor to new structure
    let needsMigration = false;
    if (settings.theme?.backgroundColor && !settings.theme?.backgroundColors) {
      const oldBg = settings.theme.backgroundColor;
      settings.theme.backgroundColors = {
        console: oldBg,
        uncaught: oldBg,
        rejection: oldBg,
        resource: oldBg,
        network: oldBg,
      };
      delete settings.theme.backgroundColor;
      needsMigration = true;
      console.log('[Catchy Content] Migrated old backgroundColor to backgroundColors');
    }
    if (settings.theme?.textColor && !settings.theme?.textColors) {
      const oldText = settings.theme.textColor;
      settings.theme.textColors = {
        console: oldText,
        uncaught: oldText,
        rejection: oldText,
        resource: oldText,
        network: oldText,
      };
      delete settings.theme.textColor;
      needsMigration = true;
      console.log('[Catchy Content] Migrated old textColor to textColors');
    }

    // Persist migration changes to storage
    if (needsMigration) {
      chrome.storage.sync.set({ settings }, () => {
        if (chrome.runtime.lastError) {
          console.error('[Catchy Content] Failed to persist migration:', chrome.runtime.lastError);
        } else {
          console.log('[Catchy Content] Migration persisted to storage');
        }
      });
    }

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

    // Apply visual customization settings
    if (settings.theme?.backgroundColors) {
      toastManager.setBackgroundColors(settings.theme.backgroundColors);
    }
    if (settings.theme?.textColors) {
      toastManager.setTextColors(settings.theme.textColors);
    }
    if (settings.theme?.borderRadius !== undefined) {
      toastManager.setBorderRadius(settings.theme.borderRadius);
    }
    if (settings.theme?.shadow !== undefined) {
      toastManager.setShadow(settings.theme.shadow);
    }
    if (settings.theme?.spacing !== undefined) {
      toastManager.setSpacing(settings.theme.spacing);
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
    // Check 0: Wait for initialization (prevents race condition with permanent ignores loading)
    if (!isInitialized) {
      console.log('[Catchy Content] Extension still initializing, skipping error');
      return;
    }

    // Check 1: Is extension enabled for current site? (combines global + per-site logic)
    if (!isEnabledForCurrentSite) {
      console.log('[Catchy Content] Disabled for', window.location.hostname, ', ignoring error');
      return;
    }

    // Check 2: Error type filter
    const errorType = event.data.error.type;
    const isErrorTypeEnabled = isErrorTypeAllowed(errorType);

    if (!isErrorTypeEnabled) {
      console.log('[Catchy Content] Error type disabled:', errorType);
      return;
    }

    // Check 3: Ignore list (session + permanent)
    const errorSignature = getErrorSignature(event.data.error);
    if (!shouldShowError(errorSignature)) {
      console.log('[Catchy Content] Error ignored:', errorSignature);
      return;
    }

    showToast(event.data.error);
  }
});

/**
 * Handle error ignore action from Toast component
 * Supports session (until reload) and permanent (forever) scopes
 */
function handleErrorIgnore(signature: string, scope: 'session' | 'permanent'): void {
  console.log('[Catchy Content] === IGNORING ERROR ===');
  console.log('[Catchy Content] Scope:', scope);
  console.log('[Catchy Content] Signature to ignore:', signature);

  if (scope === 'session') {
    // Add to session ignore list (clears on page reload)
    addToSessionIgnoreList(signature);
    if (import.meta.env.DEV) {
      console.log('[Catchy Content] ✓ Added to session ignore list');
      console.log('[Catchy Content] Total session ignores:', sessionIgnoreList.size);
    }
  } else if (scope === 'permanent') {
    // Add to in-memory permanent ignore list and persist to storage
    if (!permanentIgnoreList.has(signature)) {
      permanentIgnoreList.add(signature);

      // Persist in-memory list to storage
      chrome.storage.local.set({ ignoredErrorSignatures: Array.from(permanentIgnoreList) }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            '[Catchy Content] Failed to save permanent ignore:',
            chrome.runtime.lastError
          );
          // Rollback on error
          permanentIgnoreList.delete(signature);
          return;
        }

        console.log(
          '[Catchy Content] ✓ Added to permanent ignore list. Total:',
          permanentIgnoreList.size
        );
      });
    } else {
      if (import.meta.env.DEV) {
        console.log('[Catchy Content] Signature already in permanent ignore list');
      }
    }
  }
}

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

    // Update visual customization settings if changed
    if (newSettings.theme?.backgroundColors) {
      toastManager.setBackgroundColors(newSettings.theme.backgroundColors);
      console.log('[Catchy Content] Background colors changed');
    }
    if (newSettings.theme?.textColors) {
      toastManager.setTextColors(newSettings.theme.textColors);
      console.log('[Catchy Content] Text colors changed');
    }
    if (newSettings.theme?.borderRadius !== undefined) {
      toastManager.setBorderRadius(newSettings.theme.borderRadius);
      console.log('[Catchy Content] Border radius changed to:', newSettings.theme.borderRadius);
    }
    if (newSettings.theme?.shadow !== undefined) {
      toastManager.setShadow(newSettings.theme.shadow);
      console.log('[Catchy Content] Shadow changed to:', newSettings.theme.shadow);
    }
    if (newSettings.theme?.spacing !== undefined) {
      toastManager.setSpacing(newSettings.theme.spacing);
      console.log('[Catchy Content] Spacing changed to:', newSettings.theme.spacing);
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

  // Watch for permanent ignore changes from other tabs (local storage)
  if (areaName === 'local' && changes.ignoredErrorSignatures) {
    const newIgnoreList: string[] = changes.ignoredErrorSignatures.newValue || [];
    console.log(
      '[Catchy Content] Permanent ignores changed in another tab, updating...',
      newIgnoreList.length
    );

    // Update in-memory set directly to avoid async race conditions
    permanentIgnoreList.clear();
    for (const signature of newIgnoreList) {
      permanentIgnoreList.add(signature);
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
 *
 * CRITICAL SEQUENCE:
 * 1. Load settings (for toast position)
 * 2. Load permanent ignores (prevent race condition)
 * 3. Initialize ToastManager
 * 4. Set isInitialized flag (allows error processing)
 */
async function initializeExtension() {
  // CRITICAL: Load settings FIRST before initializing ToastManager
  // This ensures the position is set before the container is created
  await loadSettings();

  // Load permanent ignore list BEFORE allowing error processing
  await loadPermanentIgnores();

  // Initialize ToastManager with Shadow DOM (will use the position from settings)
  toastManager.initialize();

  // Mark as initialized - now safe to process errors from inject script
  isInitialized = true;

  // Set up ignore callback for toasts
  toastManager.setOnIgnore((_toastId, signature, scope) => {
    handleErrorIgnore(signature, scope);
  });

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
