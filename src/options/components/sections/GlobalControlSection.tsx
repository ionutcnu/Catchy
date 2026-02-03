import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import type { CatchySettings } from '@/types';

interface GlobalControlSectionProps {
  settings: CatchySettings;
  onSave: (settings: CatchySettings) => void;
}

/**
 * GlobalControlSection - Master toggle for enabling/disabling extension
 *
 * Primary control for activating or deactivating Catchy across all websites.
 * When disabled, no error notifications will be shown regardless of per-site settings.
 *
 * @param settings - Current extension settings
 * @param onSave - Callback to persist settings changes
 */
export function GlobalControlSection({ settings, onSave }: GlobalControlSectionProps) {
  return (
    <Card className="settings-card">
      <CardHeader>
        <CardTitle className="section-title">
          <span className="title-number">01</span>
          <span className="title-text">Global Control</span>
        </CardTitle>
        <CardDescription>
          Master toggle to enable or disable Catchy across all websites
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border hover:bg-accent/50 cursor-pointer transition-colors">
          <div className="flex-1">
            <div className="font-medium text-lg">
              {settings.enabled ? 'Catchy is Enabled' : 'Catchy is Disabled'}
            </div>
            <div className="text-sm text-muted-foreground">
              {settings.enabled
                ? 'Error notifications are active (subject to per-site settings)'
                : 'Error notifications are completely disabled on all sites'}
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => {
              onSave({
                ...settings,
                enabled: checked,
              });
            }}
            data-testid="global-control-switch"
          />
        </div>
      </CardContent>
    </Card>
  );
}
