/**
 * ErrorDrawer
 *
 * A slide-out drawer that displays error history with search, filter, and export capabilities.
 * Integrates with Shadow DOM to avoid conflicts with page styles.
 */

import type { CatchyError, ErrorType } from '@/types';
import type { ErrorHistoryManager } from '../error-history-manager';

// Interface for HTMLElement with custom listener properties
interface HTMLElementWithListeners extends HTMLElement {
  __darkModeListener?: (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => void;
  __escListener?: (e: KeyboardEvent) => void;
}

export class ErrorDrawer {
  private shadowRoot: ShadowRoot;
  private drawerElement: HTMLDivElement | null = null;
  private isOpen = false;
  private historyManager: ErrorHistoryManager;
  private searchQuery = '';
  private activeFilters: Set<ErrorType> = new Set();
  private confirmResolve: ((value: boolean) => void) | null = null;

  constructor(shadowRoot: ShadowRoot, historyManager: ErrorHistoryManager) {
    this.shadowRoot = shadowRoot;
    this.historyManager = historyManager;

    // Bind the ESC key handler to this instance
    this.handleEscapeKey = this.handleEscapeKey.bind(this);
  }

  /**
   * Handle ESC key press to close drawer
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  /**
   * Initialize the drawer (create and inject into shadow DOM)
   */
  public initialize(): void {
    if (this.drawerElement) {
      console.warn('[Catchy ErrorDrawer] Already initialized');
      return;
    }

    this.injectStyles();
    this.createDrawer();

    if (import.meta.env.DEV) {
      console.log('[Catchy ErrorDrawer] Initialized');
    }
  }

  /**
   * Inject drawer styles into shadow DOM
   */
  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Error Drawer Styles */
      .catchy-error-drawer {
        position: fixed;
        top: 0;
        right: -100%;
        width: 600px;
        max-width: 90vw;
        height: 100vh;
        background: #ffffff;
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        pointer-events: auto;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .catchy-error-drawer.open {
        right: 0;
      }

      /* Dark mode support */
      .catchy-error-drawer.dark {
        background: #1f2937;
        color: #f3f4f6;
      }

      /* Drawer Header */
      .catchy-drawer-header {
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        flex-shrink: 0;
      }

      .catchy-error-drawer.dark .catchy-drawer-header {
        background: #111827;
        border-bottom-color: #374151;
      }

      .catchy-drawer-title {
        font-size: 20px;
        font-weight: 700;
        margin: 0 0 8px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .catchy-drawer-close {
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .catchy-drawer-close:hover {
        background: #e5e7eb;
        color: #111827;
      }

      .catchy-error-drawer.dark .catchy-drawer-close {
        color: #9ca3af;
      }

      .catchy-error-drawer.dark .catchy-drawer-close:hover {
        background: #374151;
        color: #f3f4f6;
      }

      .catchy-drawer-stats {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
      }

      .catchy-error-drawer.dark .catchy-drawer-stats {
        color: #9ca3af;
      }

      /* Search Bar */
      .catchy-drawer-search {
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        flex-shrink: 0;
      }

      .catchy-error-drawer.dark .catchy-drawer-search {
        border-bottom-color: #374151;
      }

      .catchy-search-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        background: #ffffff;
        color: #111827;
        transition: border-color 0.2s;
      }

      .catchy-search-input:focus {
        outline: none;
        border-color: #3b82f6;
      }

      .catchy-error-drawer.dark .catchy-search-input {
        background: #374151;
        border-color: #4b5563;
        color: #f3f4f6;
      }

      .catchy-error-drawer.dark .catchy-search-input:focus {
        border-color: #60a5fa;
      }

      /* Filter Buttons */
      .catchy-drawer-filters {
        padding: 12px 20px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        flex-shrink: 0;
      }

      .catchy-error-drawer.dark .catchy-drawer-filters {
        border-bottom-color: #374151;
      }

      .catchy-filter-btn {
        padding: 6px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #ffffff;
        color: #374151;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-transform: capitalize;
      }

      .catchy-filter-btn:hover {
        background: #f3f4f6;
      }

      .catchy-filter-btn.active {
        background: #3b82f6;
        border-color: #3b82f6;
        color: #ffffff;
      }

      .catchy-error-drawer.dark .catchy-filter-btn {
        background: #374151;
        border-color: #4b5563;
        color: #d1d5db;
      }

      .catchy-error-drawer.dark .catchy-filter-btn:hover {
        background: #4b5563;
      }

      .catchy-error-drawer.dark .catchy-filter-btn.active {
        background: #2563eb;
        border-color: #2563eb;
        color: #ffffff;
      }

      /* Error List */
      .catchy-drawer-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
      }

      .catchy-error-item {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        transition: all 0.2s;
      }

      .catchy-error-item:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
      }

