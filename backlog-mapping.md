# Backlog Mapping

This document converts the seeded V1 trace register into a practical V2 delivery backlog.

It is intentionally planning-focused: no application code, package decisions, or implementation scaffolding are introduced here. The purpose is to turn trace evidence into backlog-ready work that product, engineering, security, and operations can sequence and own.

## How To Use This Document

- Treat each trace ID as the evidence anchor for the corresponding V2 backlog item.
- Use the proposed epic and module labels to group delivery work into a manageable roadmap.
- Use the suggested first implementation slice to define the smallest end-to-end increment that proves the trace without prematurely widening scope.
- Treat the privacy, RBAC, and audit concerns as mandatory design constraints, not optional hardening tasks.

## Backlog Summary

| Trace ID | Proposed V2 epic | Affected module | Priority | Owner role | Suggested first implementation slice |
| --- | --- | --- | --- | --- | --- |
| TRC-001 | Epic 1: Identity and Unified Sign-In | Auth and Access | Critical | Engineering Lead with Security Lead | Unified sign-in entry plus role-based route resolution for member and admin roles |
| TRC-002 | Epic 1: Identity and Unified Sign-In | Auth and Access | Critical | Security Lead with Product Owner | Server-enforced route guard matrix for public, member, and admin surfaces |
| TRC-003 | Epic 2: Member Import and Membership Operations | Member Import Workspace | Critical | Product Owner with Admin Operations Lead | Upload, column mapping, validation summary, and dry-run reconciliation report |
| TRC-004 | Epic 2: Member Import and Membership Operations | Identity Lifecycle | High | Security Lead with Engineering Lead | Single-use invitation token flow for first-time activation |
| TRC-005 | Epic 3: Membership Standing and Directory Eligibility | Membership Governance | Critical | Admin Operations Lead with Product Owner | Standing rule enforcement on sign-in and directory visibility |
| TRC-006 | Epic 4: Member Profiles and Controlled Directory | Member Directory and Profiles | High | Product Owner with Engineering Lead | Read-only member directory plus member self-service profile edit for approved fields |
| TRC-007 | Epic 5: Event Lifecycle and Participation | Event Hub | Critical | Product Owner with Engineering Lead | Event creation, publish, audience restriction, registration, and cancellation flow |
| TRC-007A | Epic 5: Event Lifecycle and Participation | Event Hub Authoring | Critical | Product Owner with Engineering Lead | Single-event create and edit flow with required field validation |
| TRC-007B | Epic 5: Event Lifecycle and Participation | Event Publishing and Delegation | Critical | Product Owner with Security Lead | Draft-to-published transition plus event-scoped editor assignment |
| TRC-007C | Epic 5: Event Lifecycle and Participation | Event Discovery and Audience Controls | Critical | Product Owner with Security Lead | Audience-filtered member event listing with denied access for ineligible users |
| TRC-007D | Epic 5: Event Lifecycle and Participation | Registration and Waitlist | Critical | Engineering Lead with Product Owner | Member registration, cancellation, and waitlist promotion on a single event |
| TRC-007E | Epic 5: Event Lifecycle and Participation | Recurrence | Medium | Engineering Lead with Product Owner | Recurring series creation with one instance override |
| TRC-007F | Epic 5: Event Lifecycle and Participation | Planning Communications | Medium | Operations Lead with Product Owner | Warning-only clash check and one scoped planning message to invitees |
| TRC-008 | Epic 5: Event Lifecycle and Participation | Event Documents | High | Engineering Lead with Operations Lead | Member-only event document access with eligibility and release-state rules |
| TRC-009 | Epic 6: Notifications and Delivery Monitoring | Notifications and Delivery Report | High | Engineering Lead with Operations Lead | Triggered notification pipeline with member-centric delivery status view |
| TRC-010 | Epic 7: Audit, Supportability, and Recovery | Audit and Support Console | Critical | Operations Lead with Security Lead | Audit event capture for privileged actions and a support-visible event timeline |

## Trace-To-Backlog Detail

### TRC-001

- Proposed V2 epic: Epic 1: Identity and Unified Sign-In
- Affected module: Auth and Access
- Priority: Critical
- Owner role: Engineering Lead with Security Lead
- Acceptance criteria:
  - A user can authenticate through one entry point without selecting a separate application surface first.
  - After successful authentication, the platform routes the user to the correct workspace based on active role assignment.
  - If a user has no eligible role, access is denied with a controlled message and no protected data is exposed.
  - Session establishment and renewal behavior is defined for both member and administrative roles.
