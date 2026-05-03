# Consent State Machine

## Purpose

Member profile visibility is member-controlled and consent-gated. Public visibility is never the default.

## States

Visibility:

- `hidden`
- `member_only`
- `public`

Consent:

- `missing`
- `granted`
- `revoked`
- `not_required`

## Transitions

| Transition | Rule | Audit |
| --- | --- | --- |
| `hidden -> member_only` | Member-capable role and policy approval | `CONSENT_VISIBILITY_CHANGED` |
| `member_only -> public` | `consent=granted` and `approved_for_public=true` | `CONSENT_VISIBILITY_CHANGED` |
| `public -> member_only/hidden` | Member may reduce visibility | `CONSENT_VISIBILITY_CHANGED` |

## Public Preview

Public preview returns exactly the fields that the public surface may render. If consent or approval is missing, preview returns an empty object.

## Dignity Rule

Microcopy must explain who can see a field and how the member can change it later.

## Notification Consent

Notification consent is event-type, channel, and year scoped. RSVP confirmations require granted consent at enqueue time. Broadcast and celebratory delivery require explicit current-year opt-in, and consent revocation cancels pending outbox rows before worker delivery.
