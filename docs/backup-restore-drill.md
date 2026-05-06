# Backup And Restore Drill

## Purpose

Phase 10 requires a repeatable backup and restore rehearsal before any release candidate is packaged. The drill proves data, audit continuity, and rollback evidence in an isolated environment.

## Scope

- PostgreSQL schema and data.
- Migration history.
- Audit event continuity.
- Public approval, outbox, notification preference, import, standing, event, and profile tables.

## Drill Procedure

1. Confirm the target is an isolated rehearsal database.
2. Capture pre-drill metadata: environment name, migration version, timestamp, operator, and correlation ID.
3. Produce a full PostgreSQL dump using the approved environment command.
4. Restore into a newly created isolated database.
5. Run schema verification against expected tables and constraints.
6. Run repository contract tests and public-safe projection tests against the restored database adapter.
7. Confirm audit rows retain `correlation_id`, `metadata_hash`, and append-only protections.
8. Record mismatch count, corrective action, and sign-off owner.

## Acceptance Criteria

- Restore completes without manual schema edits.
- Audit records remain queryable by correlation ID.
- Repository contract tests pass.
- No raw tokens, cookies, or sensitive PII appear in restored audit metadata.
- Any mismatch is documented before RC approval.
