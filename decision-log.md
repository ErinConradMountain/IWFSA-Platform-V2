# IWFSA Platform V2 Decision Log

## 2026-05-03 - Phase 1 Stack Convergence

**Decision:** Convert the V2 scaffold from JavaScript `.mjs` files to TypeScript `.ts` files with strict compiler settings in `tsconfig.json`.

**Rationale:** The execution directive requires typed contracts before business logic expands. Strict TypeScript reduces ambiguity in role, session, persistence, and telemetry boundaries.

**Status:** Accepted.

## 2026-05-03 - Workspace Isolation

**Decision:** Treat `apps/common` as the only shared module boundary. `apps/api` and `apps/web` declare `@iwfsa/common` as explicit workspace dependencies and import shared code through the `#common/*` alias.

**Rationale:** Direct cross-app source imports make public, member, and admin concerns easier to blend accidentally. The shared common package is the controlled place for contracts and rules.

**Status:** Accepted.

## 2026-05-03 - Production Persistence Target

**Decision:** PostgreSQL is the production persistence target. The in-memory adapter is restricted to local and test use and throws if used in production.

**Rationale:** IWFSA workflows require durable records, referential integrity, audit continuity, and reliable reconciliation. In-memory storage is useful for local tests but not acceptable for production.

**Status:** Accepted.

## 2026-05-03 - Telemetry Privacy Baseline

**Decision:** Add correlation ID propagation, trace/span IDs, structured request logs, and redaction for cookies, authorization headers, tokens, session identifiers, and likely PII fields.

**Rationale:** Operational visibility is needed, but telemetry must not undermine privacy or member dignity.

**Status:** Accepted.

## 2026-05-03 - Local Verification Limitation

**Decision:** Keep npm workspace scripts in `package.json`, but run equivalent Node commands in this environment because `npm` is not available on PATH.

**Rationale:** The project must be npm-workspace ready, but this Codex desktop runtime currently exposes bundled Node only. Verification should still run without weakening the documented CI sequence.

**Status:** Accepted with follow-up to install or expose npm before remote CI is finalized.

## 2026-05-03 - Phase 2 Session and CSRF Spine

**Decision:** Use opaque 256-bit CSPRNG session IDs, server-side session records, explicit TTL cookies, and single-use synchronizer CSRF tokens tied to the session.

**Rationale:** This prevents role/user data from being embedded in browser-held identifiers and blocks state-changing requests that are not explicitly tied to the current session.

**Test References:** `P2-SESSION-001`, `P2-SESSION-002`, `P2-CSRF-001`, `P2-CSRF-002`.

**Status:** Accepted.

## 2026-05-03 - Generic Auth Responses

**Decision:** Login, reset, and activation endpoints return the same generic accepted payload regardless of whether the supplied role or identity material is valid.

**Rationale:** Response payloads must not support account, role, reset-token, or activation-token enumeration.

**Test References:** `P2-AUTH-001`.

**Status:** Accepted.

## 2026-05-03 - Surface Navigation Matrix as Control Contract

**Decision:** `docs/surface-navigation-map.md` is the source of truth for task-to-surface mapping. Missing API task mappings return `403` and emit `POLICY_DENY` with `POLICY_MISSING_MAPPING`.

**Rationale:** Route generation must not drift into ad hoc public/member/admin blending.

**Test References:** `P2-POLICY-001`, `P2-ROUTE-001`, `P2-DOCS-001`.

**Status:** Accepted.

## 2026-05-03 - UX, Brand, and Seed Asset Constraints

**Decision:** Promote single-task pages, surface-scoped navigation, IWFSA design tokens, joyful UX tone, V1 visual seed assets, and `PLATFORM_MEMORY.md` into active Phase 2 CI controls.

**Rationale:** Identity and policy controls protect access, but the platform also needs a dignified, inspiring user experience that does not feel like a database and does not leak cross-surface routes.

**Test References:** `P2-UX-001`, `P2-BRAND-001`, `P2-SEED-001`.

**Status:** Accepted.

## 2026-05-03 - Phase 3 Design System And Experience Model

**Decision:** Establish semantic visibility tokens, typed governance component props, surface-aware prototype routes, and privacy-by-design documentation before building member profile and import functionality.

