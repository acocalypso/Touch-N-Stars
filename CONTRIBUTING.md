# Contributing to Touch'N'Stars

Contributions are welcome. This guide describes the current local workflow and
the checks expected before a pull request.

## Prerequisites

- Node.js 22 and npm (the CI toolchain)
- A modern Chromium-based browser for web testing
- Optional: N.I.N.A. with the Advanced API and Touch'N'Stars plugins for live
  integration testing
- Optional: Android Studio and/or Xcode for native changes

Never point automated or exploratory command tests at production equipment.
Use mocks, a simulator, or a dedicated lab installation unless a live action is
explicitly intended and supervised.

## Setup

```bash
git clone <your-fork-url>
cd Touch-N-Stars
npm ci
npm run serve
```

`npm ci` is the reproducible install path and must agree with
`package-lock.json`. The development server runs the source-scoped ESLint fix
step and the required generators before starting Vite.

## Project structure

```text
src/
├── assets/          Static assets
├── components/      Reusable Vue components
├── composables/     Shared Vue composition logic
├── integrations/    External renderer and protocol boundaries
├── locales/         i18n resources
├── plugins/         Touch'N'Stars extension system
├── router/          Vue Router configuration
├── services/        API clients and business services
├── store/           Pinia stores
├── utils/           Shared utilities
└── views/           Routed application views
```

The current Celestia Atlas boundary and its release checks are documented in
[docs/celestia-atlas-integration.md](docs/celestia-atlas-integration.md).

## Code and UI rules

- Use modern JavaScript, `const` by default, and clear names.
- Keep components focused; put reusable protocol or coordinate work behind a
  tested integration boundary.
- Add every user-facing string to the locale files. English is required and
  missing translations must be resolved before release.
- Preserve mobile safe areas, orientation changes, and a minimum 48 px touch
  target for primary controls.
- Treat coordinate frames, units, timestamps, and hardware command boundaries
  as explicit data contracts.

Prettier enforces single quotes, semicolons, and two-space indentation. ESLint
checks `src`, Vite configuration, and its own configuration with a persistent
cache under `.cache/eslint`; generated build and cache trees are excluded.

## Tests and validation

Choose the checks relevant to the change. The normal pre-push baseline is:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run format:check
npm run build
```

The repository has automated unit and integration tests. Add or update tests
for behavior changes; manual browser testing does not replace them. Use
`npm run test:coverage`, `npm run i18n:check`, and `npm run preview:smoke` when
their areas are affected. `npm run ci:verify` runs the complete CI gate.

The Vue typecheck can exceed Node's default heap. Set
`NODE_OPTIONS=--max-old-space-size=6144` before the baseline on larger working
trees (PowerShell: `$env:NODE_OPTIONS='--max-old-space-size=6144'`).

On Windows, `npm run testbuild` builds and deploys to the configured N.I.N.A.
plugin app directory and verifies the Celestia data package. A running N.I.N.A.
plugin serves that deployment on port 5000. The command deliberately skips lint
so the deployment path stays fast and deterministic; run `npm run lint`
separately.

For native changes:

```bash
npm run build:native
npm run sync:native
```

The native verifier ensures large Celestia survey data is not bundled in the
Android or iOS application. Test relevant flows on both platforms when layout,
lifecycle, networking, or Capacitor behavior changes.

## Generated files

Run the matching generator when changing plugin metadata or release notes:

```bash
npm run generate-plugins
npm run generate-whats-new
```

Review generated diffs. Do not commit `dist/`, `.cache/`, or local test-deploy
artifacts.

## Commits and pull requests

Use a short conventional prefix such as `feat:`, `fix:`, `docs:`, `refactor:`,
or `chore:`. Keep each commit coherent and avoid unrelated formatting changes.

In a pull request, explain what changed, why it changed, how it was tested, and
any remaining platform or hardware validation. For notable user-facing changes,
update `CHANGELOG.md` under `Unreleased` using Keep a Changelog categories.

## Translations and plugins

Translation helpers:

```bash
npm run locale:entry
npm run locale:entry:all
npm run locale:find-missing-keys
```

Keep translations concise and test them on a narrow mobile viewport. For plugin
structure and discovery, see [src/plugins/plugins.md](src/plugins/plugins.md) or
start with `npm run create-plugin`.

## Help

- Open a GitHub issue for reproducible bugs or feature proposals.
- Join the [Touch'N'Stars Discord](https://discord.com/invite/4gZJEMWFcN).
- Consult the [project wiki](https://github.com/Touch-N-Stars/Touch-N-Stars/wiki).

Contributions are licensed under the repository's existing licence.