- Privacy/RBAC/audit concern: Credential handling must avoid disclosure, role resolution must be server-enforced, and authentication success or failure events must be captured in the audit stream.
- Suggested first implementation slice: Deliver a single sign-in endpoint with role-based routing for `member`, `admin`, and `chief_admin`, backed by a minimal session model.

### TRC-002

- Proposed V2 epic: Epic 1: Identity and Unified Sign-In
- Affected module: Auth and Access
- Priority: Critical
- Owner role: Security Lead with Product Owner
- Acceptance criteria:
  - Public routes remain accessible without authentication and do not disclose member-only or admin-only data.
  - Member routes require an authenticated eligible member session.
  - Admin routes require an authenticated privileged role and reject member-only sessions.
  - Route protection is enforced on the server even if a user bypasses client navigation controls.
- Privacy/RBAC/audit concern: Broken access control is a top risk here; the design must enforce least privilege, prevent cross-surface leakage, and log denied privileged access attempts.
- Suggested first implementation slice: Define and implement the route-guard matrix for `public`, `member`, and `admin` surfaces, then prove it with access-control scenarios.

### TRC-003

- Proposed V2 epic: Epic 2: Member Import and Membership Operations
- Affected module: Member Import Workspace
- Priority: Critical
- Owner role: Product Owner with Admin Operations Lead
- Acceptance criteria:
  - An administrator can upload an Excel file and map source columns to required V2 member fields.
  - The system validates required fields, detects duplicate records, and distinguishes creates from updates before commit.
  - A dry-run mode produces created, updated, skipped, and failed counts with record-level reasons.
  - The import result can be reviewed before any live member state changes are applied.
- Privacy/RBAC/audit concern: Import data contains personal member information, so upload access must be limited to authorized admins, validation errors must not leak unnecessary personal data, and import actions must be auditable.
- Suggested first implementation slice: Build the dry-run upload flow with mapping, validation, and reconciliation output before allowing a commit path.

### TRC-004

- Proposed V2 epic: Epic 2: Member Import and Membership Operations
- Affected module: Identity Lifecycle
- Priority: High
- Owner role: Security Lead with Engineering Lead
- Acceptance criteria:
  - An administrator can trigger an invitation for an eligible imported member without seeing the member's eventual password.
  - Activation links are single-use, time-bounded, and invalid after successful completion or expiry.
  - A member can complete first-time activation and set a new password through a controlled workflow.
  - A reset flow can issue a separate secure recovery link without exposing secret material to administrators.
- Privacy/RBAC/audit concern: Token replay, credential leakage, and admin overreach must be prevented; invitation and reset issuance should be logged without storing secrets in retrievable form.
- Suggested first implementation slice: Implement first-time activation tokens and completion flow before adding bulk invitation and reset variants.

### TRC-005

- Proposed V2 epic: Epic 3: Membership Standing and Directory Eligibility
- Affected module: Membership Governance
- Priority: Critical
- Owner role: Admin Operations Lead with Product Owner
- Acceptance criteria:
  - Only members marked active and in good standing can enter protected member routes.
  - Members who lose good standing immediately lose directory visibility and member-portal eligibility.
  - Administrative changes to standing take effect without requiring manual database intervention.
  - Standing rules are defined in one place and applied consistently across sign-in, directory, and event eligibility checks.
- Privacy/RBAC/audit concern: Eligibility decisions directly affect personal visibility and access rights, so rule changes must be RBAC-controlled and fully auditable.
- Suggested first implementation slice: Enforce standing checks at sign-in and directory read time before wiring the full membership-fee workflow.

### TRC-006

- Proposed V2 epic: Epic 4: Member Profiles and Controlled Directory
- Affected module: Member Directory and Profiles
- Priority: High
- Owner role: Product Owner with Engineering Lead
- Acceptance criteria:
  - Eligible members can view a directory of active members in good standing only.
  - Members can edit only approved self-service profile fields such as biography, contact details, links, and profile image metadata.
  - Administrative users can review and correct member profile information when governance or data quality requires it.
  - Profile visibility respects consent and excludes data that has not been approved for member-facing display.
