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

  // Add new site to per-site settings
  const handleAddSite = () => {
    if (!newSiteHostname.trim()) return;

    // Normalize hostname: extract hostname from URL, strip www, lowercase
    let input = newSiteHostname.trim();

    // Ensure there's a scheme for URL constructor
    if (!input.match(/^https?:\/\//)) {
      input = `https://${input}`;
    }

    let normalized: string;
    try {
      const url = new URL(input);
      // Extract hostname (includes port if present), strip leading "www.", lowercase
      normalized = url.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      // If URL parsing fails, fall back to basic normalization
      normalized = input
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '')
        .toLowerCase();
    }

    if (!normalized) return;

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
          Control which websites Catchy is enabled on. Add sites to customize behavior per
          domain.
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
              className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleAddSite}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors primary-button"
            >
              Add Site
            </button>
          </div>

          {/* Sites List */}
          {Object.keys(settings.perSiteSettings).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No per-site settings configured. Add a site above to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(settings.perSiteSettings).map(([hostname, siteSettings]) => (
                <div
                  key={hostname}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Switch
                      checked={siteSettings.enabled}
                      onCheckedChange={() => handleToggleSite(hostname)}
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
