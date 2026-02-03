import { test, expect } from '../fixtures';
import { PopupPage } from '../page-objects/PopupPage';
import { SettingsPage } from '../page-objects/SettingsPage';

/**
 * Popup ↔ Settings Sync Tests
 * Verifies that changes made in popup are reflected in settings page and vice versa
 */

test.describe('Popup ↔ Settings Sync', () => {
  const TEST_HOSTNAME = 'lonut.dev';

  test('Popup global toggle → Settings page reflects change', async ({ context, extensionId }) => {
    const popup = new PopupPage(context, extensionId);
    const settings = new SettingsPage(context, extensionId);

    // Open popup and toggle global mode OFF
    await popup.open(TEST_HOSTNAME);
    const initialState = await popup.isGlobalModeEnabled();

    await popup.toggleGlobalMode();
    const newState = await popup.isGlobalModeEnabled();
    expect(newState).toBe(!initialState);
    await popup.close();

    // Verify settings page shows same state
    await settings.open();
    const settingsState = await settings.isGlobalModeEnabled();
    expect(settingsState).toBe(newState);
    await settings.close();
  });

  test('Settings global toggle → Popup reflects change', async ({ context, extensionId }) => {
    const popup = new PopupPage(context, extensionId);
    const settings = new SettingsPage(context, extensionId);

    // Open settings and toggle global mode
    await settings.open();
    const initialState = await settings.isGlobalModeEnabled();

    await settings.toggleGlobalMode();
    const newState = await settings.isGlobalModeEnabled();
    expect(newState).toBe(!initialState);
    await settings.close();

    // Verify popup shows same state
    await popup.open(TEST_HOSTNAME);
    const popupState = await popup.isGlobalModeEnabled();
    expect(popupState).toBe(newState);
    await popup.close();
  });

  test('Popup site toggle → Settings page reflects change', async ({ page, context, extensionId }) => {
    const popup = new PopupPage(context, extensionId);
    const settings = new SettingsPage(context, extensionId);

    // Navigate to test page
    await page.goto(`https://${TEST_HOSTNAME}/`);

    // Open popup and toggle site
    await popup.open(TEST_HOSTNAME);
    const initialState = await popup.isSiteEnabled();

    await popup.toggleSite();
    const newState = await popup.isSiteEnabled();
    expect(newState).toBe(!initialState);
    await popup.close();

    // Verify settings page shows same state
    await settings.open();
    const settingsState = await settings.isSiteEnabled(TEST_HOSTNAME);
    expect(settingsState).toBe(newState);

    // Verify site exists in per-site list
    expect(await settings.hasSite(TEST_HOSTNAME)).toBe(true);
    await settings.close();
  });

  test('Settings add site → Popup shows site in per-site list', async ({ page, context, extensionId }) => {
    const popup = new PopupPage(context, extensionId);
    const settings = new SettingsPage(context, extensionId);

    const testSite = 'example.com';

    // Add site via settings page
    await settings.open();

    // Remove site first if it exists
    if (await settings.hasSite(testSite)) {
      await settings.removeSite(testSite);
    }

    await settings.addSite(testSite);
    expect(await settings.hasSite(testSite)).toBe(true);

    const settingsEnabled = await settings.isSiteEnabled(testSite);
    await settings.close();

    // Verify popup shows correct state when on that site
    await page.goto(`https://${testSite}/`);
    await popup.open(testSite);

    const popupEnabled = await popup.isSiteEnabled();
    expect(popupEnabled).toBe(settingsEnabled);
    await popup.close();
  });

  test('Settings toggle site → Popup reflects change', async ({ page, context, extensionId }) => {
    const popup = new PopupPage(context, extensionId);
    const settings = new SettingsPage(context, extensionId);

    // Ensure site exists
    await settings.open();
    if (!(await settings.hasSite(TEST_HOSTNAME))) {
      await settings.addSite(TEST_HOSTNAME);
    }

    const initialState = await settings.isSiteEnabled(TEST_HOSTNAME);

    // Toggle site in settings
    await settings.toggleSite(TEST_HOSTNAME);
    const newState = await settings.isSiteEnabled(TEST_HOSTNAME);
    expect(newState).toBe(!initialState);
    await settings.close();

    // Verify popup shows same state
    await page.goto(`https://${TEST_HOSTNAME}/`);
    await popup.open(TEST_HOSTNAME);

    const popupState = await popup.isSiteEnabled();
    expect(popupState).toBe(newState);
    await popup.close();
  });

  test('Settings remove site → Popup shows site as enabled (default)', async ({ page, context, extensionId }) => {
    const popup = new PopupPage(context, extensionId);
    const settings = new SettingsPage(context, extensionId);

    // Add site via settings
    await settings.open();
    if (!(await settings.hasSite(TEST_HOSTNAME))) {
      await settings.addSite(TEST_HOSTNAME);
    }

    // Remove the site
    await settings.removeSite(TEST_HOSTNAME);
    expect(await settings.hasSite(TEST_HOSTNAME)).toBe(false);
    await settings.close();

    // Verify popup shows site as enabled (default when not in per-site list)
    await page.goto(`https://${TEST_HOSTNAME}/`);
    await popup.open(TEST_HOSTNAME);

    const popupEnabled = await popup.isSiteEnabled();
    expect(popupEnabled).toBe(true); // Default is enabled when not in per-site list
    await popup.close();
  });
});
