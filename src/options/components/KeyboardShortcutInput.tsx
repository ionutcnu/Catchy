import { useEffect, useState } from 'react';

interface KeyboardShortcutInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}

const BROWSER_RESERVED_SHORTCUTS = [
  'Ctrl+T',
  'Ctrl+W',
  'Ctrl+N',
  'Ctrl+Shift+T',
  'Ctrl+Shift+N',
  'Ctrl+Tab',
  'Ctrl+Shift+Tab',
  'Alt+ArrowLeft',
  'Alt+ArrowRight',
  'Ctrl+L',
  'Ctrl+K',
  'F5',
  'Ctrl+R',
  'Ctrl+H',
  'Ctrl+J',
  'Ctrl+D',
  'Cmd+T',
  'Cmd+W',
  'Cmd+N',
  'Cmd+Shift+T',
  'Cmd+Shift+N',
  'Cmd+Tab',
  'Cmd+Shift+Tab',
  'Cmd+L',
  'Cmd+R',
  'Cmd+H',
  'Cmd+D',
];

export function KeyboardShortcutInput({
  label,
  value,
  onChange,
  helperText,
}: KeyboardShortcutInputProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const isMac =
    (
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
        ?.platform || navigator.platform
    )
      .toUpperCase()
      .indexOf('MAC') >= 0;

  useEffect(() => {
    if (!isCapturing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];
      const modifiers: string[] = [];

      // Add modifiers
      if (e.ctrlKey) {
        keys.push('Ctrl');
        modifiers.push('Ctrl');
      }
      if (e.altKey) {
        keys.push('Alt');
        modifiers.push('Alt');
      }
      if (e.shiftKey) {
        keys.push('Shift');
        modifiers.push('Shift');
      }
      if (e.metaKey) {
        keys.push('Cmd');
        modifiers.push('Cmd');
      }

      // Add main key (not a modifier)
      const mainKey = e.key;
      let hasMainKey = false;
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey) && mainKey.length > 0) {
        // Normalize key names
        let normalizedKey = mainKey;
        if (mainKey.length === 1) {
          normalizedKey = mainKey.toUpperCase();
        }
        keys.push(normalizedKey);
        hasMainKey = true;
      }

      // Must have at least one modifier AND one main key
      if (modifiers.length === 0 || !hasMainKey) {
        setConflict('Shortcut must include at least one modifier key and one main key');
        return;
      }

      const shortcut = keys.join('+');

      // Check against browser reserved shortcuts
      if (BROWSER_RESERVED_SHORTCUTS.includes(shortcut)) {
        setConflict(`${shortcut} is reserved by the browser`);
        return;
      }

      // Valid shortcut
      setConflict(null);
      onChange(shortcut);
      setIsCapturing(false);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCapturing(false);
        setConflict(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleEscape, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleEscape, true);
    };
  }, [isCapturing, onChange]);

  const toggleCapture = () => {
    setIsCapturing(!isCapturing);
    setConflict(null);
  };

  const shortcutKeys = value ? value.split('+') : [];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{label}</div>

      <div className="flex gap-2">
        <div
          className={`flex-1 px-4 py-3 border-2 rounded-lg transition-colors ${
            isCapturing ? 'border-primary bg-primary/5' : 'border-border bg-background'
          }`}
        >
          {isCapturing ? (
            <span className="text-sm text-muted-foreground">Press keys... (ESC to cancel)</span>
          ) : shortcutKeys.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {shortcutKeys.map((key) => (
                <kbd
                  key={key}
                  className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono"
                >
                  {key}
                </kbd>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No shortcut set</span>
          )}
        </div>
        <button
          type="button"
          onClick={toggleCapture}
          className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
        >
          {isCapturing ? 'Cancel' : 'Change'}
        </button>
      </div>

      {conflict && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span>⚠️</span>
          <span>{conflict}</span>
        </p>
      )}

      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}

      <p className="text-xs text-muted-foreground">
        Platform: {isMac ? 'macOS (Cmd)' : 'Windows/Linux (Ctrl)'}
      </p>
    </div>
  );
}
