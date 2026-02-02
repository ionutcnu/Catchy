import { test, expect } from '../fixtures';
import { SettingsPage } from '../page-objects/SettingsPage';
import { ExtensionPage } from '../page-objects/ExtensionPage';

/**
 * Settings Page Per-Site Control Tests
 * Tests toast visibility using Settings Page to control:
 * - Global mode state (ON/OFF)
 * - Per-site settings (enabled/disabled)
 *
 * Uses lonut.dev and lonut.dev/about to verify hostname-based settings
 * (both URLs share the same hostname, so per-site settings affect both)
 */

test.describe('Settings Page: Per-Site Control', () => {
  const LONUT_DEV = 'https://lonut.dev/';
  const LONUT_ABOUT = 'https://lonut.dev/about';
  const LONUT_HOSTNAME = 'lonut.dev';

  test.describe('Global Mode ON (via Settings)', () => {
    test('Scenario 1: lonut.dev disabled → NO toast on lonut.dev', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Open settings and ensure global mode ON
      await settings.open();
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }
      expect(await settings.isGlobalModeEnabled()).toBe(true);

      // Add lonut.dev and disable it
      if (!(await settings.hasSite(LONUT_HOSTNAME))) {
        await settings.addSite(LONUT_HOSTNAME);
      }

      if (await settings.isSiteEnabled(LONUT_HOSTNAME)) {
        await settings.toggleSite(LONUT_HOSTNAME);
      }
      expect(await settings.isSiteEnabled(LONUT_HOSTNAME)).toBe(false);
      await settings.close();

      // Navigate to lonut.dev and trigger error → NO toast
      await page.goto(LONUT_DEV);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(500);

      await page.evaluate(() => console.error('Test: Settings Global ON, lonut.dev disabled'));

      expect(await ext.waitForNoToast(2000)).toBe(true);
      expect(await ext.hasToast()).toBe(false);
    });

    test('Scenario 2: lonut.dev disabled → NO toast on lonut.dev/about (same hostname)', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Open settings, ensure global ON, lonut.dev disabled
      await settings.open();
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }

      if (!(await settings.hasSite(LONUT_HOSTNAME))) {
        await settings.addSite(LONUT_HOSTNAME);
      }

      if (await settings.isSiteEnabled(LONUT_HOSTNAME)) {
        await settings.toggleSite(LONUT_HOSTNAME);
      }
      expect(await settings.isSiteEnabled(LONUT_HOSTNAME)).toBe(false);
      await settings.close();

      // Navigate to lonut.dev/about → Should also have NO toast (same hostname)
      await page.goto(LONUT_ABOUT);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(500);

      await page.evaluate(() => console.error('Test: Settings Global ON, lonut.dev disabled, about page'));

      expect(await ext.waitForNoToast(2000)).toBe(true);
      expect(await ext.hasToast()).toBe(false);
    });

    test('Scenario 3: lonut.dev enabled → SHOW toast on lonut.dev', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Open settings, ensure global ON, lonut.dev enabled
      await settings.open();
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }

      if (!(await settings.hasSite(LONUT_HOSTNAME))) {
        await settings.addSite(LONUT_HOSTNAME);
      }

      if (!(await settings.isSiteEnabled(LONUT_HOSTNAME))) {
        await settings.toggleSite(LONUT_HOSTNAME);
      }
      expect(await settings.isSiteEnabled(LONUT_HOSTNAME)).toBe(true);
      await settings.close();

      // Navigate to lonut.dev → Should SHOW toast
      await page.goto(LONUT_DEV);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(500);

      await page.evaluate(() => console.error('Test: Settings Global ON, lonut.dev enabled'));

      expect(await ext.waitForToast(3000)).toBe(true);
      const message = await ext.getToastMessage();
      expect(message).toContain('Test: Settings Global ON, lonut.dev enabled');
    });

    test('Scenario 4: lonut.dev enabled → SHOW toast on lonut.dev/about (same hostname)', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Open settings, ensure global ON, lonut.dev enabled
      await settings.open();
      if (!(await settings.isGlobalModeEnabled())) {
        await settings.toggleGlobalMode();
      }

      if (!(await settings.hasSite(LONUT_HOSTNAME))) {
        await settings.addSite(LONUT_HOSTNAME);
      }

      if (!(await settings.isSiteEnabled(LONUT_HOSTNAME))) {
        await settings.toggleSite(LONUT_HOSTNAME);
      }
      expect(await settings.isSiteEnabled(LONUT_HOSTNAME)).toBe(true);
      await settings.close();

      // Navigate to lonut.dev/about → Should SHOW toast (same hostname)
      await page.goto(LONUT_ABOUT);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(500);

      await page.evaluate(() => console.error('Test: Settings Global ON, lonut.dev enabled, about page'));

      expect(await ext.waitForToast(3000)).toBe(true);
      const message = await ext.getToastMessage();
      expect(message).toContain('Test: Settings Global ON, lonut.dev enabled, about page');
    });
  });

  test.describe('Global Mode OFF (via Settings)', () => {
    test('Scenario 5: Global OFF, lonut.dev disabled → NO toast on lonut.dev', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Open settings, disable global mode
      await settings.open();
      if (await settings.isGlobalModeEnabled()) {
        await settings.toggleGlobalMode();
      }
      expect(await settings.isGlobalModeEnabled()).toBe(false);

      // Add and disable lonut.dev
      if (!(await settings.hasSite(LONUT_HOSTNAME))) {
        await settings.addSite(LONUT_HOSTNAME);
      }

      if (await settings.isSiteEnabled(LONUT_HOSTNAME)) {
        await settings.toggleSite(LONUT_HOSTNAME);
      }
      expect(await settings.isSiteEnabled(LONUT_HOSTNAME)).toBe(false);
      await settings.close();

      // Navigate to lonut.dev → NO toast
      await page.goto(LONUT_DEV);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(500);

      await page.evaluate(() => console.error('Test: Settings Global OFF, lonut.dev disabled'));

      expect(await ext.waitForNoToast(2000)).toBe(true);
      expect(await ext.hasToast()).toBe(false);
    });

    test('Scenario 6: Global OFF, lonut.dev enabled → SHOW toast on lonut.dev', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Open settings, disable global mode
      await settings.open();
      if (await settings.isGlobalModeEnabled()) {
        await settings.toggleGlobalMode();
      }
      expect(await settings.isGlobalModeEnabled()).toBe(false);

      // Add and enable lonut.dev
      if (!(await settings.hasSite(LONUT_HOSTNAME))) {
        await settings.addSite(LONUT_HOSTNAME);
      }

      if (!(await settings.isSiteEnabled(LONUT_HOSTNAME))) {
        await settings.toggleSite(LONUT_HOSTNAME);
      }
      expect(await settings.isSiteEnabled(LONUT_HOSTNAME)).toBe(true);
      await settings.close();

      // Navigate to lonut.dev → SHOW toast
      await page.goto(LONUT_DEV);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(500);

      await page.evaluate(() => console.error('Test: Settings Global OFF, lonut.dev enabled'));

      expect(await ext.waitForToast(3000)).toBe(true);
      const message = await ext.getToastMessage();
      expect(message).toContain('Test: Settings Global OFF, lonut.dev enabled');
    });

    test('Scenario 7: Global OFF, lonut.dev enabled → SHOW toast on lonut.dev/about', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Open settings, disable global mode
      await settings.open();
      if (await settings.isGlobalModeEnabled()) {
        await settings.toggleGlobalMode();
      }
      expect(await settings.isGlobalModeEnabled()).toBe(false);

      // Add and enable lonut.dev
      if (!(await settings.hasSite(LONUT_HOSTNAME))) {
        await settings.addSite(LONUT_HOSTNAME);
      }

      if (!(await settings.isSiteEnabled(LONUT_HOSTNAME))) {
        await settings.toggleSite(LONUT_HOSTNAME);
      }
      expect(await settings.isSiteEnabled(LONUT_HOSTNAME)).toBe(true);
      await settings.close();

      // Navigate to lonut.dev/about → SHOW toast
      await page.goto(LONUT_ABOUT);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(500);

      await page.evaluate(() => console.error('Test: Settings Global OFF, lonut.dev enabled, about page'));

      expect(await ext.waitForToast(3000)).toBe(true);
      const message = await ext.getToastMessage();
      expect(message).toContain('Test: Settings Global OFF, lonut.dev enabled, about page');
    });

    test('Scenario 8: Global OFF, lonut.dev disabled → NO toast on lonut.dev/about', async ({
      page,
      context,
      extensionId,
    }) => {
      const settings = new SettingsPage(context, extensionId);
      const ext = new ExtensionPage(page);

      // Open settings, disable global mode
      await settings.open();
      if (await settings.isGlobalModeEnabled()) {
        await settings.toggleGlobalMode();
      }
      expect(await settings.isGlobalModeEnabled()).toBe(false);

      // Add and disable lonut.dev
      if (!(await settings.hasSite(LONUT_HOSTNAME))) {
        await settings.addSite(LONUT_HOSTNAME);
      }

      if (await settings.isSiteEnabled(LONUT_HOSTNAME)) {
        await settings.toggleSite(LONUT_HOSTNAME);
      }
      expect(await settings.isSiteEnabled(LONUT_HOSTNAME)).toBe(false);
      await settings.close();

      // Navigate to lonut.dev/about → NO toast
      await page.goto(LONUT_ABOUT);
      expect(await ext.isLoaded()).toBe(true);
      await page.waitForTimeout(500);

      await page.evaluate(() => console.error('Test: Settings Global OFF, lonut.dev disabled, about page'));

      expect(await ext.waitForNoToast(2000)).toBe(true);
      expect(await ext.hasToast()).toBe(false);
    });
  });
});
