import { test, expect } from '../fixtures';
import { SettingsPage } from '../page-objects/SettingsPage';
import { ExtensionPage } from '../page-objects/ExtensionPage';

/**
 * Visual Customization Tests - Minimal coverage
 * Tests per-error-type colors, global styling, and reset functionality
 */

test.describe('Visual Customization', () => {
  const TEST_URL = 'https://lonut.dev/';

  test('Background color: Custom color applied to console errors', async ({
    page,
    context,
    extensionId,
  }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    // Enable global mode
    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }

    // Set bright green background for console errors
    await settings.navigateToSection('visual');
    await settings.setBackgroundColor('console', '#00ff00');
    await page.waitForTimeout(1000);
    await settings.close();

    // Trigger console.error and verify green background
    await page.goto(TEST_URL);
    expect(await ext.isLoaded()).toBe(true);
    await page.waitForTimeout(300); // Wait for extension initialization

    await page.evaluate(() => console.error('Custom color test'));
    expect(await ext.waitForToast(3000)).toBe(true);

    const bgColor = await ext.getToastBackgroundColor();
    expect(bgColor).toMatch(/rgb\(0,\s*255,\s*0\)/);
  });

  test('Border radius: 0px creates sharp corners', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }

    await settings.navigateToSection('visual');
    await settings.setBorderRadius(0);
    await page.waitForTimeout(1000);
    await settings.close();

    await page.goto(TEST_URL);
    await page.evaluate(() => console.error('Border radius test'));
    expect(await ext.waitForToast(3000)).toBe(true);

    const borderRadius = await ext.getToastBorderRadius();
    expect(borderRadius).toBe('0px');
  });

  test('Spacing: Adjust gap between multiple toasts', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }

    await settings.navigateToSection('visual');
    await settings.setSpacing(24);
    await page.waitForTimeout(1000);
    await settings.close();

    await page.goto(TEST_URL);
    await page.evaluate(() => {
      console.error('Toast 1');
      console.error('Toast 2');
    });
    await page.waitForTimeout(1000);

    const gap = await ext.getToastSpacing();
    expect(gap).toBe('24px');
  });

  test('Shadow: Toggle off removes box-shadow', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }

    await settings.navigateToSection('visual');
    await settings.toggleShadow();
    await page.waitForTimeout(1000);
    await settings.close();

    await page.goto(TEST_URL);
    await page.evaluate(() => console.error('Shadow test'));
    expect(await ext.waitForToast(3000)).toBe(true);

    const shadow = await ext.getToastBoxShadow();
    expect(shadow).toBe('none');
  });

  test('Reset to defaults: Restores all visual settings', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }

    // Change multiple settings
    await settings.navigateToSection('visual');
    await settings.setBackgroundColor('console', '#00ff00');
    await settings.setBorderRadius(24);
    await settings.setSpacing(4);
    await settings.toggleShadow();
    await page.waitForTimeout(1000);

    // Click reset button
    const settingsPage = settings.getPage();
    await settingsPage.locator('[data-testid="reset-visual-defaults"]').click();
    await page.waitForTimeout(1000);
    await settings.close();

    // Verify defaults restored
    await page.goto(TEST_URL);
    await page.evaluate(() => console.error('Reset test'));
    expect(await ext.waitForToast(3000)).toBe(true);

    const bgColor = await ext.getToastBackgroundColor();
    expect(bgColor).toMatch(/rgb\(220,\s*38,\s*38\)/); // #dc2626 = rgb(220, 38, 38)

    const borderRadius = await ext.getToastBorderRadius();
    expect(borderRadius).toBe('8px');

    const gap = await ext.getToastSpacing();
    expect(gap).toBe('12px');

    const shadow = await ext.getToastBoxShadow();
    expect(shadow).not.toBe('none');
  });
});
