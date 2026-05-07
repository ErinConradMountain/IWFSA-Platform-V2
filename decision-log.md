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

## 2026-05-03 - Phase 8 Durable Approval And Public Cache Delivery

**Decision:** Persist public approval queue state in `public_approval_record`, sanitize review notes before storage, expose approved public profiles through a cache-isolated anonymous endpoint, and run a CI provenance check after SBOM generation.

**Rationale:** Public storytelling needs restart-safe approval state and anonymous cache behavior before broader routing or CDN work. Provenance checks keep phase evidence tied to a clean tracked tree and SBOM output without requiring signed release tags before the Phase 10 release-candidate stage.

**Test References:** `P8-APPROVAL-REPO-001`, `P8-CACHE-001`, `P8-PROVENANCE-001`.

**Status:** Accepted.

## 2026-05-03 - Lightweight Tags Until Phase 10 RC

**Decision:** Retain lightweight phase tags for Phase 8 and Phase 9 delivery speed. Adopt annotated and signed release tags at Phase 10 RC, beginning with `v2.0-rc.1`, when release artifacts and rollback authority are finalized.

**Rationale:** Current phase tags mark local governance checkpoints, while Phase 10 release candidates require stronger cryptographic provenance for cutover rehearsal and supply-chain review.

**Status:** Accepted.

## 2026-05-03 - Phase 8 Stewardship UI, Rendering, And Dual Approval

**Decision:** Add admin queue lifecycle endpoints for pending, approved, published, and revoked records; expose public gallery/story rendering through public-safe projection only; and require chief admin final approval for honorary and memorial publication.

**Rationale:** Public storytelling is now a governed lifecycle, not a display toggle. Queue operations need audit evidence and standing re-validation, public SSR must not leak workflow or PII fields, and honorary/memorial records need elevated stewardship before publication.

**Test References:** `P8-SSR-001`, `P8-DUAL-APPROVAL-001`.

**Status:** Accepted.

## 2026-05-03 - Phase 9 Outbox-First Notification Boundary

**Decision:** Start Phase 9 with a consent-aware notification policy, deterministic outbox messages, retry/cancellation semantics, and a CSRF-protected member preference endpoint before wiring email, SMS, or in-app providers.

**Rationale:** Notifications can easily erode consent if they are sent directly from feature handlers. The outbox boundary preserves idempotency, audit evidence, provider isolation, and graceful cancellation when consent changes.

**Test References:** `P9-NOTIFICATION-POLICY-001`, `P9-OUTBOX-001`, `P9-PREFERENCES-001`.

**Status:** Accepted.

## 2026-05-03 - Phase 9 Worker, RSVP Producer, And Broadcast Preview

**Decision:** Add a fake-provider notification worker with bounded retry/dead-letter behavior, wire RSVP confirmation production through the notification policy, and expose an admin broadcast preview endpoint that evaluates audience eligibility without enqueueing messages.

**Rationale:** Provider behavior, producer integration, and admin broadcast targeting must be proven before real delivery channels or UI are added. This keeps Phase 9 idempotent, consent-aware, and auditable.

**Test References:** `P9-WORKER-001`, `P9-RSVP-PRODUCER-001`, `P9-BROADCAST-001`.

**Status:** Accepted.

## 2026-05-03 - Phase 9 Provider Adapter Boundary

**Decision:** Move the notification provider contract into `apps/common`, add channel-specific email and SMS stubs behind a provider factory, and have the worker resolve adapters per message while emitting provider-level audit evidence.

**Rationale:** The outbox already owns retry, dead-letter, and idempotent delivery state. Moving the provider contract to the shared boundary keeps transport concerns interchangeable, makes channel routing explicit, and preserves `outbox.id` to `correlationId` to `providerRef` evidence without leaking transport details into feature handlers.

**Test References:** `P9-WORKER-001`, `P9-PROVIDER-001`, `P9-PROVIDER-002`.

**Status:** Accepted.

## 2026-05-03 - Phase 9 Outbox Channel Persistence

**Decision:** Persist notification `channel` on outbox messages and remove worker-side fallback routing so provider selection is fully data-driven from the stored row.

**Rationale:** The RSVP producer already knows the allowed channel at enqueue time. Persisting that value closes the gap where the worker could otherwise default to `email`, which would weaken consent traceability and make routing decisions implicit rather than auditable.

**Test References:** `P9-OUTBOX-001`, `P9-WORKER-001`, `P9-PROVIDER-001`.

**Status:** Accepted.

## 2026-05-03 - Phase 9 Closure And Phase 10 Readiness

**Decision:** Close Phase 9 with a sign-off artifact and add named CI gates for Phase 9 notifications plus Phase 10 operational readiness documentation.

