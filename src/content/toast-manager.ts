/**
 * ToastManager
 *
 * Manages the Shadow DOM container and lifecycle of all toast notifications.
 * Singleton pattern - only one instance should exist per page.
 */

import { Toast, type ToastData, type ToastOptions } from './components/Toast';
import type { ToastPosition } from '@/types';

export class ToastManager {
  private shadowRoot: ShadowRoot | null = null;
  private container: HTMLDivElement | null = null;
  private closeAllButton: HTMLButtonElement | null = null;
  private toasts: Map<string, Toast> = new Map();
  private nextId = 0;
  private readonly MAX_TOASTS = 5; // Maximum number of visible toasts
  private position: ToastPosition = 'bottom-right'; // Default position

  /**
   * Initialize the Shadow DOM and inject styles
   */
  public initialize(): void {
    if (this.shadowRoot) {
      console.warn('[Catchy ToastManager] Already initialized');
      return;
    }

    console.log('[Catchy ToastManager] Initializing with default position:', this.position);

    // Create a host element for Shadow DOM
    const host = document.createElement('div');
    host.id = 'catchy-toast-host';
    host.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    `;

    // Create Shadow DOM
    this.shadowRoot = host.attachShadow({ mode: 'open' });

    // Inject styles
    this.injectStyles();

    // Create toast container
    this.container = document.createElement('div');
    this.container.className = 'catchy-toast-container';
    this.updateContainerPosition(); // Apply position classes
    console.log('[Catchy ToastManager] Container created with classes:', this.container.className);
    this.shadowRoot.appendChild(this.container);

    // Create close-all button
    this.closeAllButton = document.createElement('button');
    this.closeAllButton.className = 'catchy-close-all-button';
    this.closeAllButton.textContent = 'Clear All';
    this.closeAllButton.setAttribute('aria-label', 'Close all notifications');
    this.closeAllButton.style.display = 'none'; // Hidden by default
    this.closeAllButton.addEventListener('click', () => this.closeAll());
    this.shadowRoot.appendChild(this.closeAllButton);

    // Add to page
    document.body.appendChild(host);

    if (import.meta.env.DEV) {
      console.log('[Catchy ToastManager] Initialized with Shadow DOM');
    }
  }

  /**
   * Inject CSS styles into Shadow DOM
   * Uses CSS variables for easy theming
   */
  private injectStyles(): void {
    if (!this.shadowRoot) return;

    const style = document.createElement('style');
    style.textContent = `
      /* CSS Variables for theming */
      :host {
        /* Colors */
        --catchy-bg-console: #ff4444;
        --catchy-bg-uncaught: #ff6b35;
        --catchy-bg-rejection: #f7931e;
        --catchy-bg-resource: #fbb034;
        --catchy-bg-network: #c1292e;

        --catchy-text: #ffffff;
        --catchy-text-secondary: rgba(255, 255, 255, 0.8);

        /* Spacing */
        --catchy-radius: 8px;
        --catchy-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        --catchy-gap: 12px;

        /* Position */
        --catchy-position-bottom: 20px;
        --catchy-position-right: 20px;
        --catchy-position-top: 20px;
        --catchy-position-left: 20px;

        /* Typography */
        --catchy-font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        --catchy-font-size: 14px;
        --catchy-line-height: 1.5;
      }

      /* Toast Container */
      .catchy-toast-container {
        position: fixed;
        display: flex;
        flex-direction: column;
        gap: var(--catchy-gap);
        max-width: 400px;
        pointer-events: none;
        z-index: 9999;
      }

      /* Position variants */
      .catchy-toast-container.position-bottom-right {
        bottom: var(--catchy-position-bottom);
        right: var(--catchy-position-right);
      }

      .catchy-toast-container.position-bottom-left {
        bottom: var(--catchy-position-bottom);
        left: var(--catchy-position-left);
      }

      .catchy-toast-container.position-top-right {
        top: var(--catchy-position-top);
        right: var(--catchy-position-right);
        flex-direction: column-reverse;
      }

      .catchy-toast-container.position-top-left {
        top: var(--catchy-position-top);
        left: var(--catchy-position-left);
        flex-direction: column-reverse;
      }

      /* Individual Toast */
      .catchy-toast {
        background: var(--catchy-bg-console);
        color: var(--catchy-text);
        padding: 16px;
        border-radius: var(--catchy-radius);
        box-shadow: var(--catchy-shadow);
        font-family: var(--catchy-font-family);
        font-size: var(--catchy-font-size);
        line-height: var(--catchy-line-height);
        pointer-events: auto;

        /* Animation setup - default right side */
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Left-side animations */
      .position-bottom-left .catchy-toast,
      .position-top-left .catchy-toast {
        transform: translateX(-100%);
      }

      .position-bottom-left .catchy-toast.catchy-toast-closing,
      .position-top-left .catchy-toast.catchy-toast-closing {
        transform: translateX(-100%);
      }

      /* Toast variants by error type */
      .catchy-toast[data-error-type="console.error"] {
        background: var(--catchy-bg-console);
      }
      .catchy-toast[data-error-type="uncaught"] {
        background: var(--catchy-bg-uncaught);
      }
      .catchy-toast[data-error-type="unhandledrejection"] {
        background: var(--catchy-bg-rejection);
      }
      .catchy-toast[data-error-type="resource"] {
        background: var(--catchy-bg-resource);
      }
      .catchy-toast[data-error-type="network"] {
        background: var(--catchy-bg-network);
      }

      /* Show animation */
      .catchy-toast-show {
        opacity: 1;
        transform: translateX(0);
      }

      /* Show animation for left-side toasts - higher specificity */
      .position-bottom-left .catchy-toast.catchy-toast-show,
      .position-top-left .catchy-toast.catchy-toast-show {
        transform: translateX(0);
      }

      /* Closing animation */
      .catchy-toast-closing {
        opacity: 0;
        transform: translateX(100%);
      }

      /* Toast Header */
      .catchy-toast-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      /* Type Badge */
      .catchy-toast-type {
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.9;
      }

      /* Close Button */
      .catchy-toast-close {
        background: none;
        border: none;
        color: var(--catchy-text);
        font-size: 24px;
        line-height: 1;
        padding: 0;
        margin: 0;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .catchy-toast-close:hover {
        opacity: 1;
      }

      /* Message */
      .catchy-toast-message {
        margin-bottom: 8px;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 200px;
        overflow-y: auto;
      }

      /* File Location */
      .catchy-toast-location {
        font-size: 12px;
        opacity: 0.8;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        margin-bottom: 4px;
      }

      /* Timestamp */
      .catchy-toast-time {
        font-size: 11px;
        opacity: 0.6;
        margin-top: 4px;
      }

      /* Hover effects */
      .catchy-toast:hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }

      /* Scrollbar styling for message overflow */
      .catchy-toast-message::-webkit-scrollbar {
        width: 6px;
      }

      .catchy-toast-message::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
      }

      .catchy-toast-message::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
      }