- Privacy/RBAC/audit concern: This slice handles personal profile data and media, so consent boundaries, field-level edit permissions, and auditability of admin overrides are required.
- Suggested first implementation slice: Release a read-only directory plus limited self-service edits for a narrow set of approved profile fields.

### TRC-007

- Proposed V2 epic: Epic 5: Event Lifecycle and Participation
- Affected module: Event Hub
- Priority: Critical
- Owner role: Product Owner with Engineering Lead
- Acceptance criteria:
  - Authorized users can create and publish an event with audience, schedule, capacity, and registration rules.
  - Eligible members can register and cancel, and capacity or waitlist state updates immediately.
  - Restricted-audience events are visible only to eligible members and editors.
  - Delegated event editors can manage only the events within their granted scope.
- Privacy/RBAC/audit concern: Event audience restrictions and delegated editing are RBAC-sensitive; event creation, publishing, and scope changes must be attributable in the audit log.
- Suggested first implementation slice: Deliver the single-event create, publish, register, and cancel flow before recurrence, planning communications, and bulk actions.

Event domain decomposition for implementation:

- `TRC-007A`: Event authoring and field validation.
- `TRC-007B`: Publishing workflow and event-scoped delegation.
- `TRC-007C`: Audience restriction and member discovery.
- `TRC-007D`: Registration, capacity, and waitlist transitions.
- `TRC-007E`: Recurring series and instance overrides.
- `TRC-007F`: Planning communications and clash warnings.

### TRC-007A

- Proposed V2 epic: Epic 5: Event Lifecycle and Participation
- Affected module: Event Hub Authoring
- Priority: Critical
- Owner role: Product Owner with Engineering Lead
- Acceptance criteria:
  - Authorized users can create an event with the required core fields and a valid lifecycle status.
  - Invalid or incomplete event data is rejected with usable validation feedback.
  - Users with edit rights can update draft event details without affecting unrelated events.
  - Event list and detail views reflect the saved state consistently.
- Privacy/RBAC/audit concern: Authoring rights must be limited to authorized roles and create or edit actions should generate an attributable event history.
- Suggested first implementation slice: Single-event create and edit flow for admins before broader collaboration or recurring behavior.

### TRC-007B

- Proposed V2 epic: Epic 5: Event Lifecycle and Participation
- Affected module: Event Publishing and Delegation
- Priority: Critical
- Owner role: Product Owner with Security Lead
- Acceptance criteria:
  - An authorized creator can move an event from draft to published state.
  - Event-scoped editors can be assigned only to the event in question.
  - Delegated editors can edit assigned events but cannot manage unrelated events.
  - Publish and delegation actions are recorded in the audit trail.
- Privacy/RBAC/audit concern: Event-scoped delegation is a high-risk access-control boundary and requires explicit RBAC checks plus auditable scope changes.
- Suggested first implementation slice: Publish transition and one delegated-editor assignment on a single event.

### TRC-007C

- Proposed V2 epic: Epic 5: Event Lifecycle and Participation
- Affected module: Event Discovery and Audience Controls
- Priority: Critical
- Owner role: Product Owner with Security Lead
- Acceptance criteria:
  - Members see only events for audiences they are eligible to access.
  - Restricted events do not leak metadata to ineligible users through list, detail, or search views.
  - Audience changes update event visibility consistently.
  - Member event navigation remains understandable when access is denied or removed.
- Privacy/RBAC/audit concern: Audience controls protect internal group activity, so the platform must prevent metadata leakage and record privileged audience changes.
- Suggested first implementation slice: Audience-filtered list and detail access checks for one restricted and one unrestricted event.

### TRC-007D

- Proposed V2 epic: Epic 5: Event Lifecycle and Participation
- Affected module: Registration and Waitlist
- Priority: Critical
- Owner role: Engineering Lead with Product Owner
- Acceptance criteria:
  - Eligible members can register for an event until capacity is reached or registration closes.
  - Registration cancellation frees capacity immediately and updates visible availability.
  - Full events place later eligible registrants onto a waitlist in a deterministic order.
  - Waitlist promotion follows defined rules when capacity becomes available.
- Privacy/RBAC/audit concern: Registration status is personal participation data and should only be visible to eligible members and authorized admins; status changes should be auditable.
- Suggested first implementation slice: One event with capacity, registration, cancellation, and first-in waitlist promotion behavior.

### TRC-007E

