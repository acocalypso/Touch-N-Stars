# Touch-N-Stars Project Context for AI Reviews

## What this project is
- Touch-N-Stars is a mobile-first web interface for controlling N.I.N.A (Nighttime Imaging 'N' Astronomy).
- The UI is built for tablets/phones and complements the desktop N.I.N.A workflow.
- The app depends on N.I.N.A and its plugin ecosystem; this repo is not a generic astronomy app.

## Core backend/API dependency
- Primary communication is through N.I.N.A Advanced API.
- Reference API repo: https://github.com/christian-photo/ninaAPI
- Typical expectations:
  - API port 1888
  - API V2 enabled
- Changes that affect API contracts, request/response shape, command names, and sequencing behavior are high risk.

## Architecture expectations
- Frontend stack: Vue 3 + Vite.
- State and UI behavior are tightly coupled to device-control workflows (mount, camera, guider, platesolve, focuser, sequences, etc.).
- Correctness is more important than broad refactors; avoid speculative rewrites in critical control paths.

## Review priorities for this repository
- Validate that user actions map to the correct N.I.N.A API calls.
- Preserve safety and sequencing for equipment operations (no hidden behavior changes).
- Flag regressions in connection/reconnection handling, status polling, and error messaging.
- Ensure CI checks remain deterministic and actionable.
- Treat translation and formatting changes separately from functional behavior when possible.

## Domain constraints
- This project is astronomy/astrophotography control software.
- Avoid suggestions that ignore N.I.N.A/Advanced API realities.
- Prefer small, testable changes that preserve existing operational workflows.
