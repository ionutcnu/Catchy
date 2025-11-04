import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { type CatchySettings, DEFAULT_SETTINGS } from '@/types';

const CONSTANTS = {
  APP_TITLE: '🎯 Catchy',
  APP_SUBTITLE: 'Console Error Tracker',
  TOGGLE_LABEL: 'Error Catching',
  TOGGLE_DESCRIPTION: 'Capture and display console errors',
  STATUS_LOADING: 'Loading...',
  STATUS_ACTIVE: 'Active - catching errors',
  STATUS_DISABLED: 'Disabled',
  BUTTON_SETTINGS: 'Settings',
  VERSION: 'v0.1.0',
} as const;

export default function PopupApp() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const result = (await chrome.storage.sync.get(['settings'])) as { settings?: CatchySettings };
      const settings: CatchySettings = result.settings || DEFAULT_SETTINGS;
      setEnabled(settings.enabled);
      if (import.meta.env.DEV) {
        console.log('[Catchy Popup] Settings loaded:', settings);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Catchy Popup] Failed to load settings:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleToggle(checked: boolean) {
    setEnabled(checked);

    try {
      // Send message to background to update settings
      chrome.runtime.sendMessage(
        { type: 'TOGGLE_ENABLED' },
        (response: { enabled: boolean } | undefined) => {
          if (chrome.runtime.lastError) {
            if (import.meta.env.DEV) {
              console.error('[Catchy Popup] Message error:', chrome.runtime.lastError);
            }
            return;
          }
          if (response) {
            setEnabled(response.enabled);
            if (import.meta.env.DEV) {
              console.log('[Catchy Popup] Toggled:', response.enabled);
            }
          }
        }
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Catchy Popup] Failed to toggle:', error);
      }
    }
  }

  function handleOpenOptions() {
    chrome.runtime.openOptionsPage();
  }

  return (
    <div className="w-[360px] min-h-[400px] p-4">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold mb-1">{CONSTANTS.APP_TITLE}</h1>
          <p className="text-sm text-muted-foreground">{CONSTANTS.APP_SUBTITLE}</p>
        </div>

        {/* Main Card */}
        <Card>
          <div className="p-6 space-y-6">
            {/* Toggle Control */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label
                  htmlFor="error-catching-switch"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {CONSTANTS.TOGGLE_LABEL}
                </label>
                <p className="text-xs text-muted-foreground">{CONSTANTS.TOGGLE_DESCRIPTION}</p>
              </div>
              <Switch
                id="error-catching-switch"
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={loading}
              />
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <div className="relative flex h-3 w-3">
                {enabled && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    enabled ? 'bg-primary' : 'bg-muted-foreground'
                  }`}
                />
              </div>
              <span className="text-sm font-medium">
                {loading
                  ? CONSTANTS.STATUS_LOADING
                  : enabled
                    ? CONSTANTS.STATUS_ACTIVE
                    : CONSTANTS.STATUS_DISABLED}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleOpenOptions}>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Settings icon"
                >
                  <title>Settings icon</title>
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
            </div>
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
