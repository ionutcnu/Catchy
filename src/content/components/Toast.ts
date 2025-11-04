/**
 * Toast Component
 *
 * Individual toast notification that displays error information.
 * Each toast is self-contained and handles its own lifecycle.
 */

import type { ErrorType } from '@/types';

export interface ToastData {
  id: string;
  type: ErrorType;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
  timestamp: number;
}

export interface ToastOptions {
  autoCloseMs?: number; // Auto-close after X ms (0 = never)
  onClose?: (id: string) => void; // Callback when toast is closed
}

export class Toast {
  private element: HTMLDivElement;
  private data: ToastData;
  private options: ToastOptions;
  private autoCloseTimer?: number;

  constructor(data: ToastData, options: ToastOptions = {}) {
    this.data = data;
    this.options = {
      autoCloseMs: options.autoCloseMs ?? 5000,
      onClose: options.onClose,
    };

    this.element = this.createToastElement();
    this.setupHoverEvents();
    this.setupAutoClose();
  }

  /**
   * Create the toast DOM element with all its content
   */
  private createToastElement(): HTMLDivElement {
    const toast = document.createElement('div');
    toast.className = 'catchy-toast';
    toast.setAttribute('data-toast-id', this.data.id);
    toast.setAttribute('data-error-type', this.data.type);
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    // Toast header (type badge + close button)
    const header = document.createElement('div');
    header.className = 'catchy-toast-header';

    const typeBadge = document.createElement('span');
    typeBadge.className = 'catchy-toast-type';
    typeBadge.textContent = this.formatErrorType(this.data.type);
    header.appendChild(typeBadge);

    const closeButton = document.createElement('button');
    closeButton.className = 'catchy-toast-close';
    closeButton.setAttribute('aria-label', 'Close notification');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.close());
    header.appendChild(closeButton);

    toast.appendChild(header);

    // Message
    const message = document.createElement('div');
    message.className = 'catchy-toast-message';
    message.textContent = this.data.message;
    toast.appendChild(message);

    // File location (if available)
    if (this.data.file) {
      const location = document.createElement('div');
      location.className = 'catchy-toast-location';
      const locationText = this.data.line
        ? `${this.data.file}:${this.data.line}${this.data.column ? `:${this.data.column}` : ''}`
        : this.data.file;
      location.textContent = locationText;
      toast.appendChild(location);
    }

    // Timestamp
    const time = document.createElement('div');
    time.className = 'catchy-toast-time';
    time.textContent = new Date(this.data.timestamp).toLocaleTimeString();
    toast.appendChild(time);

    return toast;
  }

  /**
   * Format error type for display
   */
  private formatErrorType(type: ErrorType): string {
    const typeMap: Record<ErrorType, string> = {
      'console.error': 'Console Error',
      uncaught: 'Uncaught Error',
      unhandledrejection: 'Unhandled Rejection',
      resource: 'Resource Error',
      network: 'Network Error',
    };
    return typeMap[type] || type;
  }

  /**
   * Setup hover events to pause/resume auto-close
   */
  private setupHoverEvents(): void {
    this.element.addEventListener('mouseenter', () => {
      this.pauseAutoClose();
    });

    this.element.addEventListener('mouseleave', () => {
      this.resumeAutoClose();
    });
  }

  /**
   * Setup auto-close timer if enabled
   */
  private setupAutoClose(): void {
    if (this.options.autoCloseMs && this.options.autoCloseMs > 0) {
      this.autoCloseTimer = window.setTimeout(() => {
        this.close();
      }, this.options.autoCloseMs);
    }
  }

  /**
   * Close the toast with animation
   */
  public close(): void {
    // Clear auto-close timer
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }

    // Add closing animation
    this.element.classList.add('catchy-toast-closing');

    // Wait for animation to complete, then remove
    setTimeout(() => {
      this.remove();
    }, 300); // Match CSS transition duration
  }

  /**
   * Remove the toast from DOM
   */
  public remove(): void {
    this.element.remove();
    this.options.onClose?.(this.data.id);
  }

  /**
   * Get the DOM element
   */
  public getElement(): HTMLDivElement {
    return this.element;
  }

  /**
   * Show the toast (trigger entrance animation)
   */
  public show(): void {
    // Force a reflow to ensure animation triggers
    void this.element.offsetHeight;
    this.element.classList.add('catchy-toast-show');
  }

  /**
   * Pause auto-close (e.g., when user hovers over toast)
   */
  public pauseAutoClose(): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = undefined;
    }
  }

  /**
   * Resume auto-close (e.g., when user stops hovering)
   */
  public resumeAutoClose(): void {
    if (this.options.autoCloseMs && this.options.autoCloseMs > 0 && !this.autoCloseTimer) {
      this.setupAutoClose();
    }
  }
}
