interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  saved: boolean;
  saveError: string | null;
}

/**
 * Header - Settings page header with dark mode toggle and save status
 *
 * Displays page title, dark mode toggle button, and temporary notifications
 * for save success or errors. Notifications auto-dismiss after timeout.
 *
 * @param isDarkMode - Current dark mode state
 * @param onToggleDarkMode - Callback to toggle dark mode
 * @param saved - Show success notification
 * @param saveError - Error message to display (null if no error)
 */
export function Header({ isDarkMode, onToggleDarkMode, saved, saveError }: HeaderProps) {
  return (
    <>
      <div className="text-center mb-12 relative settings-header">
        <h1 className="text-4xl font-bold mb-2">🎯 Catchy Settings</h1>
        <p className="text-muted-foreground">Configure your error catching preferences</p>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="absolute top-0 right-0 p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-label="Sun icon"
            >
              <title>Sun icon</title>
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-label="Moon icon"
            >
              <title>Moon icon</title>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Save indicator */}
      {saved && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          Settings saved!
        </div>
      )}

      {/* Error indicator */}
      {saveError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {saveError}
        </div>
      )}
    </>
  );
}
