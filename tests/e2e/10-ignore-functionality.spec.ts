import { test, expect } from '../fixtures';
import { SettingsPage } from '../page-objects/SettingsPage';
import { ExtensionPage } from '../page-objects/ExtensionPage';

/**
 * Ignore Functionality Tests
 * Tests ignore button appearance threshold, session/permanent scopes, and error filtering
 */

test.describe('Ignore Functionality', () => {
  const TEST_URL = 'https://lonut.dev/';

  test('Ignore button: Appears after 3rd occurrence', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    // Enable global mode
    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    // Navigate to test page
    await page.goto(TEST_URL);
    await page.waitForTimeout(300); // Wait for extension initialization

    // Trigger same error 3 times
    await page.evaluate(() => console.error('Repeated error'));
    await ext.waitForToast(2000);

    // First occurrence - no ignore button
    expect(await ext.hasToastIgnoreButton(0)).toBe(false);
    expect(await ext.getToastCounter(0)).toBe(null); // No counter for single occurrence

    // Second occurrence
    await page.evaluate(() => console.error('Repeated error'));
    await page.waitForTimeout(500);

    // Counter should show ×2, still no ignore button
    expect(await ext.getToastCounter(0)).toBe('×2');
    expect(await ext.hasToastIgnoreButton(0)).toBe(false);

    // Third occurrence - ignore button appears
    await page.evaluate(() => console.error('Repeated error'));
    await page.waitForTimeout(500);

    // Counter should show ×3, ignore button appears
    expect(await ext.getToastCounter(0)).toBe('×3');
    expect(await ext.hasToastIgnoreButton(0)).toBe(true);
  });

  test('Ignore menu: Shows Dismiss and Ignore Forever options only', async ({
    page,
    context,
    extensionId,
  }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    await page.goto(TEST_URL);
    await page.waitForTimeout(300); // Wait for extension initialization

    // Trigger error 3 times to show ignore button
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => console.error('Menu test error'));
      await page.waitForTimeout(300);
    }

    expect(await ext.hasToastIgnoreButton(0)).toBe(true);

    // Click ignore button to open menu
    await ext.clickToastIgnoreButton(0);
    await page.waitForTimeout(200);

    // Verify menu options
    const menuOptions = await ext.getIgnoreMenuOptions();
    expect(menuOptions).toHaveLength(2);
    expect(menuOptions[0]).toContain('Dismiss');
    expect(menuOptions[0]).toContain('Until page reload');
    expect(menuOptions[1]).toContain('Ignore Forever');
    expect(menuOptions[1]).toContain('Never show again');

    // Verify no "browser" scope option
    expect(menuOptions.join(' ')).not.toContain('browser');
    expect(menuOptions.join(' ')).not.toContain('Until browser closes');
  });

  test('Session ignore: Blocks error until page reload', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    await page.goto(TEST_URL);
    await page.waitForTimeout(300); // Wait for extension initialization

    // Trigger error 3 times to show ignore button
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => console.error('Session ignore test'));
      await page.waitForTimeout(300);
    }

    expect(await ext.hasToastIgnoreButton(0)).toBe(true);

    // Click ignore button and select "Dismiss" (session scope)
    await ext.clickToastIgnoreButton(0);
    await page.waitForTimeout(200);
    await ext.selectIgnoreOption('session');
    await page.waitForTimeout(500);

    // Toast should be closed
    expect(await ext.getToastCount()).toBe(0);

    // Trigger same error again - should be blocked
    await page.evaluate(() => console.error('Session ignore test'));
    await page.waitForTimeout(1000);
    expect(await ext.getToastCount()).toBe(0);

    // Trigger different error - should show
    await page.evaluate(() => console.error('Different error'));
    await ext.waitForToast(2000);
    expect(await ext.getToastCount()).toBe(1);
    expect(await ext.getToastMessage(0)).toBe('Different error');

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // Trigger previously ignored error - should show again after reload
    await page.evaluate(() => console.error('Session ignore test'));
    await ext.waitForToast(2000);
    expect(await ext.getToastCount()).toBe(1);
    expect(await ext.getToastMessage(0)).toBe('Session ignore test');
  });

  test('Permanent ignore: Blocks error across page reloads', async ({
    page,
    context,
    extensionId,
  }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    await page.goto(TEST_URL);
    await page.waitForTimeout(300); // Wait for extension initialization

    // Trigger error 3 times to show ignore button
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => console.error('Permanent ignore test'));
      await page.waitForTimeout(300);
    }

    expect(await ext.hasToastIgnoreButton(0)).toBe(true);

    // Click ignore button and select "Ignore Forever" (permanent scope)
    await ext.clickToastIgnoreButton(0);
    await page.waitForTimeout(200);
    await ext.selectIgnoreOption('permanent');
    await page.waitForTimeout(500);

    // Toast should be closed
    expect(await ext.getToastCount()).toBe(0);

    // Trigger same error again - should be blocked
    await page.evaluate(() => console.error('Permanent ignore test'));
    await page.waitForTimeout(1000);
    expect(await ext.getToastCount()).toBe(0);

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // Trigger previously ignored error - should still be blocked after reload
    await page.evaluate(() => console.error('Permanent ignore test'));
    await page.waitForTimeout(1000);
    expect(await ext.getToastCount()).toBe(0);

    // Trigger different error - should show
    await page.evaluate(() => console.error('Not ignored error'));
    await ext.waitForToast(2000);
    expect(await ext.getToastCount()).toBe(1);
    expect(await ext.getToastMessage(0)).toBe('Not ignored error');

    // Note: Permanent ignores persist in chrome.storage.local across test runs
    // This is expected behavior and demonstrates the permanent scope working correctly
  });

  test('Multiple errors: Can ignore different errors separately', async ({
    page,
    context,
    extensionId,
  }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    await page.goto(TEST_URL);
    await page.waitForTimeout(300); // Wait for extension initialization

    // Trigger Error A 3 times
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => console.error('Error A'));
      await page.waitForTimeout(300);
    }

    // Trigger Error B 3 times
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => console.error('Error B'));
      await page.waitForTimeout(300);
    }

    // Should have 2 toasts
    expect(await ext.getToastCount()).toBe(2);

    // Ignore Error A (session scope)
    const errorAIndex = (await ext.getToastMessage(0)) === 'Error A' ? 0 : 1;
    await ext.clickToastIgnoreButton(errorAIndex);
    await page.waitForTimeout(200);
    await ext.selectIgnoreOption('session');
    await page.waitForTimeout(500);

    // Should have 1 toast remaining (Error B)
    expect(await ext.getToastCount()).toBe(1);

    // Trigger Error A again - should be blocked
    await page.evaluate(() => console.error('Error A'));
    await page.waitForTimeout(1000);
    expect(await ext.getToastCount()).toBe(1);

    // Trigger Error B again - should show (increment counter)
    await page.evaluate(() => console.error('Error B'));
    await page.waitForTimeout(500);
    expect(await ext.getToastCount()).toBe(1);
    expect(await ext.getToastCounter(0)).toBe('×4');
  });

  test('Counter increments correctly before ignore threshold', async ({
    page,
    context,
    extensionId,
  }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    await page.goto(TEST_URL);
    await page.waitForTimeout(300); // Wait for extension initialization

    // First occurrence - no counter
    await page.evaluate(() => console.error('Counter test'));
    await ext.waitForToast(2000);
    expect(await ext.getToastCounter(0)).toBe(null);

    // Second occurrence - counter appears
    await page.evaluate(() => console.error('Counter test'));
    await page.waitForTimeout(500);
    expect(await ext.getToastCounter(0)).toBe('×2');

    // Third occurrence - counter updates, ignore button appears
    await page.evaluate(() => console.error('Counter test'));
    await page.waitForTimeout(500);
    expect(await ext.getToastCounter(0)).toBe('×3');
    expect(await ext.hasToastIgnoreButton(0)).toBe(true);

    // Fourth occurrence - counter continues to increment
    await page.evaluate(() => console.error('Counter test'));
    await page.waitForTimeout(500);
    expect(await ext.getToastCounter(0)).toBe('×4');

    // Fifth occurrence
    await page.evaluate(() => console.error('Counter test'));
    await page.waitForTimeout(500);
    expect(await ext.getToastCounter(0)).toBe('×5');
  });

  test('Ignore menu closes when clicking outside', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    await page.goto(TEST_URL);
    await page.waitForTimeout(300); // Wait for extension initialization

    // Trigger error 3 times
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => console.error('Menu close test'));
      await page.waitForTimeout(300);
    }

    // Open ignore menu
    await ext.clickToastIgnoreButton(0);
    await page.waitForTimeout(200);

    // Verify menu is open
    expect(await ext.isIgnoreMenuOpen()).toBe(true);

    // Click outside (on page body)
    await page.click('body');
    await page.waitForTimeout(200);

    // Menu should be closed
    expect(await ext.isIgnoreMenuOpen()).toBe(false);

    // Toast should still be visible
    expect(await ext.getToastCount()).toBe(1);
  });
});
