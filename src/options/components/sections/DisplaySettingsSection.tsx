import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SliderControl } from '../SliderControl';
import type { CatchySettings } from '@/types';

interface DisplaySettingsSectionProps {
  settings: CatchySettings;
  onSave: (settings: CatchySettings) => void;
}

export function DisplaySettingsSection({ settings, onSave }: DisplaySettingsSectionProps) {
  return (
    <Card className="settings-card">
      <CardHeader>
        <CardTitle className="section-title">
          <span className="title-number">05</span>
          <span className="title-text">Display Settings</span>
        </CardTitle>
        <CardDescription>
          Control how many toasts appear and how they behave
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Max Toasts Slider */}
          <SliderControl
            label="Max toasts on screen"
            value={settings.theme.maxToasts}
            min={1}
            max={10}
            onChange={(value) => {
              onSave({
                ...settings,
                theme: {
                  ...settings.theme,
                  maxToasts: value,
                },
              });
            }}
            helperText="Maximum number of error toasts visible at once"
          />

          {/* Auto-close Slider */}
          <SliderControl
            label="Auto-close after (seconds)"
            value={settings.theme.autoCloseMs / 1000}
            min={0}
            max={60}
            step={5}
            onChange={(value) => {
              onSave({
                ...settings,
                theme: {
                  ...settings.theme,
                  autoCloseMs: value * 1000,
                },
              });
            }}
            displayValue={settings.theme.autoCloseMs === 0 ? 'Never' : `${(settings.theme.autoCloseMs / 1000).toFixed(0)}s`}
            helperText="Set to 0 to disable auto-close (toasts stay until manually closed)"
          />

          {/* Toast Size Selector */}
          <div>
            <label className="text-sm font-medium block mb-2">Toast size</label>
            <div className="grid grid-cols-4 gap-2">
              {(['small', 'medium', 'large', 'custom'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    onSave({
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
                          onSave({
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
                          onSave({
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
  );
}
