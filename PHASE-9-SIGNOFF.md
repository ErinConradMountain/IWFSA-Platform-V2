# Phase 9 Sign-Off

## Evidence

- Phase: Notifications & Celebrations
- Verification command: `node scripts\ci.mjs`
- Latest local verification: 79/79 tests passed.
- Supply-chain result: dependency scan, SBOM generation, supply-chain check, and provenance check passed.
- Local constraint: `npm` remains unavailable on PATH in this Codex runtime; Node-based gates are the controlled equivalent.

## Governance Acceptance

Phase 9 closes with a consent-aware notification boundary:

1. Notifications are outbox-first; feature handlers do not call providers directly.
2. Celebratory delivery requires current-year consent, non-private visibility, good standing, and explicit channel opt-in.
3. RSVP confirmation is produced only after RSVP succeeds and notification policy re-validates standing, consent, and preferences.
4. Review-standing RSVP can succeed as waitlist-only, but notification enqueue is skipped and audited.
5. Worker delivery is idempotent, retry-bounded, and dead-letters exhausted rows.
6. Provider routing is explicit by stored channel; silent default-to-email fallback is blocked.
7. Admin broadcast is preview-only and writes no outbox rows until a later explicit dispatch slice.
8. Consent revocation cancels pending outbox messages and emits redacted audit evidence.

## Audit Schema Confirmed

- `notification.preferences_updated`
- `notification.provider_sent`
- `notification.provider_failed`
- `notification.sent`
- `notification.failed`
- `notification.cancelled`
- `notification.outbox_processed`
- `notification.broadcast_previewed`
- `rsvp.notification_enqueued`
- `rsvp.notification_skipped`

## Verified Controls

- `P9-NOTIFICATION-POLICY-001`
- `P9-OUTBOX-001`
- `P9-PREFERENCES-001`
- `P9-WORKER-001`
- `P9-PROVIDER-001`
- `P9-PROVIDER-002`
- `P9-RSVP-PRODUCER-001`
- `P9-BROADCAST-001`

## Deferred Enhancements

- Real email, SMS, and in-app provider credentials remain deferred until deployment environment selection.
- Admin broadcast dispatch remains deferred; current implementation is preview-only.
- Conference memory and rich celebration UI are deferred to post-RC product slices unless Phase 10 readiness review re-prioritises them.

Status: Accepted and closed.
