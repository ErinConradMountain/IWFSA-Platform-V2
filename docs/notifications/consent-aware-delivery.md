# Consent-Aware Notification Delivery

## Purpose

Phase 9 notifications must travel through an outbox boundary before any email, SMS, or in-app provider is wired. This preserves idempotency, retry evidence, and member consent boundaries.

## Delivery Rules

| Rule | Requirement |
| --- | --- |
| Outbox first | Event, RSVP, standing, birthday, and celebration handlers enqueue durable outbox messages instead of calling providers directly. |
| Idempotency | Outbox IDs are deterministic for the source event and recipient scope; duplicate enqueue returns the existing message. |
| Retry | Failed delivery increments `attempts` and sets `next_retry_at` using bounded exponential backoff. |
| Cancellation | Consent revocation cancels pending messages for the affected payload reference before a worker can deliver them. |
| Audit | Delivery workers emit `notification.sent`, `notification.failed`, and `notification.cancelled` without raw PII. |

## Consent Rules

Celebratory messages, including birthdays and public-facing celebrations, require:

- `consent='granted'`
- visibility other than `hidden`
- standing `good`
- explicit opt-in for the event type and channel
- current-year consent scope

Operational notices default to opt-out, but still exclude `review` and `blocked` standing where the message would create participation or celebration exposure.

## Provider Boundary

Provider integrations are not part of the Phase 9 kickoff slice. Future provider adapters must accept only `payload_ref`, channel, event type, and correlation ID; they must resolve recipient details inside the protected system boundary and never store raw contact data in audit metadata.
