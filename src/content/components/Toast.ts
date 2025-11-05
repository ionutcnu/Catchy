/**
 * Toast Component
 *
 * Individual toast notification that displays error information.
 * Each toast is self-contained and handles its own lifecycle.
 */

import type { ErrorType, ToastPosition } from '@/types';

export interface ToastData {
  id: string;
  type: ErrorType;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
  timestamp: number;
  isPinned?: boolean;
  count?: number; // Number of times this error occurred
}

export interface ToastOptions {
  autoCloseMs?: number; // Auto-close after X ms (0 = never)
  onClose?: (id: string) => void; // Callback when toast is closed
  onPinToggle?: (id: string, isPinned: boolean) => void; // Callback when pin state changes
  position?: ToastPosition; // Position of toast container (for swipe direction)
  swipeToDismiss?: boolean; // Enable swipe-to-dismiss gesture
}

export class Toast {
  private element: HTMLDivElement;
  private data: ToastData;
  private options: ToastOptions;
  private autoCloseTimer?: number;
  private counterBadge: HTMLSpanElement | null = null;

  // Swipe-to-dismiss state
  private startX = 0;
  private currentX = 0;
  private isDragging = false;
  private hasMoved = false;
  private readonly SWIPE_THRESHOLD = 150; // pixels to trigger dismiss
  private readonly MOVE_THRESHOLD = 5; // pixels to detect intentional drag vs click

  constructor(data: ToastData, options: ToastOptions = {}) {
    this.data = data;
    this.options = {
      autoCloseMs: options.autoCloseMs ?? 5000,
      onClose: options.onClose,
      position: options.position ?? 'bottom-right',
      swipeToDismiss: options.swipeToDismiss ?? true,
    };

    this.element = this.createToastElement();
    this.setupHoverEvents();

    // Only setup swipe events if enabled
    if (this.options.swipeToDismiss) {
      this.setupSwipeEvents();
    }

    this.setupAutoClose();
  }

  /**
   * Create the toast DOM element with all its content
   */
  private createToastElement(): HTMLDivElement {
    const toast = document.createElement('div');
    toast.className = 'catchy-toast';

    // Add draggable class only if swipe-to-dismiss is enabled
    if (this.options.swipeToDismiss) {
      toast.classList.add('catchy-toast-draggable');
    }

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

    // Counter badge (only show if count > 1)
    if (this.data.count && this.data.count > 1) {
      this.counterBadge = document.createElement('span');
      this.counterBadge.className = 'catchy-toast-counter';
      this.counterBadge.textContent = `×${this.data.count}`;
      header.appendChild(this.counterBadge);
    }

    // Button container for pin and close buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'catchy-toast-buttons';

    const pinButton = document.createElement('button');
    pinButton.className = 'catchy-toast-pin';
    pinButton.setAttribute('aria-label', this.data.isPinned ? 'Unpin notification' : 'Pin notification');
    pinButton.innerHTML = this.getPinIconSVG(this.data.isPinned ?? false);
    pinButton.addEventListener('click', () => this.togglePin());
    buttonContainer.appendChild(pinButton);

    const closeButton = document.createElement('button');
    closeButton.className = 'catchy-toast-close';
    closeButton.setAttribute('aria-label', 'Close notification');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => this.close());
    buttonContainer.appendChild(closeButton);

    header.appendChild(buttonContainer);

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
   * Get pin icon SVG based on pinned state
   */
  private getPinIconSVG(isPinned: boolean): string {
    if (isPinned) {
      // Filled pin icon
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
      </svg>`;
    } else {
      // Outlined pin icon
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
      </svg>`;
    }
  }