**Rationale:** The implementation already had notification policy, outbox, provider, worker, RSVP producer, and broadcast preview tests. Formal sign-off and Phase 10 runbooks prevent the project from advancing into release-candidate work without restore, security, E2E, provenance, and rollback evidence.

**Test References:** `P9-*`, `P10-CI-001`, `P10-RESTORE-001`, `P10-SECURITY-001`, `P10-E2E-001`.

**Status:** Accepted.

## 2026-05-03 - Phase Validation Skill And Slice Brief Chain

**Decision:** Keep the phase validation workflow workspace-specific, require injected governance context, cap default handoffs at three recommendations, and chain the validated output into a prompt-generated slice brief with strict provenance requirements.

**Rationale:** The workflow encodes governance controls, not generic planning preferences. Parameterized context preserves IWFSA-specific privacy, consent, audit, and surface-isolation rules without weakening discovery or reuse. The three-recommendation ceiling and twelve-step split guard reduce scope creep and keep each handoff audit-ready.

**Status:** Accepted.

## 2026-05-03 - Phase Validation Workflow Contract Verified

**Decision:** Adopt `node scripts/agent-workflow-check.mjs` as the deterministic local proof for the phase validation skill/prompt chain.

**Rationale:** The Codex desktop runtime cannot invoke VS Code slash commands directly inside repository automation. A repository-local contract check gives a falsifiable guard for the explicit halt directive, structured refusal behavior, and archived brief slice discipline without pretending that prompt files are executable artifacts.

**Evidence:** Successful local run of `node scripts/agent-workflow-check.mjs` after wiring `scripts/validate-skill-halt.mjs`, `scripts/validate-slice-brief-prompt.mjs`, and `slices/phase9-slice3-brief.md`.

**Status:** Accepted.

## 2026-05-06 - Webpages Handoff Integrated Into Build Plan

**Decision:** Treat the cleaned `Webpages` folder as a design handoff package, not a production component source, and integrate its accepted page sheets through governed server-rendered route shells before richer component work.

**Rationale:** The JSX previews use local tokens, inline styles, hard-coded colors, and demo-only state panels. Production route work must instead use `apps/common/src/design-tokens.ts`, `docs/surface-navigation-map.md`, shared policy checks, CSRF for state changes, audit-aware copy, and surface-scoped navigation.

**Implementation Path:** Track the route-by-route work in `docs/design-handoff-integration-plan.md`; keep the `Webpages` page sheets as acceptance references; verify member/admin design pages through tests, UX checks, and browser E2E before release-candidate sign-off.

**Status:** Accepted.

## 2026-05-06 - Authenticated Design Smoke Helper

**Decision:** Add `npm run design:smoke` as the local repeatable proof for authenticated design-route rendering before full browser sign-off.

**Rationale:** The in-app browser can verify visible pages, but it must not rely on unsafe auto-submit workarounds or special unmapped test routes. The smoke helper starts isolated in-memory API/web servers, signs in through the normal HTTP route, and checks member/admin design pages for route markers, surface separation, and primary-action count.

**Status:** Accepted.

## 2026-05-06 - Browser Session Cookie Forwarding

**Decision:** Forward only the API-issued session cookie from the web sign-in response to the browser, while keeping the API CSRF cookie internal to the server-to-server sign-in request.

**Rationale:** Browser verification showed that combining the API CSRF cookie and session cookie into one forwarded `Set-Cookie` value could leave the browser unauthenticated after an otherwise successful sign-in. Separating the browser-facing session cookie from the internal CSRF exchange preserves normal browser cookie behavior without exposing extra CSRF state.

**Evidence:** In-app browser sign-in now reaches `/admin` and `/member/dashboard`; `npm run test`, `npm run design:smoke`, and clean detached-worktree `npm run ci` passed after the fix.

**Status:** Accepted.

## 2026-05-07 - Admin Preparation Routes Surface Mapping

**Decision:** Add the existing admin preparation surfaces `/admin/public-review`, `/admin/audit`, and `/admin/support-notes` to `docs/surface-navigation-map.md` using their existing policy task IDs.

**Rationale:** The web surface already renders these admin-only preparation routes and the shared policy matrix already contains the task IDs. Recording them in the surface map closes the Phase 2 control gap so design smoke coverage can verify route-shell navigation, primary-action targets, and fallback behavior without treating unmapped admin routes as real business workflows.

**Test References:** `npm run design:smoke`, `P10-E2E-001`.

**Status:** Accepted.

## 2026-05-07 - Reviewer Pilot Uses Dummy Seed Data

