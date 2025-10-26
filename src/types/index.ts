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
  id: string;                  // Unique identifier for this error
  message: string;             // Error message text
  stack?: string;              // Stack trace (if available)
  type: ErrorType;             // What kind of error is this?
  url: string;                 // URL where the error occurred
  timestamp: number;           // When it happened (milliseconds since epoch)
  count: number;               // How many times this error occurred (for grouping)
  file?: string;               // Source file (e.g., "app.js:123")
  line?: number;               // Line number
  column?: number;             // Column number
}

/**
 * Types of errors we can catch
 */
export type ErrorType =
  | 'console.error'           // console.error() calls
  | 'uncaught'                // Uncaught exceptions (window.onerror)
  | 'unhandledrejection'      // Unhandled promise rejections
  | 'resource'                // Failed resource loads (images, scripts, etc.)
  | 'network';                // Network/fetch errors

/**
 * Extension settings saved in chrome.storage
 */
export interface CatchySettings {
  enabled: boolean;            // Is extension active globally?
  perSiteSettings: {           // Per-website settings
    [hostname: string]: {
      enabled: boolean;        // Is extension active on this site?
    };
  };

  // Error filtering
  errorTypes: {                // Which error types to show
    consoleError: boolean;
    uncaught: boolean;
    unhandledRejection: boolean;
    resource: boolean;
    network: boolean;
  };

  // Ignore rules
  ignoreRules: IgnoreRule[];   // List of rules to filter out errors

  // UI settings
  theme: {
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    maxToasts: number;         // Max toasts to show at once
    autoCloseMs: number;       // Auto-close after X milliseconds (0 = never)
  };

  // Rate limiting
  rateLimit: {
    maxPerInterval: number;    // Max toasts per interval
    intervalMs: number;        // Interval in milliseconds
  };
}

/**
 * Rule to ignore/filter certain errors
 */
export interface IgnoreRule {
  id: string;                  // Unique identifier
  type: 'regex' | 'substring'; // How to match
  scope: 'message' | 'stack' | 'url'; // What to match against
  pattern: string;             // The pattern to match
  origin: 'global' | string;   // Apply globally or to specific hostname
  enabled: boolean;            // Is this rule active?
}

/**
 * Messages sent between different parts of the extension
 */
export type ExtensionMessage =
  | { type: 'ERROR_CAPTURED'; error: CatchyError }
  | { type: 'GET_SETTINGS'; }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<CatchySettings> }
  | { type: 'TOGGLE_ENABLED'; }
  | { type: 'CLEAR_ERRORS'; };

/**
 * Default settings for first-time users
 */
export const DEFAULT_SETTINGS: CatchySettings = {
  enabled: true,
  perSiteSettings: {},
  errorTypes: {
    consoleError: true,
    uncaught: true,
    unhandledRejection: true,
    resource: false,
    network: false,
  },
  ignoreRules: [],
  theme: {
    position: 'bottom-right',
    maxToasts: 5,
    autoCloseMs: 0,
  },
  rateLimit: {
    maxPerInterval: 5,
    intervalMs: 4000,
  },
};
