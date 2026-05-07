# Phase 10 Release Candidate Checklist

## Purpose

This checklist turns operational maturity into release evidence. It must be completed before the first `v2.0-rc.1` tag.

## Required Evidence

1. CI green from a clean commit.
2. SBOM generated and retained.
3. Dependency and supply-chain scans clean.
4. Migration rehearsal completed in isolated environment.
5. Backup/restore drill completed and documented.
6. Security regression checklist completed with zero P0/P1 findings.
7. E2E sweep completed across public, member, and admin surfaces.
8. Reconciliation metrics documented for any V1 migration rehearsal.
9. Release runbook and support playbook reviewed.
10. Rollback owner and release authority named.

## E2E Sweep

- Public: homepage, gallery, story, honorary, memorial, revoked/missing story path.
- Member: sign-in, dashboard, profile visibility, RSVP, notification preference, sign-out.
- Admin: import preview/commit, standing fee update, event state change, public approval, broadcast preview, audit lookup by correlation ID.
- Reviewer pilot: run `npm run reviewer:smoke` to verify the public, member, and admin walkthrough paths through the serverless preview handler before browser sign-off.

## Design Integration Sweep

- Use `docs/design-handoff-integration-plan.md` as the route-by-route build plan for converting the `Webpages` handoff pack into production surfaces.
- Confirm every integrated page has one primary task and no more than one `data-primary-action`.
- Confirm every member page uses member-only navigation and every admin page uses admin-only navigation.
- Confirm production route styling uses `apps/common/src/design-tokens.ts` through `/brand.css`; JSX previews must remain visual prototypes only.
- Confirm consent-required and standing-restricted fallbacks do not render protected member content behind the gate.
- Run `npm run design:smoke` before browser sign-off to verify authenticated design routes, cross-surface link absence, and primary-action counts through local in-memory services.
- Browser-check desktop and mobile render for the integrated design pages before RC sign-off, including no clipping, 44px controls, visible focus, and status badges with text labels.
- 2026-05-07 browser QA evidence: local Playwright fallback checked `http://127.0.0.1:3101` across public, member, and admin reviewer paths at 1366x900 and 390x844, with no console errors, no HTTP 4xx/5xx resources, no horizontal overflow, no undersized interactive targets, and successful member RSVP interaction.

## RC Packaging

- Tag format: `v2.0-rc.1`.
- RC tags must be annotated and signed when the local Git environment supports signing.
- Release artifact must include SBOM, migration record, runbook links, known limitations, and rollback instructions.

## Halt Conditions

- CI fails or gates are skipped.
- Restore rehearsal fails.
- Security regression has unresolved P0/P1 issues.
- Public/private/admin surface boundaries are ambiguous.
- Release authority or rollback ownership is missing.
