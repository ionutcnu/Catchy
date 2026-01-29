import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function IgnoredErrorsSection() {
  const [ignoredErrors, setIgnoredErrors] = useState<string[]>([]);

  // Load from storage
  const loadIgnoredErrors = useCallback(() => {
    chrome.storage.local.get(['ignoredErrorSignatures'], (result) => {
      setIgnoredErrors(result.ignoredErrorSignatures || []);
    });
  }, []);

  // Clear all
  const handleClearAllIgnoredErrors = () => {
    chrome.storage.local.set({ ignoredErrorSignatures: [] }, () => {
      setIgnoredErrors([]);
    });
  };

  // Remove single error
  const handleRemoveIgnoredError = (signature: string) => {
    const updated = ignoredErrors.filter((s) => s !== signature);
    chrome.storage.local.set({ ignoredErrorSignatures: updated }, () => {
      setIgnoredErrors(updated);
    });
  };

  // Load on mount
  useEffect(() => {
    loadIgnoredErrors();
  }, [loadIgnoredErrors]);

  return (
    <Card className="settings-card">
      <CardHeader>
        <CardTitle className="section-title">
          <span className="title-number">07</span>
          <span className="title-text">Ignored Errors</span>
        </CardTitle>
        <CardDescription>
          Manage errors you've ignored across all tabs. Ignored errors won't show as toasts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Refresh and Clear All Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadIgnoredErrors}
              className="flex-1 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
            >
              Refresh List
            </button>
            <button
              type="button"
              onClick={handleClearAllIgnoredErrors}
              disabled={ignoredErrors.length === 0}
              className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All ({ignoredErrors.length})
            </button>
          </div>

          {/* Ignored Errors List */}
          {ignoredErrors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No ignored errors. Errors you ignore will appear here.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {ignoredErrors.map((signature) => {
                // Parse signature: type::message
                const [type, ...messageParts] = signature.split('::');
                const message = messageParts.join('::'); // In case message contains ::

                return (
                  <div
                    key={signature}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-500/20 text-orange-500 uppercase">
                          {type}
                        </span>
                      </div>
                      <p className="text-sm text-foreground break-words font-mono">{message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIgnoredError(signature)}
                      className="flex-shrink-0 text-destructive hover:text-destructive/90 px-2 py-1 rounded transition-colors"
                      aria-label="Remove from ignore list"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <title>Remove</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> Ignored errors are stored per browser session in each tab.
              They persist across page reloads but are cleared when you close the tab or browser.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
