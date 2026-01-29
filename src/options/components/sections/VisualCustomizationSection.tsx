import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorPicker } from '../ColorPicker';
import { SliderControl } from '../SliderControl';
import type { CatchySettings } from '@/types';

interface VisualCustomizationSectionProps {
  settings: CatchySettings;
  onSave: (settings: CatchySettings) => void;
}

export function VisualCustomizationSection({ settings, onSave }: VisualCustomizationSectionProps) {
  return (
    <Card className="settings-card">
      <CardHeader>
        <CardTitle className="section-title">
          <span className="title-number">08</span>
          <span className="title-text">Visual Customization</span>
        </CardTitle>
        <CardDescription>
          Customize the appearance of error toasts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Background Color */}
          <ColorPicker
            label="Background Color"
            value={settings.theme.backgroundColor || '#ffffff'}
            onChange={(color) => {
              onSave({
                ...settings,
                theme: {
                  ...settings.theme,
                  backgroundColor: color,
                },
              });
            }}
          />

          {/* Text Color */}
          <ColorPicker
            label="Text Color"
            value={settings.theme.textColor || '#000000'}
            onChange={(color) => {
              onSave({
                ...settings,
                theme: {
                  ...settings.theme,
                  textColor: color,
                },
              });
            }}
          />

          {/* Border Radius */}
          <SliderControl
            label="Border Radius (px)"
            value={settings.theme.borderRadius || 8}
            min={0}
            max={24}
            onChange={(value) => {
              onSave({
                ...settings,
                theme: {
                  ...settings.theme,
                  borderRadius: value,
                },
              });
            }}
            helperText="Adjust the roundness of toast corners"
          />

          {/* Spacing */}
          <SliderControl
            label="Spacing (px)"
            value={settings.theme.spacing || 16}
            min={4}
            max={32}
            onChange={(value) => {
              onSave({
                ...settings,
                theme: {
                  ...settings.theme,
                  spacing: value,
                },
              });
            }}
            helperText="Internal padding within the toast"
          />

          {/* Shadow Toggle */}
          <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex-1">
              <div className="font-medium">Drop Shadow</div>
              <div className="text-sm text-muted-foreground">
                Add shadow effect to toasts
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.theme.shadow ?? true}
              onChange={() => {
                onSave({
                  ...settings,
                  theme: {
                    ...settings.theme,
                    shadow: !settings.theme.shadow,
                  },
                });
              }}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
