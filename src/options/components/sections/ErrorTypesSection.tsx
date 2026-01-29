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
          {/* Console Errors */}
          <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex-1">
              <div className="font-medium">Console Errors</div>
              <div className="text-sm text-muted-foreground">
                Captures console.error() calls
              </div>
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
              <div className="text-sm text-muted-foreground">
                Captures network/fetch errors
              </div>
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