**Decision:** Seed the reviewer pilot with illustrative dummy members, public-safe profile projections, and pending public-review queue records while keeping the data behind the existing member, public, and admin route boundaries.

**Rationale:** The IWFSA administrator needs a realistic review path before production data is connected. Dummy data allows the admin to test the app's shape, tone, and governance workflow without exposing real member contact details, credentials, private records, or publication decisions.

**Test References:** `npm run test`, `npm run design:smoke`, `npm run ux:check`, browser route checks, public tunnel session checks.

**Status:** Accepted.

## 2026-05-07 - Hosted Preview Protection Boundary

**Decision:** Keep the Cloudflare quick tunnel as the current public reviewer link and keep the Vercel reviewer-pilot project protected by SSO until the serverless module-packaging issue is resolved.

**Rationale:** Vercel project creation and deployment scaffolding are useful for the durable preview path, but the custom serverless wrapper currently fails at runtime because `@iwfsa/common` is not packaged as a resolvable hosted module. One intermediate Vercel deployment also served static source before the route configuration was corrected, so Vercel SSO protection is required until the hosted entrypoint is clean.

**Test References:** Vercel CLI deploy logs, `vercel project protection`, public tunnel HTTP session checks.

**Status:** Accepted.

## 2026-05-07 - Public Vercel Reviewer Preview Runtime

**Decision:** Move the reviewer pilot from temporary tunnel dependence to a public Vercel preview at `https://iwfsa-platform-v2-reviewer-pilot-lsm79cvgd.vercel.app`, disable Vercel SSO protection for that reviewer-pilot project, and package the serverless preview entrypoint with the API, web, common source, and legacy asset files it imports at runtime.

**Rationale:** The prior Vercel preview could build scaffolding but failed review readiness because the deployment was SSO-protected and the serverless function package omitted local TypeScript modules. A public, verified Vercel preview gives reviewers a durable URL while preserving the in-memory pilot boundary and existing public/member/admin policy separation.

**Evidence:** Remote Vercel deployment `dpl_25pEzMaA5usikaqHjjCfdQgmRmgv` reached `READY`; live checks returned `200` for `/`, `/health`, `/brand.css`, `/api/csrf-token`, and `/public/gallery`; member sign-in returned `303` to `/member/dashboard`; admin sign-in returned `303` to `/admin`; a member session requesting `/admin` returned `303` to `/`.

**Test References:** `npm run preview:smoke`, `npm run typecheck`, `npm run test`, `npm run design:smoke`, `npm run ux:check`, Vercel CLI deploy logs, live HTTP route checks.

**Status:** Accepted.

## 2026-05-07 - Reviewer Walkthrough Smoke And Public Route Completion

**Decision:** Add a reviewer walkthrough smoke gate and complete the mapped public review routes `/public-profiles`, `/honoraries`, `/memorials`, and `/contact` as public-safe server-rendered pages.

**Rationale:** The reviewer preview is now reachable, so the next risk is an incomplete guided review path. The Phase 10 checklist expects public homepage, gallery, story, honorary, memorial, member, and admin paths to be testable. These routes are already mapped in `docs/surface-navigation-map.md`, so rendering them closes a review gap without inventing new surfaces.

**Evidence:** `npm run reviewer:smoke` exercises public recognition/contact pages, preview credentials, member dashboard/profile/events/directory/notifications/fallbacks, member RSVP, admin dashboard/members/events/import/public-review/audit pages, admin member creation, admin event creation, surface separation, and primary-action limits through the serverless preview handler.

**Test References:** `npm run reviewer:smoke`, web route tests, `npm run design:smoke`, `npm run preview:smoke`.

**Status:** Accepted.

## 2026-05-07 - Browser QA Polish For Reviewer Pilot

**Decision:** Add explicit favicon handling and improve public story links as 44px touch targets after rendered browser QA.

**Rationale:** Scripted smoke coverage passed, but the reviewer deadline requires a credible browser experience. The fallback Playwright pass checked desktop and mobile public, member, and admin surfaces and found one noisy missing-resource console error plus small text-style public story links. Handling `/favicon.ico` and styling story links as touch targets removes these review distractions without changing route scope or business logic.

**Evidence:** Local browser QA on `http://127.0.0.1:3101` covered public homepage, gallery, honorary, memorial, contact, sign-in, member dashboard, member events with RSVP, mobile member profile, admin dashboard, admin members, mobile public review, and mobile audit. The final pass reported no console errors, no HTTP 4xx/5xx resources, no horizontal overflow, no undersized interactive targets, and no excess primary actions.

**Test References:** `npm run test`, `npm run ux:check`, `npm run reviewer:smoke`, local Playwright fallback browser QA.

**Status:** Accepted.
