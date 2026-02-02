import type { Page } from '@playwright/test';

/**
 * Page Object Model for Extension Content Script
 * Handles interactions with toasts in shadow DOM
 */
export class ExtensionPage {
  constructor(private page: Page) {}

  /**
   * Check if extension is loaded (shadow host exists)
   */
  async isLoaded(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return !!document.querySelector('#catchy-toast-host');
    });
  }

  /**
   * Check if any toast exists
   */
  async hasToast(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return false;

      const toasts = host.shadowRoot.querySelectorAll('.catchy-toast');
      return toasts.length > 0;
    });
  }

  /**
   * Get toast count
   */
  async getToastCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return 0;

      return host.shadowRoot.querySelectorAll('.catchy-toast').length;
    });
  }

  /**
   * Get toast message by index
   */
  async getToastMessage(index: number = 0): Promise<string | null> {
    return await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const toasts = host.shadowRoot.querySelectorAll('.catchy-toast');
      const toast = toasts[idx];
      if (!toast) return null;

      const messageEl = toast.querySelector('[data-testid="toast-message"]');
      return messageEl?.textContent || null;
    }, index);
  }

  /**
   * Get toast type badge text
   */
  async getToastType(index: number = 0): Promise<string | null> {
    return await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const toasts = host.shadowRoot.querySelectorAll('.catchy-toast');
      const toast = toasts[idx];
      if (!toast) return null;

      const typeEl = toast.querySelector('[data-testid="toast-type-badge"]');
      return typeEl?.textContent || null;
    }, index);
  }

  /**
   * Wait for toast to appear
   */
  async waitForToast(timeout: number = 3000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await this.hasToast()) {
        return true;
      }
      await this.page.waitForTimeout(100);
    }

    return false;
  }

  /**
   * Wait for no toasts
   */
  async waitForNoToast(timeout: number = 3000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (!(await this.hasToast())) {
        return true;
      }
      await this.page.waitForTimeout(100);
    }

    return false;
  }

  /**
   * Wait for toast to disappear (auto-close)
   */
  async waitForToastToDisappear(timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now();

    // First wait for toast to appear
    if (!(await this.hasToast())) {
      return false;
    }

    // Then wait for it to disappear
    while (Date.now() - startTime < timeout) {
      if (!(await this.hasToast())) {
        return true;
      }
      await this.page.waitForTimeout(100);
    }

    return false;
  }

  /**
   * Get toast dimensions (width, height)
   */
  async getToastDimensions(index: number = 0): Promise<{ width: number; height: number } | null> {
    return await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const toasts = host.shadowRoot.querySelectorAll('.catchy-toast');
      const toast = toasts[idx];
      if (!toast) return null;

      const rect = toast.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }, index);
  }

  /**
   * Get computed font size of toast
   */
  async getToastFontSize(index: number = 0): Promise<string | null> {
    return await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const toasts = host.shadowRoot.querySelectorAll('.catchy-toast');
      const toast = toasts[idx];
      if (!toast) return null;

      return window.getComputedStyle(toast).fontSize;
    }, index);
  }

  /**
   * Wait for toast count to stabilize at expected value
   * Useful for max toasts tests where count may fluctuate briefly
   */
  async waitForToastCount(expectedCount: number, timeout: number = 3000): Promise<boolean> {
    const startTime = Date.now();
    let stableCount = 0;
    const requiredStableTime = 500; // Count must be stable for 500ms

    while (Date.now() - startTime < timeout) {
      const count = await this.getToastCount();

      if (count === expectedCount) {
        if (stableCount === 0) {
          stableCount = Date.now();
        } else if (Date.now() - stableCount >= requiredStableTime) {
          return true; // Count has been stable at expected value
        }
      } else {
        stableCount = 0; // Reset if count changes
      }

      await this.page.waitForTimeout(100);
    }

    return false;
  }

  /**
   * Get toast position by checking container's position class
   * Returns position string like 'top-left', 'bottom-right', etc.
   */
  async getToastPosition(): Promise<string | null> {
    return await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const container = host.shadowRoot.querySelector('.catchy-toast-container');
      if (!container) return null;

      // Check which position class the container has
      const classList = container.classList;
      if (classList.contains('position-top-left')) return 'top-left';
      if (classList.contains('position-top-right')) return 'top-right';
      if (classList.contains('position-bottom-left')) return 'bottom-left';
      if (classList.contains('position-bottom-right')) return 'bottom-right';

      return null;
    });
  }

  /**
   * Get toast background color
   */
  async getToastBackgroundColor(index = 0): Promise<string | null> {
    return await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const toasts = host.shadowRoot.querySelectorAll('.catchy-toast');
      const toast = toasts[idx];
      if (!toast) return null;

      return window.getComputedStyle(toast).backgroundColor;
    }, index);
  }

  /**
   * Get toast text color
   */
  async getToastTextColor(index = 0): Promise<string | null> {
    return await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const toasts = host.shadowRoot.querySelectorAll('.catchy-toast');
      const toast = toasts[idx];
      if (!toast) return null;

      return window.getComputedStyle(toast).color;
    }, index);
  }

  /**
   * Get toast border radius
   */
  async getToastBorderRadius(index = 0): Promise<string | null> {
    return await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const toasts = host.shadowRoot.querySelectorAll('.catchy-toast');
      const toast = toasts[idx];
      if (!toast) return null;

      return window.getComputedStyle(toast).borderRadius;
    }, index);
  }

  /**
   * Get toast box shadow
   */
  async getToastBoxShadow(index = 0): Promise<string | null> {
    return await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const toasts = host.shadowRoot.querySelectorAll('.catchy-toast');
      const toast = toasts[idx];
      if (!toast) return null;

      return window.getComputedStyle(toast).boxShadow;
    }, index);
  }

  /**
   * Get spacing between toasts (gap)
   */
  async getToastSpacing(): Promise<string | null> {
    return await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const container = host.shadowRoot.querySelector('.catchy-toast-container');
      if (!container) return null;

      return window.getComputedStyle(container).gap;
    });
  }

  // ========================================
  // Error Drawer Methods
  // ========================================

  /**
   * Open error drawer using keyboard shortcut (default: ` backtick)
   */
  async openDrawer(shortcut: string = '`'): Promise<void> {
    // Handle single key shortcuts
    if (!shortcut.includes('+')) {
      await this.page.keyboard.press(shortcut);
    } else {
      // Handle combination shortcuts
      const [modifier, key] = shortcut.split('+');
      await this.page.keyboard.press(`${modifier}+${key}`);
    }
    await this.page.waitForTimeout(500); // Wait for drawer animation
  }

  /**
   * Close error drawer using ESC key
   */
  async closeDrawer(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500); // Wait for drawer animation
  }

  /**
   * Check if error drawer is open
   */
  async isDrawerOpen(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return false;

      const drawer = host.shadowRoot.querySelector('.catchy-error-drawer');
      if (!drawer) return false;

      return drawer.classList.contains('open');
    });
  }

  /**
   * Get error count displayed in drawer header
   */
  async getDrawerErrorCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return 0;

      const statsEl = host.shadowRoot.querySelector('.catchy-drawer-stats');
      if (!statsEl?.textContent) return 0;

      // Format: "X / Y errors stored" - extract first number
      const match = statsEl.textContent.match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
  }

  /**
   * Get error items count in drawer list
   */
  async getDrawerErrorItems(): Promise<number> {
    return await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return 0;

      const items = host.shadowRoot.querySelectorAll('.catchy-error-item');
      return items.length;
    });
  }

  /**
   * Search errors in drawer
   */
  async searchDrawer(query: string): Promise<void> {
    await this.page.evaluate((searchQuery) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return;

      const searchInput = host.shadowRoot.querySelector('.catchy-search-input') as HTMLInputElement;
      if (!searchInput) return;

      searchInput.value = searchQuery;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }, query);
    await this.page.waitForTimeout(300);
  }

  /**
   * Toggle error type filter in drawer
   */
  async toggleDrawerFilter(errorType: 'console.error' | 'uncaught' | 'unhandledrejection'): Promise<void> {
    await this.page.evaluate((type) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return;

      const filterBtn = host.shadowRoot.querySelector(`[data-type="${type}"]`) as HTMLButtonElement;
      if (!filterBtn) return;

      filterBtn.click();
    }, errorType);
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if error type filter is active
   */
  async isDrawerFilterActive(errorType: 'console.error' | 'uncaught' | 'unhandledrejection'): Promise<boolean> {
    return await this.page.evaluate((type) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return false;

      const filterBtn = host.shadowRoot.querySelector(`[data-type="${type}"]`);
      if (!filterBtn) return false;

      return filterBtn.classList.contains('active');
    }, errorType);
  }

  /**
   * Clear all errors using drawer button
   */
  async clearAllErrors(): Promise<void> {
    await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return;

      // Find "Clear All" button with class 'danger'
      const buttons = host.shadowRoot.querySelectorAll('.catchy-action-btn.danger');
      const clearBtn = Array.from(buttons).find(
        (btn) => btn.textContent?.includes('Clear All')
      ) as HTMLButtonElement;
      if (!clearBtn) return;

      clearBtn.click();
    });
    await this.page.waitForTimeout(300);
  }

  /**
   * Confirm clear all action in dialog
   */
  async confirmClearAll(): Promise<void> {
    await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return;

      const confirmBtn = host.shadowRoot.querySelector('.catchy-modal-btn-confirm') as HTMLButtonElement;
      if (!confirmBtn) return;

      confirmBtn.click();
    });
    await this.page.waitForTimeout(300);
  }

  /**
   * Cancel clear all action in dialog
   */
  async cancelClearAll(): Promise<void> {
    await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return;

      const cancelBtn = host.shadowRoot.querySelector('.catchy-modal-btn-cancel') as HTMLButtonElement;
      if (!cancelBtn) return;

      cancelBtn.click();
    });
    await this.page.waitForTimeout(300);
  }

  /**
   * Export errors as JSON using drawer button
   */
  async exportErrorsJSON(): Promise<void> {
    await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return;

      const buttons = host.shadowRoot.querySelectorAll('.catchy-action-btn.primary');
      const exportBtn = Array.from(buttons).find(
        (btn) => btn.textContent?.includes('Export JSON')
      ) as HTMLButtonElement;
      if (!exportBtn) return;

      exportBtn.click();
    });
    await this.page.waitForTimeout(300);
  }

  /**
   * Export errors as CSV using drawer button
   */
  async exportErrorsCSV(): Promise<void> {
    await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return;

      const buttons = host.shadowRoot.querySelectorAll('.catchy-action-btn.primary');
      const exportBtn = Array.from(buttons).find(
        (btn) => btn.textContent?.includes('Export CSV')
      ) as HTMLButtonElement;
      if (!exportBtn) return;

      exportBtn.click();
    });
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if drawer is in dark mode
   */
  async isDrawerDarkMode(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return false;

      const drawer = host.shadowRoot.querySelector('.catchy-error-drawer');
      if (!drawer) return false;

      return drawer.classList.contains('dark');
    });
  }

  /**
   * Get error message from drawer by index
   */
  async getDrawerErrorMessage(index: number = 0): Promise<string | null> {
    return await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const items = host.shadowRoot.querySelectorAll('.catchy-error-item');
      const item = items[idx];
      if (!item) return null;

      const messageEl = item.querySelector('.catchy-error-message');
      return messageEl?.textContent || null;
    }, index);
  }

  /**
   * Get error type from drawer by index
   */
  async getDrawerErrorType(index: number = 0): Promise<string | null> {
    return await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const items = host.shadowRoot.querySelectorAll('.catchy-error-item');
      const item = items[idx];
      if (!item) return null;

      const typeEl = item.querySelector('.catchy-error-type');
      return typeEl?.textContent || null;
    }, index);
  }

  /**
   * Get toast counter badge text (e.g., "×3")
   */
  async getToastCounter(index: number = 0): Promise<string | null> {
    return await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return null;

      const toasts = host.shadowRoot.querySelectorAll('.catchy-toast');
      const toast = toasts[idx];
      if (!toast) return null;

      const counterEl = toast.querySelector('[data-testid="toast-counter"]');
      return counterEl?.textContent || null;
    }, index);
  }

  /**
   * Check if toast has ignore button
   */
  async hasToastIgnoreButton(index: number = 0): Promise<boolean> {
    return await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return false;

      const toasts = host.shadowRoot.querySelectorAll('.catchy-toast');
      const toast = toasts[idx];
      if (!toast) return false;

      const ignoreBtn = toast.querySelector('[data-testid="toast-ignore"]');
      return !!ignoreBtn;
    }, index);
  }

  /**
   * Click toast ignore button to open menu
   */
  async clickToastIgnoreButton(index: number = 0): Promise<void> {
    await this.page.evaluate((idx) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return;

      const toasts = host.shadowRoot.querySelectorAll('.catchy-toast');
      const toast = toasts[idx];
      if (!toast) return;

      const ignoreBtn = toast.querySelector('[data-testid="toast-ignore"]') as HTMLButtonElement;
      if (ignoreBtn) {
        ignoreBtn.click();
      }
    }, index);
  }

  /**
   * Check if ignore menu is open
   */
  async isIgnoreMenuOpen(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return false;

      const menu = host.shadowRoot.querySelector('.catchy-ignore-menu');
      return !!menu;
    });
  }

  /**
   * Get ignore menu options (label + description text)
   */
  async getIgnoreMenuOptions(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return [];

      const menuItems = host.shadowRoot.querySelectorAll('.catchy-ignore-menu-item');
      const options: string[] = [];

      menuItems.forEach((item) => {
        const label = item.querySelector('.catchy-ignore-menu-label')?.textContent || '';
        const description = item.querySelector('.catchy-ignore-menu-description')?.textContent || '';
        options.push(`${label} - ${description}`);
      });

      return options;
    });
  }

  /**
   * Select an ignore option from the menu
   * @param scope 'session' for "Dismiss" or 'permanent' for "Ignore Forever"
   */
  async selectIgnoreOption(scope: 'session' | 'permanent'): Promise<void> {
    await this.page.evaluate((scopeType) => {
      const host = document.querySelector('#catchy-toast-host');
      if (!host?.shadowRoot) return;

      const menuItems = host.shadowRoot.querySelectorAll('.catchy-ignore-menu-item');
      const targetIndex = scopeType === 'session' ? 0 : 1; // session is first, permanent is second

      const item = menuItems[targetIndex] as HTMLElement;
      if (item) {
        item.click();
      }
    }, scope);
  }
}
