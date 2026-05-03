# Consent-Aware Notification Delivery

## Purpose

Phase 9 notifications must travel through an outbox boundary before any email, SMS, or in-app provider is wired. This preserves idempotency, retry evidence, and member consent boundaries.

## Delivery Rules

| Rule | Requirement |
| --- | --- |
| Outbox first | Event, RSVP, standing, birthday, and celebration handlers enqueue durable outbox messages instead of calling providers directly. |
| Idempotency | Outbox IDs are deterministic for the source event and recipient scope; duplicate enqueue returns the existing message. |
| Retry | Failed delivery increments `attempts` and sets `next_retry_at` using bounded exponential backoff. |
| Retry cap | Worker retry policy is base 30 seconds, max 15 minutes, max 5 attempts; exhausted rows are dead-lettered as `failed`. |
| Cancellation | Consent revocation cancels pending messages for the affected payload reference before a worker can deliver them. |
| Audit | Delivery workers emit `notification.outbox_processed` and cancellation emits `notification.cancelled` without raw PII. |

## Consent Rules

Celebratory messages, including birthdays and public-facing celebrations, require:

- `consent='granted'`
- visibility other than `hidden`
- standing `good`
- explicit opt-in for the event type and channel
- current-year consent scope

Operational notices default to opt-out, but still exclude `review` and `blocked` standing where the message would create participation or celebration exposure.

## RSVP Producer

RSVP confirmation is the first producer integration. The RSVP route writes a deterministic `rsvp.confirmation` outbox message only after the RSVP succeeds and the same request re-checks standing, consent, and member notification preferences. Review-standing members may still be waitlisted by the event engine, but notification enqueue is skipped and `rsvp.notification_skipped` is audited.

RSVP payload references use only `event_id`, `member_id`, RSVP state, and correlation ID. Names, emails, phone numbers, event notes, and provider addresses are not persisted in the outbox row.

## Worker Lifecycle

The fake provider adapter is deterministic and exists only to verify worker behavior before real email, SMS, or in-app providers are connected. A worker batch:

1. Reads pending messages where `next_retry_at` is due.
2. Calls the provider adapter.
3. Marks success as `sent`.
4. Marks failure as pending with the next backoff time until the retry cap is reached.
5. Marks exhausted rows as `failed` and emits an outbox processed audit result of `dead_letter`.

Worker reruns ignore non-pending rows, which prevents duplicate delivery after crash/restart.

## Broadcast Preview

Admin broadcast dispatch remains deferred. The current preview endpoint evaluates a candidate audience without writing outbox rows. Inclusion requires standing `good`, granted current-year consent, non-private visibility, and explicit opt-in for `admin_broadcast` on the selected channel. `review`, `blocked`, opt-out, expired, and hidden candidates are excluded.

## Provider Boundary

Provider integrations are not part of the Phase 9 kickoff slice. Future provider adapters must accept only `payload_ref`, channel, event type, and correlation ID; they must resolve recipient details inside the protected system boundary and never store raw contact data in audit metadata.
