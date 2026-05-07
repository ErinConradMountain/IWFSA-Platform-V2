# Change Log

## 2026-05-07 - Strengthened Route-Shell Smoke Coverage

- Updated the public landing test to align with centralized public site navigation while preserving public/member/admin separation checks.
- Added primary-action target and navigation-surface checks to `npm run design:smoke`.
- Mapped the existing admin preparation routes in `docs/surface-navigation-map.md`.
- Recorded the admin preparation route mapping decision in `decision-log.md`.

Verification recorded for this slice:

- `node --experimental-strip-types scripts/run-tests.mjs`
- `node --experimental-strip-types scripts/design-route-smoke.mjs`
- `node scripts/docs-control-check.mjs`
- `node scripts/ux-brand-check.mjs`
- `node scripts/ci.mjs` through supply-chain checks; final provenance check remains blocked because the tracked working tree is dirty.

## 2026-05-06 - Integrated Server-Rendered Design Helpers And Route Smoke Coverage

- Cleaned and staged the `Webpages` handoff pack as page-sheet and visual-prototype reference material.
- Added reusable server-rendered design helper patterns for governed member/admin route shells.
- Strengthened Admin Members with confirmation requirements for temporary create, edit, and delete actions.
- Added `npm run design:smoke` to verify authenticated design routes without adding unsafe test routes or browser auto-submit workarounds.
- Wired the design smoke check into CI and documented the handoff integration path.

Verification recorded for this slice:

- `npm run test`
- `npm run design:smoke`
- `npm run docs:check`
- `npm run ux:check`
- `npm run typecheck`
- `npm run ci` through supply-chain checks; provenance remains blocked until the repository has a clean tracked working tree.

## 2026-05-06 - Split Phase 9/10 Slice And Extracted Design Helper Boundary

- Committed notification/Phase 9 closure and Phase 10 readiness gates as a separate slice from the design handoff integration work.
- Verified the committed Phase 9/10 slice from a clean detached worktree with `npm run ci`.
- Extracted server-rendered design helpers from `apps/web/src/server.ts` into `apps/web/src/design-components.ts`.
- Preserved route-level policy, auth, CSRF, fallback, and API gateway logic inside `apps/web/src/server.ts`.

Verification recorded for this slice:

- `npm run test`
- `npm run design:smoke`
- `npm run typecheck`

## 2026-05-06 - Added Designer Guidance Documentation Baseline

- Committed enforceable designer handoff guidance as a documentation-only slice.
- Added a decision-log note for the browser-discovered session cookie forwarding fix.
- Confirmed the accepted three-commit baseline remains scope-aligned.
- Completed a 493px-wide in-app browser responsive pass across the checked member/admin routes.

Verification recorded for this slice:

- `git show --stat HEAD~2..HEAD`
- `git show --stat HEAD~3..HEAD`
- In-app browser route pass at 493px viewport
