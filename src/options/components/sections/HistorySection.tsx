import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CatchySettings } from '@/types';
import { KeyboardShortcutInput } from '../KeyboardShortcutInput';
import { NumberInputWithPresets } from '../NumberInputWithPresets';

interface HistorySectionProps {
  settings: CatchySettings;
  onSave: (settings: CatchySettings) => void;
}

export function HistorySection({ settings, onSave }: HistorySectionProps) {
  return (
    <Card className="settings-card">
      <CardHeader>
        <CardTitle className="section-title">
          <span className="title-number">06</span>
          <span className="title-text">Error History</span>
        </CardTitle>
        <CardDescription>Configure error history storage and access past errors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Max History Size Input */}
          <NumberInputWithPresets
            label="Max errors in history"
            value={settings.theme.maxHistorySize}
            min={5}
            max={50}
            step={5}
            unit="errors"
            onChange={(value) => {
              onSave({
                ...settings,
                theme: {
                  ...settings.theme,
                  maxHistorySize: value,
                },
              });
            }}
            presets={[5, 10, 25, 50]}
            helperText="Errors are stored during the page session."
            warningText="Higher values use more memory"
          />

          {/* Drawer Keyboard Shortcut */}
          <div className="pt-4 border-t border-border">
            <KeyboardShortcutInput
              label="📊 Drawer Keyboard Shortcut"
              value={settings.theme.drawerShortcut || '`'}
              onChange={(value) => {
                onSave({
                  ...settings,
                  theme: {
                    ...settings.theme,
                    drawerShortcut: value,
                  },
                });
              }}
              helperText="Press any key or key combination. Single keys (like 'E' or '~') and combinations (like 'Alt+E') are supported."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
