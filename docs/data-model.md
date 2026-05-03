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

Stores async follow-up work from committed imports.

- `id`: deterministic message ID.
- `event_type`: currently `activation_invite`.
- `payload_ref`: redacted or non-sensitive reference.
- `state`: `pending`, `sent`, or `failed`.
- `created_at`: enqueue timestamp.

Invariant: import commit does not block on delivery.

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
