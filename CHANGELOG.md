# Changelog

All notable changes to Catchy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.0.0] - 2026-02-10

First public release on the Chrome Web Store.

### Added

- "Ignore this" button on toast — dismiss errors for current session or permanently
- Max toasts cap — limits concurrent visible toasts to prevent UI flooding
- Playwright E2E test suite — 10 test files covering all major user flows
- Backtick key (`` ` ``) as default keyboard shortcut to open the error history drawer
- Per-page session store with ring buffer
- Ignored errors management page — view and remove permanently ignored errors

### Changed

- Toast component overhauled — improved rendering, animations, and dismiss behavior
- Error history drawer improvements — better scroll, grouping, and clear behavior
- Popup redesigned for clearer per-site and global toggle controls
- Default drawer shortcut changed from `Alt+E` to backtick (`` ` ``)

### Fixed

- Extension initialization race condition on fast-loading pages
- Settings propagation timing in content script
- Flaky test reliability improvements

---

## [0.2.0] - 2026-01-30

### Changed

- Settings page refactored from a monolithic component into a modular section-based architecture
- Added sidebar navigation with categorized sections
- Improved input controls — hybrid sliders, color pickers, keyboard shortcut inputs
- Enhanced accessibility — ARIA labels, focus states, screen reader support

### Fixed

- Resolved all TypeScript and Biome lint build errors
- Fixed 38 CodeRabbit review issues across accessibility, type safety, logic, and UI/UX
- Fixed keyboard shortcut validation — modifier-only shortcuts now rejected
- Fixed dark mode hydration issue
- Fixed shadow toggle checkbox behavior
- Fixed preset button validation
- Removed Google Fonts for privacy and GDPR compliance

---

## [0.1.0] - 2025-11-06

### Added

- Console error interception (`console.error`)
- Uncaught exception handling (`window.onerror`)
- Unhandled promise rejection tracking
- Shadow DOM toast notifications with swipe-to-dismiss
- Error history drawer — up to 50 errors per session (configurable 5–50)
- Error deduplication — grouped by type, message, file, and line with occurrence counter
- Pin errors to persist after page refresh
- Toast positioning — 4 corner options
- Toast sizing — small, medium, large, custom
- Configurable auto-close timer
- Max toasts on screen control (1–10)
- Dark mode support
- Global enable/disable toggle
- Per-site settings — enable/disable per domain
- Selective error type toggles
- Full React settings page with Tailwind CSS
- Extension icons — 16, 32, 48, 128px
- Chrome storage sync for settings persistence

---

## [0.0.1] - Initial Development

### Added

- Basic error catching
- Simple toast notifications
- Minimal settings
