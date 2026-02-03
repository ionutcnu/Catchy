interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  'data-testid'?: string;
}

/**
 * ColorPicker - Visual color input component with preview swatch
 *
 * Displays current color value in hex format and provides native
 * color picker input for selection. Used for customizing toast colors.
 *
 * @param label - Display label for the color setting
 * @param value - Current hex color value (e.g., "#dc2626")
 * @param onChange - Callback when color changes, receives new hex value
 * @param data-testid - Optional test identifier
 */
export function ColorPicker({
  label,
  value,
  onChange,
  'data-testid': dataTestId,
}: ColorPickerProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="font-medium block mb-1">{label}</div>
        <span className="text-sm font-mono text-muted-foreground">{value}</span>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
            aria-label={label}
            data-testid={dataTestId}
          />
        </div>
      </div>
    </div>
  );
}
