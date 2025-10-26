/**
 * Injected Script (runs in page context)
 *
 * WHY THIS EXISTS:
 * Content scripts run in an "isolated world" - they can't access the page's JavaScript directly.
 * But to catch errors BEFORE they happen, we need to patch console.error, window.onerror, etc.
 * So we inject this script into the actual page context using a <script> tag.
 *
 * This script:
 * 1. Patches console.error to intercept calls
 * 2. Listens for window.onerror (uncaught exceptions)
 * 3. Listens for unhandledrejection (promise rejections)
 * 4. Sends captured errors to content script via window.postMessage
 */

(function () {
  console.log('[Catchy Inject] Error catcher initialized');

  // Store original console.error so we can still call it
  const originalConsoleError = console.error;

  /**
   * Send error to content script
   * We use postMessage because inject script can't use chrome.runtime directly
   */
  function sendError(error: any) {
    window.postMessage(
      {
        source: 'catchy-inject',
        type: 'ERROR_CAPTURED',
        error,
      },
      '*'
    );
  }

  /**
   * PATCH 1: Intercept console.error() calls
   */
  console.error = function (...args: any[]) {
    // Build error message from arguments
    const message = args
      .map((arg) => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      })
      .join(' ');

    // Send to Catchy
    sendError({
      type: 'console.error',
      message,
      url: window.location.href,
      timestamp: Date.now(),
    });

    // Still call original console.error so DevTools works normally
    originalConsoleError.apply(console, args);
  };

  /**
   * PATCH 2: Catch uncaught exceptions
   * window.onerror fires when JavaScript errors aren't caught
   */
  window.addEventListener('error', (event) => {
    // Skip if it's a resource loading error (we handle those separately)
    if (event.target !== window) {
      return;
    }

    sendError({
      type: 'uncaught',
      message: event.message,
      file: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack,
      url: window.location.href,
      timestamp: Date.now(),
    });
  });

  /**
   * PATCH 3: Catch unhandled promise rejections
   * Fires when a Promise rejects and there's no .catch() handler
   */
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;

    // Extract message from Error object or use as-is
    let message = 'Unhandled Promise Rejection';
    let stack: string | undefined;

    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else {
      message = JSON.stringify(reason, null, 2);
    }

    sendError({
      type: 'unhandledrejection',
      message,
      stack,
      url: window.location.href,
      timestamp: Date.now(),
    });
  });

  console.log('[Catchy Inject] Error handlers installed');
})();
