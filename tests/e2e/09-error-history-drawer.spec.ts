import { test, expect } from '../fixtures';
import { SettingsPage } from '../page-objects/SettingsPage';
import { ExtensionPage } from '../page-objects/ExtensionPage';

/**
 * Error History Drawer Tests
 * Tests drawer open/close, search, filters, clear, and export functionality
 */

test.describe('Error History Drawer', () => {
  const TEST_URL = 'https://lonut.dev/';

  test('Drawer: Opens with ` (backtick) shortcut, closes with ESC', async ({
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
    await settings.close();

    // Navigate to test page
    await page.goto(TEST_URL);
    expect(await ext.isLoaded()).toBe(true);
    await page.waitForTimeout(500);

    // Verify drawer starts closed
    expect(await ext.isDrawerOpen()).toBe(false);

    // Open drawer with ` (backtick)
    await ext.openDrawer('`');
    expect(await ext.isDrawerOpen()).toBe(true);

    // Close drawer with ESC
    await ext.closeDrawer();
    expect(await ext.isDrawerOpen()).toBe(false);
  });

  test('Drawer: Displays error count and error items', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    await page.goto(TEST_URL);
    await page.waitForTimeout(500);

    // Trigger 3 different errors
    await page.evaluate(() => console.error('Error 1'));
    await page.evaluate(() => console.error('Error 2'));
    await page.evaluate(() => console.error('Error 3'));
    await page.waitForTimeout(1000);

    // Open drawer
    await ext.openDrawer();
    expect(await ext.isDrawerOpen()).toBe(true);

    // Verify error count
    const errorCount = await ext.getDrawerErrorCount();
    expect(errorCount).toBe(3);

    // Verify error items displayed
    const errorItems = await ext.getDrawerErrorItems();
    expect(errorItems).toBe(3);
  });

  test('Drawer: Search filters errors by message content', async ({
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
    await page.waitForTimeout(500);

    // Trigger errors with different messages
    await page.evaluate(() => {
      console.error('Database connection failed');
      console.error('API timeout error');
      console.error('Database query error');
    });
    await page.waitForTimeout(1000);

    // Open drawer
    await ext.openDrawer();

    // Search for "Database"
    await ext.searchDrawer('Database');
    await page.waitForTimeout(500);

    // Should show only 2 database-related errors
    const filteredItems = await ext.getDrawerErrorItems();
    expect(filteredItems).toBe(2);

    // Verify first result contains "Database"
    const firstError = await ext.getDrawerErrorMessage(0);
    expect(firstError).toContain('Database');
  });

  test('Drawer: Filter by error type (console.error)', async ({
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
    await page.waitForTimeout(500);

    // Trigger different error types
    await page.evaluate(() => {
      console.error('Console error 1');
      console.error('Console error 2');
      setTimeout(() => {
        throw new Error('Uncaught error');
      }, 0);
    });
    await page.waitForTimeout(1500);

    // Open drawer
    await ext.openDrawer();

    // Initially all errors shown
    const allItems = await ext.getDrawerErrorItems();
    expect(allItems).toBe(3);

    // Toggle console.error filter
    await ext.toggleDrawerFilter('console.error');
    expect(await ext.isDrawerFilterActive('console.error')).toBe(true);
    await page.waitForTimeout(500);

    // Should show only console.error items
    const filteredItems = await ext.getDrawerErrorItems();
    expect(filteredItems).toBe(2);

    // Toggle filter off
    await ext.toggleDrawerFilter('console.error');
    expect(await ext.isDrawerFilterActive('console.error')).toBe(false);
    await page.waitForTimeout(500);

    // Should show all errors again
    const allItemsAgain = await ext.getDrawerErrorItems();
    expect(allItemsAgain).toBe(3);
  });

  test('Drawer: Filter by error type (uncaught)', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    await page.goto(TEST_URL);
    await page.waitForTimeout(500);

    // Trigger different error types
    await page.evaluate(() => {
      console.error('Console error');
      setTimeout(() => {
        throw new Error('Uncaught 1');
      }, 0);
      setTimeout(() => {
        throw new Error('Uncaught 2');
      }, 100);
    });
    await page.waitForTimeout(1500);

    // Open drawer
    await ext.openDrawer();

    // Toggle uncaught filter
    await ext.toggleDrawerFilter('uncaught');
    expect(await ext.isDrawerFilterActive('uncaught')).toBe(true);
    await page.waitForTimeout(500);

    // Should show only uncaught errors
    const filteredItems = await ext.getDrawerErrorItems();
    expect(filteredItems).toBe(2);
  });

  test('Drawer: Filter by error type (unhandledrejection)', async ({
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
    await page.waitForTimeout(500);

    // Trigger different error types
    await page.evaluate(() => {
      console.error('Console error');
      Promise.reject('Rejection 1');
      Promise.reject('Rejection 2');
    });
    await page.waitForTimeout(1500);

    // Open drawer
    await ext.openDrawer();

    // Toggle unhandledrejection filter
    await ext.toggleDrawerFilter('unhandledrejection');
    expect(await ext.isDrawerFilterActive('unhandledrejection')).toBe(true);
    await page.waitForTimeout(500);

    // Should show only unhandled rejections
    const filteredItems = await ext.getDrawerErrorItems();
    expect(filteredItems).toBe(2);
  });

  test('Drawer: Combine search and filter', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    await page.goto(TEST_URL);
    await page.waitForTimeout(500);

    // Trigger errors
    await page.evaluate(() => {
      console.error('Database connection failed');
      console.error('API timeout');
      setTimeout(() => {
        throw new Error('Database query failed');
      }, 0);
    });
    await page.waitForTimeout(1500);

    // Open drawer
    await ext.openDrawer();

    // Search for "Database"
    await ext.searchDrawer('Database');
    await page.waitForTimeout(500);

    // Should show 2 items (1 console.error + 1 uncaught)
    expect(await ext.getDrawerErrorItems()).toBe(2);

    // Add console.error filter
    await ext.toggleDrawerFilter('console.error');
    await page.waitForTimeout(500);

    // Should show only 1 item (console.error with "Database")
    expect(await ext.getDrawerErrorItems()).toBe(1);
  });

  test('Drawer: Clear all errors with confirmation', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    await page.goto(TEST_URL);
    await page.waitForTimeout(500);

    // Trigger errors
    await page.evaluate(() => {
      console.error('Error 1');
      console.error('Error 2');
      console.error('Error 3');
    });
    await page.waitForTimeout(1000);

    // Open drawer
    await ext.openDrawer();
    expect(await ext.getDrawerErrorCount()).toBe(3);

    // Click clear all
    await ext.clearAllErrors();
    await page.waitForTimeout(500);

    // Confirm
    await ext.confirmClearAll();
    await page.waitForTimeout(500);

    // Verify errors cleared
    expect(await ext.getDrawerErrorCount()).toBe(0);
    expect(await ext.getDrawerErrorItems()).toBe(0);
  });

  test('Drawer: Cancel clear all keeps errors', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    await page.goto(TEST_URL);
    await page.waitForTimeout(500);

    // Trigger errors
    await page.evaluate(() => {
      console.error('Error 1');
      console.error('Error 2');
    });
    await page.waitForTimeout(1000);

    // Open drawer
    await ext.openDrawer();
    const initialCount = await ext.getDrawerErrorCount();
    expect(initialCount).toBe(2);

    // Click clear all
    await ext.clearAllErrors();
    await page.waitForTimeout(500);

    // Cancel
    await ext.cancelClearAll();
    await page.waitForTimeout(500);

    // Verify errors still exist
    expect(await ext.getDrawerErrorCount()).toBe(initialCount);
  });

  test('Drawer: Errors persist when drawer is reopened', async ({
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
    await page.waitForTimeout(500);

    // Trigger errors
    await page.evaluate(() => {
      console.error('Persistent error 1');
      console.error('Persistent error 2');
    });
    await page.waitForTimeout(1000);

    // Open drawer, verify count
    await ext.openDrawer();
    expect(await ext.getDrawerErrorCount()).toBe(2);

    // Close drawer
    await ext.closeDrawer();
    await page.waitForTimeout(500);

    // Reopen drawer
    await ext.openDrawer();

    // Verify errors still there
    expect(await ext.getDrawerErrorCount()).toBe(2);
    expect(await ext.getDrawerErrorItems()).toBe(2);
  });

  test('Drawer: Empty state message when no errors', async ({ page, context, extensionId }) => {
    const settings = new SettingsPage(context, extensionId);
    const ext = new ExtensionPage(page);

    await settings.open();
    await settings.navigateToSection('global');
    if (!(await settings.isGlobalModeEnabled())) {
      await settings.toggleGlobalMode();
    }
    await settings.close();

    await page.goto(TEST_URL);
    await page.waitForTimeout(500);

    // Open drawer without triggering errors
    await ext.openDrawer();

    // Verify empty state
    expect(await ext.getDrawerErrorCount()).toBe(0);
    expect(await ext.getDrawerErrorItems()).toBe(0);
  });
});
