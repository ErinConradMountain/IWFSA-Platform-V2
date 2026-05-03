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
