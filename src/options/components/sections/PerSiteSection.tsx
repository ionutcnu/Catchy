import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import type { CatchySettings } from '@/types';

interface PerSiteSectionProps {
  settings: CatchySettings;
  onSave: (settings: CatchySettings) => void;
}

export function PerSiteSection({ settings, onSave }: PerSiteSectionProps) {
  const [newSiteHostname, setNewSiteHostname] = useState('');

  // Normalize hostname helper
  const normalizeHostname = (input: string): string => {
    if (!input.trim()) return '';

    let processedInput = input.trim();
    if (!processedInput.match(/^https?:\/\//)) {
      processedInput = `https://${processedInput}`;
    }

    try {
      const url = new URL(processedInput);
      return url.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return processedInput
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '')
        .toLowerCase();
    }
  };

  // Check if hostname is valid
  const isValidHostname = (input: string): boolean => {
    const normalized = normalizeHostname(input);
    return normalized.length > 0 && normalized.includes('.');
  };

  // Check if hostname already exists
  const isDuplicate = (input: string): boolean => {
    const normalized = normalizeHostname(input);
    return normalized in settings.perSiteSettings;
  };

  // Add new site to per-site settings
  const handleAddSite = () => {
    const input = newSiteHostname.trim();
    if (!input) return;

    // Validate hostname
    if (!isValidHostname(input)) {
      // Could show error message to user here
      return;
    }

    // Normalize and check for duplicates
    const normalized = normalizeHostname(input);
    if (isDuplicate(input)) {
      // Could show error message to user here
      return;
    }

    onSave({
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
    onSave({
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
    onSave({
      ...settings,
      perSiteSettings: remainingSettings,
    });
  };

  return (
    <Card className="settings-card">
      <CardHeader>
        <CardTitle className="section-title">
          <span className="title-number">04</span>
          <span className="title-text">Per-Site Settings</span>
        </CardTitle>
        <CardDescription>
          Control which websites Catchy is enabled on. Add sites to customize behavior per domain.
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
              data-testid="per-site-input"
              className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleAddSite}
              data-testid="per-site-add-button"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors primary-button"
            >
              Add Site
            </button>
          </div>

          {/* Validation Feedback */}
          {newSiteHostname.trim() && (
            <div className="space-y-2">
              {isValidHostname(newSiteHostname) ? (
                <div
                  className="text-xs flex items-center gap-1"
                  data-testid="per-site-validation-success"
                >
                  <span className="text-green-600">✓</span>
                  <span className="text-green-600">
                    Will be saved as:{' '}
                    <code className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded font-mono">
                      {normalizeHostname(newSiteHostname)}
                    </code>
                  </span>
                </div>
              ) : (
                <div
                  className="text-xs flex items-center gap-1"
                  data-testid="per-site-validation-error"
                >
                  <span className="text-destructive">✗</span>
                  <span className="text-destructive">
                    Invalid hostname format (must include a domain extension like .com)
                  </span>
                </div>
              )}

              {isValidHostname(newSiteHostname) && isDuplicate(newSiteHostname) && (
                <div
                  className="text-xs flex items-center gap-1"
                  data-testid="per-site-duplicate-warning"
                >
                  <span className="text-orange-600">⚠️</span>
                  <span className="text-orange-600">This site is already configured</span>
                </div>
              )}
            </div>
          )}

          {/* Sites List */}
          {Object.keys(settings.perSiteSettings).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="per-site-empty">
              No per-site settings configured. Add a site above to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(settings.perSiteSettings).map(([hostname, siteSettings]) => (
                <div
                  key={hostname}
                  data-testid={`per-site-row-${hostname}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Switch
                      checked={siteSettings.enabled}
                      onCheckedChange={() => handleToggleSite(hostname)}
                      data-testid={`per-site-switch-${hostname}`}
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
                    data-testid={`per-site-remove-${hostname}`}
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
  );
}
