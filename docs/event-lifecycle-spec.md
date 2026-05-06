# Event Lifecycle Spec

## Purpose

Phase 6 makes participation a governed transaction. Events, RSVP decisions, waitlist movement, and document access are policy-checked, audit-emitted, and correlation-aware.

## State Transitions

- `draft -> published`: admin-only and audit-required.
- `published -> closed`: admin-only; new RSVPs are blocked after closure.
- `closed -> archived`: preserves event memory after participation ends.
- `draft|published -> archived`: allowed for withdrawal or retirement.

Invalid reverse transitions are rejected and must not mutate state.

## Capacity Rules

- `registered_count` must never exceed `max_capacity`.
- RSVP is idempotent per `event_id + member_id`.
- If capacity is available, the member receives `registered`.
- If capacity is full, the member receives `waitlisted` with deterministic ascending `waitlist_position`.
- Cancellation promotes the earliest eligible waitlisted member and enqueues a `waitlist_promoted` outbox message.
- RSVP confirmation notifications are enqueued only after RSVP succeeds and notification policy re-validates standing, consent, and preferences.

## Audience Targeting

Eligibility requires:

- standing is not `blocked`;
- consent is `granted`;
- the event audience allows the member by `all`, active standing, group, or role.

Denied access returns a generic RFC 9457-style `403` and emits `EVENT_ACCESS_DENIED` without revealing hidden event data.

Review-standing members may be waitlisted by RSVP policy, but RSVP confirmation enqueue is skipped and audited with `rsvp.notification_skipped`.

## Secure Document Boundary

Document access is issued only after event eligibility passes. Tokens are high-entropy, hashed for storage, expire after a short TTL, and are single use. Denied, expired, or invalid attempts are audited with safe metadata only.

## UX Contract

Member route flow is: discover eligible event -> decide -> RSVP or waitlist -> confirmation. Each view has one primary action and uses event state tokens for `published`, `capacity_full`, `waitlisted`, and `eligible`.
