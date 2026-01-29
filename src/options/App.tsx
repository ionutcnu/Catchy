import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AboutSection } from './components/sections/AboutSection';
import { DisplaySettingsSection } from './components/sections/DisplaySettingsSection';
import { ErrorTypesSection } from './components/sections/ErrorTypesSection';
import { GlobalControlSection } from './components/sections/GlobalControlSection';
import { HistorySection } from './components/sections/HistorySection';
import { IgnoredErrorsSection } from './components/sections/IgnoredErrorsSection';
import { PerSiteSection } from './components/sections/PerSiteSection';
import { ToastPositionSection } from './components/sections/ToastPositionSection';
import { VisualCustomizationSection } from './components/sections/VisualCustomizationSection';
import { useSettings } from './hooks/useSettings';

type SectionId =
  | 'global'
  | 'position'
  | 'errors'
  | 'persite'
  | 'display'
  | 'history'
  | 'ignored'
  | 'visual'
  | 'about';

export default function OptionsApp() {
  const { settings, saved, saveError, isDarkMode, saveSettings, toggleDarkMode } = useSettings();
  const [activeSection, setActiveSection] = useState<SectionId>('global');

  const renderSection = () => {
    switch (activeSection) {
      case 'global':
        return <GlobalControlSection settings={settings} onSave={saveSettings} />;
      case 'position':
        return <ToastPositionSection settings={settings} onSave={saveSettings} />;
      case 'errors':
        return <ErrorTypesSection settings={settings} onSave={saveSettings} />;
      case 'persite':
        return <PerSiteSection settings={settings} onSave={saveSettings} />;
      case 'display':
        return <DisplaySettingsSection settings={settings} onSave={saveSettings} />;
      case 'history':
        return <HistorySection settings={settings} onSave={saveSettings} />;
      case 'ignored':
        return <IgnoredErrorsSection />;
      case 'visual':
        return <VisualCustomizationSection settings={settings} onSave={saveSettings} />;
      case 'about':
        return <AboutSection />;
      default:
        return <GlobalControlSection settings={settings} onSave={saveSettings} />;
    }
  };

  return (
    <div className="min-h-screen bg-background settings-container">
      <div className="container max-w-7xl mx-auto py-12 px-4">
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          saved={saved}
          saveError={saveError}
        />

        <div className="settings-layout">
          <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
          <main className="settings-content">{renderSection()}</main>
        </div>
      </div>
    </div>
  );
}
