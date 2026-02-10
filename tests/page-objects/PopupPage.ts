import type { Page, BrowserContext } from '@playwright/test';

/**
 * Page Object Model for Extension Popup
 * Handles interactions with chrome-extension popup page
 */
export class PopupPage {
  private page: Page | null = null;
  private currentTestHostname: string = 'localhost';

  constructor(
    private context: BrowserContext,
    private extensionId: string
  ) {}

  /**
   * Open the popup page
   * @param testHostname - Hostname to simulate (for testing without active tab)
   */
  async open(testHostname?: string): Promise<void> {
    if (testHostname) {
      this.currentTestHostname = testHostname;
    }

    // Open popup with test hostname parameter
    this.page = await this.context.newPage();
    const url = `chrome-extension://${this.extensionId}/popup/index.html?testHostname=${this.currentTestHostname}`;
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(800); // Wait for React to mount and load settings
  }

  /**
   * Get page instance (throws if not opened)
   */
  private getPage(): Page {
    if (!this.page) {
      throw new Error('Popup not opened. Call open() first.');
    }
    return this.page;
  }

  /**
   * Check if global mode is enabled
   */
  async isGlobalModeEnabled(): Promise<boolean> {
    const page = this.getPage();
    const toggle = page.locator('[data-testid="global-mode-toggle"]');
    const classes = await toggle.getAttribute('class');
    return classes?.includes('bg-primary') ?? false;
  }

  /**
   * Toggle global mode ON/OFF
   */
  async toggleGlobalMode(): Promise<void> {
    const page = this.getPage();
    await page.locator('[data-testid="global-mode-toggle"]').click();
    await page.waitForTimeout(300); // Wait for state update
  }

  /**
   * Get current hostname displayed in popup
   */
  async getCurrentHostname(): Promise<string> {
    const page = this.getPage();
    return await page.locator('[data-testid="current-hostname"]').textContent() ?? '';
  }

  /**
   * Check if current site is enabled
   */
  async isSiteEnabled(): Promise<boolean> {
    const page = this.getPage();
    const statusText = await page.locator('[data-testid="site-status"]').textContent();
    return statusText?.includes('Enabled for this site') ?? false;
  }

  /**
   * Toggle current site ON/OFF
   */
  async toggleSite(): Promise<void> {
    const page = this.getPage();
    await page.locator('[data-testid="site-toggle-button"]').click();
    await page.waitForTimeout(300); // Wait for state update
  }

  /**
   * Close popup
   */
  async close(): Promise<void> {
    const page = this.getPage();
    await page.close();
    this.page = null;
  }

  /**
   * Bring popup to front
   */
  async bringToFront(): Promise<void> {
    const page = this.getPage();
    await page.bringToFront();
  }
}
