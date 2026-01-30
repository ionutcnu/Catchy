# Changelog

All notable changes to Catchy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Rules engine for filtering errors (regex/substring patterns)
- "Ignore this" action on toast with prefilled rule suggestions
- Performance guard for error storms (rate limiting)
- Per-tab session store (ring buffer)
- Presets: "Dev", "QA", "Demo" profiles
- Import/Export settings as JSON

### Changed

### Fixed

### Removed

---

## [0.2.0] - 2026-01-30

### Changed
- **Settings Page Overhaul**
  - Refactored monolithic settings page into modular component architecture
  - Added sidebar navigation with categorized sections
  - Improved input controls (hybrid sliders, color pickers, keyboard shortcuts)
  - Enhanced accessibility (ARIA labels, focus states, screen reader support)
  - Better UX with specialized input components and preset values

### Fixed
- Resolved all build errors (TypeScript and Biome lint)
- Fixed 38 CodeRabbit review issues:
  - Accessibility improvements (10 fixes)
  - Type safety enhancements (3 fixes)
  - Logic and race condition fixes (5 fixes)
  - Code quality improvements (4 fixes)
  - Privacy and deprecation updates (2 fixes)
  - Architecture improvements (2 fixes)
  - Critical validation fixes (2 fixes)
  - UI/UX bug fixes (4 fixes)
  - Consistency improvements (6 fixes)
- Fixed keyboard shortcut validation (modifier-only shortcuts now rejected)
- Fixed dark mode hydration issue
- Fixed shadow toggle checkbox behavior
- Fixed preset button validation
- Removed Google Fonts for privacy/GDPR compliance

---

## [0.1.0] - 2025-11-06

### Added
- **Error Capturing**
  - Console error interception (`console.error()`)
  - Uncaught exception handling (`window.onerror`)
  - Unhandled promise rejection tracking
  - Resource error detection (images, scripts, etc.)
  - Network error monitoring
- **Error History & Management**
  - Error history drawer with up to 200 errors per session
  - Multiple access methods (keyboard shortcut, toast icon, pin icon)
  - Customizable keyboard shortcut (default: Alt+E)
  - Error grouping by message and stack
  - Pin errors to persist after page refresh
- **UI & Customization**
  - Shadow DOM toast notifications
  - Dark mode support
  - Toast positioning (4 corner options)
  - Toast sizing (small, medium, large, custom)
  - Swipe to dismiss gesture
  - Configurable auto-close timer
  - Max toasts on screen control (1-10)
- **Settings & Controls**
  - Full React-based settings page with Tailwind CSS
  - Global enable/disable toggle
  - Per-site settings (enable/disable per domain)
  - Selective error type toggles
  - Recent features highlights section
- **Branding**
  - Extension icons (16x16, 32x32, 48x48, 128x128)
  - Creator credits (Lonut & Wadalin)
  - Comprehensive README with features and usage guide

### Technical
- Built with TypeScript + React + Tailwind CSS
- Chrome Extension Manifest V3
- Vite build system with Biome for linting
- Shadow DOM for UI isolation
- Chrome storage sync for settings persistence

---

## [0.0.1] - Initial Development

### Added
- Basic error catching functionality
- Simple toast notifications
- Minimal settings

---

**Created by Lonut & Wadalin**
