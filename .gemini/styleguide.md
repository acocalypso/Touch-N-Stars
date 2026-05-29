# Touch-N-Stars Gemini Review Style Guide

## Goal

You are reviewing a pull request against Touch-N-Stars, a mobile-first Vue/Vite frontend for controlling N.I.N.A through the N.I.N.A Advanced API.

Your core question on every PR:

Is this change correct and safe for real astrophotography equipment workflows?

## Hard Project Rules (always findings if violated)

### R1. N.I.N.A API contract safety
- Any changed API request/response handling must remain compatible with N.I.N.A Advanced API behavior.
- Flag changed endpoint paths, payload shapes, status handling, or assumptions that can break communication.

### R2. Operational safety over convenience
- Changes to sequence, mount, camera, guider, focuser, filter wheel, rotator, dome, or shutdown/restart flows must preserve safe sequencing and explicit failure handling.
- Flag hidden behavior changes, silent failures, or state transitions that can mislead users during live sessions.

### R3. No speculative architecture churn
- Prefer minimal, local fixes over broad rewrites in core control paths.
- Flag large refactors without clear risk reduction or test evidence.

### R4. Keep plugin contract stability
- Plugin metadata and registry behavior must remain backward compatible unless explicitly migrated.
- Flag plugin key/name/schema changes without migration strategy.

### R5. i18n runtime integrity
- Changes to localized strings must preserve placeholder variable names and semantic intent across locales.
- Flag placeholder mismatches that can break interpolation at runtime.

## Universal Review Lenses

### L1. Correctness under real usage
- Does this still work when connected to real N.I.N.A sessions, not only mock/demo paths?

### L2. Failure and recovery paths
- Are API/network/disconnect errors surfaced clearly and recoverable without stale UI state?

### L3. State consistency
- Do store/composable/component updates keep status, controls, and indicators synchronized?

### L4. Security and trust boundaries
- Flag unsafe HTML insertion, unsanitized dynamic content, or sensitive data leakage.

### L5. Test adequacy
- If behavior changed, are tests added/updated in the relevant utility/composable/service surface?

## Surface-Specific Guidance

### API/service layer (src/services, plugin service modules)
- Verify request payloads, response parsing, retry/backoff, and timeout expectations.
- Prefer explicit schema handling over implicit property access.

### Composables and store (src/composables, src/store)
- Check side effects, watcher lifecycles, and race conditions when state changes quickly.

### UI components (src/components, src/views)
- Ensure controls reflect true backend status and disabled/loading states are accurate.
- Validate that dangerous operations still require intentional user action.

### Build/CI/workflow files
- Keep checks deterministic and actionable.
- Avoid introducing gates that fail unrelated PRs without scoped triggers.

## Things Not To Flag

- Formatting-only diffs when CI formatting checks already enforce style.
- Purely generated artifacts unless the PR intentionally changes generation logic.
- Unrelated pre-existing code patterns outside touched scope unless directly causing the finding.

## Output Style

- Findings first, ordered by severity.
- For each finding include:
  - Severity: HIGH, MEDIUM, or LOW
  - What is wrong
  - Why it matters for Touch-N-Stars and N.I.N.A workflows
  - Concrete fix direction
- Prefer concise, actionable findings over broad commentary.
