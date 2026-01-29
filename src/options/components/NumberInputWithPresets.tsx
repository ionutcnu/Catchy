interface NumberInputWithPresetsProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  presets?: number[];
  helperText?: string;
  warningText?: string;
}

export function NumberInputWithPresets({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit,
  presets,
  helperText,
  warningText,
}: NumberInputWithPresetsProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{label}</div>

      <div className="flex items-center gap-3">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInputChange}
          className="flex-1 px-3 py-2 border border-border rounded bg-background"
        />
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>

      {presets && presets.length > 0 && (
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-xs text-muted-foreground">Presets:</span>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className="px-2 py-1 text-xs border border-border rounded hover:bg-accent transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      )}

      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}

      {warningText && (
        <p className="text-xs text-orange-600 flex items-center gap-1">
          <span>⚠️</span>
          <span>{warningText}</span>
        </p>
      )}
    </div>
  );
}