- Proposed V2 epic: Epic 5: Event Lifecycle and Participation
- Affected module: Recurrence
- Priority: Medium
- Owner role: Engineering Lead with Product Owner
- Acceptance criteria:
  - Authorized users can create a recurring series from a base event definition.
  - A single instance can override selected details without mutating the whole series.
  - Members see the correct instance-specific information where overrides exist.
  - Series and instance edits remain distinguishable in the admin workflow.
- Privacy/RBAC/audit concern: Recurrence changes can affect many future events, so bulk-impact edits must be role-controlled and clearly auditable.
- Suggested first implementation slice: Weekly series creation with one overridden instance title or date.

### TRC-007F

- Proposed V2 epic: Epic 5: Event Lifecycle and Participation
- Affected module: Planning Communications
- Priority: Medium
- Owner role: Operations Lead with Product Owner
- Acceptance criteria:
  - Organizers receive a warning, not a hard stop, when a new event overlaps relevant audience and time windows.
  - Organizers can send a planning message to a defined invitee subset.
  - Recipients and delivery intent are captured for support review.
  - Warning behavior does not block legitimate event publishing.
- Privacy/RBAC/audit concern: Planning communications expose attendance and invitee context, so recipient scope must be controlled and all organizer actions should be attributable.
- Suggested first implementation slice: Warning-only clash check plus one organizer message to confirmed invitees.

### TRC-008

- Proposed V2 epic: Epic 5: Event Lifecycle and Participation
- Affected module: Event Documents
- Priority: High
- Owner role: Engineering Lead with Operations Lead
- Acceptance criteria:
  - Authorized event owners can attach agenda or minutes documents to an event.
  - Only members eligible for the event can view or download attached documents.
  - Document availability can be configured for immediate or post-event release.
  - Document access respects both event audience scope and release-state rules.
- Privacy/RBAC/audit concern: Event materials may contain sensitive internal content, so document access must be tightly scoped, access decisions must be enforceable server-side, and administrative document changes should be auditable.
- Suggested first implementation slice: Support one document type on one event with member eligibility checks before expanding to richer document workflows.

### TRC-009

- Proposed V2 epic: Epic 6: Notifications and Delivery Monitoring
- Affected module: Notifications and Delivery Report
- Priority: High
- Owner role: Engineering Lead with Operations Lead
- Acceptance criteria:
  - Event and membership actions can trigger notification jobs without blocking the initiating workflow.
  - Delivery states progress through a defined lifecycle that support staff can understand without reading raw logs.
  - The admin delivery view defaults to member-centric fields and hides low-level diagnostic noise.
  - Failed deliveries can be identified and triaged using operationally meaningful status information.
- Privacy/RBAC/audit concern: Notification payloads may contain personal contact data, so channel use and status views must be access-controlled, and delivery actions should be auditable without overexposing message content.
- Suggested first implementation slice: Implement one trigger path, one outbound channel, and one admin delivery report for operational visibility.

### TRC-010

- Proposed V2 epic: Epic 7: Audit, Supportability, and Recovery
- Affected module: Audit and Support Console
- Priority: Critical
- Owner role: Operations Lead with Security Lead
- Acceptance criteria:
  - Sensitive administrative and event-governance actions create immutable audit events with actor, action, target, and timestamp.
  - Support staff can inspect a coherent event timeline for a member or workflow without querying the database directly.
  - The platform distinguishes between business events, support diagnostics, and security-relevant audit entries.
  - Recovery or remediation actions can be recorded and linked to the original operational event.
- Privacy/RBAC/audit concern: Audit data must itself be protected, access to support views must be role-limited, and privileged changes must be attributable and tamper-resistant.
- Suggested first implementation slice: Capture audit events for privileged membership and event actions, then expose a minimal support timeline view.

## Priority Guidance

- `Critical`: Required to establish safe platform boundaries or core business operability.
- `High`: Required soon after the critical path, but can follow the first boundary-setting slices.

## Suggested Epic Order

1. Epic 1: Identity and Unified Sign-In
2. Epic 2: Member Import and Membership Operations
3. Epic 3: Membership Standing and Directory Eligibility
4. Epic 4: Member Profiles and Controlled Directory
5. Epic 5: Event Lifecycle and Participation
6. Epic 6: Notifications and Delivery Monitoring
7. Epic 7: Audit, Supportability, and Recovery

This order follows the dependency structure already captured in `migration-strategy.md`: identity first, member operations second, trusted member experience third, event participation fourth, and operational visibility before broader rollout.