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
            min={50}
            max={500}
            step={10}
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
            presets={[50, 100, 200, 500]}
            helperText="Errors are stored during the page session."
            warningText="Higher values use more memory"
          />

          {/* Drawer Keyboard Shortcut */}
          <div className="pt-4 border-t border-border">
            <KeyboardShortcutInput
              label="📊 Drawer Keyboard Shortcut"
              value={settings.theme.drawerShortcut || 'Alt+E'}
              onChange={(value) => {
                onSave({
                  ...settings,
                  theme: {
                    ...settings.theme,
                    drawerShortcut: value,
                  },
                });
              }}
              helperText="Customize the keyboard shortcut to open the error history drawer on any webpage where Catchy is active."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
