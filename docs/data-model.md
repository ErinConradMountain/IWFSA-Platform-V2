# Data Model

## Purpose

This document defines the Phase 4 canonical persistence entities and invariants. PostgreSQL is the production target; in-memory adapters exist only for local/test parity.

## Entities

### `member_account`

Stores authentication/account lifecycle state.

- `id`: opaque member account identifier.
- `email_hash`: hashed email, never raw email.
- `auth_state`: `pending_activation`, `active`, or `locked`.
- `created_at`, `updated_at`: lifecycle timestamps.

Invariant: raw email is not stored in this Phase 4 account contract.

### `member_profile`

Stores profile content and visibility state.

- `member_id`: foreign key to `member_account`.
- `display_name`: display value.
- `biography`: profile biography.
- `visibility`: `hidden`, `member_only`, or `public`.
- `consent`: `granted`, `missing`, `revoked`, or `not_required`.
- `approved_for_public`: admin approval flag.
- `updated_at`: change timestamp.

Invariant: public reads require `visibility='public'`, `consent='granted'`, latest standing `good`, and `approved_for_public=true`.

Public-safe profile repository projections may select only display name, biography, and public freshness metadata needed for the rendered page. They must not use `SELECT *` or return member account IDs, raw contact fields, audit metadata, standing history details, or internal workflow state.

### `membership_status`

Append-only standing history.

- `member_id`: foreign key to `member_account`.
- `standing`: `active`, `good`, `grace`, `outstanding`, or `blocked`.
- `effective_at`: effective timestamp.
- `issuer`: actor issuing the standing update.

Invariant: standing changes append rows; current standing is derived by latest effective timestamp.

### `membership_year`

Stores governed membership cycles.

- `id`, `label`: cycle identity.
- `start_date`, `end_date`: inclusive membership period.
- `grace_period_days`: review window before overdue balances block access.
- `status`: `open` or `closed`.

Invariant: open membership years cannot overlap.

### `fee_record`

Stores ledger entries for dues, waivers, and event-related fees.

- `member_id`: linked member account.
- `membership_year_id`: linked membership year.
- `type`: `dues`, `waiver`, or `event_fee`.
- `amount_cents`, `amount_paid_cents`: integer currency values.
- `status`: `pending`, `partial`, `paid`, or `waived`.
- `transaction_ref`: optional non-sensitive payment reference.
- `waiver_reason`: mandatory for waivers.
- `recorded_at`: evidence timestamp.

Invariant: waived records cannot receive payment; partial payments accumulate until paid.

### `standing_history`

Stores append-only standing decisions.

- `member_id`: linked member.
- `standing`: `good`, `review`, `blocked`, or compatibility standing.
- `reason`: deterministic standing reason.
- `effective_from`: timestamp when the decision took effect.
- `actor_id`: admin or system actor.

Invariant: standing changes append rows and rotate active sessions for the member subject.

### `activation_token`

Stores hashed activation/reset token records.

- `token_hash`: hashed token.
- `member_id`: foreign key to `member_account`.
- `purpose`: `activation` or `reset`.
- `expires_at`: expiry timestamp.
- `used_at`: single-use marker.

Invariant: raw tokens are never stored.

### `import_batch`

Stores import preview/commit state.

- `id`: deterministic batch ID.
- `source_checksum`: source-file checksum.
- `state`: `preview`, `committed`, or `failed`.
- `row_count`: number of canonical rows.
- `created_at`, `committed_at`: lifecycle timestamps.

Invariant: preview is non-mutating; commit is idempotent by batch ID.

### `import_batch_row`

Stores canonical preview rows before live member mutation.

- `batch_id`: foreign key to `import_batch`.
- `row_number`: source row order.
- `source_key`: source-system identifier where available.
- `verified_email_hash`: hashed verified email, never raw email.
- `display_name`: preview display value.
- `action`: `create`, `update`, `skip`, or `fail`.
- `issues`: validation issue list.
- `raw_snapshot_hash`: hash of the raw row snapshot.

Invariant: preview rows do not mutate `member_account` or `member_profile`.

### `outbox_message`

Stores async follow-up work from committed imports and notification delivery jobs.

- `id`: deterministic message ID.
- `event_type`: activation, birthday, RSVP, standing, celebration, or operational notification type.
- `channel`: `email`, `in_app`, or `sms` delivery target selected at enqueue time.
- `payload_ref`: redacted or non-sensitive reference.
- `state`: `pending`, `sent`, `failed`, or `cancelled`.
- `attempts`: delivery attempt count.
- `next_retry_at`: next eligible delivery attempt timestamp.
- `correlation_id`: source request or job correlation.
- `created_at`: enqueue timestamp.