      .catchy-error-drawer.dark .catchy-error-item {
        background: #374151;
        border-color: #4b5563;
      }

      .catchy-error-drawer.dark .catchy-error-item:hover {
        background: #4b5563;
        border-color: #6b7280;
      }

      .catchy-error-item-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 8px;
      }

      .catchy-error-type-badge {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        padding: 4px 8px;
        border-radius: 4px;
        letter-spacing: 0.5px;
      }

      .catchy-error-type-badge.console-error {
        background: #fee2e2;
        color: #991b1b;
      }

      .catchy-error-type-badge.uncaught {
        background: #fed7aa;
        color: #9a3412;
      }

      .catchy-error-type-badge.unhandledrejection {
        background: #fef3c7;
        color: #92400e;
      }

      .catchy-error-type-badge.resource {
        background: #fef9c3;
        color: #854d0e;
      }

      .catchy-error-type-badge.network {
        background: #fecaca;
        color: #7f1d1d;
      }

      .catchy-error-time {
        font-size: 11px;
        color: #6b7280;
      }

      .catchy-error-drawer.dark .catchy-error-time {
        color: #9ca3af;
      }

      .catchy-error-message {
        font-size: 14px;
        color: #111827;
        margin-bottom: 8px;
        word-wrap: break-word;
        white-space: pre-wrap;
      }

      .catchy-error-drawer.dark .catchy-error-message {
        color: #f3f4f6;
      }

      .catchy-error-location {
        font-size: 12px;
        color: #6b7280;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        word-break: break-all;
      }

      .catchy-error-drawer.dark .catchy-error-location {
        color: #9ca3af;
      }

      .catchy-no-errors {
        text-align: center;
        padding: 40px 20px;
        color: #6b7280;
        font-size: 14px;
      }

      .catchy-error-drawer.dark .catchy-no-errors {
        color: #9ca3af;
      }

      /* Action Buttons */
      .catchy-drawer-actions {
        padding: 16px 20px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      .catchy-error-drawer.dark .catchy-drawer-actions {
        border-top-color: #374151;
      }

      .catchy-action-btn {
        flex: 1;
        padding: 10px 16px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #ffffff;
        color: #374151;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .catchy-action-btn:hover {
        background: #f3f4f6;
      }

      .catchy-action-btn.primary {
        background: #3b82f6;
        border-color: #3b82f6;
        color: #ffffff;
      }

      .catchy-action-btn.primary:hover {
        background: #2563eb;
      }

      .catchy-action-btn.danger {
        background: #ef4444;
        border-color: #ef4444;
        color: #ffffff;
      }

      .catchy-action-btn.danger:hover {
        background: #dc2626;
      }

      .catchy-error-drawer.dark .catchy-action-btn {
        background: #374151;
        border-color: #4b5563;
        color: #d1d5db;
      }

      .catchy-error-drawer.dark .catchy-action-btn:hover {
        background: #4b5563;
      }

      /* Scrollbar styling */
      .catchy-drawer-content::-webkit-scrollbar {
        width: 8px;
      }

      .catchy-drawer-content::-webkit-scrollbar-track {
        background: #f3f4f6;
      }

      .catchy-error-drawer.dark .catchy-drawer-content::-webkit-scrollbar-track {
        background: #1f2937;
      }

      .catchy-drawer-content::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 4px;
      }

      .catchy-error-drawer.dark .catchy-drawer-content::-webkit-scrollbar-thumb {
        background: #4b5563;
      }

