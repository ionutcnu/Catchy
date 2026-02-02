import { test, expect } from '../fixtures';
import { PopupPage } from '../page-objects/PopupPage';
import { ExtensionPage } from '../page-objects/ExtensionPage';
import path from 'node:path';

/**
 * Complete User Workflow Test
 * Tests the first interaction of a user with the extension:
 * - Global enable/disable
 * - Per-site enable/disable
 * - Toast appearance validation
 */

test.describe('User Workflow: Global & Per-Site Controls', () => {
  test('should control toasts via popup settings', async ({ page, context, extensionId, testServer }) => {
    const popup = new PopupPage(context, extensionId);
    const ext = new ExtensionPage(page);

    const minimalUrl = `${testServer.url}/minimal.html`;
    const realWebsite = 'https://lonut.dev/';
    const minimalHostname = new URL(minimalUrl).hostname; // Extract hostname for popup

    // =====================================
    // STEP 1: Verify extension loaded and global mode ON by default
    // =====================================
    await popup.open(minimalHostname);
    expect(await popup.isGlobalModeEnabled()).toBe(true);
    await popup.close();

    // =====================================
    // STEP 2: Go to minimal.html, trigger error, validate toast appears
    // =====================================
    await page.goto(minimalUrl);
    expect(await ext.isLoaded()).toBe(true);

    await page.evaluate(() => console.error('Test error 1: Global ON'));
    expect(await ext.waitForToast(3000)).toBe(true);

    const message1 = await ext.getToastMessage();
    expect(message1).toContain('Test error 1');

    // =====================================
    // STEP 3: Disable Global Mode via popup
    // =====================================
    await popup.open(minimalHostname);
    expect(await popup.isGlobalModeEnabled()).toBe(true);

    await popup.toggleGlobalMode();
    expect(await popup.isGlobalModeEnabled()).toBe(false);
    await popup.close();

    // =====================================
    // STEP 4: Trigger error on minimal.html, validate NO toast
    // =====================================
    await page.goto(minimalUrl);
    await page.evaluate(() => console.error('Test error 2: Global OFF'));

    expect(await ext.waitForNoToast(2000)).toBe(true);
    expect(await ext.hasToast()).toBe(false);

    // =====================================
    // STEP 5: Enable Global Mode back ON
    // =====================================
    await popup.open(minimalHostname);
    await popup.toggleGlobalMode();
    expect(await popup.isGlobalModeEnabled()).toBe(true);
    await popup.close();

    // =====================================
    // STEP 6: Disable minimal.html specifically (global ON, site disabled)
    // =====================================
    await page.goto(minimalUrl);

    await popup.open(minimalHostname);
    expect(await popup.getCurrentHostname()).toContain(minimalHostname);
    expect(await popup.isSiteEnabled()).toBe(true);

    await popup.toggleSite();
    expect(await popup.isSiteEnabled()).toBe(false);
    await popup.close();

    // =====================================
    // STEP 7: Trigger error, validate NO toast (global ON, site disabled)
    // =====================================
    await page.goto(minimalUrl);
    await page.evaluate(() => console.error('Test error 3: Global ON, Site OFF'));

    expect(await ext.waitForNoToast(2000)).toBe(true);
    expect(await ext.hasToast()).toBe(false);

    // =====================================
    // STEP 8: Navigate to lonut.dev, trigger error, validate toast appears
    // =====================================
    await page.goto(realWebsite);
    await page.evaluate(() => console.error('Test error 4: Different site'));

    expect(await ext.waitForToast(3000)).toBe(true);
    const message4 = await ext.getToastMessage();
    expect(message4).toContain('Test error 4');

    // =====================================
    // STEP 9: Go back to minimal.html, validate still disabled
    // =====================================
    await page.goto(minimalUrl);
    await page.evaluate(() => console.error('Test error 5: Site still disabled'));

    expect(await ext.waitForNoToast(2000)).toBe(true);
    expect(await ext.hasToast()).toBe(false);

    // =====================================
    // Verify popup shows correct state
    // =====================================
    await popup.open(minimalHostname);
    expect(await popup.isGlobalModeEnabled()).toBe(true);
    expect(await popup.isSiteEnabled()).toBe(false); // Still disabled
    await popup.close();
  });
});

