# IWFSA Platform V2 Test Strategy

## Purpose

This document defines the verification layers for the V2 platform. The goal is to protect privacy, consent, auditability, and surface isolation while keeping the engineering feedback loop clear.

## Phase 1 Baseline

The Phase 1 and Phase 2 gate runs:

1. `npm run check`
2. `npm test`
3. `npm run typecheck`
4. `npm run dependency:scan`
5. `npm run workspace:ls`
6. `npm run sbom`

In the current Codex desktop environment, `npm` is not on PATH, so the equivalent Node commands are:

1. `node scripts/check.mjs`
2. `node --experimental-strip-types --test apps/api/test/*.test.ts apps/web/test/*.test.ts`
3. `node scripts/typecheck.mjs`
4. `node scripts/dependency-scan.mjs`
5. `node scripts/workspace-ls.mjs`
6. `node scripts/generate-sbom.mjs`

Phase 2 adds these required test IDs:

| Test ID | Coverage |
| --- | --- |
| `P2-SESSION-001` | Session ID rotates on login and remains opaque. |
| `P2-SESSION-002` | Session ID rotates on admin elevation, standing change, and credential reset. |
| `P2-CSRF-001` | Missing or replayed CSRF token returns 403. |
| `P2-CSRF-002` | Valid session-bound CSRF token permits state-changing request once. |
| `P2-AUTH-001` | Login, reset, and activation responses are generic. |
| `P2-POLICY-001` | Policy matrix covers 20+ role, surface, standing, and consent permutations. |
| `P2-ROUTE-001` | Web route guards redirect unauthorized users to surface-safe fallbacks. |
| `P2-AUDIT-001` | `SESSION_CREATED`, `SESSION_ROTATED`, `POLICY_DENY`, and `CSRF_BLOCKED` emit with correlation ID. |
| `P2-DOCS-001` | CI verifies AGENTS.md and `docs/surface-navigation-map.md` contain active control markers. |
| `P2-UX-001` | Member sign-in lands on dashboard with one primary CTA to complete profile. |
| `P2-BRAND-001` | Web code has no inline style attributes or hard-coded colors outside design tokens. |
| `P2-SEED-001` | V1 seed member assets resolve through `/legacy-assets/{filename}` and seed data contains no private contact details. |
| `P3-DESIGN-001` | Design system docs define semantic visibility tokens and component governance props. |
| `P3-PROTOTYPE-001` | P0 prototype routes exist for member profile edit, admin import preview, and public profile approval. |
| `P3-A11Y-001` | Prototype markup includes visibility labels for assistive technology and one primary task per route. |
| `P3-PRIVACY-001` | Privacy-by-design documentation maps UX risks to consent, visibility, and audit controls. |
| `P4-REPO-001` | Repository contract suite passes for in-memory and PostgreSQL adapter clients. |
| `P4-AUDIT-001` | Audit emitter stores redacted metadata and metadata hash for privileged writes. |
| `P4-DB-001` | CI blocks direct DB access from API route handlers. |
| `P4-MIGRATION-001` | Phase 4 migration and rollback scripts exist for canonical entities. |
| `P4-CI-001` | CI includes staged spine checks, SBOM validation, dependency scan, and supply-chain check. |
| `P5-IMPORT-001` | Import preview persists rows without mutating live member tables. |
| `P5-IMPORT-002` | Import commit is idempotent and enqueues one activation invite per eligible row. |
| `P5-TOKEN-001` | Activation token replay returns generic response and emits onboarding once. |
| `P5-CONSENT-001` | Public visibility is blocked without consent and approval; public preview omits private state. |
| `P5-STANDING-001` | Blocked standing denies route access and emits `STANDING_DENIED`. |
| `P6-EVENT-001` | Event state machine permits valid lifecycle transitions and audits state changes. |
| `P6-RSVP-001` | Parallel RSVP simulation never exceeds capacity and preserves waitlist order. |
| `P6-RSVP-002` | Cancellation promotes the first waitlisted member and enqueues an outbox message. |
| `P6-POLICY-001` | Blocked or consent-missing participants receive generic denial and access-denied audit. |
| `P6-DOC-001` | Document access tokens are eligibility-checked, expiring, hashed, and single use. |
| `P6-API-001` | API RSVP, document, and admin event-state routes are CSRF-protected and audit-emitting. |
| `P7-CYCLE-001` | Membership cycle opening rejects overlaps and emits standing review evidence. |
| `P7-FEE-001` | Fee records accumulate partial payments, transition to paid, and waivers lock payment. |
| `P7-STANDING-001` | Standing determination maps paid, partial, overdue, and manual block cases. |
| `P7-SESSION-001` | Standing change appends history, emits audit, and rotates active subject sessions. |
| `P7-API-001` | Admin fee update recalculates standing and blocks old member session cookies. |
| `P7-ELIGIBILITY-001` | Review-standing members can access member surface but RSVP to waitlist by default. |
| `P8-PUBLIC-QUERY-001` | Public profile repository pushes standing, visibility, consent, and approval predicates into the data layer. |
| `P8-MEMBER-HINT-001` | Member publication-gate hint renders only on member profile routes. |
| `P8-APPROVAL-001` | Admin publication approval requires RBAC, member standing re-validation, valid state transition, and PII-redacted audit. |
| `P8-APPROVAL-REPO-001` | Public approval repository persists queue state, sanitizes review notes before storage, and rejects invalid revocation. |
| `P8-CACHE-001` | Public profile endpoint emits cache-isolation headers and returns public-safe schema only. |
| `P8-PROVENANCE-001` | CI provenance check verifies clean tracked tree, tag resolution when present, and SBOM component alignment. |

## Layers

### Unit Tests

Unit tests cover pure domain logic in `apps/common`, including policy rules, validation rules, state transitions, telemetry redaction, and repository contracts.

### Contract Tests

Contract tests verify API request/response bodies, repository adapters, RFC 9457 problem details, and OpenAPI alignment once Phase 3 introduces formal contracts.

### Integration Tests

Integration tests run across `apps/api` and `apps/common` with local/test persistence only. They verify sessions, telemetry headers, authorization boundaries, idempotency, and audit emission.

### End-to-End Tests

E2E tests cover public, member, and admin surfaces through the browser. They must verify that public routes never expose private fields, member routes enforce consent and standing, and admin routes emit audit events on privileged writes.

### Security Regression Tests

Security tests cover CSRF, session fixation, authorization bypass, account enumeration, dependency risk, log redaction, and private data leakage.

## Quality Gates

- Strict TypeScript mode remains enabled.
- Every privileged write emits an audit event before the request is considered complete.
- Telemetry must include a correlation ID and must redact session IDs, tokens, credentials, and raw PII.
- No direct cross-app source imports are allowed; shared code flows through `apps/common`.
- In-memory persistence is permitted only for local/test boundaries.

## Trace Linkage

Each future feature test must reference an item in `v1-trace-extraction.md` and mark it as `observed`, `confirmed`, `retired`, or `new`.
