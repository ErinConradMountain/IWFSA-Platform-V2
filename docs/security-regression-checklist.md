# Security Regression Checklist

## Purpose

Phase 10 security regression verifies that identity, consent, public rendering, notifications, and audit controls still hold when the release candidate is assembled.

## Required Checks

| Area | Check | Evidence |
| --- | --- | --- |
| Sessions | Opaque IDs, rotation on login/admin elevation/standing/reset, secure cookie attributes. | `P2-SESSION-*` |
| CSRF | Missing, invalid, or replayed token rejects state-changing routes. | `P2-CSRF-*` |
| Authorization | Unknown or cross-surface routes deny without route leakage. | `P2-POLICY-001` |
| Public data | Public profile/story routes render only approved projection fields. | `P8-SSR-001` |
| Imports | Preview is non-mutating and commit is idempotent. | `P5-IMPORT-*` |
| Events | RSVP capacity and document access are policy-gated. | `P6-*` |
| Standing | Standing change rotates sessions and blocks old cookies. | `P7-*` |
| Notifications | Outbox, provider routing, retry, and consent cancellation are enforced. | `P9-*` |
| Telemetry | Logs redact cookies, tokens, session identifiers, and raw PII. | telemetry tests |
| Supply chain | Dependency scan, SBOM, provenance check pass. | CI output |

## P0/P1 Halt Conditions

- Raw PII, token, cookie, or session ID appears in audit or logs.
- Public route exposes private fields, standing, contact data, or workflow state.
- CSRF bypass succeeds.
- Standing-blocked account reaches protected member actions.
- Notification worker delivers without consent/policy/outbox evidence.
