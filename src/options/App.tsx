import { useSettings } from './hooks/useSettings';
import { Header } from './components/Header';
import { GlobalControlSection } from './components/sections/GlobalControlSection';
import { ToastPositionSection } from './components/sections/ToastPositionSection';
import { ErrorTypesSection } from './components/sections/ErrorTypesSection';
import { PerSiteSection } from './components/sections/PerSiteSection';
import { DisplaySettingsSection } from './components/sections/DisplaySettingsSection';
import { HistorySection } from './components/sections/HistorySection';
import { IgnoredErrorsSection } from './components/sections/IgnoredErrorsSection';
import { VisualCustomizationSection } from './components/sections/VisualCustomizationSection';
import { AboutSection } from './components/sections/AboutSection';

export default function OptionsApp() {
  const { settings, saved, saveError, isDarkMode, saveSettings, toggleDarkMode } = useSettings();

  return (
    <div className="min-h-screen bg-background settings-container">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          saved={saved}
          saveError={saveError}
        />

        <div className="space-y-6">
          <GlobalControlSection settings={settings} onSave={saveSettings} />
          <ToastPositionSection settings={settings} onSave={saveSettings} />
          <ErrorTypesSection settings={settings} onSave={saveSettings} />
          <PerSiteSection settings={settings} onSave={saveSettings} />
          <DisplaySettingsSection settings={settings} onSave={saveSettings} />
          <HistorySection settings={settings} onSave={saveSettings} />
          <IgnoredErrorsSection />
          <VisualCustomizationSection settings={settings} onSave={saveSettings} />
          <AboutSection />
        </div>
      </div>
    </div>
  );
}
