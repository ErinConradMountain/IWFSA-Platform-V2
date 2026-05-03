# Audit Event Catalog

## Purpose

Audit events provide operational evidence for identity, consent, import, standing, and public-representation changes. Events must be append-only and must not contain raw PII, tokens, cookies, or session IDs.

## Required Attributes

- `actor`
- `action`
- `targetType`
- `targetId`
- `timestamp`
- `correlationId`
- `redactedMetadata`
- `metadataHash`

## Event Taxonomy

| Event | Trigger | Target Type | Notes |
| --- | --- | --- | --- |
| `SESSION_CREATED` | Anonymous CSRF session created | `session` | No subject data in target ID. |
| `SESSION_ROTATED` | Login, admin elevation, standing change, reset | `session` | Metadata includes reason only. |
| `CSRF_BLOCKED` | Missing, invalid, or replayed CSRF token | `session` | Metadata includes method/path only. |
| `POLICY_DENY` | Authorization denial or missing task mapping | requested surface/task | Metadata includes reason and task. |
| `PROFILE_VISIBILITY_CHANGED` | Member profile visibility update | `member_profile` | Raw email/name redacted. |
| `IMPORT_COMMITTED` | Admin commits reviewed import batch | `import_batch` | Source PII redacted. |
| `IMPORT_PREVIEWED` | Admin creates reviewed import preview | `import_batch` | Preview is non-mutating. |
| `IMPORT_RESOLVED` | Admin resolves duplicate row | `import_batch` | Reserved for duplicate UI. |
| `IMPORT_FAILED` | Import rejected or commit fails | `import_batch` | Safe reason only. |
| `MEMBER_ONBOARDED` | Activation token consumed successfully | `member_account` | Generic responses prevent enumeration. |
| `CONSENT_VISIBILITY_CHANGED` | Member changes profile visibility/consent | `member_profile` | Display names redacted from metadata. |
| `STANDING_VISIBILITY_CHANGED` | Standing transition changes public render eligibility | `member_profile` | Emit when standing recalculation forces public visibility to private or restores approval eligibility. |
| `STANDING_CHANGED` | Admin changes member standing | `membership_status` | Raw member identifiers redacted. |
| `STANDING_DENIED` | Blocked member route access denied | `membership_status` | Emits alongside policy denial. |
| `PUBLIC_PROFILE_APPROVED` | Admin approves public render | `member_profile` | Future approval workflow event. |
| `profile.publication_requested` | Member requests public profile review | `member_profile` | Metadata schema: `actor_id`, `member_id`, `profile_version`, `previous_state`, `new_state`, `correlation_id`, `review_notes`; notes are PII-redacted. |
| `profile.publication_reviewed` | Admin records review without approval | `member_profile` | Same schema as publication request; no public render state change. |
| `profile.publication_approved` | Admin approves the profile version for publication | `member_profile` | Requires admin/chief_admin, admin surface, audit trail, member standing re-check as `good`, and durable approval record update. |
| `profile.publication_revoked` | Member or admin revokes public publication | `member_profile` | Resets effective public visibility to private/hidden and requires audit correlation plus persisted revocation timestamp. |
| `profile.honorary_published` | Chief admin completes final approval for an honorary entry | `member_profile` | Emitted only after first admin approval; metadata uses redacted notes and the final approver correlation ID. |
| `profile.memorial_published` | Chief admin completes final approval for a memorial entry | `member_profile` | Emitted only after first admin approval; metadata must avoid family/contact/private biographical PII. |
| `notification.preferences_updated` | Member updates notification channel/event preferences | `notification_preferences` | Metadata includes consent scope year and event type keys only. |
| `notification.sent` | Worker receives provider accepted/sent result | `outbox_message` | Metadata includes event type, payload reference, and provider reference only. |
| `notification.failed` | Worker delivery attempt fails and is scheduled for retry | `outbox_message` | Metadata includes event type, payload reference, and attempt count. |
| `notification.cancelled` | Pending message is cancelled after consent revocation or policy change | `outbox_message` | Metadata includes event type and payload reference only. |
| `notification.outbox_processed` | Worker processes one outbox row through a provider adapter | `outbox_message` | Metadata includes event type, payload reference, attempts, and result `sent`, `retry_scheduled`, or `dead_letter`. |
| `notification.broadcast_previewed` | Admin previews a broadcast audience without enqueueing messages | `notification_broadcast` | Metadata includes channel, target count, and excluded count only. |
| `rsvp.notification_enqueued` | RSVP confirmation outbox row is created after standing/consent check | `outbox_message` | Metadata includes event ID and RSVP state only. |
| `rsvp.notification_skipped` | RSVP succeeds but notification enqueue is blocked by policy | `outbox_message` | Metadata includes event ID and safe denial reason only. |
| `EVENT_STATE_CHANGED` | Admin publishes, closes, or archives event | `event` | Metadata includes previous and new state. |
| `RSVP_REGISTERED` | Eligible member registers within capacity | `event` | No raw member PII in metadata. |
| `WAITLIST_JOINED` | Eligible member joins full event waitlist | `event` | Metadata includes state only. |
| `WAITLIST_PROMOTED` | Cancellation promotes next waitlisted member | `event` | Member identifiers are redacted by audit filters. |
| `EVENT_ACCESS_DENIED` | RSVP or event action denied by eligibility | `event` | Generic reason only. |
| `DOCUMENT_ACCESS_GRANTED` | Eligible member receives short-lived document token | `event_document` | Raw token never appears in audit metadata. |
| `DOCUMENT_ACCESS_DENIED` | Event document eligibility or token issue fails | `event_document` | Generic denial reason only. |
| `MEMBERSHIP_CYCLE_OPENED` | Admin opens a membership year | `membership_year` | Emits with safe cycle label only. |
| `MEMBERSHIP_CYCLE_CLOSED` | Admin closes a membership year | `membership_year` | No member PII. |
| `MEMBERSHIP_GRACE_STARTED` | Grace period begins | `membership_year` | Reserved for scheduled rollover automation. |
| `STANDING_REVIEW` | Cycle opening or grace condition requires review | `membership_year` | System-generated review evidence. |
| `FEE_RECORDED` | Admin creates a fee ledger record | `fee_record` | Amount/type only. |
| `FEE_PAYMENT_APPLIED` | Admin records payment against a fee | `fee_record` | Transaction references must be non-sensitive. |
| `FEE_WAIVED` | Admin applies waiver with reason | `fee_record` | Reason must avoid raw medical/financial detail. |
| `FEE_BALANCE_ADJUSTED` | Admin adjusts balance | `fee_record` | Reserved for controlled correction workflow. |
| `STANDING_CHANGED` | Fee, waiver, cycle, or manual decision changes standing | `membership_status` | Metadata includes previous/new standing and reason; session counts only. |

## Retention And Access

Audit events are retained as institutional evidence. Admin read views arrive later, but writes start now. Audit records must be queryable by correlation ID for incident triage.
