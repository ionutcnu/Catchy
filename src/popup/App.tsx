import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type CatchySettings, DEFAULT_SETTINGS } from '@/types';

const manifest = chrome.runtime.getManifest();

const CONSTANTS = {
  APP_TITLE: '🎯 Catchy',
  APP_SUBTITLE: 'Console Error Tracker',
  STATUS_LOADING: 'Loading...',
  STATUS_ENABLED: 'Enabled for this site',
  STATUS_DISABLED: 'Disabled for this site',
  BUTTON_ENABLE: 'Enable for this site',
  BUTTON_DISABLE: 'Disable for this site',
  BUTTON_SETTINGS: 'Settings',
  BUTTON_ERROR_HISTORY: 'Error History',
  VERSION: `v${manifest.version}`,
} as const;

export default function PopupApp() {
  const [currentHostname, setCurrentHostname] = useState<string>('');
  const [isGloballyEnabled, setIsGloballyEnabled] = useState(false);
  const [isEnabledForSite, setIsEnabledForSite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      // Get current tab's hostname
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const hostname = tab.url ? new URL(tab.url).hostname : '';
      setCurrentHostname(hostname);

      // Load settings
      const result = (await chrome.storage.sync.get(['settings'])) as { settings?: CatchySettings };
      const settings: CatchySettings = result.settings || DEFAULT_SETTINGS;

      // Get global enabled state
      const globalEnabled = settings.enabled ?? false;
      setIsGloballyEnabled(globalEnabled);

      // Check if enabled for this specific site using same logic as content script
      const perSiteSettings = settings.perSiteSettings || {};
      let siteEnabled: boolean;

      if (globalEnabled) {
        // Global mode ON: All sites enabled by default, unless explicitly disabled
        if (perSiteSettings[hostname]) {
          siteEnabled = perSiteSettings[hostname].enabled;
        } else {
          siteEnabled = true; // Enabled by default when global is ON
        }
      } else {
        // Global mode OFF: Opt-in mode - only explicitly enabled sites work
        if (perSiteSettings[hostname]) {
          siteEnabled = perSiteSettings[hostname].enabled;
        } else {
          siteEnabled = false; // Disabled by default when global is OFF
        }
      }

      setIsEnabledForSite(siteEnabled);

      if (import.meta.env.DEV) {
        console.log('[Catchy Popup] Settings loaded:', settings);
        console.log('[Catchy Popup] Current hostname:', hostname);
        console.log('[Catchy Popup] Global enabled:', globalEnabled);
        console.log('[Catchy Popup] Enabled for site:', siteEnabled);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Catchy Popup] Failed to load settings:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load dark mode preference on mount
  useEffect(() => {
    chrome.storage.sync.get(['darkMode'], (result) => {
      if (result.darkMode !== undefined) {
        setIsDarkMode(result.darkMode);
        if (result.darkMode) {
          document.documentElement.classList.add('dark');
        }
      }
    });
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleToggleGlobal() {
    const newGlobalState = !isGloballyEnabled;
    setIsGloballyEnabled(newGlobalState);

    try {
      // Load current settings
      const result = (await chrome.storage.sync.get(['settings'])) as { settings?: CatchySettings };
      const settings: CatchySettings = result.settings || DEFAULT_SETTINGS;

      // Update global enabled state
      const updatedSettings: CatchySettings = {
        ...settings,
        enabled: newGlobalState,
      };

      // Save updated settings
      await chrome.storage.sync.set({ settings: updatedSettings });

      // Recalculate site enabled state based on new global state
      const perSiteSettings = settings.perSiteSettings || {};
      let newSiteEnabled: boolean;

      if (newGlobalState) {
        // Global mode ON: All sites enabled by default, unless explicitly disabled
        if (perSiteSettings[currentHostname]) {
          newSiteEnabled = perSiteSettings[currentHostname].enabled;
        } else {
          newSiteEnabled = true;
        }
      } else {
        // Global mode OFF: Opt-in mode - only explicitly enabled sites work
        if (perSiteSettings[currentHostname]) {
          newSiteEnabled = perSiteSettings[currentHostname].enabled;
        } else {
          newSiteEnabled = false;
        }
      }

      setIsEnabledForSite(newSiteEnabled);

      if (import.meta.env.DEV) {
        console.log('[Catchy Popup] Toggled global:', newGlobalState);
        console.log('[Catchy Popup] Site now:', newSiteEnabled);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Catchy Popup] Failed to toggle global:', error);
      }
      // Revert on error
      setIsGloballyEnabled(!newGlobalState);
    }
  }

  async function handleToggleSite() {
    if (!currentHostname) return;

    const newEnabledState = !isEnabledForSite;
    setIsEnabledForSite(newEnabledState);

    try {
      // Load current settings
      const result = (await chrome.storage.sync.get(['settings'])) as { settings?: CatchySettings };
      const settings: CatchySettings = result.settings || DEFAULT_SETTINGS;

      // Update per-site settings for this hostname
      const updatedSettings: CatchySettings = {
        ...settings,
        perSiteSettings: {
          ...settings.perSiteSettings,
          [currentHostname]: {
            enabled: newEnabledState,
          },
        },
      };

      // Save updated settings
      await chrome.storage.sync.set({ settings: updatedSettings });

      if (import.meta.env.DEV) {
        console.log('[Catchy Popup] Toggled site:', currentHostname, newEnabledState);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Catchy Popup] Failed to toggle site:', error);
      }
      // Revert on error
      setIsEnabledForSite(!newEnabledState);
    }
  }

  function handleOpenOptions() {
    chrome.runtime.openOptionsPage();
  }

  async function handleOpenErrorHistory() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        if (import.meta.env.DEV) {
          console.error('[Catchy Popup] No active tab found');
        }
        return;
      }

      // Send message to content script to open drawer
      await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_DRAWER' });

      if (import.meta.env.DEV) {
        console.log('[Catchy Popup] Sent OPEN_DRAWER message to content script');
      }

      // Close popup after opening drawer
      window.close();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Catchy Popup] Failed to open error history:', error);
      }
    }
  }

  function toggleDarkMode() {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // Toggle dark class on document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to chrome storage
    chrome.storage.sync.set({ darkMode: newDarkMode }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Catchy Popup] Failed to save dark mode preference:', chrome.runtime.lastError);
      }
    });
  }

  return (
    <div className="w-[360px] min-h-[400px] p-4">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="text-center border-b pb-4 relative">
          <h1 className="text-2xl font-bold mb-1">{CONSTANTS.APP_TITLE}</h1>
          <p className="text-sm text-muted-foreground">{CONSTANTS.APP_SUBTITLE}</p>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="absolute top-0 right-0 p-2 rounded-lg border border-border hover:bg-accent transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>

        {/* Main Card */}
        <Card>
          <div className="p-6 space-y-6">
            {/* Current Hostname */}
            {loading ? (
              <div className="text-center text-muted-foreground">{CONSTANTS.STATUS_LOADING}</div>
            ) : (
              <>
                {/* Global Toggle */}
                <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {isGloballyEnabled ? '🌍' : '🎯'}
                      </span>
                      <span className="text-sm font-semibold">
                        {isGloballyEnabled ? 'Global Mode' : 'Opt-in Mode'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleGlobal}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isGloballyEnabled ? 'bg-primary' : 'bg-muted-foreground'
                      }`}
                      aria-label="Toggle global mode"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isGloballyEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isGloballyEnabled
                      ? 'All sites show errors by default. Disable noisy sites below.'
                      : 'Only enabled sites show errors. Enable sites individually below.'}
                  </p>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Current Site</span>
                  </div>
                </div>

                {/* Hostname Display */}
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/30 border">
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  <span className="text-sm font-mono truncate">{currentHostname || 'No site'}</span>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <div className="relative flex h-3 w-3">
                    {isEnabledForSite && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        isEnabledForSite ? 'bg-primary' : 'bg-muted-foreground'
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {isEnabledForSite ? CONSTANTS.STATUS_ENABLED : CONSTANTS.STATUS_DISABLED}
                  </span>
                </div>

                {/* Toggle Button */}
                <Button
                  variant={isEnabledForSite ? 'outline' : 'default'}
                  className="w-full"
                  onClick={handleToggleSite}
                  disabled={!currentHostname}
                >
                  {isEnabledForSite ? CONSTANTS.BUTTON_DISABLE : CONSTANTS.BUTTON_ENABLE}
                </Button>

                {/* Error History Button */}
                <Button variant="outline" className="w-full" onClick={handleOpenErrorHistory}>
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  {CONSTANTS.BUTTON_ERROR_HISTORY}
                </Button>

                {/* Settings Button */}
                <Button variant="outline" className="w-full" onClick={handleOpenOptions}>
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {CONSTANTS.BUTTON_SETTINGS}
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          <span>{CONSTANTS.VERSION}</span>
        </div>
      </div>
    </div>
  );
}