**Rationale:** Design decisions can create privacy leaks if visibility, consent, and auditability are not represented directly in tokens, components, route flows, and wireframe annotations.

**Test References:** `P3-DESIGN-001`, `P3-PROTOTYPE-001`, `P3-A11Y-001`, `P3-PRIVACY-001`.

**Status:** Accepted.

## 2026-05-03 - Phase 4 Platform Spine

**Decision:** Add typed repository interfaces, in-memory and PostgreSQL adapter implementations, canonical Phase 4 migrations, redacted audit emitter, and CI spine checks before implementing full import/onboarding/profile persistence.

**Rationale:** Durable persistence and audit evidence are governance controls. Building them before feature complexity reduces the risk of ad hoc DB access, non-idempotent imports, unredacted logs, and missing evidence trails.

**Test References:** `P4-REPO-001`, `P4-AUDIT-001`, `P4-DB-001`, `P4-MIGRATION-001`, `P4-CI-001`.

**Status:** Accepted.

## 2026-05-03 - Phase 5 Member Intake And Consent Enforcement

**Decision:** Implement CSV-first import preview/commit, hashed activation token lifecycle, profile visibility state machine, and standing-denied audit evidence using pure Node and existing repository adapters while npm remains unavailable.

**Rationale:** This creates the operational membership pipeline without adding unverified dependencies. XLSX parsing and richer UI can be added after dependency installation and browser tooling are available.

**Test References:** `P5-IMPORT-001`, `P5-IMPORT-002`, `P5-TOKEN-001`, `P5-CONSENT-001`, `P5-STANDING-001`.

**Status:** Accepted.

## 2026-05-03 - Phase 6 Events And Participation Engine

**Decision:** Implement the event lifecycle, RSVP/waitlist engine, audience eligibility, and short-lived document access in `apps/common`, then expose minimal CSRF-protected API routes for RSVP, document token issue, and admin state transitions.

**Rationale:** Participation must be governed before richer event UI is built. Keeping the capacity and eligibility logic in common preserves adapter boundaries while API routes enforce policy, CSRF, audit correlation, and generic denials.

**Test References:** `P6-EVENT-001`, `P6-RSVP-001`, `P6-RSVP-002`, `P6-POLICY-001`, `P6-DOC-001`, `P6-API-001`.

**Status:** Accepted.

## 2026-05-03 - Phase 7 Membership Standing And Fee Governance

**Decision:** Add a dedicated standing module for membership years, fee records, waivers, standing calculation, standing history, and subject-session rotation. Member-facing Phase 7 standings are `good`, `review`, and `blocked`, while earlier standing values remain accepted for compatibility.

**Rationale:** Financial governance should not be scattered across route handlers. Centralizing the rules keeps fee updates auditable, makes standing deterministic, and ensures access changes propagate by rotating member sessions immediately after standing changes.

**Test References:** `P7-CYCLE-001`, `P7-FEE-001`, `P7-STANDING-001`, `P7-SESSION-001`, `P7-API-001`, `P7-ELIGIBILITY-001`.

**Status:** Accepted.

## 2026-05-03 - Phase 8 Repository-Enforced Public Visibility

**Decision:** Enforce public profile eligibility in both policy and the shared repository boundary. Public rendering requires latest standing `good`, profile visibility `public`, consent `granted`, and admin approval before rows leave the data layer.

**Rationale:** Filtering after fetch can leak private state into logs, caches, errors, or telemetry. Repository-level predicate pushdown and public-safe projection preserve the public/member/admin separation before Phase 8 routes or CDN caching expand.

**Test References:** `P8-PUBLIC-QUERY-001`, `P8-MEMBER-HINT-001`.

**Status:** Accepted.

## 2026-05-03 - Git Provenance And Phase Tag Hygiene

**Decision:** Exclude local dependencies, generated build output, environment files, logs, temp folders, IDE settings, and local reflection files before phase tagging. Phase tags must point to clean commits that have passed the local CI gate.

**Rationale:** The V2 checkout had only `README.md` tracked while the working platform scaffold was untracked. A clean baseline commit is required before phase tags can carry useful provenance.

**Status:** Accepted.
