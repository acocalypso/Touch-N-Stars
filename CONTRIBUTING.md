# Contributing to Touch'N'Stars

Thank you for your interest in contributing to Touch'N'Stars! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm
- A running NINA installation with the Advanced API plugin (for testing)

### Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run serve
   ```

## Code Style

We use **ESLint** and **Prettier** to maintain consistent code quality.

### Before Committing

Always run the linter and formatter before committing:
```bash
npm run format
npm run lint:fix
```

### Key Rules

- Use ES6+ syntax
- Use `const` by default, `let` when reassignment is needed, avoid `var`
- Use meaningful variable and function names
- Keep functions small and focused
- **No hardcoded strings** - Use i18n for all user-facing text (at least English required)

### Formatting

Prettier handles formatting automatically. Key settings:
- Single quotes for strings
- Semicolons required
- 2 spaces indentation

## Project Structure

```
src/
├── assets/         # Static assets (images, icons, etc.)
├── components/     # Reusable Vue components
├── composables/    # Vue composables (reusable logic)
├── locales/        # Translation files (i18n)
├── plugins/        # Plugin system extensions
├── router/         # Vue Router configuration
├── services/       # API and business logic
├── store/          # Pinia stores
├── utils/          # Utility functions
└── views/          # Page components
```

## Commits

Use conventional commit style:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Example: `feat: add dark mode toggle to settings`

## Pull Requests

1. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/your-feature-name
   ```

2. Make your changes and ensure:
   - Code passes linting (`npm run lint:fix`)
   - The app builds successfully (`npm run testbuild`)
   - You have tested your changes

3. Push your branch and create a Pull Request

4. Provide a clear description of:
   - What the PR does
   - Why the change is needed
   - How it was tested

## Testing

Currently, no automated tests are set up. Please test your changes manually:
- Verify on both mobile and desktop browsers
- Test with a real NINA connection if possible
- Check that existing functionality still works

## Changelog

For notable changes, update `CHANGELOG.md` under `## [Unreleased]`:
- Follow [Keep a Changelog](https://keepachangelog.com/) format
- Use: Added, Changed, Fixed, Removed

## Translations (i18n)

Translation files are located in `src/locales/`.

### Adding a New Translation Key

Use the helper script:
```bash
npm run locale:entry
```

Or for all languages:
```bash
npm run locale:entry:all
```

### Guidelines

- Keep translations concise (UI space is limited on mobile)
- Use placeholders for dynamic values: `{count} images`
- Test translations in the app to ensure they fit

## Plugins

Touch'N'Stars has a plugin system for extending functionality. For detailed documentation on:

- Plugin structure and files
- Creating new plugins
- Auto-discovery system
- Icon support
- Guidelines

See [`src/plugins/plugins.md`](src/plugins/plugins.md)

**Quick start:**
```bash
npm run create-plugin
```

## Questions?

- Open an issue for bugs or feature requests
- Join our [Discord](https://discord.com/invite/4gZJEMWFcN) for discussions
- Check the [Wiki](https://github.com/Touch-N-Stars/Touch-N-Stars/wiki) for documentation

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).
