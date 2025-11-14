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
  showIgnoreButton?: boolean; // Show ignore button (based on error count threshold)
  onIgnore?: (id: string, signature: string, scope: 'session' | 'browser' | 'permanent') => void; // Callback when error is ignored
  errorSignature?: string; // Error signature for ignore matching
  ignoreButtonThreshold?: number; // Threshold for showing ignore button
}

export class Toast {
  private element: HTMLDivElement;
  private data: ToastData;
  private options: ToastOptions;
  private autoCloseTimer?: number;
  private counterBadge: HTMLSpanElement | null = null;
  private ignoreMenu: HTMLDivElement | null = null;
  private isIgnoreMenuOpen = false;

  // Swipe-to-dismiss state
  private startX = 0;
  private currentX = 0;
  private isDragging = false;
  private hasMoved = false;
  private readonly SWIPE_THRESHOLD = 150; // pixels to trigger dismiss
  private readonly MOVE_THRESHOLD = 5; // pixels to detect intentional drag vs click

  constructor(data: ToastData, options: ToastOptions = {}) {
    this.data = data;
    // Spread all options to preserve callbacks like onIgnore, errorSignature, etc.
    this.options = {
      autoCloseMs: 5000,
      position: 'bottom-right',
      swipeToDismiss: true,
      ...options, // Spread all options including onIgnore, errorSignature, showIgnoreButton, etc.
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

    // Button container for copy, pin, ignore (conditional), and close buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'catchy-toast-buttons';

    // Copy button (most used - first)
    const copyButton = document.createElement('button');
    copyButton.className = 'catchy-toast-copy';
    copyButton.setAttribute('aria-label', 'Copy error to clipboard');
    copyButton.innerHTML = this.getCopyIconSVG();
    copyButton.addEventListener('click', () => this.copyToClipboard());
    buttonContainer.appendChild(copyButton);

    // Pin button (second)
    const pinButton = document.createElement('button');
    pinButton.className = 'catchy-toast-pin';
    pinButton.setAttribute(
      'aria-label',
      this.data.isPinned ? 'Unpin notification' : 'Pin notification'
    );
    pinButton.innerHTML = this.getPinIconSVG(this.data.isPinned ?? false);
    pinButton.addEventListener('click', () => this.togglePin());
    buttonContainer.appendChild(pinButton);

    // Ignore button (conditional - only if threshold met)
    if (this.options.showIgnoreButton) {
      const ignoreButton = document.createElement('button');
      ignoreButton.className = 'catchy-toast-ignore';
      ignoreButton.setAttribute('aria-label', 'Ignore this error');
      ignoreButton.innerHTML = this.getIgnoreIconSVG();
      ignoreButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleIgnoreMenu();
      });
      buttonContainer.appendChild(ignoreButton);
    }

    // Close button (last - safe action)
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
   * Get copy icon SVG
   */
  private getCopyIconSVG(): string {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>`;
  }

  /**
   * Get ignore icon SVG (eye with slash)
   */
  private getIgnoreIconSVG(): string {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>`;
  }

  /**
   * Toggle ignore menu dropdown
   */
  private toggleIgnoreMenu(): void {
    if (this.isIgnoreMenuOpen) {
      this.closeIgnoreMenu();
    } else {
      this.openIgnoreMenu();
    }
  }

