# Catchy - Console Error Toaster

[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/jkohplmikjpabfejhmlihpadbjkpjn?label=version)](https://chromewebstore.google.com/detail/catchy-console-error-toas/jkohplmikjpabfejhmlihpadbjkpjn)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/jkohplmikjpabfejhmlihpadbjkpjn)](https://chromewebstore.google.com/detail/catchy-console-error-toas/jkohplmikjpabfejhmlihpadbjkpjn)
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/jkohplmikjpabfejhmlihpadbjkpjn)](https://chromewebstore.google.com/detail/catchy-console-error-toas/jkohplmikjpabfejhmlihpadbjkpjn)
[![GitHub Stars](https://img.shields.io/github/stars/ionutcnu/Catchy?style=flat)](https://github.com/ionutcnu/Catchy)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Catchy surfaces JavaScript errors as visual, non-intrusive toasts directly on the page — so you never miss a console error again.

**[Add to Chrome](https://chromewebstore.google.com/detail/catchy-console-error-toas/jkohplmikjpabfejhmlihpadbjkpjn)** · **[Report a Bug](https://github.com/ionutcnu/Catchy/issues/new/choose)** · **[Request a Feature](https://github.com/ionutcnu/Catchy/issues/new/choose)**

---

## What It Catches

- `console.error` calls
- Uncaught exceptions via `window.onerror`
- Unhandled promise rejections

## Features

- **Real-time toasts** — errors appear in under 250ms
- **Smart grouping** — duplicate errors are grouped with a counter
- **Ignore rules** — filter by regex or substring, session or permanent
- **Per-site control** — enable/disable per domain from the popup
- **Global toggle** — master on/off switch
- **Shadow DOM isolation** — zero CSS conflicts with the host page
- **Rate limiting** — handles error storms without flooding the UI
- **Error history drawer** — scrollable panel with up to 200 errors per session
- **Keyboard shortcut** — open drawer with the backtick key `` ` `` (customizable)
- **Toast customization** — position, size, auto-close timer, dark mode
- **Settings sync** — preferences sync across Chrome devices

## Installation

[Add from the Chrome Web Store](https://chromewebstore.google.com/detail/catchy-console-error-toas/jkohplmikjpabfejhmlihpadbjkpjn)

Or load unpacked for development — see [Development Setup](#development-setup) below.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/)
- Chrome browser

### Install and build

```powershell
git clone https://github.com/ionutcnu/Catchy.git
cd Catchy
bun install
bun run build
```

### Load in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Commands

```powershell
bun run dev          # Watch mode build
bun run build        # Production build
bun run lint         # Biome lint check
bun run lint:fix     # Biome auto-fix
bun run format       # Biome format
bun run check:fix    # Full lint + format fix
bun run type-check   # TypeScript check only
```

## Project Structure

```text
src/
├── content/           # Content script (error catching, toast rendering)
│   ├── index.ts       # Entry point and coordinator
│   ├── toast-manager.ts
│   ├── error-history-manager.ts
│   └── components/
│       ├── Toast.ts
│       └── ErrorDrawer.ts
├── options/           # Options page (React)
├── popup/             # Extension popup (React)
├── background/        # Service worker
└── types/             # Shared TypeScript types
public/icons/          # Extension icons (16, 32, 48, 128)
manifest.json          # Extension manifest (MV3)
```

## How It Works

1. **Content script** injects into every page and patches `console.error`, `window.onerror`, and `unhandledrejection`
2. Errors are captured and passed to the **toast manager**, which renders them in a Shadow DOM container — isolated from the page's styles
3. The **error history manager** stores up to 200 errors per session and powers the drawer panel
4. The **background service worker** manages settings, syncs state, and updates the toolbar badge
5. The **popup** provides a quick per-site toggle and links to the options page
6. The **options page** exposes full configuration: error types, toast appearance, ignore rules, keyboard shortcuts

## Configuration

Open the options page via:
- Extension icon → Settings
- Right-click extension icon → Options

Key settings:
- Which error types to capture
- Toast position, size, auto-close behavior
- Ignore rules (regex or substring)
- Per-site enable/disable
- Keyboard shortcut customization

## Troubleshooting

**Toasts not appearing**
- Check the extension is enabled (popup toggle)
- Catchy does not run on `chrome://` or `chrome-extension://` pages
- Check the DevTools console for `[Catchy]` log messages

**Extension won't load after build**
- Load the `dist/` folder, not the project root
- Run `bun run build` first

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, branching strategy, and PR guidelines.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT — see [LICENSE](./LICENSE).

---

Built by [Ionut](https://github.com/ionutcnu). Original idea sparked by a conversation with Wadalin.
