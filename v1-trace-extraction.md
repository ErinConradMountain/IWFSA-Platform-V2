# V1 Trace Extraction

This document defines how evidence from V1 will be extracted and mapped into V2 requirements, design, implementation, and test artifacts.

## Goal

Create defensible traceability from V1 behavior to V2 delivery so the migration preserves required outcomes and exposes intentional change.

## Scope

- Functional requirements implemented in V1
- Business rules embedded in code, configuration, or forms
- User roles and permissions
- Integrations and interface contracts
- Data entities and lifecycle states
- Compliance, audit, and reporting obligations
- Operational procedures and exception paths

## Source Artifacts

| Source Type | Examples | Extraction Purpose |
| --- | --- | --- |
| Code | Services, controllers, SQL, scripts, validations | Recover implicit rules and processing logic |
| UI artifacts | Forms, navigation, labels, exports | Recover user journeys and decision points |
| Database | Schemas, stored procedures, reference data | Recover canonical data structures and lifecycle rules |
| Documentation | SOPs, user guides, issue history | Recover expected behavior and known constraints |
| Test assets | Manual scripts, UAT evidence, regression tests | Recover verifiable outcomes |
| Logs and reports | Audit trails, notifications, scheduled jobs | Recover real operational behavior |
| Stakeholder interviews | SMEs, support, product owners | Confirm intent where V1 artifacts are incomplete |

## Trace Model

Use the following chain wherever possible:

`V1 source -> observed behavior -> business rule / requirement -> V2 design element -> V2 backlog item -> V2 test evidence`

## Extraction Workflow

1. Inventory V1 artifacts by domain area.
2. Identify user-visible workflows and high-risk backend processing.
3. Extract explicit and implicit rules from code, configuration, and data.
4. Normalize findings into requirement statements using clear, testable language.
5. Tag each finding as `must preserve`, `candidate change`, or `retire`.
6. Link each accepted requirement to a V2 owner, delivery item, and verification method.
7. Review unresolved gaps with business and operational stakeholders.

## Trace Record Template

| Field | Description |
| --- | --- |
| Trace ID | Stable identifier such as `TRC-001` |
| Domain | Business area or subsystem |
| V1 source | File, screen, query, report, or interview note |
| Observed behavior | What V1 actually does |
| Business intent | Why the behavior exists |
| Decision | Preserve, change, or retire |
| V2 target | Service, UI, API, data model, or control |
| Verification | Test, review, audit evidence, or demo |
| Notes | Assumptions, risks, or open questions |

## Initial Proof-of-Concept Trace Register

The following records seed the trace catalog using the V1 planning artifacts as a proof-of-concept evidence base. These are not the full migration inventory; they are the first concrete records to drive V2 scope.

| Trace ID | Domain | V1 source | Observed behavior | Business intent | Decision | V2 target | Verification | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TRC-001 | Authentication | V1 `docs/product-requirements.md` unified sign-in routing rules | Members, event editors, admins, and chief admins authenticate through one sign-in entry and route by role. | Reduce sign-in friction while preserving role separation. | Preserve | Central auth service plus role-based route resolver | Role-routing integration tests and UX walkthrough | V2 should preserve one entry point but can replace the V1 auth implementation. |
| TRC-002 | Authorization | V1 `docs/product-requirements.md` member/admin surface boundaries | Public, member, and admin surfaces have distinct visibility and access rules. | Prevent leakage of private member activity and preserve governance boundaries. | Preserve | Policy-driven authorization and route guards | Access-control tests for public/member/admin boundaries | Must remain server-enforced, not UI-only. |
| TRC-003 | Member import | V1 `docs/product-requirements.md` member provisioning section | Admins import annual member data from Excel with mapping, validation, dedupe, and update/create behavior. | Make yearly membership administration operationally practical. | Preserve | Import pipeline, staging validation, and admin review flow | Dry-run import tests and reconciliation report review | High-value early slice because it feeds onboarding and member visibility. |
| TRC-004 | Onboarding and reset | V1 `docs/product-requirements.md` invite and reset flows | Admins invite members to activate; reset links are short-lived, single-use, and private to the member. | Secure onboarding and recovery without exposing credentials to admins. | Preserve | Invitation and reset token service | Token lifecycle tests and admin/member journey demo | Security-sensitive and should be delivered early. |
| TRC-005 | Membership standing | V1 `docs/product-requirements.md` good-standing and dues rules | Only active members in good standing may appear in the member directory or use the member portal. | Enforce annual membership governance and access control. | Preserve | Membership standing policy engine and directory filters | Standing transition tests and visibility checks | Impacts both authz and directory behavior. |
| TRC-006 | Member directory and profiles | V1 `docs/product-requirements.md` profile governance section | Members can maintain profiles while admins retain control over directory quality and visibility. | Keep member data useful, current, and consent-aware. | Refactor | Profile service, media handling, and consent-aware visibility controls | Profile edit tests and admin moderation review | Requires clear data ownership and auditability in V2. |
| TRC-007 | Event lifecycle | V1 `docs/product-requirements.md` events, recurrence, and publishing sections | Events support audience targeting, capacity, waitlist, recurrence, direct publishing, and delegated editing. | Support the core member participation workflow with controlled collaboration. | Preserve | Event service, audience policy checks, and event-management UI | End-to-end event create/publish/register/cancel tests | Likely needs decomposition into sub-traces during backlog shaping. |
| TRC-008 | Event documents | V1 `docs/product-requirements.md` event documents section | Event documents are optional, member-only, and availability can change before or after the event. | Distribute meeting materials without exposing them publicly. | Preserve | Document metadata model, authorization checks, and storage policy | Eligibility tests for agenda/minutes visibility | Storage backend can change in V2. |
| TRC-009 | Notifications | V1 `docs/product-requirements.md` notifications section | Event and membership operations trigger in-app and transactional notifications, while admin monitoring remains member-centric. | Keep members informed and keep operations diagnosable. | Refactor | Notification service, delivery telemetry, and admin delivery views | Delivery report checks and failed-message handling tests | V2 should hide low-level diagnostics from default admin views. |
| TRC-010 | Audit and supportability | V1 `docs/product-requirements.md` audit plus rollback requirements | Critical admin and event actions must be attributable and support rollback or remediation. | Preserve institutional memory, support, and governance trust. | Refactor | Central audit event stream and support playbooks | Audit event review and incident drill | Must align with non-functional supportability and security goals. |

