import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SliderControl } from '../SliderControl';
import type { CatchySettings } from '@/types';

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
        <CardDescription>
          Configure error history storage and access past errors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Max History Size Slider */}
          <SliderControl
            label="Max errors in history"
            value={settings.theme.maxHistorySize}
            min={50}
            max={500}
            step={50}
            onChange={(value) => {
              onSave({
                ...settings,
                theme: {
                  ...settings.theme,
                  maxHistorySize: value,
                },
              });
            }}
            helperText="⚠️ Higher values use more memory. Errors are stored during the page session."
          />

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
                    onSave({
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
  );
}
