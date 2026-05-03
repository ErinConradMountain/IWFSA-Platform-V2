# Membership Standing Spec

## Purpose

Phase 7 turns fees and standing into governed platform controls. Membership cycles, fee updates, waivers, and standing changes must be typed, audit-emitted, and reflected in access decisions without exposing financial detail to public or member surfaces.

## Membership Cycles

- A `membership_year` has a start date, end date, status, and grace period.
- Open years cannot overlap.
- Opening a cycle emits `MEMBERSHIP_CYCLE_OPENED` and `STANDING_REVIEW`.
- Closing a cycle emits `MEMBERSHIP_CYCLE_CLOSED`.

## Fee Ledger

- A `fee_record` belongs to one member and one membership year.
- Payment states are `pending`, `partial`, `paid`, and `waived`.
- Partial payments accumulate until `amount_paid_cents >= amount_cents`.
- Waivers require a reason and lock the record against later payment attempts.
- Fee updates emit `FEE_RECORDED`, `FEE_PAYMENT_APPLIED`, or `FEE_WAIVED`.

## Standing Determination

`evaluateStanding()` returns:

- `good`: active open cycle and all dues paid or waived.
- `review`: partial payment or currently inside the grace period.
- `blocked`: no active cycle, overdue balance after grace, or manual block.

The codebase keeps earlier `active`, `grace`, and `outstanding` values for compatibility, but Phase 7 decisions collapse member-facing access into `good`, `review`, and `blocked`.

## Session Propagation

Standing changes call `rotateSessionsForSubject()` with reason `standing_change`. Old session cookies stop resolving on the next request, and new sessions carry the updated standing. The maximum propagation target is the next request cycle, which is stricter than the five-minute directive.

## Eligibility Enforcement

- `blocked` denies member dashboard, RSVP, directory, and document routes through the policy layer.
- `review` members may enter the member surface but are placed on the event waitlist by default.
- Admin fee and waiver endpoints require `admin.standing.manage`, CSRF, audit trail, and generic responses.

## Standing To Public Visibility

Public storytelling and public-safe profile reads require all four gates to pass: `standing=good`, `visibility=public`, `consent=granted`, and `approved=true`. Any other combination resolves to a private effective visibility and must be omitted from public query results.

| Standing | Public render default | Approval eligibility |
| --- | --- | --- |
| `good` | Eligible only with public visibility, consent, and admin approval | Eligible |
| `review` | Private | Not eligible until standing returns to `good` |
| `blocked` | Private | Not eligible |

Repository-level public queries must use the equivalent of `WHERE visibility='public' AND standing='good' AND approved=true`; member or admin preview flows may show drafts only on their own controlled surfaces.

## UX Contract

Admin standing views should be single-task pages: record payment, apply waiver, or view status. Member-facing copy must remain dignified and avoid exposing raw financial detail in route responses.
