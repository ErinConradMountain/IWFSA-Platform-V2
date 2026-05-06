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
