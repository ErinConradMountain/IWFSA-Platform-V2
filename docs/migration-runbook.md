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
