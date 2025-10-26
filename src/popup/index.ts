/**
 * Popup Script
 *
 * This handles the popup UI when you click the extension icon
 */

import { type CatchySettings, DEFAULT_SETTINGS } from '../types';

// Get DOM elements
const toggleCheckbox = document.getElementById('toggle-enabled') as HTMLInputElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const statusText = statusDiv.querySelector('.status-text') as HTMLSpanElement;
const openOptionsBtn = document.getElementById('open-options') as HTMLButtonElement;

/**
 * Load current settings and update UI
 */
async function loadSettings() {
  const result = await chrome.storage.sync.get(['settings']);
  const settings: CatchySettings = result.settings || DEFAULT_SETTINGS;

  // Update toggle checkbox
  toggleCheckbox.checked = settings.enabled;

  // Update status display
  updateStatus(settings.enabled);

  console.log('[Catchy Popup] Settings loaded:', settings);
}

/**
 * Update status indicator
 */
function updateStatus(enabled: boolean) {
  if (enabled) {
    statusDiv.classList.add('active');
    statusDiv.classList.remove('disabled');
    statusText.textContent = 'Active - catching errors';
  } else {
    statusDiv.classList.remove('active');
    statusDiv.classList.add('disabled');
    statusText.textContent = 'Disabled';
  }
}

/**
 * Toggle enabled/disabled
 */
toggleCheckbox.addEventListener('change', async () => {
  // Send message to background to update settings
  chrome.runtime.sendMessage({ type: 'TOGGLE_ENABLED' }, (response) => {
    if (response) {
      updateStatus(response.enabled);
      console.log('[Catchy Popup] Toggled:', response.enabled);
    }
  });
});

/**
 * Open options page
 */
openOptionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Initialize on load
loadSettings();