      .catchy-toast-message::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }

      /* Close All Button - Fixed bottom-center */
      .catchy-close-all-button {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: var(--catchy-text);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 8px 16px;
        border-radius: var(--catchy-radius);
        font-family: var(--catchy-font-family);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        pointer-events: auto;
        transition: all 0.2s;
        z-index: 10000;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .catchy-close-all-button:hover {
        background: rgba(0, 0, 0, 0.95);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateX(-50%) translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      .catchy-close-all-button:active {
        transform: translateX(-50%) translateY(0);
      }
    `;

    this.shadowRoot.appendChild(style);
  }

  /**
   * Show a new toast notification
   */
  public showToast(data: Omit<ToastData, 'id'>, options?: ToastOptions): string {
    if (!this.container) {
      console.error('[Catchy ToastManager] Not initialized');
      return '';
    }

    // Check if we've reached max toasts limit
    if (this.toasts.size >= this.MAX_TOASTS) {
      // Remove the oldest toast (first one in the map)
      const oldestId = this.toasts.keys().next().value;
      if (oldestId) {
        this.closeToast(oldestId);
      }
    }

    // Generate unique ID
    const id = `toast-${++this.nextId}-${Date.now()}`;

    // Create toast data with ID
    const toastData: ToastData = { ...data, id };

    // Create toast instance
    const toast = new Toast(toastData, {
      ...options,
      onClose: (closedId) => {
        this.toasts.delete(closedId);
        options?.onClose?.(closedId);
      },
    });

    // Add to container
    this.container.appendChild(toast.getElement());

    // Store reference
    this.toasts.set(id, toast);

    // Show close-all button if we have multiple toasts
    this.updateCloseAllButton();

    // Trigger show animation (next frame)
    requestAnimationFrame(() => {
      toast.show();
    });

    if (import.meta.env.DEV) {
      console.log('[Catchy ToastManager] Toast shown:', id, data.type, `(${this.toasts.size}/${this.MAX_TOASTS})`);
    }

    return id;
  }

  /**
   * Close a specific toast by ID
   */
  public closeToast(id: string): void {
    const toast = this.toasts.get(id);
    if (toast) {
      toast.close();
      // Update close-all button visibility after toast closes
      setTimeout(() => {
        this.updateCloseAllButton();
      }, 300); // Wait for close animation
    }
  }

  /**
   * Close all toasts
   */
  public closeAll(): void {
    for (const toast of this.toasts.values()) {
      toast.close();
    }
    // Hide close-all button immediately
    if (this.closeAllButton) {
      this.closeAllButton.style.display = 'none';
    }
  }

  /**
   * Get count of active toasts
   */
  public getToastCount(): number {
    return this.toasts.size;
  }

  /**
   * Set toast position
   */
  public setPosition(position: ToastPosition): void {
    if (import.meta.env.DEV) {
      console.log('[Catchy ToastManager] Position changed:', this.position, '→', position);
    }
    this.position = position;
    this.updateContainerPosition();
  }

  /**
   * Get current toast position
   */
  public getPosition(): ToastPosition {
    return this.position;
  }

  /**
   * Update container position classes
   */
  private updateContainerPosition(): void {
    if (!this.container) {
      console.warn('[Catchy ToastManager] updateContainerPosition: container is null');
      return;
    }

    // Remove all position classes
    this.container.classList.remove(
      'position-bottom-right',
      'position-bottom-left',
      'position-top-right',
      'position-top-left'
    );

    // Add current position class
    this.container.classList.add(`position-${this.position}`);
  }

  /**
   * Update close-all button visibility
   * Show when 2+ toasts, hide when <2
   */
  private updateCloseAllButton(): void {
    if (!this.closeAllButton) return;

    if (this.toasts.size >= 2) {
      this.closeAllButton.style.display = 'block';
    } else {
      this.closeAllButton.style.display = 'none';
    }
  }

  /**
   * Destroy the toast manager and clean up
   */
  public destroy(): void {
    this.closeAll();
    const host = document.getElementById('catchy-toast-host');
    host?.remove();
    this.shadowRoot = null;
    this.container = null;
    this.toasts.clear();

    if (import.meta.env.DEV) {
      console.log('[Catchy ToastManager] Destroyed');
    }
  }
}

// Export singleton instance
export const toastManager = new ToastManager();
