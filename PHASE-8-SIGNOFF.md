# Phase 8 Sign-Off

## Evidence

- Phase: Public Surface & Storytelling
- Completion commit: `cc882eb`
- Completion tag: `phase8-complete`
- Verification: `npm run ci`
- Test result: `65/65` passed
- Supply-chain result: dependency scan, SBOM generation, supply-chain check, and provenance check passed.

## Governance Acceptance

Phase 8 closes with a consent-gated public content pipeline:

1. Member profile visibility requires `standing='good'`, `visibility='public'`, `consent='granted'`, and `approved=true`.
2. Repository-level public queries push all visibility predicates into the data layer and project only public-safe fields.
3. Public cache middleware isolates anonymous public reads and strips cookie-setting behavior.
4. Admin approval, revocation, and dual approval emit structured audit events with redacted metadata.
5. Honorary and memorial publication requires first admin approval plus chief admin final approval.
6. Public gallery and story routes render only allowlisted fields and prevent protected or revoked paths from being indexed.

## Audit Schema Confirmed

- `profile.publication_requested`
- `profile.publication_reviewed`
- `profile.publication_approved`
- `profile.publication_revoked`
- `profile.honorary_published`
- `profile.memorial_published`

## Verified Controls

- `P8-PUBLIC-QUERY-001`
- `P8-MEMBER-HINT-001`
- `P8-APPROVAL-001`
- `P8-APPROVAL-REPO-001`
- `P8-CACHE-001`
- `P8-PROVENANCE-001`
- `P8-SSR-001`
- `P8-DUAL-APPROVAL-001`

## Deferred Enhancements

- Advanced CDN edge header rewriting is deferred to deployment hardening.
- Multi-region cache purge and provider-level invalidation are deferred until production CDN selection.
- Rich admin queue UI is deferred; the current slice provides lifecycle endpoints and tests.

Status: Accepted and closed.
