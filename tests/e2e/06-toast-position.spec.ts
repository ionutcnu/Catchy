import { test, expect } from '../fixtures';
import { SettingsPage } from '../page-objects/SettingsPage';
import { ExtensionPage } from '../page-objects/ExtensionPage';

/**
 * Toast Position Tests
 * Tests toast position settings, swipe to dismiss, and persist pinned toasts
 */

test.describe('Toast Position', () => {
  const TEST_URL = 'https://lonut.dev/';

  test.describe('Position Settings', () => {
    test('Position = top-left: Toast appears in top-left corner', async ({
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

      // Set position to top-left
      await settings.navigateToSection('position');
      await settings.setToastPosition('top-left');

      // CRITICAL: Wait for chrome.storage.sync.set() to complete BEFORE closing page
      await page.waitForTimeout(1000);

      await settings.close();

      // Navigate to test page
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(500);

      // Trigger error
      await page.evaluate(() => console.error('Test: Position top-left'));
      expect(await ext.waitForToast(3000)).toBe(true);

      // Verify position is top-left
      const position = await ext.getToastPosition();
      expect(position).toBe('top-left');
    });

    test('Position = top-right: Toast appears in top-right corner', async ({
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

      // Set position to top-right
      await settings.navigateToSection('position');
      await settings.setToastPosition('top-right');

      // Wait BEFORE closing for storage to save
      await page.waitForTimeout(1000);
      await settings.close();

      // Navigate and trigger error
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(500);

      await page.evaluate(() => console.error('Test: Position top-right'));
      expect(await ext.waitForToast(3000)).toBe(true);

      // Verify position is top-right
      const position = await ext.getToastPosition();
      expect(position).toBe('top-right');
    });

    test('Position = bottom-left: Toast appears in bottom-left corner', async ({
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

      // Set position to bottom-left
      await settings.navigateToSection('position');
      await settings.setToastPosition('bottom-left');

      // Wait BEFORE closing for storage to save
      await page.waitForTimeout(1000);
      await settings.close();

      // Navigate and trigger error
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(500);

      await page.evaluate(() => console.error('Test: Position bottom-left'));
      expect(await ext.waitForToast(3000)).toBe(true);

      // Verify position is bottom-left
      const position = await ext.getToastPosition();
      expect(position).toBe('bottom-left');
    });

    test('Position = bottom-right: Toast appears in bottom-right corner (default)', async ({
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

      // Set position to bottom-right
      await settings.navigateToSection('position');
      await settings.setToastPosition('bottom-right');

      // Wait BEFORE closing for storage to save
      await page.waitForTimeout(1000);
      await settings.close();

      // Navigate and trigger error
      await page.goto(TEST_URL);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(500);

      await page.evaluate(() => console.error('Test: Position bottom-right'));
      expect(await ext.waitForToast(3000)).toBe(true);

      // Verify position is bottom-right
      const position = await ext.getToastPosition();
      expect(position).toBe('bottom-right');
    });
  });

  test.describe('Toast Behavior Settings', () => {
    test('Swipe to Dismiss: Toggle ON and verify setting persists', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);

      // Open settings and navigate to position section
      await settings.open();
      await settings.navigateToSection('position');

      // Check current state
      const initialState = await settings.isSwipeToDismissEnabled();

      // Toggle swipe to dismiss
      await settings.toggleSwipeToDismiss();

      // Wait for storage to save
      await page.waitForTimeout(1000);

      // Verify state changed
      const newState = await settings.isSwipeToDismissEnabled();
      expect(newState).toBe(!initialState);

      // Close and reopen to verify persistence
      await settings.close();
      await settings.open();
      await settings.navigateToSection('position');

      // Verify setting persisted
      const persistedState = await settings.isSwipeToDismissEnabled();
      expect(persistedState).toBe(newState);

      await settings.close();
    });

    test('Persist Pinned Toasts: Toggle ON and verify setting persists', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);

      // Open settings and navigate to position section
      await settings.open();
      await settings.navigateToSection('position');

      // Check current state
      const initialState = await settings.isPersistPinnedEnabled();

      // Toggle persist pinned
      await settings.togglePersistPinned();

      // Wait for storage to save
      await page.waitForTimeout(1000);

      // Verify state changed
      const newState = await settings.isPersistPinnedEnabled();
      expect(newState).toBe(!initialState);

      // Close and reopen to verify persistence
      await settings.close();
      await settings.open();
      await settings.navigateToSection('position');

      // Verify setting persisted
      const persistedState = await settings.isPersistPinnedEnabled();
      expect(persistedState).toBe(newState);

      await settings.close();
    });
  });
});
