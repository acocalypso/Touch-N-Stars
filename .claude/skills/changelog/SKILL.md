---
name: changelog
description: Write or fix a CHANGELOG.md release entry. Use when a change is ready for release notes, when preparing a version, or when the What's New screen in the app shows a wrong version, missing entries or literal markdown characters.
---

# CHANGELOG entries in Touch'N'Stars

`CHANGELOG.md` is not free-form. `scripts/generate-whats-new.js` parses it at
build time (`serve`, `build:app`, `ionic:build` all run it) into
`public/whats-new.json`, which the app renders as the **What's New screen**.
A malformed entry ships to users.

## The parser contract

Verified against `scripts/generate-whats-new.js`:

| Rule | Where | What breaks |
| --- | --- | --- |
| Heading must be `## [AppX.Y.Z] - YYYY-MM-DD` | line 51 | A missing `App` prefix or `-` separator yields `version: 'unknown'` in the payload |
| Only the **first** `## [` block is exported | lines 29-45 | A new release added below an old one is never shown |
| Only `### ` headings and flat `- ` bullets are converted | lines 75-88 | Indented sub-bullets fall through to the paragraph fallback (line 92) and lose their list |
| All text is HTML-escaped | `escapeHtml`, line 97 | Backticks, bold markers and markdown links appear literally on the screen |

So: **no inline markdown, no nested lists, no code spans.** Write plain
sentences.

## Version numbers

`package.json` holds the version **without** prefix (`6.1.4-beta8`), the
CHANGELOG heading **with** it (`App6.1.4-beta8`). `src/version.js` only
re-exports `package.json`, so there is nothing else to keep in sync.

The `Bump version from … to …` commits are made separately by the maintainer. Write the changelog entry against the version that is (or will
be) in `package.json` — do not bump it yourself.

## Entry shape

```markdown
## [App6.1.4-beta8] - 2026-08-24

### Added
- Sequence editor: Items can now be saved directly from the editor

### Fixed
- Guiding: Manual VNC guide cameras now correctly set the PHD2Camera profile value
```

Sections follow Keep a Changelog: `Added`, `Changed`, `Fixed`
(plus `Deprecated`, `Removed`, `Security` when they apply). Omit empty ones.

## Writing style

- **Prefix each bullet with the affected area**, matching the wording users see
  in the UI: `Guiding (PHD2):`, `Equipment:`, `Settings:`, `Atlas:`,
  `Sequence editor:`, `PINS:`.
- Write from the user's side, not the commit's. `fix(mount): treat a parked
  mount as not slewing` becomes *"Mount: A parked mount is no longer shown as
  slewing"*.
- One bullet per user-visible change. Several commits that add up to one
  feature get one bullet — the hardware-db plugin shipped as a single line
  despite a dozen commits.
- Long entries are fine when the symptom needs explaining: describe what went
  wrong for the user, then what happens now. See the beta5 `Equipment:` entries
  for the tone.
- No issue numbers, no file paths, no commit hashes.

