import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CatchySettings, ToastPosition } from '@/types';

interface ToastPositionSectionProps {
  settings: CatchySettings;
  onSave: (settings: CatchySettings) => void;
}

export function ToastPositionSection({ settings, onSave }: ToastPositionSectionProps) {
  const handlePositionChange = (position: ToastPosition) => {
    onSave({
      ...settings,
      theme: {
        ...settings.theme,
        position,
      },
    });
  };

  return (
    <Card className="settings-card">
      <CardHeader>
        <CardTitle className="section-title">
          <span className="title-number">02</span>
          <span className="title-text">Toast Position</span>
        </CardTitle>
        <CardDescription>
          Choose where error notifications appear on your screen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as ToastPosition[]).map(
            (position) => (
              <button
                key={position}
                type="button"
                onClick={() => handlePositionChange(position)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  settings.theme.position === position
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-sm font-medium capitalize">
                  {position.replace(/-/g, ' ')}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {position === 'top-left' && 'Top left corner'}
                  {position === 'top-right' && 'Top right corner'}
                  {position === 'bottom-left' && 'Bottom left corner'}
                  {position === 'bottom-right' && 'Bottom right corner (default)'}
                </div>
              </button>
            )
          )}
        </div>

        {/* Swipe to Dismiss Toggle */}
        <div className="mt-6 pt-6 border-t border-border space-y-4">
          <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex-1">
              <div className="font-medium">Swipe to Dismiss</div>
              <div className="text-sm text-muted-foreground">
                Enable drag gesture to dismiss toast notifications
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.theme.swipeToDismiss}
              onChange={() => {
                onSave({
                  ...settings,
                  theme: {
                    ...settings.theme,
                    swipeToDismiss: !settings.theme.swipeToDismiss,
                  },
                });
              }}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </label>

          {/* Persist Pinned Toasts Toggle */}
          <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex-1">
              <div className="font-medium">Persist Pinned Toasts</div>
              <div className="text-sm text-muted-foreground">
                Keep pinned error notifications after page refresh
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.theme.persistPinnedToasts}
              onChange={() => {
                onSave({
                  ...settings,
                  theme: {
                    ...settings.theme,
                    persistPinnedToasts: !settings.theme.persistPinnedToasts,
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
