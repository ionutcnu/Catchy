interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  displayValue?: string;
  helperText?: string;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  displayValue,
  helperText,
}: SliderControlProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium">{label}</div>
        <span className="text-sm font-mono text-muted-foreground">{displayValue ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
      />
      {helperText && <p className="text-xs text-muted-foreground mt-1">{helperText}</p>}
    </div>
  );
}
