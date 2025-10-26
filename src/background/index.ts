/**
 * Background Service Worker
 *
 * This is the "brain" of the extension. It:
 * - Runs in the background (even when no tabs are open)
 * - Listens for events (installation, tab updates, messages)
 * - Manages global state and settings
 * - Coordinates between different parts of the extension
 *
 * Key Concept: Service workers are event-driven and don't run continuously.
 * They "wake up" when an event happens, do their work, then go to sleep.
 */

import { type CatchySettings, DEFAULT_SETTINGS } from '../types';

console.log('[Catchy Background] Service worker started');

/**
 * When extension is first installed or updated
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Catchy Background] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First time installation - set default settings
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    console.log('[Catchy Background] Default settings initialized');

    // Optional: Open welcome page or options page
    // chrome.tabs.create({ url: 'options.html' });
  } else if (details.reason === 'update') {
    // Extension was updated - might need to migrate settings
    console.log('[Catchy Background] Extension updated');
  }
});

/**
 * Listen for messages from content scripts or popup
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Catchy Background] Message received:', message);

  // Handle different message types
  if (message.type === 'GET_SETTINGS') {
    // Content script is asking for settings
    chrome.storage.sync.get(['settings'], (result) => {
      const settings: CatchySettings = result.settings || DEFAULT_SETTINGS;
      sendResponse({ settings });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'UPDATE_SETTINGS') {
    // Popup/options page is updating settings
    chrome.storage.sync.get(['settings'], (result) => {
      const currentSettings: CatchySettings = result.settings || DEFAULT_SETTINGS;
      const updatedSettings = { ...currentSettings, ...message.settings };

      chrome.storage.sync.set({ settings: updatedSettings }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === 'TOGGLE_ENABLED') {
    // Toggle extension on/off
    chrome.storage.sync.get(['settings'], (result) => {
      const settings: CatchySettings = result.settings || DEFAULT_SETTINGS;
      settings.enabled = !settings.enabled;

      chrome.storage.sync.set({ settings }, () => {
        // Update badge to show status
        chrome.action.setBadgeText({
          text: settings.enabled ? '' : 'OFF',
        });
        sendResponse({ enabled: settings.enabled });
      });
    });
    return true;
  }

  return false; // No async response
});

/**
 * Update badge when settings change
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.settings) {
    const settings: CatchySettings = changes.settings.newValue;

    // Update badge based on enabled state
    chrome.action.setBadgeText({
      text: settings.enabled ? '' : 'OFF',
    });

    console.log('[Catchy Background] Settings changed:', settings);
  }
});

/**
 * Optional: Handle browser action (extension icon) clicks
 * (This only fires if there's no popup defined)
 */
// chrome.action.onClicked.addListener((tab) => {
//   console.log('[Catchy Background] Extension icon clicked', tab);
// });
