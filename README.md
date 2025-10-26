# 🎯 Catchy - Console Error Toaster

A Chrome extension that catches console and runtime errors and shows them as clean, customizable toast notifications.

## 📋 What It Does

- **Catches Errors**: Intercepts `console.error()`, uncaught exceptions, and unhandled promise rejections
- **Toast Notifications**: Shows errors as non-intrusive toast notifications on the page
- **Per-Site Control**: Enable/disable on specific websites
- **Developer Friendly**: Doesn't interfere with DevTools - errors still appear in console

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
│   ├── content/           # Content script (runs on web pages)
│   │   ├── index.ts      # Injects error catcher
│   │   └── inject.ts     # Patches console.error, catches errors
│   ├── popup/             # Extension popup UI
│   ├── options/           # Settings page
│   ├── types/             # TypeScript definitions
│   └── utils/             # Shared utilities
├── public/
│   └── icons/             # Extension icons
└── dist/                  # Built extension (generated)
```

## 🏗️ How It Works

### Architecture Overview

1. **Inject Script** (`src/content/inject.ts`)
   - Runs in the page's JavaScript context
   - Patches `console.error`, `window.onerror`, `unhandledrejection`
   - Sends captured errors via `window.postMessage`

2. **Content Script** (`src/content/index.ts`)
   - Runs in isolated extension context
   - Injects the inject script into the page
   - Listens for errors via `postMessage`
   - Shows toast notifications

3. **Background Script** (`src/background/index.ts`)
   - Manages settings and state
   - Handles communication between parts

4. **Popup** (`src/popup/`)
   - Quick toggle for enable/disable
   - Opens settings page

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

## 📝 Next Steps

- [ ] Add proper icons (create PNG files: 16x16, 32x32, 48x48, 128x128)
- [ ] Implement Shadow DOM toast component (instead of inline styles)
- [ ] Add error grouping by message
- [ ] Implement rate limiting
- [ ] Create full settings UI
- [ ] Add ignore rules functionality
- [ ] Implement per-site settings

## 📄 License

MIT

## 🤝 Contributing

This is a learning project! Feel free to experiment and add features.

---

**Built with**: TypeScript + Vite + Chrome Extension Manifest V3
