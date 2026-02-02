import type { Page, BrowserContext } from '@playwright/test';

/**
 * Page Object Model for Settings Page
 * Handles interactions with chrome-extension://[id]/options/index.html
 */
export class SettingsPage {
  private page: Page | null = null;

  constructor(
    private context: BrowserContext,
    private extensionId: string
  ) {}

  /**
   * Open the settings page
   */
  async open(): Promise<void> {
    this.page = await this.context.newPage();
    const url = `chrome-extension://${this.extensionId}/options/index.html`;
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(800); // Wait for React to mount and load settings
  }

  /**
   * Get page instance (throws if not opened)
   */
  private getPage(): Page {
    if (!this.page) {
      throw new Error('Settings page not opened. Call open() first.');
    }
    return this.page;
  }

  /**
   * Get page instance publicly for advanced test scenarios
   */
  public getPagePublic(): Page {
    return this.getPage();
  }

  /**
   * Navigate to a specific section
   */
  async navigateToSection(section: 'global' | 'persite' | 'display' | 'position' | 'errors' | 'history' | 'ignored' | 'visual' | 'about'): Promise<void> {
    const page = this.getPage();
    await page.locator(`[data-testid="nav-${section}"]`).click();
    await page.waitForTimeout(500); // Wait for section to render
  }

  /**
   * Check if global mode is enabled (from Global Control section)
   */
  async isGlobalModeEnabled(): Promise<boolean> {
    const page = this.getPage();
    await this.navigateToSection('global');
    const toggle = page.locator('[data-testid="global-control-switch"]');
    const classes = await toggle.getAttribute('class');
    return classes?.includes('bg-primary') ?? false;
  }

  /**
   * Toggle global mode ON/OFF (from Global Control section)
   */
  async toggleGlobalMode(): Promise<void> {
    const page = this.getPage();
    await this.navigateToSection('global');
    await page.locator('[data-testid="global-control-switch"]').click();
    await page.waitForTimeout(300); // Wait for state update
  }

  /**
   * Add a site to per-site settings
   * @param hostname - Hostname to add (e.g., "lonut.dev", "example.com")
   */
  async addSite(hostname: string): Promise<void> {
    const page = this.getPage();
    await this.navigateToSection('persite');

    await page.locator('[data-testid="per-site-input"]').fill(hostname);
    await page.locator('[data-testid="per-site-add-button"]').click();
    await page.waitForTimeout(300); // Wait for site to be added
  }

  /**
   * Check if a site exists in per-site settings
   */
  async hasSite(hostname: string): Promise<boolean> {
    const page = this.getPage();
    await this.navigateToSection('persite');

    const row = page.locator(`[data-testid="per-site-row-${hostname}"]`);
    return await row.isVisible();
  }

  /**
   * Check if a site is enabled in per-site settings
   */
  async isSiteEnabled(hostname: string): Promise<boolean> {
    const page = this.getPage();
    await this.navigateToSection('persite');

    const toggle = page.locator(`[data-testid="per-site-switch-${hostname}"]`);
    const classes = await toggle.getAttribute('class');
    return classes?.includes('bg-primary') ?? false;
  }

  /**
   * Toggle a site ON/OFF in per-site settings
   */
  async toggleSite(hostname: string): Promise<void> {
    const page = this.getPage();
    await this.navigateToSection('persite');

    await page.locator(`[data-testid="per-site-switch-${hostname}"]`).click();
    await page.waitForTimeout(300); // Wait for state update
  }

  /**
   * Remove a site from per-site settings
   */
  async removeSite(hostname: string): Promise<void> {
    const page = this.getPage();
    await this.navigateToSection('persite');

    await page.locator(`[data-testid="per-site-remove-${hostname}"]`).click();
    await page.waitForTimeout(300); // Wait for site to be removed
  }

  /**
   * Close settings page
   */
  async close(): Promise<void> {
    const page = this.getPage();
    await page.close();
    this.page = null;
  }

  /**
   * Bring settings page to front
   */
  async bringToFront(): Promise<void> {
    const page = this.getPage();
    await page.bringToFront();
  }

  // ========================================
  // Display Settings Methods
  // ========================================

  /**
   * Set max toasts on screen (must be on display section first)
   * @param count - Number of toasts (1, 3, 5, 8, or 10)
   */
  async setMaxToasts(count: 1 | 3 | 5 | 8 | 10): Promise<void> {
    const page = this.getPage();
    const button = page.locator(`[data-testid="max-toasts-${count}"]`);
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
    await page.waitForTimeout(300);
  }

  /**
   * Set auto-close time using preset (must be on display section first)
   * @param seconds - Seconds (0, 5, 10, or 30)
   */
  async setAutoClosePreset(seconds: 0 | 5 | 10 | 30): Promise<void> {
    const page = this.getPage();
    const button = page.locator(`[data-testid="auto-close-preset-${seconds}"]`);
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
    await page.waitForTimeout(300);
  }

  /**
   * Set auto-close time using input (must be on display section first)
   * @param seconds - Seconds (0-60)
   */
  async setAutoCloseInput(seconds: number): Promise<void> {
    const page = this.getPage();
    await page.locator('[data-testid="auto-close-input"]').fill(String(seconds));
    await page.waitForTimeout(300);
  }

