import { test, expect } from '../fixtures';
import { PopupPage } from '../page-objects/PopupPage';
import { ExtensionPage } from '../page-objects/ExtensionPage';

/**
 * Global Mode + Per-Site Interaction Tests
 * Tests toast visibility based on:
 * - Global mode state (ON/OFF)
 * - Current site's per-site setting (enabled/disabled)
 * - Other site's per-site setting (to verify isolation)
 */

test.describe('Global + Per-Site Interaction', () => {
  const LONUT_DEV = 'https://lonut.dev/';
  const EXAMPLE_COM = 'https://example.com/';
  const LONUT_HOSTNAME = 'lonut.dev';
  const EXAMPLE_HOSTNAME = 'example.com';

  test.describe('Global Mode ON', () => {
    test('Scenario 1: Current site disabled → NO toast (lonut.dev)', async ({
      page,
      context,
      extensionId,
    }) => {
      const popup = new PopupPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Navigate to lonut.dev
      await page.goto(LONUT_DEV);
      expect(await ext.isLoaded()).toBe(true);

      // Ensure global mode ON
      await popup.open(LONUT_HOSTNAME);
      if (!(await popup.isGlobalModeEnabled())) {
        await popup.toggleGlobalMode();
      }
      expect(await popup.isGlobalModeEnabled()).toBe(true);

      // Disable lonut.dev specifically
      if (await popup.isSiteEnabled()) {
        await popup.toggleSite();
      }
      expect(await popup.isSiteEnabled()).toBe(false);
      await popup.close();

      // Trigger error on lonut.dev → Should NOT show toast
      await page.goto(LONUT_DEV);
      await page.evaluate(() => console.error('Test: Global ON, lonut.dev disabled'));

      expect(await ext.waitForNoToast(2000)).toBe(true);
      expect(await ext.hasToast()).toBe(false);
    });

    test('Scenario 2: Other site disabled, current enabled → SHOW toast (lonut.dev)', async ({
      page,
      context,
      extensionId,
    }) => {
      const popup = new PopupPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Navigate to example.com and disable it
      await page.goto(EXAMPLE_COM);
      await popup.open(EXAMPLE_HOSTNAME);

      if (!(await popup.isGlobalModeEnabled())) {
        await popup.toggleGlobalMode();
      }

      if (await popup.isSiteEnabled()) {
        await popup.toggleSite();
      }
      expect(await popup.isSiteEnabled()).toBe(false);
      await popup.close();

      // Navigate to lonut.dev and ensure it's enabled
      await page.goto(LONUT_DEV);
      await popup.open(LONUT_HOSTNAME);

      if (!(await popup.isSiteEnabled())) {
        await popup.toggleSite();
      }
      expect(await popup.isSiteEnabled()).toBe(true);
      await popup.close();

      // Trigger error on lonut.dev → Should SHOW toast (example.com disabled, but lonut.dev enabled)
      await page.goto(LONUT_DEV);
      await page.evaluate(() => console.error('Test: Global ON, example.com disabled, lonut.dev enabled'));

      expect(await ext.waitForToast(3000)).toBe(true);
      const message = await ext.getToastMessage();
      expect(message).toContain('Test: Global ON, example.com disabled, lonut.dev enabled');
    });

    test('Scenario 3: Current site enabled → SHOW toast (example.com)', async ({
      page,
      context,
      extensionId,
    }) => {
      const popup = new PopupPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Navigate to example.com
      await page.goto(EXAMPLE_COM);
      expect(await ext.isLoaded()).toBe(true);

      // Ensure global mode ON and site enabled
      await popup.open(EXAMPLE_HOSTNAME);
      if (!(await popup.isGlobalModeEnabled())) {
        await popup.toggleGlobalMode();
      }

      if (!(await popup.isSiteEnabled())) {
        await popup.toggleSite();
      }
      expect(await popup.isSiteEnabled()).toBe(true);
      await popup.close();

      // Trigger error on example.com → Should SHOW toast
      await page.goto(EXAMPLE_COM);
      expect(await ext.isLoaded()).toBe(true); // Verify extension loaded
      await page.waitForTimeout(500); // Wait for content script to fully initialize

      await page.evaluate(() => console.error('Test: Global ON, example.com enabled'));

      expect(await ext.waitForToast(3000)).toBe(true);
      const message = await ext.getToastMessage();
      expect(message).toContain('Test: Global ON, example.com enabled');
    });

    test('Scenario 4: Current site disabled → NO toast (example.com)', async ({
      page,
      context,
      extensionId,
    }) => {
      const popup = new PopupPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Navigate to example.com
      await page.goto(EXAMPLE_COM);

      // Ensure global mode ON, disable example.com
      await popup.open(EXAMPLE_HOSTNAME);
      if (!(await popup.isGlobalModeEnabled())) {
        await popup.toggleGlobalMode();
      }

      if (await popup.isSiteEnabled()) {
        await popup.toggleSite();
      }
      expect(await popup.isSiteEnabled()).toBe(false);
      await popup.close();

      // Trigger error on example.com → Should NOT show toast
      await page.goto(EXAMPLE_COM);
      await page.evaluate(() => console.error('Test: Global ON, example.com disabled'));

      expect(await ext.waitForNoToast(2000)).toBe(true);
      expect(await ext.hasToast()).toBe(false);
    });
  });

  test.describe('Global Mode OFF', () => {
    test('Scenario 5: Global OFF, current site disabled → NO toast (lonut.dev)', async ({
      page,
      context,
      extensionId,
    }) => {
      const popup = new PopupPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Navigate to lonut.dev
      await page.goto(LONUT_DEV);

      // Disable global mode
      await popup.open(LONUT_HOSTNAME);
      if (await popup.isGlobalModeEnabled()) {
        await popup.toggleGlobalMode();
      }
      expect(await popup.isGlobalModeEnabled()).toBe(false);

      // Disable lonut.dev
      if (await popup.isSiteEnabled()) {
        await popup.toggleSite();
      }
      expect(await popup.isSiteEnabled()).toBe(false);
      await popup.close();

      // Trigger error → Should NOT show toast
      await page.goto(LONUT_DEV);
      await page.evaluate(() => console.error('Test: Global OFF, lonut.dev disabled'));

      expect(await ext.waitForNoToast(2000)).toBe(true);
      expect(await ext.hasToast()).toBe(false);
    });

    test('Scenario 6: Global OFF, current site enabled → SHOW toast (lonut.dev)', async ({
      page,
      context,
      extensionId,
    }) => {
      const popup = new PopupPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Navigate to lonut.dev
      await page.goto(LONUT_DEV);

      // Disable global mode
      await popup.open(LONUT_HOSTNAME);
      if (await popup.isGlobalModeEnabled()) {
        await popup.toggleGlobalMode();
      }
      expect(await popup.isGlobalModeEnabled()).toBe(false);

      // Enable lonut.dev specifically
      if (!(await popup.isSiteEnabled())) {
        await popup.toggleSite();
      }
      expect(await popup.isSiteEnabled()).toBe(true);
      await popup.close();

      // Trigger error → Should SHOW toast (global OFF but site enabled)
      await page.goto(LONUT_DEV);
      await page.evaluate(() => console.error('Test: Global OFF, lonut.dev enabled'));

      expect(await ext.waitForToast(3000)).toBe(true);
      const message = await ext.getToastMessage();
      expect(message).toContain('Test: Global OFF, lonut.dev enabled');
    });

    test('Scenario 7: Global OFF, current site enabled → SHOW toast (example.com)', async ({
      page,
      context,
      extensionId,
    }) => {
      const popup = new PopupPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Navigate to example.com
      await page.goto(EXAMPLE_COM);

      // Disable global mode
      await popup.open(EXAMPLE_HOSTNAME);
      if (await popup.isGlobalModeEnabled()) {
        await popup.toggleGlobalMode();
      }
      expect(await popup.isGlobalModeEnabled()).toBe(false);

      // Enable example.com specifically
      if (!(await popup.isSiteEnabled())) {
        await popup.toggleSite();
      }
      expect(await popup.isSiteEnabled()).toBe(true);
      await popup.close();

      // Trigger error → Should SHOW toast
      await page.goto(EXAMPLE_COM);
      expect(await ext.isLoaded()).toBe(true); // Verify extension loaded
      await page.waitForTimeout(500); // Wait for content script to fully initialize

      await page.evaluate(() => console.error('Test: Global OFF, example.com enabled'));

      expect(await ext.waitForToast(3000)).toBe(true);
      const message = await ext.getToastMessage();
      expect(message).toContain('Test: Global OFF, example.com enabled');
    });

    test('Scenario 8: Global OFF, current site disabled → NO toast (example.com)', async ({
      page,
      context,
      extensionId,
    }) => {
      const popup = new PopupPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Navigate to example.com
      await page.goto(EXAMPLE_COM);

      // Disable global mode
      await popup.open(EXAMPLE_HOSTNAME);
      if (await popup.isGlobalModeEnabled()) {
        await popup.toggleGlobalMode();
      }
      expect(await popup.isGlobalModeEnabled()).toBe(false);

      // Disable example.com
      if (await popup.isSiteEnabled()) {
        await popup.toggleSite();
      }
      expect(await popup.isSiteEnabled()).toBe(false);
      await popup.close();

      // Trigger error → Should NOT show toast
      await page.goto(EXAMPLE_COM);
      await page.evaluate(() => console.error('Test: Global OFF, example.com disabled'));

      expect(await ext.waitForNoToast(2000)).toBe(true);
      expect(await ext.hasToast()).toBe(false);
    });
  });
});
