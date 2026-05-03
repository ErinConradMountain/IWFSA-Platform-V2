# Carry-Forward Matrix

This document records what should be retained, refactored, replaced, or retired as the platform moves from V1 to V2.

## Purpose

- Make migration decisions explicit.
- Prevent accidental loss of proven V1 behavior.
- Separate business-critical carry-forward items from technical debt.
- Create a single decision log that product, engineering, and operations can review.

## Decision Rules

- `Carry forward`: Preserve with minimal change because the V1 implementation or rule is still valid.
- `Refactor`: Preserve the behavior, but re-implement it to meet V2 architecture or quality goals.
- `Replace`: Deliver the same business outcome using a new pattern, service, or workflow.
- `Retire`: Remove because it is obsolete, duplicated, risky, or unsupported in V2.

## Matrix

| Trace ID | Area | V1 Asset / Capability | Decision | Rationale | V2 Target | Evidence / Source | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TRC-001 | Authentication | Unified sign-in with role-based routing | Refactor | Preserve the one-entry-point user experience while replacing the underlying auth stack with stronger session and token controls. | Central identity service plus role resolver | V1 PRD unified sign-in routing rules | Engineering + Security | Seeded |
| TRC-002 | Authorization | Public, member, and admin boundary rules | Carry forward | The visibility and access intent is business-critical and should survive the rebuild unchanged in principle. | Policy-driven authorization layer across all surfaces | V1 PRD surface boundaries and member navigation rules | Product + Security | Seeded |
| TRC-003 | Member operations | Excel-based member import with validation and dedupe | Carry forward | This is the operational entry point for annual membership administration and onboarding. | Import staging workflow, validation engine, and reconciliation report | V1 PRD member provisioning section | Product + Engineering | Seeded |
| TRC-004 | Member operations | Invite and credential-reset flows | Carry forward | Secure activation and reset are validated business needs and should not regress. | Invitation/reset token service with private delivery | V1 PRD initial invite and reset sections | Engineering + Security | Seeded |
| TRC-005 | Membership governance | Good-standing and active-member access control | Carry forward | Membership standing is a core governance rule that controls directory visibility and portal access. | Standing policy engine and enforcement hooks | V1 PRD membership rules | Product + Admin Ops | Seeded |
| TRC-006 | Member profiles | Member directory and profile maintenance | Refactor | Preserve the business outcome while redesigning around cleaner data ownership, consent controls, and media handling. | Profile service and consent-aware member directory | V1 PRD profile governance section | Product + Engineering | Seeded |
| TRC-007 | Events | Event creation, publishing, audience restrictions, capacity, waitlist, and delegated editing | Carry forward | This is the primary member value stream and should be preserved as a governed collaboration workflow. | Event service, event-management UI, and audience policy checks | V1 PRD events, recurrence, and publishing sections | Product + Engineering | Seeded |
| TRC-008 | Event documents | Agenda/minutes and other member-only event documents | Refactor | Preserve controlled document access while allowing storage and lifecycle management to change in V2. | Document metadata model, storage adapter, and visibility rules | V1 PRD event documents section | Engineering + Ops | Seeded |
| TRC-009 | Notifications | In-app and transactional notifications with admin monitoring | Refactor | Business triggers should remain, but delivery management and monitoring need stronger operational visibility. | Notification service with delivery telemetry and member-centric admin views | V1 PRD notifications section | Product + Engineering | Seeded |
| TRC-010 | Auditability | Audit log, rollback awareness, and support-ready admin actions | Refactor | The governance outcome must survive, but V2 needs a cleaner event model and explicit support procedures. | Central audit stream, incident views, and recovery runbooks | V1 PRD audit and rollback requirements | Security + Ops | Seeded |
| NFR-001 | Domain model | Canonical entities, statuses, and lifecycle rules | Refactor | Semantics should remain stable, but the model needs normalization and explicit ownership boundaries in V2. | Versioned V2 domain model and API contracts | V1 schema, forms, reports | Engineering | Proposed |
| NFR-002 | Reporting | Mandatory operational and compliance reports | Carry forward | Required outputs must remain available even if delivery mechanisms change. | Rebuilt reporting endpoints and exports | Existing report catalog and stakeholder review | Product + Engineering | Proposed |
| NFR-003 | Integrations | External system interfaces that remain in use | Refactor | Contracts need stabilization, retry policy, idempotency, and explicit secrets handling. | Managed integration adapters | V1 interface list | Engineering | Proposed |
| NFR-004 | Batch processing | Recurring operational automations | Replace | Scheduled work should move to observable background jobs with failure isolation. | Scheduler-backed background workers | V1 cron/tasks inventory | Engineering + Ops | Proposed |
| NFR-005 | Configuration | Environment-specific settings and secrets | Replace | V2 should remove hard-coded values and rely on managed configuration. | Twelve-factor style config plus secret store | V1 config files and deployment scripts | Engineering + Ops | Proposed |
| NFR-006 | Data retention | Retention and archival obligations | Carry forward | Governance and compliance obligations survive technology change. | Documented retention controls and archival jobs | Policies and stakeholder input | Product + Security | Proposed |
| NFR-007 | UI debt | High-friction or low-value legacy screens | Retire selectively | The rebuild should not preserve outdated UX with no current value. | Simplified V2 workflows | V1 usability findings | Product + Design | Proposed |
| NFR-008 | Technical debt | Fragile code paths and manual workarounds | Retire | Unsupported workarounds should not be rebuilt into V2. | No direct V2 equivalent | Incident history and team knowledge | Engineering | Proposed |
| NFR-009 | Test assets | Business-critical acceptance scenarios | Carry forward | Expected business outcomes should survive migration even if the harness changes. | V2 acceptance test suite tied to trace IDs | Existing test cases and SME scenarios | QA + Engineering | Proposed |
| NFR-010 | Runbooks | Operational knowledge for support and recovery | Refactor | Support procedures remain necessary but must match V2 tooling and architecture. | V2 runbooks and support playbooks | V1 support docs | Ops | Proposed |

## Review Questions

- Does the V1 item still support a current business objective?
- Is the current implementation safe, supportable, and compliant enough to keep?
- Would carrying this forward block V2 architectural goals?
- Can the business outcome be preserved while the implementation changes?
- Is there a measurable cost or risk reduction from retiring it?

## Exit Criteria

- Every in-scope V1 capability has a decision.
- Every `Carry forward`, `Refactor`, and `Replace` item has an accountable owner.
- Retired items have explicit approval and user communication impact assessed.
- The matrix is linked to migration planning, backlog items, and acceptance tests.

## Current Biases To Keep Honest

- Do not let the V1 UI layout dictate the V2 information architecture when the business outcome can be preserved with a cleaner flow.
- Do not replace a V1 capability by default unless the business outcome, operational burden, or security posture is demonstrably improved.
- Do not accept a `Carry forward` decision without naming the trace evidence that justifies it.