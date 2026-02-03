interface SettingRowProps {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * SettingRow - Reusable checkbox row component for boolean settings
 *
 * Displays a labeled checkbox with title and description text.
 * Used throughout settings UI for toggle options.
 *
 * @param title - Setting name displayed prominently
 * @param description - Explanatory text below title
 * @param checked - Current checkbox state
 * @param onCheckedChange - Callback when checkbox is toggled
 */
export function SettingRow({ title, description, checked, onCheckedChange }: SettingRowProps) {
  return (
    <label className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="w-5 h-5 accent-primary cursor-pointer"
      />
    </label>
  );
}
