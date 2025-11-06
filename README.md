# 🎯 Catchy - Console Error Toaster

A Chrome extension that catches console and runtime errors and shows them as clean, customizable toast notifications.

**Created by Lonut & Wadalin**

## ✨ Features

### Error Capturing
- **Console Errors**: Intercepts `console.error()` calls
- **Uncaught Exceptions**: Captures uncaught errors via `window.onerror`
- **Unhandled Promise Rejections**: Catches unhandled promise rejections
- **Resource Errors**: Detects failed resource loads (images, scripts, etc.)
- **Network Errors**: Monitors network/fetch failures

### Error History & Management
- **📊 Error History Drawer**: Scrollable drawer panel with up to 200 errors per session
- **Multiple Access Methods**:
  - Click toast icon to open drawer
  - Use keyboard shortcut (default: `Alt+E`, customizable)
  - Click pin icon for quick access
- **Error Grouping**: Groups identical errors with count indicators
- **Persist Pinned Toasts**: Keep important errors after page refresh

### Customization
- **Toast Positioning**: Choose from 4 corner positions (top-left, top-right, bottom-left, bottom-right)
- **Toast Sizing**: Small, medium, large, or custom dimensions
- **Dark Mode**: Full dark mode support
- **Auto-close Timer**: Configurable or disable for manual dismissal
- **Swipe to Dismiss**: Touch/drag gesture support
- **Max Toasts**: Control how many toasts appear on screen (1-10)

### Site Control
- **Global Toggle**: Master on/off switch for all sites
- **Per-Site Settings**: Enable/disable Catchy for specific domains
- **Selective Error Types**: Toggle which error categories to capture

### Developer Friendly
- **DevTools Integration**: Errors still appear in console
- **Keyboard Shortcuts**: Quick access to error history
- **No Interference**: Doesn't break existing error handlers

## 📖 Usage

### Quick Start
1. **Install** the extension (see Development Setup below)
2. **Enable** Catchy by clicking the extension icon in your toolbar
3. Visit any website and trigger errors to see toast notifications
4. **Access error history** by pressing `Alt+E` or clicking the toast icon

### Accessing Error History
There are three ways to open the error history drawer:
- **Keyboard**: Press `Alt+E` (customizable in settings)
- **Toast Icon**: Click the 📊 icon on any toast notification
- **Pin Icon**: Click the pin icon that appears when errors are present

### Managing Errors
- **Pin errors**: Click the pin icon on a toast to keep it after refresh
- **Dismiss**: Click the ✕ button or swipe the toast away
- **View details**: Click on any error in the drawer to see full stack trace
- **Clear history**: Use the "Clear All" button in the drawer

### Configuration
1. Click the extension icon in the toolbar
2. Click "Open Settings" or right-click → "Options"
3. Configure:
   - Which error types to capture
   - Toast position and size
   - Enable/disable per site
   - Keyboard shortcuts
   - Dark mode

## 🚀 Development Setup

### Prerequisites

- Node.js 18+ and npm
- Google Chrome browser

### Installation

1. **Clone/Navigate to the project**
   ```bash
   cd C:\Users\cionc\OneDrive\Desktop\Chesarp\Catchy
   ```

2. **Install dependencies** (if not already done)
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```
   This compiles TypeScript and bundles everything into the `dist/` folder.

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

5. **Test it!**
   - Visit any website (e.g., `https://example.com`)
   - Open DevTools Console and type:
     ```javascript
     console.error("Test error from Catchy!");
     ```
   - You should see a red toast appear in the bottom-right corner!

## 🛠️ Development Commands

```bash
# Build for production
npm run build

# Build in watch mode (auto-rebuild on file changes)
npm run dev

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking without building
npm run type-check
```

## 📁 Project Structure

```
Catchy/
├── manifest.json          # Extension configuration
├── src/
│   ├── background/        # Background service worker
│   │   └── index.ts       # Manages extension state and settings
│   ├── content/           # Content script (runs on web pages)
│   │   ├── index.ts       # Main content script coordinator
│   │   ├── inject.ts      # Error capturing (console.error, window.onerror, etc.)
│   │   ├── toast-manager.ts         # Toast lifecycle and UI management
│   │   ├── error-history-manager.ts # Error storage and drawer UI
│   │   └── components/    # Shadow DOM components
│   │       ├── Toast.ts   # Toast notification component
│   │       └── ErrorDrawer.ts # Error history drawer component
│   ├── popup/             # Extension popup UI (React)
│   │   ├── App.tsx        # Popup main component
│   │   └── main.tsx       # Popup entry point
│   ├── options/           # Settings page (React)
│   │   ├── App.tsx        # Settings main component
│   │   └── main.tsx       # Settings entry point
│   ├── components/        # Shared React components
│   │   └── ui/            # UI components (Button, Switch, Card)
│   ├── types/             # TypeScript definitions
│   │   └── index.ts       # Shared types (CatchySettings, ErrorEvent, etc.)
│   ├── lib/               # Utilities
│   │   └── utils.ts       # Helper functions
│   └── styles/            # Global styles
├── public/
│   └── icons/             # Extension icons (16, 32, 48, 128)
└── dist/                  # Built extension (generated)
```

