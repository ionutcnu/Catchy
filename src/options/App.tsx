import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { type CatchySettings, DEFAULT_SETTINGS, type ToastPosition } from '@/types';

export default function OptionsApp() {
  const [settings, setSettings] = useState<CatchySettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [newSiteHostname, setNewSiteHostname] = useState('');
  const saveIdRef = useRef(0); // Track save attempts to prevent race conditions

  // Load settings and theme preference on mount
  useEffect(() => {
    chrome.storage.sync.get(['settings', 'darkMode'], (result) => {
      if (result.settings) {
        // Deep merge with defaults to handle legacy settings missing new fields
        const mergedSettings: CatchySettings = {
          ...DEFAULT_SETTINGS,
          ...result.settings,
          theme: {
            ...DEFAULT_SETTINGS.theme,
            ...result.settings.theme,
          },
          errorTypes: {
            ...DEFAULT_SETTINGS.errorTypes,
            ...result.settings.errorTypes,
          },
          rateLimit: {
            ...DEFAULT_SETTINGS.rateLimit,
            ...result.settings.rateLimit,
          },
        };
        setSettings(mergedSettings);
      }

      // Load dark mode preference
      if (result.darkMode !== undefined) {
        setIsDarkMode(result.darkMode);
        if (result.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });

    // Listen for dark mode changes
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'sync' && changes.darkMode) {
        const newDarkMode = changes.darkMode.newValue;
        setIsDarkMode(newDarkMode);
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Save settings to Chrome storage
  const saveSettings = (newSettings: CatchySettings) => {
    const previousSettings = settings; // Preserve for rollback on error
    const currentSaveId = ++saveIdRef.current; // Increment save ID for this attempt

    setSettings(newSettings); // Optimistically update UI

    chrome.storage.sync.set({ settings: newSettings }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Catchy Options] Failed to save settings:', chrome.runtime.lastError);

        // Only rollback if this is still the latest save attempt
        // If user made another change after this save started, don't clobber it
        setSettings((currentSettings) => {
          // Check if current state matches the failed save payload
          if (JSON.stringify(currentSettings) === JSON.stringify(newSettings)) {
            // Safe to rollback - no newer save has succeeded
            setSaveError(chrome.runtime.lastError?.message || 'Failed to save settings');
            setTimeout(() => setSaveError(null), 3000);
            return previousSettings;
          }
          // Current state is different - a newer save succeeded, don't rollback
          return currentSettings;
        });
        return;
      }

      // Only show success indicator if this save is still relevant
      if (currentSaveId === saveIdRef.current) {
        setSaveError(null); // Clear any previous errors only on success
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  const handlePositionChange = (position: ToastPosition) => {
    saveSettings({
      ...settings,
      theme: {
        ...settings.theme,
        position,
      },
    });
  };

  const handleErrorTypeToggle = (errorType: keyof CatchySettings['errorTypes']) => {
    saveSettings({
      ...settings,
      errorTypes: {
        ...settings.errorTypes,
        [errorType]: !settings.errorTypes[errorType],
      },
    });
  };

  const toggleDarkMode = () => {
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
        console.error(
          '[Catchy Options] Failed to save dark mode preference:',
          chrome.runtime.lastError
        );
      }
    });
  };

  // Add new site to per-site settings
  const handleAddSite = () => {
    if (!newSiteHostname.trim()) return;

    // Normalize hostname: extract hostname from URL, strip www, lowercase
    let input = newSiteHostname.trim();

    // Ensure there's a scheme for URL constructor
    if (!input.match(/^https?:\/\//)) {
      input = `https://${input}`;
    }

    let normalized: string;
    try {
      const url = new URL(input);
      // Extract hostname (includes port if present), strip leading "www.", lowercase
      normalized = url.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      // If URL parsing fails, fall back to basic normalization
      normalized = input
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '')
        .toLowerCase();
    }

    if (!normalized) return;

    saveSettings({
      ...settings,
      perSiteSettings: {
        ...settings.perSiteSettings,
        [normalized]: { enabled: true },
      },
    });

    setNewSiteHostname(''); // Clear input
  };

  // Toggle per-site enabled state
  const handleToggleSite = (hostname: string) => {
    saveSettings({
      ...settings,
      perSiteSettings: {
        ...settings.perSiteSettings,
        [hostname]: {
          enabled: !settings.perSiteSettings[hostname]?.enabled,
        },
      },
    });
  };

  // Remove site from per-site settings
  const handleRemoveSite = (hostname: string) => {
    const { [hostname]: _, ...remainingSettings } = settings.perSiteSettings;
    saveSettings({
      ...settings,
      perSiteSettings: remainingSettings,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <h1 className="text-4xl font-bold mb-2">🎯 Catchy Settings</h1>
          <p className="text-muted-foreground">Configure your error catching preferences</p>

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
                width="20"
                height="20"
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
                width="20"
                height="20"
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

        {/* Save indicator */}
        {saved && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
            Settings saved!
          </div>
        )}

        {/* Error indicator */}
        {saveError && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg">
            {saveError}
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Global Enable/Disable Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Global Control</CardTitle>
              <CardDescription>
                Master toggle to enable or disable Catchy across all websites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex items-center justify-between p-4 rounded-lg border-2 border-border hover:bg-accent/50 cursor-pointer transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-lg">
                    {settings.enabled ? 'Catchy is Enabled' : 'Catchy is Disabled'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {settings.enabled
                      ? 'Error notifications are active (subject to per-site settings)'
                      : 'Error notifications are completely disabled on all sites'}
                  </div>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => {
                    saveSettings({
                      ...settings,
                      enabled: checked,
                    });
                  }}
                />
              </label>
            </CardContent>
          </Card>

          {/* Toast Position Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Toast Position</CardTitle>
              <CardDescription>
                Choose where error notifications appear on your screen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as ToastPosition[]).map(
                  (position) => (
                    <button
                      key={position}
                      type="button"
                      onClick={() => handlePositionChange(position)}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        settings.theme.position === position
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-sm font-medium capitalize">
                        {position.replace(/-/g, ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {position === 'top-left' && 'Top left corner'}
                        {position === 'top-right' && 'Top right corner'}
                        {position === 'bottom-left' && 'Bottom left corner'}
                        {position === 'bottom-right' && 'Bottom right corner (default)'}
                      </div>
                    </button>
                  )
                )}
              </div>

              {/* Swipe to Dismiss Toggle */}
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">Swipe to Dismiss</div>
                    <div className="text-sm text-muted-foreground">
                      Enable drag gesture to dismiss toast notifications
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.theme.swipeToDismiss}
                    onChange={() => {
                      saveSettings({
                        ...settings,
                        theme: {
                          ...settings.theme,
                          swipeToDismiss: !settings.theme.swipeToDismiss,
                        },
                      });
                    }}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </label>

                {/* Persist Pinned Toasts Toggle */}
                <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">Persist Pinned Toasts</div>
                    <div className="text-sm text-muted-foreground">
                      Keep pinned error notifications after page refresh
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.theme.persistPinnedToasts}
                    onChange={() => {
                      saveSettings({
                        ...settings,
                        theme: {
                          ...settings.theme,
                          persistPinnedToasts: !settings.theme.persistPinnedToasts,
                        },
                      });
                    }}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Error Type Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>Error Types</CardTitle>
              <CardDescription>Choose which types of errors to capture and display</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Console Errors */}
                <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">Console Errors</div>
                    <div className="text-sm text-muted-foreground">
                      Captures console.error() calls
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.errorTypes.consoleError}
                    onChange={() => handleErrorTypeToggle('consoleError')}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </label>

                {/* Uncaught Errors */}
                <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">Uncaught Errors</div>
                    <div className="text-sm text-muted-foreground">
                      Captures uncaught exceptions (window.onerror)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.errorTypes.uncaught}
                    onChange={() => handleErrorTypeToggle('uncaught')}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </label>

                {/* Unhandled Rejections */}
                <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">Unhandled Promise Rejections</div>
                    <div className="text-sm text-muted-foreground">
                      Captures unhandled promise rejections
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.errorTypes.unhandledRejection}
                    onChange={() => handleErrorTypeToggle('unhandledRejection')}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </label>

                {/* Resource Errors */}
                <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">Resource Errors</div>
                    <div className="text-sm text-muted-foreground">
                      Captures failed resource loads (images, scripts, etc.)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.errorTypes.resource}
                    onChange={() => handleErrorTypeToggle('resource')}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </label>

                {/* Network Errors */}
                <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">Network Errors</div>
                    <div className="text-sm text-muted-foreground">
                      Captures network/fetch errors
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.errorTypes.network}
                    onChange={() => handleErrorTypeToggle('network')}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Per-Site Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Per-Site Settings</CardTitle>
              <CardDescription>
                Control which websites Catchy is enabled on. Add sites to customize behavior per
                domain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add New Site Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSiteHostname}
                    onChange={(e) => setNewSiteHostname(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSite();
                    }}
                    placeholder="example.com"
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddSite}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Add Site
                  </button>
                </div>

                {/* Sites List */}
                {Object.keys(settings.perSiteSettings).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No per-site settings configured. Add a site above to get started.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(settings.perSiteSettings).map(([hostname, siteSettings]) => (
                      <div
                        key={hostname}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Switch
                            checked={siteSettings.enabled}
                            onCheckedChange={() => handleToggleSite(hostname)}
                          />
                          <div>
                            <div className="font-medium">{hostname}</div>
                            <div className="text-xs text-muted-foreground">
                              {siteSettings.enabled ? 'Enabled' : 'Disabled'}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSite(hostname)}
                          className="text-destructive hover:text-destructive/90 px-2 py-1 rounded transition-colors"
                          aria-label={`Remove ${hostname}`}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Control how many toasts appear and how they behave
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Max Toasts Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Max toasts on screen</label>
                    <span className="text-sm font-mono text-muted-foreground">
                      {settings.theme.maxToasts}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.theme.maxToasts}
                    onChange={(e) => {
                      saveSettings({
                        ...settings,
                        theme: {
                          ...settings.theme,
                          maxToasts: Number(e.target.value),
                        },
                      });
                    }}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum number of error toasts visible at once
                  </p>
                </div>

                {/* Auto-close Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Auto-close after (seconds)</label>
                    <span className="text-sm font-mono text-muted-foreground">
                      {settings.theme.autoCloseMs === 0
                        ? 'Never'
                        : `${(settings.theme.autoCloseMs / 1000).toFixed(0)}s`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={settings.theme.autoCloseMs / 1000}
                    onChange={(e) => {
                      saveSettings({
                        ...settings,
                        theme: {
                          ...settings.theme,
                          autoCloseMs: Number(e.target.value) * 1000,
                        },
                      });
                    }}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Set to 0 to disable auto-close (toasts stay until manually closed)
                  </p>
                </div>

                {/* Toast Size Selector */}
                <div>
                  <label className="text-sm font-medium block mb-2">Toast size</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['small', 'medium', 'large', 'custom'] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          saveSettings({
                            ...settings,
                            theme: {
                              ...settings.theme,
                              toastSize: size,
                            },
                          });
                        }}
                        className={`p-3 rounded-lg border-2 transition-all capitalize ${
                          settings.theme.toastSize === size
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Small: 12px | Medium: 14px | Large: 16px font size
                  </p>

                  {/* Custom Size Inputs - Only show when 'custom' is selected */}
                  {settings.theme.toastSize === 'custom' && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                      <p className="text-sm font-medium mb-3">Custom dimensions</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            Width (px)
                          </label>
                          <input
                            type="number"
                            min="200"
                            max="800"
                            value={settings.theme.customWidth || 400}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              if (value >= 200 && value <= 800) {
                                saveSettings({
                                  ...settings,
                                  theme: {
                                    ...settings.theme,
                                    customWidth: value,
                                  },
                                });
                              }
                            }}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            Height (px)
                          </label>
                          <input
                            type="number"
                            min="50"
                            max="400"
                            value={settings.theme.customHeight || 100}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              if (value >= 50 && value <= 400) {
                                saveSettings({
                                  ...settings,
                                  theme: {
                                    ...settings.theme,
                                    customHeight: value,
                                  },
                                });
                              }
                            }}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Width: 200-800px | Height: 50-400px
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error History Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Error History</CardTitle>
              <CardDescription>
                Configure error history storage and access past errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Max History Size Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Max errors in history</label>
                    <span className="text-sm font-mono text-muted-foreground">
                      {settings.theme.maxHistorySize}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="50"
                    value={settings.theme.maxHistorySize}
                    onChange={(e) => {
                      saveSettings({
                        ...settings,
                        theme: {
                          ...settings.theme,
                          maxHistorySize: Number(e.target.value),
                        },
                      });
                    }}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ⚠️ Higher values use more memory. Errors are stored during the page session.
                  </p>
                </div>

                {/* Drawer Keyboard Shortcut */}
                <div className="pt-4 border-t border-border">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        📊 Drawer Keyboard Shortcut
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Customize the keyboard shortcut to open the error history drawer on any
                        webpage where Catchy is active.
                      </p>
                      <input
                        type="text"
                        value={settings.theme.drawerShortcut || 'Alt+E'}
                        onChange={(e) => {
                          saveSettings({
                            ...settings,
                            theme: {
                              ...settings.theme,
                              drawerShortcut: e.target.value,
                            },
                          });
                        }}
                        placeholder="e.g., Alt+E, Ctrl+Shift+H"
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Examples: <code className="px-1 bg-muted rounded">Alt+E</code>,{' '}
                        <code className="px-1 bg-muted rounded">Ctrl+Shift+H</code>,{' '}
                        <code className="px-1 bg-muted rounded">Ctrl+Alt+D</code>
                      </p>
                    </div>

                    {/* Current Shortcut Display */}
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Current shortcut:</div>
                      <div className="flex items-center gap-2">
                        {(settings.theme.drawerShortcut || 'Alt+E')
                          .split('+')
                          .map((key, index, array) => (
                            <div key={index} className="flex items-center gap-2">
                              <kbd className="px-2 py-1 bg-background border border-border rounded font-mono text-xs">
                                {key.trim()}
                              </kbd>
                              {index < array.length - 1 && <span className="text-xs">+</span>}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>About Catchy</CardTitle>
              <CardDescription>
                A modern Chrome extension for tracking console errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Catchy helps developers catch and display console errors and runtime exceptions with
                clean, customizable toast notifications. Perfect for debugging and monitoring web
                applications during development.
              </p>

              {/* Creators */}
              <div className="mb-4 pb-4 border-b border-border">
                <div className="text-sm font-medium mb-2">Created by</div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-md font-medium text-sm">
                    Lonut
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-md font-medium text-sm">
                    Wadalin
                  </span>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-muted rounded">v0.1.0</span>
                <span className="px-2 py-1 bg-muted rounded">React</span>
                <span className="px-2 py-1 bg-muted rounded">TypeScript</span>
                <span className="px-2 py-1 bg-muted rounded">Tailwind CSS</span>
              </div>
            </CardContent>
          </Card>

          {/* Changelog */}
          <Card>
            <CardHeader>
              <CardTitle>Changelog</CardTitle>
              <CardDescription>Recent updates and improvements</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Version 0.1.0 introduces error history drawer with up to 200 errors per session,
                customizable keyboard shortcuts (Alt+E), dark mode support, per-site settings,
                selective error type toggles, and swipe-to-dismiss gestures.
              </p>
              <a
                href="https://github.com/ionutcnu/Catchy/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View full changelog on GitHub"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                View Full Changelog
                <span aria-hidden="true">→</span>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
