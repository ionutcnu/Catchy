import type { ChangeEvent } from 'react';
import { useId } from 'react';

interface HybridSliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  presets?: Array<{ value: number; label: string }>;
  helperText?: string;
}

export function HybridSliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit,
  presets,
  helperText,
}: HybridSliderInputProps) {
  const id = useId();
  const sliderId = useId();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleInputChange}
            className="w-20 px-2 py-1 border border-border rounded text-sm text-right bg-background"
          />
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
      </div>

      <input
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        aria-label={`${label} slider`}
      />

      {presets && presets.length > 0 && (
        <div className="flex gap-2">
          {presets.map((preset, index) => (
            <button
              key={`${preset.value}-${index}`}
              type="button"
              onClick={() => {
                // Validate preset is within bounds
                if (preset.value >= min && preset.value <= max) {
                  onChange(preset.value);
                }
              }}
              className="px-2 py-1 text-xs border border-border rounded hover:bg-accent transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
}
