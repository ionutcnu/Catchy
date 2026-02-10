import { test, expect } from '../fixtures';
import { SettingsPage } from '../page-objects/SettingsPage';
import { ExtensionPage } from '../page-objects/ExtensionPage';

/**
 * Display Settings Tests
 * Tests max toasts on screen, auto-close timer, and toast size features
 */

test.describe('Display Settings', () => {
  const TEST_URL = 'https://lonut.dev/';

  test.describe('Max Toasts on Screen', () => {
    test('Max toasts = 1: Trigger 3 errors → Only 1 toast visible', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Ensure global mode is ON first
      await settings.open();
      await settings.navigateToSection('global');
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }

      // Set max toasts to 1
      await settings.navigateToSection('display');
      await settings.setMaxToasts(1);

      // CRITICAL: Wait for chrome.storage.sync.set() to complete BEFORE closing page
      await page.waitForTimeout(1000);

      await settings.close();

      // Navigate to test page
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(300); // Wait for extension initialization

      // Trigger errors with delays
      await page.evaluate(() => console.error('Error 1'));
      await page.waitForTimeout(300);
      await page.evaluate(() => console.error('Error 2'));
      await page.waitForTimeout(300);
      await page.evaluate(() => console.error('Error 3'));
      await page.waitForTimeout(500);

      // Verify only 1 toast is visible (should be Error 3, the last one)
      const toastCount = await ext.getToastCount();
      expect(toastCount).toBe(1);
    });

    test('Max toasts = 3: Trigger 5 errors → Only 3 toasts visible', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Ensure global mode is ON
      await settings.open();
      await settings.navigateToSection('global');
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }

      // Set max toasts to 3
      await settings.navigateToSection('display');
      await settings.setMaxToasts(3);

      // Wait BEFORE closing for storage to save
      await page.waitForTimeout(1000);
      await settings.close();

      // Navigate and trigger 5 errors
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(300); // Wait for extension initialization

      // Trigger errors with delays
      await page.evaluate(() => console.error('Error 1'));
      await page.waitForTimeout(300);
      await page.evaluate(() => console.error('Error 2'));
      await page.waitForTimeout(300);
      await page.evaluate(() => console.error('Error 3'));
      await page.waitForTimeout(300);
      await page.evaluate(() => console.error('Error 4'));
      await page.waitForTimeout(300);
      await page.evaluate(() => console.error('Error 5'));
      await page.waitForTimeout(500);

      // Verify only 3 toasts are visible (should be Error 3, 4, 5)
      const toastCount = await ext.getToastCount();
      expect(toastCount).toBe(3);
    });

    test('Max toasts = 5: Trigger 7 errors → Only 5 toasts visible', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Ensure global mode is ON
      await settings.open();
      await settings.navigateToSection('global');
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }

      // Set max toasts to 5
      await settings.navigateToSection('display');
      await settings.setMaxToasts(5);

      // Wait BEFORE closing for storage to save
      await page.waitForTimeout(1000);
      await settings.close();

      // Navigate and trigger 7 errors (more than max)
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(300); // Wait for extension initialization

      // Trigger errors with delays
      await page.evaluate(() => console.error('Error 1'));
      await page.waitForTimeout(300);
      await page.evaluate(() => console.error('Error 2'));
      await page.waitForTimeout(300);
      await page.evaluate(() => console.error('Error 3'));
      await page.waitForTimeout(300);
      await page.evaluate(() => console.error('Error 4'));
      await page.waitForTimeout(300);
      await page.evaluate(() => console.error('Error 5'));
      await page.waitForTimeout(300);
      await page.evaluate(() => console.error('Error 6'));
      await page.waitForTimeout(300);
      await page.evaluate(() => console.error('Error 7'));
      await page.waitForTimeout(500);

      // Verify only 5 toasts are visible (should be Error 3, 4, 5, 6, 7)
      const toastCount = await ext.getToastCount();
      expect(toastCount).toBe(5);
    });
  });

  test.describe('Auto-Close Timer', () => {
    test('Auto-close = Never (0): Toast stays visible', async ({ page, context, extensionId }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Ensure global mode is ON and set auto-close to Never
      await settings.open();
      await settings.navigateToSection('global');
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }
      await settings.navigateToSection('display');
      await settings.setAutoClosePreset(0);
      await page.waitForTimeout(1000);
      await settings.close();

      // Navigate and trigger error
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(300); // Wait for extension initialization

      await page.evaluate(() => console.error('Test: Auto-close Never'));

      expect(await ext.waitForToast(3000)).toBe(true);

      // Wait 3 seconds, toast should still be there
      await page.waitForTimeout(3000);
      expect(await ext.hasToast()).toBe(true);
    });

    test('Auto-close = 5s: Toast disappears after 5 seconds', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Ensure global mode is ON and set auto-close to 5 seconds
      await settings.open();
      await settings.navigateToSection('global');
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }
      await settings.navigateToSection('display');
      await settings.setAutoClosePreset(5);
      await page.waitForTimeout(1000);
      await settings.close();

      // Navigate and trigger error
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(300); // Wait for extension initialization

      await page.evaluate(() => console.error('Test: Auto-close 5s'));

      expect(await ext.waitForToast(3000)).toBe(true);

      // Wait for toast to disappear (should happen within 6 seconds)
      expect(await ext.waitForToastToDisappear(6000)).toBe(true);
    });

    test('Auto-close = 10s: Toast disappears after 10 seconds', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Ensure global mode is ON and set auto-close to 10 seconds
      await settings.open();
      await settings.navigateToSection('global');
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }
      await settings.navigateToSection('display');
      await settings.setAutoClosePreset(10);
      await page.waitForTimeout(1000);
      await settings.close();

      // Navigate and trigger error
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(300); // Wait for extension initialization

      await page.evaluate(() => console.error('Test: Auto-close 10s'));

      expect(await ext.waitForToast(3000)).toBe(true);

      // Verify toast still there after 5 seconds
      await page.waitForTimeout(5000);
      expect(await ext.hasToast()).toBe(true);

      // Wait for toast to disappear (should happen within 6 more seconds)
      expect(await ext.waitForToastToDisappear(6000)).toBe(true);
    });
  });

  test.describe('Toast Size', () => {
    test('Small size: Font size ~12px', async ({ page, context, extensionId }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Ensure global mode is ON and set toast size to small
      await settings.open();
      await settings.navigateToSection('global');
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }
      await settings.navigateToSection('display');
      await settings.setToastSize('small');
      await page.waitForTimeout(1000);
      await settings.close();

      // Navigate and trigger error
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(300); // Wait for extension initialization

      await page.evaluate(() => console.error('Test: Small size'));

      expect(await ext.waitForToast(3000)).toBe(true);

      // Check font size is approximately 12px
      const fontSize = await ext.getToastFontSize();
      expect(fontSize).toMatch(/12px/);
    });

    test('Medium size: Font size ~14px', async ({ page, context, extensionId }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Ensure global mode is ON and set toast size to medium
      await settings.open();
      await settings.navigateToSection('global');
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }
      await settings.navigateToSection('display');
      await settings.setToastSize('medium');
      await page.waitForTimeout(1000);
      await settings.close();

      // Navigate and trigger error
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(300); // Wait for extension initialization

      await page.evaluate(() => console.error('Test: Medium size'));

      expect(await ext.waitForToast(3000)).toBe(true);

      // Check font size is approximately 14px
      const fontSize = await ext.getToastFontSize();
      expect(fontSize).toMatch(/14px/);
    });

    test('Large size: Font size ~16px', async ({ page, context, extensionId }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Ensure global mode is ON and set toast size to large
      await settings.open();
      await settings.navigateToSection('global');
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }
      await settings.navigateToSection('display');
      await settings.setToastSize('large');
      await page.waitForTimeout(1000);
      await settings.close();

      // Navigate and trigger error
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(300); // Wait for extension initialization

      await page.evaluate(() => console.error('Test: Large size'));

      expect(await ext.waitForToast(3000)).toBe(true);

      // Check font size is approximately 16px
      const fontSize = await ext.getToastFontSize();
      expect(fontSize).toMatch(/16px/);
    });
  });
});
