/**
 * TypeScript Type Definitions for Catchy Extension
 *
 * These types define the data structures used throughout the extension.
 * Think of them as "blueprints" that describe what data looks like.
 */

/**
 * Error captured from a web page
 */
export interface CatchyError {
  id: string; // Unique identifier for this error
  message: string; // Error message text
  stack?: string; // Stack trace (if available)
  type: ErrorType; // What kind of error is this?
  url: string; // URL where the error occurred
  timestamp: number; // When it happened (milliseconds since epoch)
  count: number; // How many times this error occurred (for grouping)
  file?: string; // Source file (e.g., "app.js:123")
  line?: number; // Line number
  column?: number; // Column number
}

/**
 * Types of errors we can catch
 */
export type ErrorType =
  | 'console.error' // console.error() calls
  | 'uncaught' // Uncaught exceptions (window.onerror)
  | 'unhandledrejection'; // Unhandled promise rejections

/**
 * Toast notification position on screen
 */
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/**
 * Toast notification size
 */
export type ToastSize = 'small' | 'medium' | 'large' | 'custom';

/**
 * Extension settings saved in chrome.storage
 */
export interface CatchySettings {
  enabled: boolean; // Is extension active globally?
  perSiteSettings: {
    // Per-website settings
    [hostname: string]: {
      enabled: boolean; // Is extension active on this site?
    };
  };

  // Error filtering
  errorTypes: {
    // Which error types to show
    consoleError: boolean;
    uncaught: boolean;
    unhandledRejection: boolean;
  };

  // Ignore rules (planned feature - not yet implemented)
  ignoreRules?: IgnoreRule[]; // List of rules to filter out errors (optional until implemented)

  // UI settings
  theme: {
    position: ToastPosition;
    maxToasts: number; // Max toasts to show at once
    autoCloseMs: number; // Auto-close after X milliseconds (0 = never)
    swipeToDismiss: boolean; // Enable swipe-to-dismiss gesture
    persistPinnedToasts: boolean; // Persist pinned toasts across page refreshes
    toastSize: ToastSize; // Size of toast notifications
    customWidth?: number; // Custom width in pixels (when toastSize is 'custom')
    customHeight?: number; // Custom height in pixels (when toastSize is 'custom')
    maxHistorySize: number; // Max errors to keep in history (5-50)
    drawerShortcut: string; // Keyboard shortcut to open error drawer (e.g., "Alt+E")

    // Visual customization - Per-error-type colors
    backgroundColors: {
      console: string; // Background for console.error
      uncaught: string; // Background for uncaught exceptions
      rejection: string; // Background for unhandled promise rejections
    };
    textColors: {
      console: string; // Text color for console.error
      uncaught: string; // Text color for uncaught exceptions
      rejection: string; // Text color for unhandled promise rejections
    };

    // Global styling
    borderRadius: number; // Border radius in pixels (0-24)
    shadow: boolean; // Enable/disable drop shadow
    spacing: number; // Gap between toasts in pixels (4-32)
  };

  // Rate limiting
  rateLimit: {
    maxPerInterval: number; // Max toasts per interval
    intervalMs: number; // Interval in milliseconds
  };
}

/**
 * Rule to ignore/filter certain errors
 */
export interface IgnoreRule {
  id: string; // Unique identifier
  type: 'regex' | 'substring'; // How to match
  scope: 'message' | 'stack' | 'url'; // What to match against
  pattern: string; // The pattern to match
  origin: 'global' | string; // Apply globally or to specific hostname
  enabled: boolean; // Is this rule active?
}

/**
 * Messages sent between different parts of the extension
 */
export type ExtensionMessage =
  | { type: 'ERROR_CAPTURED'; error: CatchyError }
  | { type: 'GET_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<CatchySettings> }
  | { type: 'TOGGLE_ENABLED' }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'OPEN_DRAWER' };

/**
 * Default settings for first-time users
 */
export const DEFAULT_SETTINGS: CatchySettings = {
  enabled: false, // Disabled globally by default - opt-in per site
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
    autoCloseMs: 0,
    swipeToDismiss: true,
    persistPinnedToasts: false,
    toastSize: 'medium',
    customWidth: 400,
    customHeight: 100,
    maxHistorySize: 25,
    drawerShortcut: '`', // Default keyboard shortcut (backtick/tilde key)

    // Visual customization defaults - Per-error-type colors
    backgroundColors: {
      console: '#dc2626', // Red-600 (console.error)
      uncaught: '#ea580c', // Orange-600 (uncaught exceptions)
      rejection: '#f59e0b', // Amber-500 (promise rejections)
    },
    textColors: {
      console: '#ffffff', // White for dark red
      uncaught: '#ffffff', // White for dark orange
      rejection: '#ffffff', // White for amber
    },

    // Global styling defaults
    borderRadius: 8, // 8px rounded corners
    shadow: true, // Drop shadow enabled
    spacing: 12, // 12px gap between toasts
  },
  rateLimit: {
    maxPerInterval: 5,
    intervalMs: 4000,
  },
};

/**
 * Calculate the best text color (black or white) for a given background color
 * Uses relative luminance formula from WCAG 2.0
 * @param bgColor - Background color in hex format (e.g., '#dc2626')
 * @returns '#000000' for light backgrounds, '#ffffff' for dark backgrounds
 */
export function getAutoTextColor(bgColor: string): string {
  // Remove # if present
  const hex = bgColor.replace('#', '');

  // Parse RGB values
  const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
  const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
  const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

  // Calculate relative luminance
  const luminance =
    0.2126 * (r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4) +
    0.7152 * (g <= 0.03928 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4) +
    0.0722 * (b <= 0.03928 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4);

  // Use white text for dark backgrounds (luminance < 0.5), black for light
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
