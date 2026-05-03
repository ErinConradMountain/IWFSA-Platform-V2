# Import Pipeline Spec

## Purpose

The import pipeline turns raw membership intake files into a reviewed, auditable, idempotent membership operation.

## Flow

1. Quarantine: accept only `text/csv` or `.xlsx` MIME type markers, with size limit.
2. Parse: convert CSV rows to canonical row objects using pure Node.
3. Classify: deterministic order is `source_key`, then `verified_email`, then `admin_override_flag`.
4. Preview: persist `import_batch` and `import_batch_row`; do not mutate live member tables.
5. Commit: require idempotency key `batch_id + checksum`; upsert member accounts and enqueue activation invites.
6. Audit: emit `IMPORT_PREVIEWED`, `IMPORT_COMMITTED`, or `IMPORT_FAILED`.

## Current Constraints

XLSX binary parsing is deferred until npm/dependency installation is available. The MIME boundary is represented now; CSV parsing is active.

## Privacy Rules

- Raw email is hashed before durable row storage.
- Raw row snapshots are represented by hash.
- Logs and audit metadata redact PII.