      .catchy-drawer-content::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }

      .catchy-error-drawer.dark .catchy-drawer-content::-webkit-scrollbar-thumb:hover {
        background: #6b7280;
      }

      /* Confirmation Modal (shadcn-style) */
      .catchy-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
        pointer-events: none;
      }

      .catchy-modal-overlay.show {
        opacity: 1;
        pointer-events: auto;
      }

      .catchy-modal {
        background: #ffffff;
        border-radius: 8px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        transform: scale(0.95);
        transition: transform 0.2s ease-in-out;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .catchy-modal-overlay.show .catchy-modal {
        transform: scale(1);
      }

      .catchy-error-drawer.dark .catchy-modal,
      .catchy-modal-overlay.dark .catchy-modal {
        background: #1f2937;
        color: #f3f4f6;
      }

      .catchy-modal-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #111827;
      }

      .catchy-error-drawer.dark .catchy-modal-title,
      .catchy-modal-overlay.dark .catchy-modal-title {
        color: #f3f4f6;
      }

      .catchy-modal-description {
        font-size: 14px;
        color: #6b7280;
        margin: 0 0 24px 0;
        line-height: 1.5;
      }

      .catchy-error-drawer.dark .catchy-modal-description,
      .catchy-modal-overlay.dark .catchy-modal-description {
        color: #9ca3af;
      }

      .catchy-modal-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .catchy-modal-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
      }

      .catchy-modal-btn-cancel {
        background: transparent;
        color: #374151;
        border-color: #d1d5db;
      }

      .catchy-modal-btn-cancel:hover {
        background: #f3f4f6;
      }

      .catchy-error-drawer.dark .catchy-modal-btn-cancel,
      .catchy-modal-overlay.dark .catchy-modal-btn-cancel {
        color: #d1d5db;
        border-color: #4b5563;
      }

      .catchy-error-drawer.dark .catchy-modal-btn-cancel:hover,
      .catchy-modal-overlay.dark .catchy-modal-btn-cancel:hover {
        background: #374151;
      }

      .catchy-modal-btn-confirm {
        background: #ef4444;
        color: #ffffff;
        border-color: #ef4444;
      }

      .catchy-modal-btn-confirm:hover {
        background: #dc2626;
      }
    `;

    this.shadowRoot.appendChild(style);
  }

  /**
   * Create the drawer element
   */
  private createDrawer(): void {
    this.drawerElement = document.createElement('div');
    this.drawerElement.className = 'catchy-error-drawer';

    // Header
    const header = document.createElement('div');
    header.className = 'catchy-drawer-header';

    const title = document.createElement('div');
    title.className = 'catchy-drawer-title';
    title.innerHTML = `
      <span>📊 Error History</span>
      <button class="catchy-drawer-close" aria-label="Close drawer">×</button>
    `;

    const closeBtn = title.querySelector('.catchy-drawer-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.close());

    const stats = document.createElement('p');
    stats.className = 'catchy-drawer-stats';
    this.updateStats(stats);

    header.appendChild(title);
    header.appendChild(stats);

    // Search bar
    const searchContainer = document.createElement('div');
    searchContainer.className = 'catchy-drawer-search';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'catchy-search-input';
    searchInput.placeholder = 'Search errors...';
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.renderErrors();
    });

    searchContainer.appendChild(searchInput);

    // Filter buttons
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'catchy-drawer-filters';

    const errorTypes: ErrorType[] = ['console.error', 'uncaught', 'unhandledrejection'];

    errorTypes.forEach((type) => {
      const filterBtn = document.createElement('button');
      filterBtn.className = 'catchy-filter-btn';
      filterBtn.textContent = type.replace(/\./g, ' ');
      filterBtn.dataset.type = type;

      filterBtn.addEventListener('click', () => {
        if (this.activeFilters.has(type)) {
          this.activeFilters.delete(type);
          filterBtn.classList.remove('active');
        } else {
          this.activeFilters.add(type);
          filterBtn.classList.add('active');
        }
        this.renderErrors();
      });

      filtersContainer.appendChild(filterBtn);
    });

    // Content area (error list)
    const content = document.createElement('div');
    content.className = 'catchy-drawer-content';

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'catchy-drawer-actions';

    const exportJSONBtn = document.createElement('button');
    exportJSONBtn.className = 'catchy-action-btn primary';
    exportJSONBtn.textContent = 'Export JSON';
    exportJSONBtn.addEventListener('click', () => {
      this.historyManager.downloadJSON();
    });

    const exportCSVBtn = document.createElement('button');
    exportCSVBtn.className = 'catchy-action-btn primary';
    exportCSVBtn.textContent = 'Export CSV';
    exportCSVBtn.addEventListener('click', () => {
      this.historyManager.downloadCSV();
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'catchy-action-btn danger';
    clearBtn.textContent = 'Clear All';
    clearBtn.addEventListener('click', async () => {
      const confirmed = await this.showConfirmDialog(
        'Clear all error history?',
        'This action cannot be undone. All error history will be permanently deleted.'
      );

      if (confirmed) {
        this.historyManager.clear();
        this.renderErrors();
        this.updateStats(stats);
      }
    });

    actions.appendChild(exportJSONBtn);
    actions.appendChild(exportCSVBtn);
    actions.appendChild(clearBtn);

    // Assemble drawer
    this.drawerElement.appendChild(header);
    this.drawerElement.appendChild(searchContainer);
    this.drawerElement.appendChild(filtersContainer);
    this.drawerElement.appendChild(content);
    this.drawerElement.appendChild(actions);

    this.shadowRoot.appendChild(this.drawerElement);

    // Initial render
    this.renderErrors();
  }

  /**
   * Update stats display
   */
  private updateStats(statsElement: HTMLElement): void {
    const count = this.historyManager.getCount();
    const maxSize = this.historyManager.getMaxSize();
    statsElement.textContent = `${count} / ${maxSize} errors stored`;
  }

  /**
   * Render error list
   */
  private renderErrors(): void {
    if (!this.drawerElement) return;

    const content = this.drawerElement.querySelector('.catchy-drawer-content');
    const stats = this.drawerElement.querySelector('.catchy-drawer-stats');

    if (!content || !stats) return;

    // Update stats
    this.updateStats(stats as HTMLElement);

    // Get filtered errors
    let errors = this.historyManager.getAll();

    // Apply search filter
    if (this.searchQuery.trim()) {
      errors = this.historyManager.search(this.searchQuery);
    }

    // Apply type filters
    if (this.activeFilters.size > 0) {
      errors = errors.filter((error) => this.activeFilters.has(error.type));
    }

    // Clear content
    content.innerHTML = '';

    // Show errors or empty state
    if (errors.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'catchy-no-errors';
      emptyState.textContent =
        this.searchQuery || this.activeFilters.size > 0
          ? 'No errors match your filters'
          : 'No errors captured yet';
      content.appendChild(emptyState);
      return;
    }

    // Render errors (newest first)
    const reversedErrors = [...errors].reverse();

    for (const error of reversedErrors) {
      const errorItem = this.createErrorItem(error);
      content.appendChild(errorItem);
    }
  }

  /**
   * Create an error item element
   */
  private createErrorItem(error: CatchyError): HTMLDivElement {
    const item = document.createElement('div');
    item.className = 'catchy-error-item';

    const header = document.createElement('div');
    header.className = 'catchy-error-item-header';

    const badge = document.createElement('span');
    badge.className = `catchy-error-type-badge ${error.type.replace(/\./g, '-')}`;
    badge.textContent = error.type;

    const time = document.createElement('span');
    time.className = 'catchy-error-time';
    time.textContent = new Date(error.timestamp).toLocaleString();

    header.appendChild(badge);
    header.appendChild(time);

    const message = document.createElement('div');
    message.className = 'catchy-error-message';
    message.textContent = error.message;

    item.appendChild(header);
    item.appendChild(message);

    if (error.file || error.line) {
      const location = document.createElement('div');
      location.className = 'catchy-error-location';
      location.textContent = `${error.file || 'unknown'}${error.line ? `:${error.line}` : ''}${error.column ? `:${error.column}` : ''}`;
      item.appendChild(location);
    }

    return item;
  }

  /**
   * Open the drawer
   */
  public open(): void {
    if (!this.drawerElement) {
      this.initialize();
    }

    if (this.drawerElement && !this.isOpen) {
      this.renderErrors(); // Refresh content
      this.drawerElement.classList.add('open');
      this.isOpen = true;

      // Add ESC key listener when drawer opens
      document.addEventListener('keydown', this.handleEscapeKey);

      if (import.meta.env.DEV) {
        console.log('[Catchy ErrorDrawer] Opened');
      }
    }
  }

  /**
   * Close the drawer
   */
  public close(): void {
    if (this.drawerElement && this.isOpen) {
      this.drawerElement.classList.remove('open');
      this.isOpen = false;

      // Remove ESC key listener when drawer closes
      document.removeEventListener('keydown', this.handleEscapeKey);

      if (import.meta.env.DEV) {
        console.log('[Catchy ErrorDrawer] Closed');
      }
    }
  }

  /**
   * Toggle drawer open/closed
   */
  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Check if drawer is open
   */
  public getIsOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Set dark mode
   */
  public setDarkMode(enabled: boolean): void {
    if (this.drawerElement) {
      if (enabled) {
        this.drawerElement.classList.add('dark');
      } else {
        this.drawerElement.classList.remove('dark');
      }
    }
  }

  /**
   * Show confirmation dialog (shadcn-style)
   */
  private showConfirmDialog(title: string, description: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmResolve = resolve;

      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.className = 'catchy-modal-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      // Apply dark mode if drawer is dark
      if (this.drawerElement?.classList.contains('dark')) {
        overlay.classList.add('dark');
      }

      // Create modal
      const modal = document.createElement('div');
      modal.className = 'catchy-modal';

      // Modal title
      const modalTitle = document.createElement('h3');
      modalTitle.className = 'catchy-modal-title';
      modalTitle.textContent = title;
      const titleId = `catchy-modal-title-${Date.now()}`;
      modalTitle.id = titleId;

      // Modal description
      const modalDescription = document.createElement('p');
      modalDescription.className = 'catchy-modal-description';
      modalDescription.textContent = description;
      const descId = `catchy-modal-desc-${Date.now()}`;
      modalDescription.id = descId;

      overlay.setAttribute('aria-labelledby', titleId);
      overlay.setAttribute('aria-describedby', descId);

      // Actions container
      const actions = document.createElement('div');
      actions.className = 'catchy-modal-actions';

      // Cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'catchy-modal-btn catchy-modal-btn-cancel';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', () => {
        this.closeConfirmDialog(overlay, false);
      });

      // Confirm button
      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'catchy-modal-btn catchy-modal-btn-confirm';
      confirmBtn.textContent = 'Continue';
      confirmBtn.addEventListener('click', () => {
        this.closeConfirmDialog(overlay, true);
      });

      // Assemble modal
      actions.appendChild(cancelBtn);
      actions.appendChild(confirmBtn);
      modal.appendChild(modalTitle);
      modal.appendChild(modalDescription);
      modal.appendChild(actions);
      overlay.appendChild(modal);

      // Add to shadow root
      this.shadowRoot.appendChild(overlay);

      // Listen for dark mode changes while modal is open
      const handleDarkModeChange = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string
      ) => {
        if (areaName === 'sync' && changes.darkMode) {
          const newDarkMode = changes.darkMode.newValue;
          if (newDarkMode) {
            overlay.classList.add('dark');
          } else {
            overlay.classList.remove('dark');
          }
        }
      };
      chrome.storage.onChanged.addListener(handleDarkModeChange);

      // Store listener reference for cleanup
      (overlay as HTMLElementWithListeners).__darkModeListener = handleDarkModeChange;

      // Show with animation
      requestAnimationFrame(() => {
        overlay.classList.add('show');
        // Set focus to cancel button (first focusable element)
        cancelBtn.focus();
      });

      // Handle ESC key
      const handleEscKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          this.closeConfirmDialog(overlay, false);
        }
      };
      document.addEventListener('keydown', handleEscKey);
      (overlay as HTMLElementWithListeners).__escListener = handleEscKey;

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeConfirmDialog(overlay, false);
        }
      });
    });
  }

  /**
   * Close confirmation dialog
   */
  private closeConfirmDialog(overlay: HTMLElement, confirmed: boolean): void {
    overlay.classList.remove('show');

    // Remove dark mode listener
    const listener = (overlay as HTMLElementWithListeners).__darkModeListener;
    if (listener) {
      chrome.storage.onChanged.removeListener(listener);
      delete (overlay as HTMLElementWithListeners).__darkModeListener;
    }

    // Remove ESC listener
    const escListener = (overlay as HTMLElementWithListeners).__escListener;
    if (escListener) {
      document.removeEventListener('keydown', escListener);
      delete (overlay as HTMLElementWithListeners).__escListener;
    }

    setTimeout(() => {
      overlay.remove();
      if (this.confirmResolve) {
        this.confirmResolve(confirmed);
        this.confirmResolve = null;
      }
    }, 200); // Match transition duration
  }

  /**
   * Destroy the drawer
   */
  public destroy(): void {
    // Remove ESC key listener if it exists
    document.removeEventListener('keydown', this.handleEscapeKey);

    // Reset open state
    this.isOpen = false;

    // Remove DOM element
    if (this.drawerElement) {
      this.drawerElement.remove();
      this.drawerElement = null;
    }

    if (import.meta.env.DEV) {
      console.log('[Catchy ErrorDrawer] Destroyed');
    }
  }
}
