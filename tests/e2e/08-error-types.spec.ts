import { test, expect } from '../fixtures';
import { SettingsPage } from '../page-objects/SettingsPage';
import { ExtensionPage } from '../page-objects/ExtensionPage';

/**
 * Error Types Tests
 * Tests error type toggles, persistence, and capture behavior
 */

test.describe('Error Types', () => {
  const TEST_URL = 'https://lonut.dev/';

  test('Console errors: Default enabled, can toggle off', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    // Enable global mode
    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }

    // Verify console errors enabled by default
    await settings.navigateToSection('errors');
    expect(await settings.isConsoleErrorEnabled()).toBe(true);

    // Disable console errors
    await settings.toggleConsoleError();
    await page.waitForTimeout(500);
    expect(await settings.isConsoleErrorEnabled()).toBe(false);
    await settings.close();

    // Trigger console.error - should NOT show toast
    await page.goto(TEST_URL);
    expect(await ext.isLoaded()).toBe(true);
    await page.waitForTimeout(300); // Wait for extension initialization

    await page.evaluate(() => console.error('Test console error'));
    await page.waitForTimeout(1000);

    const toastCount = await ext.getToastCount();
    expect(toastCount).toBe(0);
  });

  test('Console errors: Re-enable shows toasts again', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    // Enable global mode and console errors
    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }

    await settings.navigateToSection('errors');
    if (!(await settings.isConsoleErrorEnabled())) {
      await settings.toggleConsoleError();
    }
    await page.waitForTimeout(500);
    await settings.close();

    // Trigger console.error - should show toast
    await page.goto(TEST_URL);
    await page.waitForTimeout(500);

    await page.evaluate(() => console.error('Test console error enabled'));
    expect(await ext.waitForToast(3000)).toBe(true);

    const toastCount = await ext.getToastCount();
    expect(toastCount).toBe(1);
  });

  test('Uncaught errors: Default enabled, can toggle off', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }

    // Verify uncaught errors enabled by default
    await settings.navigateToSection('errors');
    expect(await settings.isUncaughtEnabled()).toBe(true);

    // Disable uncaught errors
    await settings.toggleUncaught();
    await page.waitForTimeout(500);
    expect(await settings.isUncaughtEnabled()).toBe(false);
    await settings.close();

    // Trigger uncaught error - should NOT show toast
    await page.goto(TEST_URL);
    await page.waitForTimeout(500);

    // Use setTimeout to throw in page context, not Playwright context
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('Test uncaught error');
      }, 0);
    });
    await page.waitForTimeout(1000);

    const toastCount = await ext.getToastCount();
    expect(toastCount).toBe(0);
  });

  test('Unhandled rejections: Default enabled, can toggle off', async ({
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

    // Verify unhandled rejection enabled by default
    await settings.navigateToSection('errors');
    expect(await settings.isUnhandledRejectionEnabled()).toBe(true);

    // Disable unhandled rejection
    await settings.toggleUnhandledRejection();
    await page.waitForTimeout(500);
    expect(await settings.isUnhandledRejectionEnabled()).toBe(false);
    await settings.close();

    // Trigger unhandled rejection - should NOT show toast
    await page.goto(TEST_URL);
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      Promise.reject('Test unhandled rejection');
    });
    await page.waitForTimeout(1000);

    const toastCount = await ext.getToastCount();
    expect(toastCount).toBe(0);
  });

  test('Error types: Settings persist across page reload', async ({
    page,
    context,
    extensionId,
  }) => {
    const settings = new SettingsPage(context, extensionId);

    await settings.open();
    await settings.navigateToSection('errors');

    // Get initial state
    const initialConsole = await settings.isConsoleErrorEnabled();
    const initialUncaught = await settings.isUncaughtEnabled();
    const initialRejection = await settings.isUnhandledRejectionEnabled();

    // Toggle all to opposite state
    await settings.toggleConsoleError();
    await settings.toggleUncaught();
    await settings.toggleUnhandledRejection();

    await page.waitForTimeout(500);

    // Verify toggled state
    expect(await settings.isConsoleErrorEnabled()).toBe(!initialConsole);
    expect(await settings.isUncaughtEnabled()).toBe(!initialUncaught);
    expect(await settings.isUnhandledRejectionEnabled()).toBe(!initialRejection);

    // Close and reopen settings
    await settings.close();
    await settings.open();
    await settings.navigateToSection('errors');

    // Verify settings persisted
    expect(await settings.isConsoleErrorEnabled()).toBe(!initialConsole);
    expect(await settings.isUncaughtEnabled()).toBe(!initialUncaught);
    expect(await settings.isUnhandledRejectionEnabled()).toBe(!initialRejection);

    // Restore defaults by toggling back
    await settings.toggleConsoleError();
    await settings.toggleUncaught();
    await settings.toggleUnhandledRejection();

    await settings.close();
  });

  test('Error types: Multiple types can be disabled simultaneously', async ({
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

    // Disable console errors and uncaught, leave rejection enabled
    await settings.navigateToSection('errors');
    if (await settings.isConsoleErrorEnabled()) {
      await settings.toggleConsoleError();
    }
    if (await settings.isUncaughtEnabled()) {
      await settings.toggleUncaught();
    }
    if (!(await settings.isUnhandledRejectionEnabled())) {
      await settings.toggleUnhandledRejection();
    }

    await page.waitForTimeout(500);
    await settings.close();

    // Test page
    await page.goto(TEST_URL);
    await page.waitForTimeout(500);

    // Trigger console.error - should NOT show
    await page.evaluate(() => console.error('Should not show'));
    await page.waitForTimeout(500);
    expect(await ext.getToastCount()).toBe(0);

    // Trigger uncaught error - should NOT show
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('Should not show');
      }, 0);
    });
    await page.waitForTimeout(500);
    expect(await ext.getToastCount()).toBe(0);

    // Trigger unhandled rejection - SHOULD show
    await page.evaluate(() => {
      Promise.reject('Should show');
    });
    expect(await ext.waitForToast(3000)).toBe(true);
    expect(await ext.getToastCount()).toBe(1);

    // Restore defaults
    await settings.open();
    await settings.navigateToSection('errors');
    if (!(await settings.isConsoleErrorEnabled())) {
      await settings.toggleConsoleError();
    }
    if (!(await settings.isUncaughtEnabled())) {
      await settings.toggleUncaught();
    }
    if (await settings.isUnhandledRejectionEnabled()) {
      await settings.toggleUnhandledRejection();
    }
    await settings.close();
  });

  test('Error types: All three toggles present, no bulk actions', async ({
    page,
    context,
    extensionId,
  }) => {
    const settings = new SettingsPage(context, extensionId);

    await settings.open();
    await settings.navigateToSection('errors');

    const settingsPage = settings.getPagePublic();

    // Verify 3 toggles exist
    const consoleToggle = settingsPage.locator('[data-testid="toggle-console-error"]');
    const uncaughtToggle = settingsPage.locator('[data-testid="toggle-uncaught"]');
    const rejectionToggle = settingsPage.locator('[data-testid="toggle-unhandled-rejection"]');

    await expect(consoleToggle).toBeVisible();
    await expect(uncaughtToggle).toBeVisible();
    await expect(rejectionToggle).toBeVisible();

    // Verify no bulk action buttons
    const selectAllButton = settingsPage.locator('button:has-text("Select All")');
    const deselectAllButton = settingsPage.locator('button:has-text("Deselect All")');
    const commonOnlyButton = settingsPage.locator('button:has-text("Common Only")');

    await expect(selectAllButton).not.toBeVisible();
    await expect(deselectAllButton).not.toBeVisible();
    await expect(commonOnlyButton).not.toBeVisible();

    await settings.close();
  });
});
