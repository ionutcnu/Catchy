import { useEffect, useRef, useState } from 'react';
import { type CatchySettings, DEFAULT_SETTINGS } from '@/types';

/**
 * useSettings - React hook for managing extension settings
 *
 * Provides settings state, save/load functionality, and dark mode toggle.
 * Handles Chrome storage sync with optimistic updates and race condition
 * prevention via save ID tracking. Validates maxHistorySize (5-50 range).
 *
 * @returns Settings state and control functions (saveSettings, toggleDarkMode)
 */
export function useSettings() {
  const [settings, setSettings] = useState<CatchySettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const saveIdRef = useRef(0); // Track save attempts to prevent race conditions
  const userEditedRef = useRef(false); // Track if user has made edits

  // Load settings and theme preference on mount
  useEffect(() => {
    chrome.storage.sync.get(['settings', 'darkMode'], (result) => {
      // Load settings only if user hasn't made edits
      if (!userEditedRef.current && result.settings) {
        // Deep merge with defaults to handle legacy settings missing new fields
        const mergedSettings: CatchySettings = {
          ...DEFAULT_SETTINGS,
          ...result.settings,
          theme: {
            ...DEFAULT_SETTINGS.theme,
            ...result.settings.theme,
            // Merge nested color objects explicitly
            backgroundColors: {
              ...DEFAULT_SETTINGS.theme.backgroundColors,
              ...result.settings.theme?.backgroundColors,
            },
            textColors: {
              ...DEFAULT_SETTINGS.theme.textColors,
              ...result.settings.theme?.textColors,
            },
          },
          errorTypes: {
            ...DEFAULT_SETTINGS.errorTypes,
            ...result.settings.errorTypes,
          },
          rateLimit: {
            ...DEFAULT_SETTINGS.rateLimit,
            ...result.settings.rateLimit,
          },
        };
        setSettings(mergedSettings);
      }

      // Always load dark mode preference (independent of settings)
      if (result.darkMode !== undefined) {
        setIsDarkMode(result.darkMode);
        if (result.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });

    // Listen for dark mode changes
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'sync' && changes.darkMode) {
        const newDarkMode = changes.darkMode.newValue;
        setIsDarkMode(newDarkMode);
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  /**
   * Save settings to Chrome sync storage with validation
   *
   * Validates maxHistorySize (5-50 range) before saving to prevent
   * invalid values that could break error history functionality.
   * Uses optimistic UI updates with rollback on error.
   * Prevents race conditions via save ID tracking.
   *
   * @param newSettings - Settings object to save
   */
  const saveSettings = (newSettings: CatchySettings) => {
    // Validate maxHistorySize before saving (clamp to 5-50 range)
    // Use defensive merge to preserve nested color objects
    const validatedSettings: CatchySettings = {
      ...newSettings,
      theme: {
        ...newSettings.theme,
        maxHistorySize: Math.max(5, Math.min(50, newSettings.theme.maxHistorySize)),
        backgroundColors: {
          ...newSettings.theme.backgroundColors,
        },
        textColors: {
          ...newSettings.theme.textColors,
        },
      },
    };

    userEditedRef.current = true; // Mark that user has made edits
    const previousSettings = settings; // Preserve for rollback on error
    const currentSaveId = ++saveIdRef.current; // Increment save ID for this attempt

    setSettings(validatedSettings); // Optimistically update UI

    chrome.storage.sync.set({ settings: validatedSettings }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Catchy Options] Failed to save settings:', chrome.runtime.lastError);

        // Only rollback if this is still the latest save attempt
        // Check saveId to prevent stale failure from undoing newer success
        if (saveIdRef.current === currentSaveId) {
          setSaveError(chrome.runtime.lastError?.message || 'Failed to save settings');
          setTimeout(() => setSaveError(null), 3000);
          setSettings(previousSettings);
        }
        return;
      }

      // Only show success indicator if this save is still relevant
      if (currentSaveId === saveIdRef.current) {
        setSaveError(null); // Clear any previous errors only on success
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  /**
   * Toggle dark mode preference
   *
   * Updates DOM class and persists preference to Chrome sync storage.
   * Changes are broadcast to all extension contexts via storage listener.
   */
  const toggleDarkMode = () => {
    const previousDarkMode = isDarkMode;
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // Toggle dark class on document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to chrome storage with rollback on failure
    chrome.storage.sync.set({ darkMode: newDarkMode }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          '[Catchy Options] Failed to save dark mode preference:',
          chrome.runtime.lastError
        );

        // Rollback state and DOM class on error
        setIsDarkMode(previousDarkMode);
        if (previousDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  };

  return {
    settings,
    saved,
    saveError,
    isDarkMode,
    saveSettings,
    toggleDarkMode,
  };
}
