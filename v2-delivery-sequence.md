# V2 Delivery Sequence

This document converts the trace-backed backlog into a practical delivery sequence for the V2 rebuild.

It is intentionally implementation-aware but still planning-first: each wave is defined by the smallest end-to-end slice that proves business value, security boundaries, and operability before the next layer is added.

## Sequencing Principles

- Establish identity and access boundaries before protected business features.
- Land member-operability slices before member-experience richness.
- Deliver the single-event lifecycle before recurrence or organizer convenience features.
- Introduce operational visibility before expanding breadth of workflow automation.
- Keep every wave demonstrable with trace-linked acceptance outcomes.

## Delivery Waves

| Wave | Goal | Primary trace coverage | Why this wave exists first | Exit evidence |
| --- | --- | --- | --- | --- |
| Wave 0 | Working platform skeleton | TRC-001, TRC-002 support only | Creates the runnable repo, web/API split, and shared configuration boundary needed for all later work. | App starts locally, health routes respond, route shells exist |
| Wave 1 | Identity and access boundary | TRC-001, TRC-002 | Every protected slice depends on trustworthy authentication and authorization. | Unified sign-in route, role routing, and protected route checks validated |
| Wave 2 | Member intake and activation | TRC-003, TRC-004 | Member operations must exist before directory eligibility and event participation can be trusted. | Dry-run import, activation token flow, and reset pathway proven |
| Wave 3 | Membership governance | TRC-005 | Standing and eligibility rules control who can use the member surface and what they can see. | Standing enforcement works across sign-in and member visibility decisions |
| Wave 4 | Member directory baseline | TRC-006 | The trusted member experience can now be exposed safely. | Read-only directory and limited self-service profile updates validated |
| Wave 5 | Core event lifecycle | TRC-007A, TRC-007B, TRC-007C, TRC-007D | This is the core member value stream and should arrive before convenience enhancements. | Single-event authoring, publishing, discovery, registration, and waitlist behavior proven |
| Wave 6 | Event governance extensions | TRC-008, TRC-007E, TRC-007F | Documents, recurrence, and organizer coordination should follow only after the base event model is stable. | Document eligibility rules, one recurring series, and warning-only clash behavior validated |
| Wave 7 | Notification and support operations | TRC-009, TRC-010 | Operational visibility must exist before broader rollout or higher-volume usage. | Notification status reporting and audit timeline views validated |

## Wave Detail

### Wave 0: Working Platform Skeleton

- Scope:
  - Repository scripts and runtime entry points.
  - `apps/web`, `apps/api`, and `apps/common` boundaries.
  - Health routes and placeholder public/member/admin shells.
- Preconditions:
  - Architecture decisions accepted for runtime, repository layout, and delivery style.
- Exit criteria:
  - Local start commands run without external dependencies.
  - Web and API surfaces are reachable and distinguish public vs protected placeholders.
  - Shared environment loading and config conventions exist.

### Wave 1: Identity and Access Boundary

- Scope:
  - Unified sign-in entry.
  - Role-based routing.
  - Protected member and admin route checks.
- Included traces:
  - `TRC-001`
  - `TRC-002`
- Exit criteria:
  - Public routes remain open.
  - Member and admin routes enforce server-side access boundaries.
  - Authentication and denied-access events are observable.

### Wave 2: Member Intake and Activation

- Scope:
  - Dry-run member import.
  - First-time activation tokens.
  - Credential reset path.
- Included traces:
  - `TRC-003`
  - `TRC-004`
- Exit criteria:
  - Import validates without committing member mutations.
  - Activation links are single-use and expiring.
  - Reset path is private to the member and not reversible by admins.

### Wave 3: Membership Governance

- Scope:
  - Active and good-standing rule model.
  - Eligibility enforcement for protected member access.
  - Directory and event-read gating hooks.
- Included traces:
  - `TRC-005`
- Exit criteria:
  - Standing rules are applied consistently at sign-in and read boundaries.
  - Admin standing changes take effect without ad hoc data fixes.

### Wave 4: Member Directory Baseline

- Scope:
  - Read-only member directory.
  - Limited self-service profile editing.
  - Consent-aware display rules.
- Included traces:
  - `TRC-006`
- Exit criteria:
  - Only eligible members appear.
  - Editable profile fields are narrowly defined and permissioned.
  - Member-visible data respects consent and review states.

### Wave 5: Core Event Lifecycle

- Scope:
  - Event authoring.
  - Draft-to-published workflow.
  - Event-scoped delegation.
  - Audience restriction and discovery.
  - Registration, capacity, and waitlist.
- Included traces:
  - `TRC-007A`
  - `TRC-007B`
  - `TRC-007C`
  - `TRC-007D`
- Exit criteria:
  - Admins or delegated editors can create and publish one event.
  - Eligible members can discover, register, and cancel.
  - Ineligible members cannot see or access restricted events.
  - Capacity and waitlist state remains coherent.

### Wave 6: Event Governance Extensions

- Scope:
  - Event documents.
  - Recurring series and per-instance overrides.
  - Warning-only clash checks and organizer planning communications.
- Included traces:
  - `TRC-008`
  - `TRC-007E`
  - `TRC-007F`
- Exit criteria:
  - Event document access matches event eligibility and release timing.
  - One recurring series supports one overridden instance.
  - Clash detection warns without blocking publication.

### Wave 7: Notification and Support Operations

- Scope:
  - Notification job triggering.
  - Delivery status reporting.
  - Audit event timeline and support visibility.
- Included traces:
  - `TRC-009`
  - `TRC-010`
- Exit criteria:
  - One notification trigger path is visible end-to-end.
  - Admin delivery monitoring is member-centric.
  - Sensitive admin and event-governance actions appear in an audit timeline.

## Dependency Rules

- Wave 1 must finish before any protected business workflow leaves placeholder state.
- Wave 2 must finish before real member directory or event participation data is exposed.
- Wave 3 must finish before the directory or event discovery surfaces are treated as trustworthy.
- Wave 5 should not include recurrence or planning communications in its initial release.
- Wave 7 should complete before production-facing rollout broadens beyond controlled users.

## Out Of Sequence Risks To Avoid

- Building event registration before member standing creates eligibility ambiguity.
- Adding recurrence before single-event stability multiplies correction cost.
- Adding notification breadth before support visibility increases operational noise.
- Adding document workflows before RBAC boundaries are proven risks internal content exposure.

## Recommended Review Cadence

- End of each wave: trace review, acceptance review, and security/operability checkpoint.
- End of Waves 1, 3, 5, and 7: explicit go/no-go checkpoint before wider scope expansion.