Invariant: source handlers do not block on provider delivery; duplicate deterministic IDs do not create duplicate delivery; worker routing reads the persisted channel and must not silently default to another transport.

### `notification_preferences`

Stores member notification consent and channel settings.

- `member_id`: member account identifier.
- `consent_scope_year`: year for which preferences are valid.
- `preferences_json`: event-type/channel map with booleans only.
- `updated_at`: evidence timestamp.

Invariant: celebratory notifications require current-year consent, explicit opt-in, non-private visibility, and eligible standing.

### `event`

Stores governed event lifecycle state.

- `id`: opaque event identifier.
- `title`: event display title.
- `status`: `draft`, `published`, `closed`, or `archived`.
- `max_capacity`, `registered_count`, `waitlist_count`: capacity controls.
- `audience_rules`: JSON policy input for role, group, or standing targeting.
- `version`: concurrency marker for adapter implementations.

Invariant: only `published` events can receive RSVPs; capacity cannot exceed `max_capacity`.

### `rsvp_record`

Stores member participation state per event.

- `event_id`, `member_id`: composite key.
- `state`: `registered`, `waitlisted`, or `cancelled`.
- `waitlist_position`: deterministic FIFO order for waitlisted members.
- `created_at`: request timestamp.

Invariant: RSVP is idempotent per event/member pair and waitlist promotion preserves position order.

### `document_access`

Stores event document access token evidence.

- `token_hash`: hashed single-use token.
- `event_id`, `member_id`: access scope.
- `expires_at`: short TTL.
- `used_at`: single-use marker.

Invariant: raw document tokens and storage paths are never stored in public/member payloads.

### `audit_event`

Append-only evidence stream.

- `action`, `actor`, `target_type`, `target_id`
- `timestamp`, `correlation_id`
- `redacted_metadata`
- `metadata_hash`

Invariant: audit events are insert-only; update/delete are blocked by migration rules.

### `public_approval_record`

Stores durable public profile publication review state.

- `id`: opaque approval record identifier.
- `profile_id`: profile under review.
- `member_id`: member represented by the profile.
- `profile_version`: immutable profile version reviewed by the curator.
- `requested_at`: request timestamp.
- `reviewed_by`: admin or chief admin actor that reviewed the request.
- `status`: `pending_review`, `approved`, `published`, or `revoked`.
- `review_notes_sanitized`: markup-stripped, length-limited, PII-redacted review note.
- `approved_at`, `revoked_at`: lifecycle timestamps.
- `content_type`: `profile`, `honorary`, or `memorial`.
- `requires_dual_approval`: true when honorary or memorial content requires chief admin final approval.
- `final_approved_by`, `final_approved_at`: chief admin final approval evidence for dual-approval records.
- `correlation_id`: request/audit correlation.

Invariant: review notes are sanitized before persistence; pending requests cannot be revoked without first creating accountable approval/review context; honorary and memorial records cannot publish until final chief admin approval is recorded.

## Phase 5 State Transitions

- Import batch: `preview -> committed` or `preview -> failed`.
- Activation token: `issued -> consumed`; replay returns the same generic response without a second onboarding event.
- Visibility: `hidden/private -> member_only -> public`; public requires `consent=granted` and `approved_for_public=true`.
- Standing: `blocked` denies member route access and emits `STANDING_DENIED`.

## Phase 6 State Transitions

- Event: `draft -> published -> closed -> archived`; reverse transitions are rejected.
- RSVP: `registered`, `waitlisted`, or `cancelled`; duplicate RSVP returns existing active state.
- Waitlist: cancellation promotes the lowest `waitlist_position` and emits `WAITLIST_PROMOTED`.
- Document access: `issued -> consumed`; expired or replayed tokens are rejected.

## Phase 7 State Transitions

- Membership year: `open -> closed`; overlapping open years are rejected.
- Fee record: `pending -> partial -> paid`; `pending|partial -> waived`.
- Standing: `good`, `review`, or `blocked` based on cycle, balance, grace period, and manual block.
- Session propagation: standing change rotates subject sessions immediately.

## Phase 8 State Transitions

- Public approval: `pending_review -> approved -> published`; `approved|published -> revoked`.
- Honorary/memorial approval: `pending_review -> approved -> published` requires first admin approval and final chief admin approval.
- Public profile delivery: public reads use repository-level standing, visibility, consent, and approval predicates plus public-safe projection.

## Phase 9 State Transitions

- Notification outbox: `pending -> sent`; failed delivery remains `pending` with incremented attempts and future `next_retry_at`; consent revocation changes pending messages to `cancelled`.
- Notification preferences: current-year member preference updates replace the event/channel map and emit `notification.preferences_updated`.
- Notification routing: producer-selected `channel` is persisted on enqueue and becomes the single worker routing source for provider selection.
