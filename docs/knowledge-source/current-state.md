# Current State

## 2026-05-06 - Design Handoff Integration Baseline

The cleaned `Webpages` handoff pack is now treated as the acceptance reference for member/admin design pages, not as production component source. Production route work remains governed by `docs/surface-navigation-map.md`, `apps/common/src/design-tokens.ts`, CSRF rules, policy checks, audit-aware copy, and one `data-primary-action` per page.

Current implementation baseline:

- Server-rendered route shells include reusable status summary, visibility badge, info callout, and priority panel patterns.
- Admin Members includes explicit create, edit, and delete confirmations before temporary member records mutate.
- `npm run design:smoke` signs in through the normal HTTP route and verifies authenticated member/admin design pages for content markers, surface separation, and primary-action count.
- `npm run ci` includes the design smoke check after the agent workflow check and before the UX/brand gate.

Open next step: split notification, Phase 9, and Phase 10 changes into their own slice, then extract the server-rendered design helpers from `apps/web/src/server.ts` into a clearer module boundary.

## 2026-05-06 - Design Helper Module Boundary

The server-rendered design helper patterns now live in `apps/web/src/design-components.ts`.

Current implementation baseline:

- `apps/web/src/server.ts` owns route rendering, auth/session flow, policy/fallback behavior, and API gateway calls.
- `apps/web/src/design-components.ts` owns small reusable HTML render helpers for status badges, status summaries, priority panels, and info callouts.
- The extracted helpers remain server-rendered prototype infrastructure, not a production React component library.

Open next step: keep moving repeated route-shell UI into small typed server-render helpers only where it clarifies governance and avoids mixing policy logic into presentation helpers.

## 2026-05-06 - Designer Guidance Documentation Baseline

The remaining designer guidance documents are enforceable handoff references and are part of the current documentation baseline:

- `docs/designer-custom-instructions.md`
- `docs/designer-page-handoff-checklist.md`
- `docs/member-section-visual-design-brief.md`

These files define design scope, page-level handoff checks, mobile/accessibility expectations, visual quality bars, token usage, surface separation, and member/admin dignity constraints. They do not change route policy, data, authentication, or workflow logic.

## 2026-05-07 - Route Shell Navigation Smoke Baseline

Authenticated member/admin route-shell smoke coverage now checks surface-scoped navigation and verifies that each rendered primary action stays inside the expected surface and resolves to an implemented governed route.

Current implementation baseline:

- Public landing tests now expect public-only site navigation with Home and Sign in links, while still blocking member/admin links.
- Admin preparation routes `/admin/public-review`, `/admin/audit`, and `/admin/support-notes` are recorded in `docs/surface-navigation-map.md` with their existing policy task IDs.
- The public-review preparation page uses a review-checklist primary action rather than a future approval route that has not been implemented as a governed workflow.

Open next step: complete the browser E2E sweep from `docs/design-handoff-integration-plan.md` after the working tree is clean enough for the provenance gate to pass.

## 2026-05-07 - Admin Reviewer Pilot Baseline

The local reviewer pilot now opens with seeded dummy data so the IWFSA administrator can inspect the current public, member, and admin surfaces without using real member records.

Current implementation baseline:

- Admin Members loads four dummy records with active and restricted standing examples.
- Public Gallery renders two approved public-safe dummy profiles from the allowlisted projection path.
- Admin Public Review renders two seeded pending review requests through the existing policy-gated admin queue.
- Sign In shows temporary preview credentials for the admin and member reviewer flows.
- A temporary Cloudflare quick tunnel can expose the local web service for external review while the app continues to use the local API service behind the server-rendered web layer.

Open next step: convert the temporary tunnel into a durable preview deployment path once the server entrypoint and environment model are ready for hosted execution.

## 2026-05-07 - Reviewer Feedback And Hosted Preview Status

The reviewer handoff now includes `docs/admin-reviewer-feedback-checklist.md` for structured admin, member, and public-surface feedback.

Current hosted-preview status:

- The public reviewer link remains the Cloudflare quick tunnel to the local web service.
- The Vercel project `iwfsa-platform-v2-reviewer-pilot` has been created and linked for future preview deployment work.
- Vercel SSO protection is enabled because the current custom serverless wrapper still returns a runtime module-resolution error for `@iwfsa/common` in the hosted function package.
- The mobile browser pass found and fixed small-screen header and public-gallery wrapping defects.

Open next step: turn the Vercel wrapper into a production-grade hosted entrypoint by packaging `apps/common` as a resolvable runtime module or moving the deployment target to a platform that can run the existing two-service Node preview directly.
