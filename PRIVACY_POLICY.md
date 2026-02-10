# Privacy Policy

**Last updated:** February 2025

## Overview

Catchy ("the Extension") is a Chrome extension that surfaces JavaScript console errors as visual toasts on the page. This policy describes what data the Extension does and does not collect.

## Data Collection

**Catchy collects no data. Zero.**

- No analytics
- No telemetry
- No crash reporting
- No usage tracking
- No personal information
- No network requests of any kind

## How the Extension Works

Catchy operates entirely within your browser:

1. The content script intercepts `console.error`, `window.onerror`, and unhandled promise rejections on the current page.
2. Errors are displayed as toasts directly on that page.
3. Your settings (enabled/disabled state, ignore rules, position preferences) are stored locally using Chrome's `chrome.storage.sync` API, which syncs across your own Chrome devices via your Google account. This sync is handled entirely by Chrome — no data passes through any server operated by Catchy.

## Permissions

The Extension requests the following Chrome permissions:

| Permission | Reason |
|------------|--------|
| `storage` | Save your settings (enable/disable, ignore rules, position) |
| `scripting` | Inject the error-catching content script into pages |
| `activeTab` | Read the current tab's domain for per-site controls |

No permission is used to collect, transmit, or store data beyond your local browser.

## Third Parties

Catchy does not integrate with any third-party services, SDKs, or APIs.

## Changes to This Policy

If this policy changes, the updated version will be posted at this URL with a new "Last updated" date. Given that Catchy collects no data, material changes are unlikely.

## Contact

If you have questions, open an issue on GitHub:
https://github.com/ionutcnu/Catchy/issues