  /**
   * Set toast size (must be on display section first)
   * @param size - Size option (small, medium, large, custom)
   */
  async setToastSize(size: 'small' | 'medium' | 'large' | 'custom'): Promise<void> {
    const page = this.getPage();
    const button = page.locator(`[data-testid="toast-size-${size}"]`);
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
    await page.waitForTimeout(300);
  }

  // ========================================
  // Toast Position Methods
  // ========================================

  /**
   * Set toast position (must be on position section first)
   * @param position - Position option (top-left, top-right, bottom-left, bottom-right)
   */
  async setToastPosition(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): Promise<void> {
    const page = this.getPage();
    const button = page.locator(`[data-testid="toast-position-${position}"]`);
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
    await page.waitForTimeout(300);
  }

  /**
   * Get current toast position (must be on position section first)
   * @returns Current position
   */
  async getToastPosition(): Promise<string> {
    const page = this.getPage();
    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

    for (const position of positions) {
      const button = page.locator(`[data-testid="toast-position-${position}"]`);
      const classes = await button.getAttribute('class');
      if (classes?.includes('border-primary bg-primary/10')) {
        return position;
      }
    }

    return 'bottom-right'; // default
  }

  /**
   * Toggle swipe to dismiss (must be on position section first)
   */
  async toggleSwipeToDismiss(): Promise<void> {
    const page = this.getPage();
    await page.locator('[data-testid="swipe-to-dismiss-toggle"]').click();
    await page.waitForTimeout(300);
  }

  /**
   * Toggle persist pinned toasts (must be on position section first)
   */
  async togglePersistPinned(): Promise<void> {
    const page = this.getPage();
    await page.locator('[data-testid="persist-pinned-toggle"]').click();
    await page.waitForTimeout(300);
  }

  /**
   * Check if swipe to dismiss is enabled (must be on position section first)
   */
  async isSwipeToDismissEnabled(): Promise<boolean> {
    const page = this.getPage();
    const checkbox = page.locator('[data-testid="swipe-to-dismiss-toggle"]');
    return await checkbox.isChecked();
  }

  /**
   * Check if persist pinned is enabled (must be on position section first)
   */
  async isPersistPinnedEnabled(): Promise<boolean> {
    const page = this.getPage();
    const checkbox = page.locator('[data-testid="persist-pinned-toggle"]');
    return await checkbox.isChecked();
  }

  // ========================================
  // Visual Customization Methods
  // ========================================

  /**
   * Set background color for error type
   */
  async setBackgroundColor(
    errorType: 'console' | 'uncaught' | 'rejection',
    color: string
  ): Promise<void> {
    const page = this.getPage();
    const input = page.locator(`[data-testid="color-bg-${errorType}"]`);
    await input.fill(color);
    await page.waitForTimeout(300);
  }

  /**
   * Set border radius
   */
  async setBorderRadius(value: number): Promise<void> {
    const page = this.getPage();
    const slider = page.locator('[data-testid="slider-border-radius"]');
    await slider.fill(String(value));
    await page.waitForTimeout(300);
  }

  /**
   * Set spacing
   */
  async setSpacing(value: number): Promise<void> {
    const page = this.getPage();
    const slider = page.locator('[data-testid="slider-spacing"]');
    await slider.fill(String(value));
    await page.waitForTimeout(300);
  }

  /**
   * Toggle shadow
   */
  async toggleShadow(): Promise<void> {
    const page = this.getPage();
    await page.locator('[data-testid="shadow-toggle"]').click();
    await page.waitForTimeout(300);
  }

  // ========================================
  // Error Types Methods
  // ========================================

  /**
   * Check if console error type is enabled (must be on errors section first)
   */
  async isConsoleErrorEnabled(): Promise<boolean> {
    const page = this.getPage();
    const checkbox = page.locator('[data-testid="toggle-console-error"]');
    return await checkbox.isChecked();
  }

  /**
   * Check if uncaught error type is enabled (must be on errors section first)
   */
  async isUncaughtEnabled(): Promise<boolean> {
    const page = this.getPage();
    const checkbox = page.locator('[data-testid="toggle-uncaught"]');
    return await checkbox.isChecked();
  }

  /**
   * Check if unhandled rejection type is enabled (must be on errors section first)
   */
  async isUnhandledRejectionEnabled(): Promise<boolean> {
    const page = this.getPage();
    const checkbox = page.locator('[data-testid="toggle-unhandled-rejection"]');
    return await checkbox.isChecked();
  }

  /**
   * Toggle console error type (must be on errors section first)
   */
  async toggleConsoleError(): Promise<void> {
    const page = this.getPage();
    await page.locator('[data-testid="toggle-console-error"]').click();
    await page.waitForTimeout(300);
  }

  /**
   * Toggle uncaught error type (must be on errors section first)
   */
  async toggleUncaught(): Promise<void> {
    const page = this.getPage();
    await page.locator('[data-testid="toggle-uncaught"]').click();
    await page.waitForTimeout(300);
  }

  /**
   * Toggle unhandled rejection type (must be on errors section first)
   */
  async toggleUnhandledRejection(): Promise<void> {
    const page = this.getPage();
    await page.locator('[data-testid="toggle-unhandled-rejection"]').click();
    await page.waitForTimeout(300);
  }
}
