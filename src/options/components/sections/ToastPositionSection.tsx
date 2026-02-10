import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CatchySettings, ToastPosition } from '@/types';

interface ToastPositionSectionProps {
  settings: CatchySettings;
  onSave: (settings: CatchySettings) => void;
}

/**
 * ToastPositionSection - Configure toast screen position
 *
 * Provides visual grid for selecting toast notification position
 * (top-left, top-right, bottom-left, bottom-right).
 *
 * @param settings - Current extension settings
 * @param onSave - Callback to persist settings changes
 */
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
        <CardDescription>Choose where error notifications appear on your screen</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as ToastPosition[]).map(
            (position) => (
              <button
                key={position}
                type="button"
                data-testid={`toast-position-${position}`}
                onClick={() => handlePositionChange(position)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  settings.theme.position === position
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-sm font-medium capitalize">{position.replace(/-/g, ' ')}</div>
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

        {/* Visual Preview */}
        <div className="mt-6 relative w-full h-48 bg-muted/30 rounded-lg border-2 border-dashed border-border overflow-hidden">
          <div
            className="absolute w-24 h-14 bg-primary/20 border-2 border-primary rounded flex items-center justify-center text-xs font-medium transition-all duration-300"
            style={{
              top: settings.theme.position.startsWith('top') ? '12px' : 'auto',
              bottom: settings.theme.position.startsWith('bottom') ? '12px' : 'auto',
              left: settings.theme.position.endsWith('left') ? '12px' : 'auto',
              right: settings.theme.position.endsWith('right') ? '12px' : 'auto',
            }}
          >
            Toast
          </div>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            Live Preview
          </span>
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
              data-testid="swipe-to-dismiss-toggle"
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
              data-testid="persist-pinned-toggle"
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
