# Contributing to Catchy

Thanks for your interest in contributing. Here's everything you need to get started.

## Prerequisites

- [Bun](https://bun.sh/) (package manager + runtime)
- Node.js 18+ (for Playwright tests)
- Chrome or Chromium browser
- Git

## Local Setup

```bash
git clone https://github.com/ionutcnu/Catchy.git
cd Catchy
bun install
bun run dev
```

Then load the extension in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

The extension will hot-reload as you make changes.

## Project Structure

```
src/
├── content/      # Content script (error catching, toast rendering)
├── options/      # Options page (React UI)
├── background/   # Service worker
public/icons/     # Extension icons
manifest.json     # Extension manifest (MV3)
```

## Development Commands

```bash
bun run dev          # Watch mode build
bun run build        # Production build
bun run lint         # Biome lint check
bun run lint:fix     # Biome auto-fix
bun run format       # Biome format
bun run check:fix    # Full lint + format fix
bun run type-check   # TypeScript check only
```

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting. Run before committing:

```bash
bun run check:fix
```

No Prettier, no ESLint — Biome handles everything. Your editor should pick up `biome.json` automatically.

## Branching

```
main        → stable, always releasable
develop     → active development (target your PRs here)
feature/*   → new features  (feature/dark-theme)
hotfix/*    → urgent fixes branched from main
```

**Always branch from `develop`, not `main`.**

## Submitting a PR

1. Fork the repo
2. Branch from `develop`: `git checkout -b feature/your-feature`
3. Make your changes
4. Run `bun run check:fix` and `bun run type-check`
5. Commit using the format: `type: what in where`
   - Types: `feat | fix | refactor | docs | test | chore | perf | style`
   - Example: `fix: Prevent duplicate toasts on rapid errors`
6. Open a PR against `develop`
7. Fill in the PR description with: what changed, why, and how to test it

## Reporting Bugs

Use the [Bug Report template](https://github.com/ionutcnu/Catchy/issues/new/choose). Include:
- Chrome version
- Extension version
- Steps to reproduce
- Expected vs actual behavior

## Requesting Features

Use the [Feature Request template](https://github.com/ionutcnu/Catchy/issues/new/choose). Explain the use case, not just the feature.

## What Makes a Good PR

- Focused: one thing per PR
- Tested: explain how you verified it works
- Clean: passes lint and type-check before opening
- Small: prefer multiple small PRs over one large one

## License

By contributing, you agree your contributions are licensed under the [MIT License](./LICENSE).
