# Release Runbook

## Release Checklist

- CI green.
- SBOM generated.
- Dependency and supply-chain checks clean.
- Migration runbook reviewed.
- Rollback owner identified.
- Support playbook linked.
- Decision log updated.

## Rollback Authority

Rollback requires explicit operational approval. For Phase 4, rollback rehearsal is limited to isolated environments.

## Evidence Pack

Each release candidate should include:

- test output,
- migration record,
- SBOM,
- audit event catalog version,
- known limitations.