  /**
   * Toggle pin state
   */
  public togglePin(): void {
    this.data.isPinned = !this.data.isPinned;

    // Update pin button
    const pinButton = this.element.querySelector('.catchy-toast-pin') as HTMLButtonElement;
    if (pinButton) {
      pinButton.innerHTML = this.getPinIconSVG(this.data.isPinned);
      pinButton.setAttribute('aria-label', this.data.isPinned ? 'Unpin notification' : 'Pin notification');
    }

    // Update visual state
    if (this.data.isPinned) {
      this.element.classList.add('catchy-toast-pinned');
      this.pauseAutoClose(); // Stop auto-close timer
    } else {
      this.element.classList.remove('catchy-toast-pinned');
      this.resumeAutoClose(); // Resume auto-close if applicable
    }

    // Notify ToastManager
    this.options.onPinToggle?.(this.data.id, this.data.isPinned);
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
   * Setup swipe-to-dismiss with mouse drag
   */
  private setupSwipeEvents(): void {
    // Mousedown - start tracking potential drag
    this.element.addEventListener('mousedown', (e) => {
      // Only track left mouse button
      if (e.button !== 0) return;

      // Don't interfere with text selection
      const target = e.target as HTMLElement;
      if (target.classList.contains('catchy-toast-message') ||
          target.classList.contains('catchy-toast-location')) {
        return;
      }

      this.isDragging = true;
      this.hasMoved = false;
      this.startX = e.clientX;
      this.currentX = e.clientX;

      // Pause auto-close while potentially dragging
      this.pauseAutoClose();
    });

    // Mousemove - update position only if moved beyond threshold
    const handleMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;

      this.currentX = e.clientX;
      const deltaX = this.currentX - this.startX;
      const absDistance = Math.abs(deltaX);

      // Only start actual dragging if moved beyond threshold
      if (!this.hasMoved && absDistance < this.MOVE_THRESHOLD) {
        return;
      }

      // Mark as moved and prevent text selection from now on
      if (!this.hasMoved) {
        this.hasMoved = true;
        this.element.style.userSelect = 'none';
      }

      // Only allow movement in the correct direction based on position
      const isRightSide = this.options.position?.includes('right') ?? true;
      const isValidDirection = isRightSide ? deltaX > 0 : deltaX < 0;

      if (isValidDirection) {
        // Apply transform for visual feedback
        this.element.style.transform = `translateX(${deltaX}px)`;
        this.element.style.transition = 'none'; // Disable transition during drag
      }
    };

    // Mouseup - check if should dismiss
    const handleMouseUp = (e: MouseEvent) => {
      if (!this.isDragging) return;

      this.isDragging = false;
      const deltaX = e.clientX - this.startX;
      const absDistance = Math.abs(deltaX);

      // Re-enable text selection
      this.element.style.userSelect = '';

      // Check if swipe threshold met (only if actually moved)
      const isRightSide = this.options.position?.includes('right') ?? true;
      const isValidDirection = isRightSide ? deltaX > 0 : deltaX < 0;

      if (this.hasMoved && isValidDirection && absDistance >= this.SWIPE_THRESHOLD) {
        // Dismiss with swipe animation
        this.dismissWithSwipe(isRightSide);
      } else if (this.hasMoved) {
        // Snap back to original position
        this.element.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        this.element.style.transform = 'translateX(0)';

        // Resume auto-close if applicable
        this.resumeAutoClose();
      } else {
        // No movement - was just a click, resume auto-close
        this.resumeAutoClose();
      }

      // Reset moved flag
      this.hasMoved = false;
    };

    // Attach global listeners for mousemove and mouseup
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Clean up on remove
    const originalRemove = this.remove.bind(this);
    this.remove = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      originalRemove();
    };
  }

  /**
   * Dismiss toast with swipe animation
   */
  private dismissWithSwipe(isRightSide: boolean): void {
    // Animate out in swipe direction
    this.element.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s';
    this.element.style.transform = `translateX(${isRightSide ? '400px' : '-400px'})`;
    this.element.style.opacity = '0';

    // Remove after animation
    setTimeout(() => {
      this.remove();
    }, 300);
  }

  /**
   * Setup auto-close timer if enabled
   */
  private setupAutoClose(): void {
    // Don't auto-close if pinned
    if (this.data.isPinned) {
      return;
    }

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
   * Get the toast data
   */
  public getData(): ToastData {
    return this.data;
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

  /**
   * Increment the error counter when a duplicate error occurs
   */
  public incrementCounter(): void {
    // Increment the count
    this.data.count = (this.data.count || 1) + 1;

    // Create counter badge if it doesn't exist
    if (!this.counterBadge) {
      this.counterBadge = document.createElement('span');
      this.counterBadge.className = 'catchy-toast-counter';

      // Insert counter after type badge
      const header = this.element.querySelector('.catchy-toast-header');
      const typeBadge = header?.querySelector('.catchy-toast-type');
      if (typeBadge && header) {
        typeBadge.after(this.counterBadge);
      }
    }

    // Update counter text
    this.counterBadge.textContent = `×${this.data.count}`;

    // Add pulse animation
    this.counterBadge.classList.remove('catchy-toast-counter-pulse');
    // Force reflow to restart animation
    void this.counterBadge.offsetWidth;
    this.counterBadge.classList.add('catchy-toast-counter-pulse');

    // Update timestamp to latest occurrence
    this.data.timestamp = Date.now();
    const timeElement = this.element.querySelector('.catchy-toast-time');
    if (timeElement) {
      timeElement.textContent = new Date(this.data.timestamp).toLocaleTimeString();
    }
  }
}