## 🏗️ How It Works

### Architecture Overview

1. **Inject Script** (`src/content/inject.ts`)
   - Runs in the page's JavaScript context
   - Patches `console.error`, `window.onerror`, `unhandledrejection`
   - Captures resource and network errors
   - Sends captured errors via `window.postMessage`

2. **Content Script** (`src/content/index.ts`)
   - Runs in isolated extension context
   - Injects the inject script into the page
   - Listens for errors via `postMessage`
   - Manages toast notifications and error history
   - Handles keyboard shortcuts

3. **Toast Manager** (`src/content/toast-manager.ts`)
   - Creates and manages toast notifications in Shadow DOM
   - Handles toast lifecycle (show, dismiss, auto-close)
   - Implements swipe-to-dismiss gesture
   - Groups duplicate errors

4. **Error History Manager** (`src/content/error-history-manager.ts`)
   - Stores errors in session (up to 200 errors)
   - Manages error drawer UI
   - Provides search and filter capabilities
   - Handles pinned errors persistence

5. **Background Script** (`src/background/index.ts`)
   - Manages settings and state
   - Handles communication between parts
   - Updates badge based on extension state

6. **Popup** (`src/popup/`)
   - Quick toggle for enable/disable
   - Shows current site status
   - Opens settings page

7. **Options Page** (`src/options/`)
   - Full settings UI built with React + Tailwind
   - Dark mode support
   - Per-site configuration
   - Error type toggles

### Keyboard Shortcuts

- **`Alt+E`** (customizable): Open/close error history drawer
- Configure custom shortcuts in the Options page under "Error History" settings

## 🔧 Configuration Files Explained

- **`manifest.json`** - Tells Chrome about your extension (permissions, files, etc.)
- **`tsconfig.json`** - TypeScript compiler settings
- **`vite.config.ts`** - Build tool configuration (compiles TS, bundles files)
- **`.eslintrc.cjs`** - Code quality rules
- **`.prettierrc`** - Code formatting rules
- **`.gitignore`** - Files to exclude from version control

## 🐛 Troubleshooting

### Extension won't load
- Make sure you built it first: `npm run build`
- Load the `dist` folder, not the root project folder

### Errors aren't showing
- Check if the extension is enabled (click icon in toolbar)
- Open DevTools Console and look for `[Catchy]` log messages
- Make sure you're testing on a normal webpage (not chrome:// pages)

### Build errors
- Try deleting `node_modules` and `dist` folders
- Run `npm install` again
- Make sure you have Node.js 18+ installed

## 📝 Roadmap

### ✅ Completed
- [x] Shadow DOM toast component with swipe-to-dismiss
- [x] Error grouping by message and stack
- [x] Full settings UI (React + Tailwind + Dark mode)
- [x] Per-site settings
- [x] Error type toggles (Console, Uncaught, Rejections, Resource, Network)
- [x] Error history drawer with 200 error cap
- [x] Keyboard shortcuts (customizable)
- [x] Persist pinned toasts
- [x] Extension icons (16x16, 32x32, 48x48, 128x128)

### 🚧 In Progress
- [ ] Rules engine for filtering errors (regex/substring patterns)
- [ ] "Ignore this" action on toast with prefilled rule suggestions
- [ ] Performance guard for error storms (rate limiting)
- [ ] Per-tab session store (ring buffer)

### 📋 Planned Features
- [ ] Presets: "Dev", "QA", "Demo" profiles
- [ ] Import/Export settings as JSON
- [ ] Unit tests (rules engine, grouping, rate limiting)
- [ ] E2E tests with Playwright
- [ ] A11y improvements (aria-live, focus traps)
- [ ] Redaction (mask tokens/emails/hex blobs)
- [ ] Optional DevTools panel with searchable error list
- [ ] Chrome Web Store listing and release

## 📄 License

MIT

## 🤝 Contributing

This is a learning project! Feel free to experiment and add features.

---

**Built with**: TypeScript + Vite + Chrome Extension Manifest V3
