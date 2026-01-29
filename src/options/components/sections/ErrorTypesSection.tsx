import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CatchySettings } from '@/types';

interface ErrorTypesSectionProps {
  settings: CatchySettings;
  onSave: (settings: CatchySettings) => void;
}

export function ErrorTypesSection({ settings, onSave }: ErrorTypesSectionProps) {
  const handleErrorTypeToggle = (errorType: keyof CatchySettings['errorTypes']) => {
    onSave({
      ...settings,
      errorTypes: {
        ...settings.errorTypes,
        [errorType]: !settings.errorTypes[errorType],
      },
    });
  };

  const handleSelectAll = () => {
    const allEnabled = Object.keys(settings.errorTypes).reduce(
      (acc, key) => {
        acc[key as keyof CatchySettings['errorTypes']] = true;
        return acc;
      },
      {} as CatchySettings['errorTypes']
    );
    onSave({
      ...settings,
      errorTypes: allEnabled,
    });
  };

  const handleDeselectAll = () => {
    const allDisabled = Object.keys(settings.errorTypes).reduce(
      (acc, key) => {
        acc[key as keyof CatchySettings['errorTypes']] = false;
        return acc;
      },
      {} as CatchySettings['errorTypes']
    );
    onSave({
      ...settings,
      errorTypes: allDisabled,
    });
  };

  const handleCommonOnly = () => {
    onSave({
      ...settings,
      errorTypes: {
        consoleError: true,
        uncaught: true,
        unhandledRejection: false,
        resource: false,
        network: false,
      },
    });
  };

  return (
    <Card className="settings-card">
      <CardHeader>
        <CardTitle className="section-title">
          <span className="title-number">03</span>
          <span className="title-text">Error Types</span>
        </CardTitle>
        <CardDescription>Choose which types of errors to capture and display</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Bulk Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Deselect All
            </button>
            <button
              type="button"
              onClick={handleCommonOnly}
              className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Common Only (Errors + Uncaught)
            </button>
          </div>
          {/* Console Errors */}
          <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex-1">
              <div className="font-medium">Console Errors</div>
              <div className="text-sm text-muted-foreground">Captures console.error() calls</div>
            </div>
            <input
              type="checkbox"
              checked={settings.errorTypes.consoleError}
              onChange={() => handleErrorTypeToggle('consoleError')}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </label>

          {/* Uncaught Errors */}
          <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex-1">
              <div className="font-medium">Uncaught Errors</div>
              <div className="text-sm text-muted-foreground">
                Captures uncaught exceptions (window.onerror)
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.errorTypes.uncaught}
              onChange={() => handleErrorTypeToggle('uncaught')}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </label>

          {/* Unhandled Rejections */}
          <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex-1">
              <div className="font-medium">Unhandled Promise Rejections</div>
              <div className="text-sm text-muted-foreground">
                Captures unhandled promise rejections
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.errorTypes.unhandledRejection}
              onChange={() => handleErrorTypeToggle('unhandledRejection')}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </label>

          {/* Resource Errors */}
          <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex-1">
              <div className="font-medium">Resource Errors</div>
              <div className="text-sm text-muted-foreground">
                Captures failed resource loads (images, scripts, etc.)
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.errorTypes.resource}
              onChange={() => handleErrorTypeToggle('resource')}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </label>

          {/* Network Errors */}
          <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex-1">
              <div className="font-medium">Network Errors</div>
              <div className="text-sm text-muted-foreground">Captures network/fetch errors</div>
            </div>
            <input
              type="checkbox"
              checked={settings.errorTypes.network}
              onChange={() => handleErrorTypeToggle('network')}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
