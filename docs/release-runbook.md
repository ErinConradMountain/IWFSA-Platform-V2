# Release Runbook

## Release Checklist

- CI green.
- SBOM generated.
- Dependency and supply-chain checks clean.
- Migration runbook reviewed.
- Rollback owner identified.
- Support playbook linked.
- Decision log updated.

## Phase 10 RC

Before `v2.0-rc.1`, attach:

- migration rehearsal evidence,
- backup/restore drill evidence,
- security regression checklist,
- E2E sweep summary,
- SBOM,
- dependency and provenance output,
- known limitations,
- stakeholder sign-off matrix.

## Rollback Authority

Rollback requires explicit operational approval. For Phase 4, rollback rehearsal is limited to isolated environments.

For Phase 10, rollback authority must name the release owner, technical rollback owner, support lead, and decision deadline before production promotion.

## Evidence Pack

Each release candidate should include:

- test output,
- migration record,
- SBOM,
- audit event catalog version,
- known limitations.

## Release Halt Conditions

- CI, supply-chain, provenance, or SBOM generation fails.
- Backup restore fails or audit continuity cannot be verified.
- Security regression has unresolved P0/P1 findings.
- Runbook links or rollback authority are missing.
