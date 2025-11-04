import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type CatchySettings, DEFAULT_SETTINGS, type ToastPosition } from '@/types';

export default function OptionsApp() {
  const [settings, setSettings] = useState<CatchySettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    chrome.storage.sync.get(['settings'], (result) => {
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
    });
  }, []);

  // Save settings to Chrome storage
  const saveSettings = (newSettings: CatchySettings) => {
    setSettings(newSettings);
    setSaveError(null); // Clear any previous errors
    chrome.storage.sync.set({ settings: newSettings }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Catchy Options] Failed to save settings:', chrome.runtime.lastError);
        setSaveError(chrome.runtime.lastError.message || 'Failed to save settings');
        setTimeout(() => setSaveError(null), 3000);
        return;
      }
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">🎯 Catchy Settings</h1>
          <p className="text-muted-foreground">Configure your error catching preferences</p>
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