## Event Domain Expansion

`TRC-007` remains the umbrella trace for the event domain, but it is too broad to act as a single implementation unit. Use the following sub-traces for delivery planning and acceptance definition.

| Trace ID | Parent trace | Domain | V1 source | Observed behavior | Business intent | Decision | V2 target | Verification | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TRC-007A | TRC-007 | Event authoring | V1 `docs/product-requirements.md` events field set and Event Hub UX | Authorized users can create and edit event records with core fields, filters, and lifecycle status. | Provide a governed operational workspace for event setup. | Preserve | Event authoring service and admin event editor | Create/edit validation tests and admin workflow demo | Treat authoring separately from registration so data model decisions stay manageable. |
| TRC-007B | TRC-007 | Event publishing and delegated editing | V1 `docs/product-requirements.md` publishing and meeting operations | Draft events can be published directly by authorized users, and event-scoped editors can collaborate within assigned scope. | Support governed collaboration without a central moderation bottleneck. | Preserve | Publish workflow, event-scoped permissions, and editor assignment model | Publish permission tests and delegated-edit audit review | High RBAC sensitivity because scope is event-specific rather than role-global. |
| TRC-007C | TRC-007 | Audience restriction and discovery | V1 `docs/product-requirements.md` events, closed group meetings, and member navigation requirements | Event visibility depends on audience rules, and only eligible members can discover or access restricted events. | Protect internal and group-limited activity while preserving member usability. | Preserve | Audience policy checks and member event discovery views | Eligible/ineligible visibility tests across audience combinations | Closely coupled to membership standing and role enforcement. |
| TRC-007D | TRC-007 | Registration, capacity, and waitlist | V1 `docs/product-requirements.md` capacity and sign-up flows | Members can register or cancel, remaining seats update immediately, and full events place members on a waitlist. | Manage participation fairly and keep availability accurate. | Preserve | Registration service, capacity calculator, and waitlist transitions | End-to-end RSVP and waitlist transition tests | Requires careful concurrency handling in V2 even if MVP load is modest. |
| TRC-007E | TRC-007 | Recurrence and instance overrides | V1 `docs/product-requirements.md` recurrence requirement | Recurring event series exist with per-instance overrides. | Reduce repetitive admin work while allowing event-specific changes. | Refactor | Recurrence model and per-instance override workflow | Series creation tests and override behavior review | Delay until single-event lifecycle is stable. |
| TRC-007F | TRC-007 | Planning communications and clash warnings | V1 `docs/product-requirements.md` publishing and meeting operations | Organizers can warn on scheduling clashes and send planning communications to invitee subsets. | Improve coordination without blocking legitimate event creation. | Refactor | Warning engine and organizer communication tools | Warning-only behavior tests and planning communication audit review | Candidate follow-on slice after core event lifecycle and notifications baseline. |

## Extraction Priorities

Prioritize V1 analysis in this order:

1. Security-sensitive and compliance-relevant behavior
2. Revenue, case, or transaction-critical workflows
3. Data creation, updates, deletions, and reconciliation logic
4. External integrations and scheduled processing
5. Reporting and operational support workflows
6. Low-usage or cosmetic features

## Quality Bar

- Every extracted statement must be understandable without reading V1 code.
- Every requirement should be testable and phrased in outcome terms.
- Every gap between observed behavior and intended behavior should be recorded.
- Every ambiguity should be tagged for review rather than guessed.

## Deliverables

- Trace register for all in-scope V1 capabilities
- Gap list for unclear or conflicting behavior
- Mapping from trace IDs to V2 backlog items
- Acceptance criteria and regression checks derived from trace findings

## Done Criteria

- High-risk V1 workflows are fully traced.
- Each V2 epic or feature references relevant trace IDs.
- Stakeholders have reviewed unresolved behavior changes.
- Trace artifacts are sufficient to support test planning and audit discussion.