import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type CatchySettings, DEFAULT_SETTINGS, type ToastPosition } from '@/types';

export default function OptionsApp() {
  const [settings, setSettings] = useState<CatchySettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
        }
      }
    });
  }, []);

  // Save settings to Chrome storage
  const saveSettings = (newSettings: CatchySettings) => {
    const previousSettings = settings; // Preserve for rollback on error
    setSettings(newSettings); // Optimistically update UI
    chrome.storage.sync.set({ settings: newSettings }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Catchy Options] Failed to save settings:', chrome.runtime.lastError);
        // Rollback UI to previous settings
        setSettings(previousSettings);
        setSaveError(chrome.runtime.lastError.message || 'Failed to save settings');
        setTimeout(() => setSaveError(null), 3000);
        return;
      }
      // Only show success indicator if save actually succeeded
      setSaveError(null); // Clear any previous errors only on success
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
        console.error('[Catchy Options] Failed to save dark mode preference:', chrome.runtime.lastError);
      }
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
              <CardDescription>
                Choose which types of errors to capture and display
              </CardDescription>
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

          <Card>
            <CardHeader>
              <CardTitle>Coming Soon!</CardTitle>
              <CardDescription>
                More settings are under construction. For now, you can toggle Catchy on/off from the
                popup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Planned Features:</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Custom ignore rules for specific error types</li>
                    <li>Per-site settings and configurations</li>
                    <li>Theme customization (dark mode, accent colors)</li>
                    <li>Export and import settings</li>
                    <li>Max toasts and auto-close timing</li>
                    <li>Error log history and filtering</li>
                  </ul>
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
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-muted rounded">v0.1.0</span>
                <span className="px-2 py-1 bg-muted rounded">React</span>
                <span className="px-2 py-1 bg-muted rounded">TypeScript</span>
                <span className="px-2 py-1 bg-muted rounded">Tailwind CSS</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