  /**
   * Open ignore menu dropdown
   */
  private openIgnoreMenu(): void {
    // Close any existing menu first
    if (this.ignoreMenu) {
      this.closeIgnoreMenu();
    }

    // Create menu
    this.ignoreMenu = document.createElement('div');
    this.ignoreMenu.className = 'catchy-ignore-menu';

    // Menu options
    const options = [
      { label: 'This session only', scope: 'session' as const, description: 'Until page reload' },
      { label: 'Until browser restart', scope: 'browser' as const, description: 'Until browser closes' },
      { label: 'Permanently', scope: 'permanent' as const, description: 'Forever' },
    ];

    options.forEach((option) => {
      const item = document.createElement('div');
      item.className = 'catchy-ignore-menu-item';

      const labelDiv = document.createElement('div');
      labelDiv.className = 'catchy-ignore-menu-label';
      labelDiv.textContent = option.label;

      const descDiv = document.createElement('div');
      descDiv.className = 'catchy-ignore-menu-description';
      descDiv.textContent = option.description;

      item.appendChild(labelDiv);
      item.appendChild(descDiv);

      item.addEventListener('click', (e) => {
        console.log('[Catchy Toast] Menu item clicked!', option.scope);
        e.stopPropagation(); // Prevent event from bubbling
        this.handleIgnore(option.scope);
      });

      this.ignoreMenu!.appendChild(item);
    });

    // Add menu to toast
    this.element.appendChild(this.ignoreMenu);
    this.isIgnoreMenuOpen = true;

    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 0);
  }

  /**
   * Close ignore menu dropdown
   */
  private closeIgnoreMenu(): void {
    if (this.ignoreMenu) {
      this.ignoreMenu.remove();
      this.ignoreMenu = null;
    }
    this.isIgnoreMenuOpen = false;
    document.removeEventListener('click', this.handleOutsideClick);
  }

  /**
   * Handle click outside ignore menu to close it
   */
  private handleOutsideClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    if (!target.closest('.catchy-ignore-menu') && !target.closest('.catchy-toast-ignore')) {
      this.closeIgnoreMenu();
    }
  };

  /**
   * Handle ignore action for a specific scope
   */
  private handleIgnore(scope: 'session' | 'browser' | 'permanent'): void {
    console.log('[Catchy Toast] handleIgnore called with scope:', scope);
    const signature = this.options.errorSignature || `${this.data.type}::${this.data.message}`;
    console.log('[Catchy Toast] Signature:', signature);
    console.log('[Catchy Toast] onIgnore callback exists:', !!this.options.onIgnore);

    // Close menu and toast
    this.closeIgnoreMenu();

    // Notify callback
    if (this.options.onIgnore) {
      console.log('[Catchy Toast] Calling onIgnore callback...');
      this.options.onIgnore(this.data.id, signature, scope);
      console.log('[Catchy Toast] onIgnore callback completed');
    } else {
      console.warn('[Catchy Toast] No onIgnore callback provided!');
    }

    // Close the toast
    this.close();

    if (import.meta.env.DEV) {
      console.log('[Catchy Toast] Error ignored:', signature, 'Scope:', scope);
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
      pinButton.setAttribute(
        'aria-label',
        this.data.isPinned ? 'Unpin notification' : 'Pin notification'
      );
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
   * Copy error message to clipboard
   */
  private async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.data.message);

      // Visual feedback - briefly change icon to checkmark
      const copyButton = this.element.querySelector('.catchy-toast-copy') as HTMLButtonElement;
      if (copyButton) {
        const originalIcon = copyButton.innerHTML;
        copyButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>`;
        copyButton.style.color = '#10b981'; // Green color

        setTimeout(() => {
          copyButton.innerHTML = originalIcon;
          copyButton.style.color = '';
        }, 1500);
      }

      if (import.meta.env.DEV) {
        console.log('[Catchy Toast] Error message copied to clipboard:', this.data.message);
      }
    } catch (error) {
      console.error('[Catchy Toast] Failed to copy to clipboard:', error);
    }
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
      if (
        target.classList.contains('catchy-toast-message') ||
        target.classList.contains('catchy-toast-location')
      ) {
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
   * Dynamically add ignore button to existing toast
   * Called when error count crosses the threshold
   */
  public showIgnoreButton(): void {
    // Check if button already exists
    const buttonContainer = this.element.querySelector('.catchy-toast-buttons');
    if (!buttonContainer || buttonContainer.querySelector('.catchy-toast-ignore')) {
      return; // Already has ignore button
    }

    // Create ignore button
    const ignoreButton = document.createElement('button');
    ignoreButton.className = 'catchy-toast-ignore';
    ignoreButton.setAttribute('aria-label', 'Ignore this error');
    ignoreButton.innerHTML = this.getIgnoreIconSVG();
    ignoreButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleIgnoreMenu();
    });

    // Insert before close button (Copy → Pin → Ignore → Close)
    const closeButton = buttonContainer.querySelector('.catchy-toast-close');
    if (closeButton) {
      buttonContainer.insertBefore(ignoreButton, closeButton);
    } else {
      buttonContainer.appendChild(ignoreButton);
    }

    if (import.meta.env.DEV) {
      console.log('[Catchy Toast] Ignore button added dynamically for:', this.data.id);
    }
  }

  /**
   * Increment the error counter when a duplicate error occurs
   * @returns The new count after incrementing
   */
  public incrementCounter(): number {
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

    return this.data.count;
  }
}
