# Local MCP chat

Status: implementing
Date: 2026-10-12

## Goal and scope

Provide a mobile-first plugin page on develop for chatting with the local PINS
model, reviewing MCP proposals, inspecting results and troubleshooting failures.
The PINS AI plugin owns inference and the gateway; the existing MCP server is
used unchanged. Standard NINA installations without this capability show a
clear unavailable state. No cloud calls or changes to existing equipment controls.

## Acceptance criteria

1. Connecting requires an explicit bearer token held only in memory; changing
   rigs or leaving the page clears credentials and pending approvals.
2. Chat shows progress, errors and model/tool results. Queries can execute;
   mutations require a separate approval of the exact tool and arguments.
3. Invalid, expired, replayed or state-changed approvals are refused by the
   server. Model prose never grants permission. Mutations are never retried.
4. Running jobs retain their ID and support background-aware status polling;
   failure, cancellation and abandonment are never displayed as success.
5. Debug mode exposes bounded redacted diagnostics and export, not secrets.
6. Narrow-screen touch controls, accessible labels and all locale keys work.
7. Debian packages contain plugin, pinned native runtime, verified model/adapter,
   licenses and provenance. Installation preserves existing user configuration.
8. Local tests and build checks pass; Pi integration uses queries and simulators
   only. Report unverified native-device and concurrent-imaging behavior.

## Design

The plugin-owned authenticated HTTP gateway is on port 4784. The private inference
API remains loopback-only. The frontend uses the current rig host; tokens are
entered deliberately and are not inherited from daemon credentials. Explicit
operator sessions bind previews to the running host's profile/device settings.
Chat offers a compact tool scope to respect the model's 1536-token context; a
tool browser also supports reviewed structured requests without inference.

Validation: gateway/runtime tests, transport tests, lint, format, i18n, build,
browser checks and conservative Pi probes. Android/iOS device tests and physical
mount/exposure operations are outside this task's automated test scope.
