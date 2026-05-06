# Phase 9 Slice 3 Brief

## Slice ID

`2026-05-03_System_Phase9Slice3ProviderBoundary_v1`

## Slice Name

Provider adapter boundary and audit correlation hardening for the Phase 9 notification spine.

## Source Provenance

- Source validation summary: Phase 9 Slice 2 verified locally.
- Commit status: local verified against commit `731b624`; push pending because remote push was environment-limited.
- Verification evidence: 77/77 tests, CI/SDLC/SBOM/supply-chain/provenance clean in the provided validation summary.
- Updated documentation list carried into planning: [audit-event-catalog.md](../audit-event-catalog.md), [security-controls-matrix.md](../security-controls-matrix.md), [PLATFORM_MEMORY.md](../PLATFORM_MEMORY.md), [decision-log.md](../decision-log.md), [docs/ci-pipeline.md](../docs/ci-pipeline.md).

## Recommendation Trace

- Selected upstream recommendation: real provider adapter boundary and contract abstraction.
- Deferred to later slices: dead-letter replay runbook and post-push provenance tagging.
- Slice discipline note: this brief intentionally covers one bounded implementation slice so the provider boundary lands before replay UI or milestone tagging work.

## Trace-to-Test Mapping

- Existing trace anchors: [test-strategy.md](../test-strategy.md) `P9-NOTIFICATION-POLICY-001`, `P9-OUTBOX-001`, `P9-WORKER-001`, `P9-RSVP-PRODUCER-001`, `P9-BROADCAST-001`.
- Existing product trace anchor: [v1-trace-extraction.md](../v1-trace-extraction.md) `TRC-009`.
- New proposed test IDs for this slice:
  - `P9-PROVIDER-001`: provider factory resolves channel-specific adapter without bypassing notification policy or outbox correlation.
  - `P9-PROVIDER-002`: duplicate outbox processing reuses provider reference and emits no duplicate `notification.sent` audit evidence.
  - `P9-PROVIDER-003`: channel validation rejects disallowed SMS/email paths before transport and records safe audit evidence.

## Migration / Backward Compatibility Notes

- No database migration is required for the initial provider boundary slice.
- The fake provider remains the default adapter to preserve current behavior while the factory and interface are introduced.
- Existing outbox identifiers, retry scheduling, and cancellation semantics remain the compatibility boundary.
- Any future provider-specific persistence should be deferred until contract behavior is proven behind the interface.

## Audit Event Schema Additions

- Keep existing audit anchors from [docs/audit-event-catalog.md](../docs/audit-event-catalog.md): `notification.outbox_processed`, `notification.sent`, and `notification.failed`.
- Add provider-specific event proposals only if needed by implementation review:
  - `notification.provider_sent`: emitted when a concrete adapter accepts delivery and returns a provider reference.
  - `notification.provider_failed`: emitted when adapter-level validation or timeout fails before a retry decision is finalized.
- Correlation fields must preserve `outbox.id` -> `correlationId` -> `providerRef` lineage without raw PII.
- Redaction rule: metadata may include event type, payload reference, attempt count, channel, and provider reference only.

## CI Gate Updates

- Required baseline gates remain [docs/ci-pipeline.md](../docs/ci-pipeline.md): `node scripts/check.mjs`, `node --experimental-strip-types scripts/run-tests.mjs`, `node scripts/workspace-ls.mjs`, `node scripts/docs-control-check.mjs`, `node scripts/agent-workflow-check.mjs`, `node scripts/supply-chain-check.mjs`, and `node scripts/provenance-check.mjs`.
- Add provider contract tests to the standard test run rather than a separate CI lane.
- Documentation control must continue to verify the workflow artifacts and notification governance markers.

## Documentation Updates

- Update [docs/audit-event-catalog.md](../docs/audit-event-catalog.md) if provider-specific audit events are accepted.
- Update [security-controls-matrix.md](../security-controls-matrix.md) with the provider boundary and pre-flight channel validation rule.
- Update [decision-log.md](../decision-log.md) with the provider factory rationale once implementation is accepted.
- Update [PLATFORM_MEMORY.md](../PLATFORM_MEMORY.md) if provider abstraction becomes a permanent platform rule.

## Implementation Steps

1. Add a `NotificationProvider` interface under `apps/common` with `send`, `validateChannel`, and `getDeliveryStatus` contracts.
2. Keep the fake provider as the default implementation and move it behind a provider factory.
3. Add email and SMS stub adapters that enforce channel-level consent validation without making network calls.
4. Wire the worker to resolve the adapter through the factory using channel and event metadata already present in the outbox payload.
5. Preserve idempotent processing by reusing stored provider references on duplicate reruns.
6. Map adapter acceptance to `notification.sent` and adapter failure to `notification.failed` while preserving `notification.outbox_processed` for the worker-level result.
7. Add provider contract tests for duplicate processing, pre-flight consent/channel rejection, and latency-safe audit correlation.
8. Update documentation and decision records only after the contract tests pass locally.

## Rollback Checkpoints

- Revert worker adapter resolution to the existing fake provider path if contract tests fail.
- Remove new provider stubs before rollback completes; do not leave partially wired transport branches.
- Preserve current outbox retry/cancel behavior and existing `notification.outbox_processed` audit evidence during rollback.
- Do not add real provider credentials, SDK configuration, or network calls in this slice.

## Open Risks / Deferred Work

- Dead-letter replay remains deferred until current-state consent and standing re-evaluation are designed.
- Post-push tagging and provenance sync remain blocked on remote push completion.
- Admin delivery-health UI remains deferred until provider contract and runbook evidence are stable.