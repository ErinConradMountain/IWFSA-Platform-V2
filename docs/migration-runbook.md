# Migration Runbook

## Phase 4 Scope

Migration file:

- `apps/api/migrations/0001_phase4_foundation.sql`

Rollback file:

- `apps/api/migrations/0001_phase4_foundation.rollback.sql`

## Procedure

1. Confirm the target environment is isolated.
2. Run the forward migration.
3. Verify tables: `member_account`, `member_profile`, `membership_status`, `activation_token`, `import_batch`, `app_session`, `audit_event`.
4. Confirm audit update/delete rules exist.
5. Run repository contract tests against the adapter.
6. For rollback rehearsal, run the rollback script only in isolated environments.

## Safety Rules

- Never run rollback on production without approved release authority.
- Never import real member data before consent-gated import workflow is complete.
- Never bypass repository adapters from route handlers.

## Phase 10 Rehearsal

Phase 10 migration rehearsal runs only in an isolated environment. The rehearsal must:

1. Load a golden V1 extract or approved synthetic equivalent.
2. Run stage, validate, reconcile, and commit steps.
3. Compare source count, committed count, skipped count, failed count, and audit event count.
4. Record reconciliation drift and root cause for each mismatch.
5. Confirm public profile, standing, event, and notification tables remain isolated by repository contracts.

## Reconciliation

Acceptance target: reconciliation drift below 0.5%, with every mismatch documented. Rehearsal evidence belongs in the RC evidence pack with migration timestamp, operator, environment, and rollback result.
