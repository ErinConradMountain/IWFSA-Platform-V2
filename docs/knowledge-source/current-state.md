# Current State

## 2026-05-06 - Design Handoff Integration Baseline

The cleaned `Webpages` handoff pack is now treated as the acceptance reference for member/admin design pages, not as production component source. Production route work remains governed by `docs/surface-navigation-map.md`, `apps/common/src/design-tokens.ts`, CSRF rules, policy checks, audit-aware copy, and one `data-primary-action` per page.

Current implementation baseline:

- Server-rendered route shells include reusable status summary, visibility badge, info callout, and priority panel patterns.
- Admin Members includes explicit create, edit, and delete confirmations before temporary member records mutate.
- `npm run design:smoke` signs in through the normal HTTP route and verifies authenticated member/admin design pages for content markers, surface separation, and primary-action count.
- `npm run ci` includes the design smoke check after the agent workflow check and before the UX/brand gate.

Open next step: split notification, Phase 9, and Phase 10 changes into their own slice, then extract the server-rendered design helpers from `apps/web/src/server.ts` into a clearer module boundary.
