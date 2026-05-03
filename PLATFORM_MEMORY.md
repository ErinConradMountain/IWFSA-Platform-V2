# Platform Memory

## Phase 2 Cross-Cutting Constraints

These constraints are active platform memory and apply to every future phase.

- Every page has one primary task and at most one `data-primary-action`.
- Navigation is surface-scoped. Public navigation must not expose member/admin routes; member navigation must not expose admin routes.
- UI color, typography, motion, and spacing decisions flow from `apps/common/src/design-tokens.ts`.
- Inline styles and hard-coded UI colors outside design tokens are not allowed.
- V1 visual assets are available only through `/legacy-assets/{filename}` and must be backed by files in `apps/web/public/legacy-assets`.
- Seed member data is illustrative only and must not include private contact details or raw PII.
- Joyful UX is expressed through calm copy, progressive disclosure, clear next actions, motion tokens, and encouraging completion states.
- Each new privileged action must be policy-checked, CSRF-protected when state-changing, and audited with correlation ID.
- Phase 3 adds semantic visibility tokens, governance component props, and P0 prototype flows as permanent pre-build controls.
- Phase 4 locks PostgreSQL as production persistence, repository adapters as the only data access path, and append-only redacted audit events as the evidence spine.
- Phase 5 operationalises member intake with non-mutating import preview, idempotent commit, activation outbox, hashed tokens, consent-gated visibility, and standing-denied audit evidence.
- Phase 6 adds governed participation: event lifecycle state, capacity-safe RSVP, FIFO waitlist promotion, audience eligibility, short-lived document access, and event audit evidence.
- Phase 7 adds membership years, fee ledger state, waiver rules, standing calculation, subject-session rotation, and review-standing RSVP waitlist behavior.
- Phase 8 begins with public visibility locked at both policy and repository boundaries: standing `good`, public visibility, granted consent, and admin approval are all required before public render.
- Member-facing publication hints must use dignified consent language and remain scoped to member profile routes only.
- Phase tags must only be created from a clean CI-passing commit; generated build output, dependencies, environment files, logs, temp folders, IDE settings, and local reflection files stay out of Git.
- Public profile publication approval now has an audit-led state machine: `pending_review -> approved -> published`, with revocation resetting effective visibility to hidden/private.

## Phase 8: Public Surface & Storytelling

- Baseline commit `2d44fb8` carries `phase7-complete` and `phase8-kickoff-repository-enforcement`; approval spine commit `086fac1` added RBAC, standing re-validation, PII-redacted review notes, and publication audit events.
- Current Phase 8 public delivery adds durable `public_approval_record` persistence, public cache-isolated `GET /api/public/profiles`, provenance CI checks, and 55+ expected tests once merged.
- Audit event schema confirmed for `profile.publication_requested`, `profile.publication_reviewed`, `profile.publication_approved`, and `profile.publication_revoked`.
- Phase 8 sign-off slice adds admin queue/revoke/final-approve lifecycle endpoints, public gallery/story SSR projection, robots isolation, and dual approval for honorary/memorial publication with `profile.honorary_published` and `profile.memorial_published`.
- Phase 8 closed at commit `cc882eb` with tag `phase8-complete`, 65/65 tests, and clean CI/SBOM/supply-chain/provenance evidence.

## Phase 9: Notifications & Celebrations

- Phase 9 starts with outbox-first delivery: no feature handler should call email, SMS, or in-app providers directly.
- Celebratory notifications require granted, current-year consent, non-private visibility, good standing, and explicit channel opt-in.
- Notification worker evidence uses `notification.sent`, `notification.failed`, and `notification.cancelled`; member preference updates use `notification.preferences_updated`.

## Current Seed Strategy

Seed data source: `seed/legacy-members.json`.

Asset path: `apps/web/public/legacy-assets`.

Real member import remains deferred to the import and consent phases.

## Verification Memory

CI currently checks:

- strict TypeScript syntax/configuration,
- API and web tests,
- workspace graph,
- documentation control markers,
- UX/brand/seed asset rules,
- dependency scan,
- SBOM generation.
