import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CatchySettings } from '@/types';
import { DEFAULT_SETTINGS, getAutoTextColor } from '@/types';
import { ColorPicker } from '../ColorPicker';
import { SliderControl } from '../SliderControl';

interface VisualCustomizationSectionProps {
  settings: CatchySettings;
  onSave: (settings: CatchySettings) => void;
}

export function VisualCustomizationSection({ settings, onSave }: VisualCustomizationSectionProps) {
  const [openAccordion, setOpenAccordion] = useState<string | null>('console');

  const errorTypes = [
    {
      key: 'console',
      label: 'Console Errors',
      description: 'console.error() messages',
      defaultBg: '#dc2626',
    },
    {
      key: 'uncaught',
      label: 'Uncaught Exceptions',
      description: 'Unhandled JavaScript errors',
      defaultBg: '#ea580c',
    },
    {
      key: 'rejection',
      label: 'Promise Rejections',
      description: 'Unhandled promise rejections',
      defaultBg: '#f59e0b',
    },
  ] as const;

  return (
    <Card className="settings-card">
      <CardHeader>
        <CardTitle className="section-title">
          <span className="title-number">08</span>
          <span className="title-text">Visual Customization</span>
        </CardTitle>
        <CardDescription>Customize colors for each error type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Per-Error-Type Colors */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Error Type Colors</div>
            {errorTypes.map((errorType) => {
              const isOpen = openAccordion === errorType.key;
              const bgColor =
                settings.theme.backgroundColors?.[
                  errorType.key as keyof typeof settings.theme.backgroundColors
                ] ?? errorType.defaultBg;
              const textColor =
                settings.theme.textColors?.[
                  errorType.key as keyof typeof settings.theme.textColors
                ] ?? getAutoTextColor(bgColor);

              return (
                <div
                  key={errorType.key}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  {/* Accordion Header */}
                  <button
                    type="button"
                    onClick={() => setOpenAccordion(isOpen ? null : errorType.key)}
                    className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color Preview */}
                      <div
                        className="w-8 h-8 rounded border-2 border-border"
                        style={{ backgroundColor: bgColor, color: textColor }}
                        title={`${bgColor} / ${textColor}`}
                      >
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                          A
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{errorType.label}</div>
                        <div className="text-xs text-muted-foreground">{errorType.description}</div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label={isOpen ? 'Collapse' : 'Expand'}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="p-4 pt-0 space-y-4 border-t border-border">
                      {/* Background Color */}
                      <ColorPicker
                        label="Background Color"
                        value={bgColor}
                        onChange={(color) => {
                          const newBgColors = {
                            ...settings.theme.backgroundColors,
                            [errorType.key]: color,
                          };
                          const autoText = getAutoTextColor(color);
                          const newTextColors = {
                            ...settings.theme.textColors,
                            [errorType.key]: autoText,
                          };

                          onSave({
                            ...settings,
                            theme: {
                              ...settings.theme,
                              backgroundColors: newBgColors,
                              textColors: newTextColors,
                            },
                          });
                        }}
                        data-testid={`color-bg-${errorType.key}`}
                      />

                      {/* Text Color (Auto-detected) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Text Color</span>
                          <span className="text-xs text-muted-foreground">
                            Auto-detected for contrast
                          </span>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-accent/20">
                          <div
                            className="w-6 h-6 rounded border border-border"
                            style={{ backgroundColor: textColor }}
                          />
                          <span className="text-sm font-mono">{textColor}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {textColor === '#ffffff' ? 'White' : 'Black'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Global Styling */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="text-sm font-medium">Global Styling</div>

            {/* Border Radius */}
            <SliderControl
              label="Border Radius (px)"
              value={settings.theme.borderRadius ?? 8}
              min={0}
              max={24}
              step={2}
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
              data-testid="slider-border-radius"
            />

            {/* Spacing */}
            <SliderControl
              label="Spacing (px)"
              value={settings.theme.spacing ?? 12}
              min={4}
              max={32}
              step={2}
              onChange={(value) => {
                onSave({
                  ...settings,
                  theme: {
                    ...settings.theme,
                    spacing: value,
                  },
                });
              }}
              helperText="Gap between toasts in pixels"
              data-testid="slider-spacing"
            />

            {/* Shadow Toggle */}
            <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
              <div className="flex-1">
                <div className="font-medium">Drop Shadow</div>
                <div className="text-sm text-muted-foreground">Add shadow effect to toasts</div>
              </div>
              <input
                type="checkbox"
                checked={settings.theme.shadow ?? true}
                onChange={(e) => {
                  onSave({
                    ...settings,
                    theme: {
                      ...settings.theme,
                      shadow: e.target.checked,
                    },
                  });
                }}
                className="w-5 h-5 accent-primary cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                data-testid="shadow-toggle"
              />
            </label>
          </div>

          {/* Color Presets */}
          <div className="space-y-2 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground block">
              Quick presets (applies to all error types):
            </span>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Red Theme', bg: '#dc2626', text: '#ffffff' },
                { label: 'Orange Theme', bg: '#ea580c', text: '#ffffff' },
                { label: 'Dark Theme', bg: '#1f2937', text: '#ffffff' },
                { label: 'Light Theme', bg: '#f3f4f6', text: '#000000' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onSave({
                      ...settings,
                      theme: {
                        ...settings.theme,
                        backgroundColors: {
                          console: preset.bg,
                          uncaught: preset.bg,
                          rejection: preset.bg,
                        },
                        textColors: {
                          console: preset.text,
                          uncaught: preset.text,
                          rejection: preset.text,
                        },
                      },
                    });
                  }}
                  className="px-3 py-2 rounded-lg border-2 border-border text-xs hover:border-primary transition-colors"
                  style={{ backgroundColor: preset.bg, color: preset.text }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset to Defaults Button */}
          <div className="pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                onSave({
                  ...settings,
                  theme: {
                    ...settings.theme,
                    backgroundColors: DEFAULT_SETTINGS.theme.backgroundColors,
                    textColors: DEFAULT_SETTINGS.theme.textColors,
                    borderRadius: DEFAULT_SETTINGS.theme.borderRadius,
                    spacing: DEFAULT_SETTINGS.theme.spacing,
                    shadow: DEFAULT_SETTINGS.theme.shadow,
                  },
                });
              }}
              className="w-full px-4 py-2 rounded-lg border-2 border-border text-sm font-medium hover:bg-accent hover:border-primary transition-colors"
              data-testid="reset-visual-defaults"
            >
              Reset All to Defaults
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
