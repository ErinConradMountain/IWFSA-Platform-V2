# Design Handoff Integration Plan

## Purpose

This plan turns the `Webpages` handoff pack into build work inside the IWFSA Platform V2 application. The handoff files are design references; production behavior must remain governed by `docs/surface-navigation-map.md`, `apps/common/src/policy.ts`, `apps/common/src/design-tokens.ts`, CSRF controls, and audit requirements.

## Current Integration Status

The first integration slice has moved the cleaned handoff pack into the running web surface without copying JSX prototypes into production.

Integrated surfaces:

- Member Dashboard: rendered as a member workspace with profile, events, directory, and notification priorities.
- Member Profile: rendered as a visibility-control surface with private, members-only, and public-safe guidance.
- Member Directory: rendered as a consent-scoped directory shell with safe searchable-field guidance.
- Member Notifications: rendered as a channel-status and notice-preference surface with current versus future channel separation.
- Consent Required: rendered as a member fallback page that does not expose protected content behind the gate.
- Standing Restricted Access: rendered as a dignity-first fallback page with safe dashboard return.
- Admin Dashboard: rendered as a stewardship console with imports, members, and public-review priorities.
- Admin Members: rendered as a temporary-record stewardship page connected to the mapped admin member API.
- Admin Import Preview: rendered as a non-mutating preview/checkpoint page.
- Admin Standing, Public Review, and Audit: rendered as admin-only preparation surfaces aligned to the route map.

Prototype status:

- `Webpages/iwfsa-*-preview.jsx` files remain visual prototypes only.
- Production route rendering must not import or copy those JSX files directly.
- Demo-only preview states belong in design review or test environments, not live member/admin pages.

## Development Sequence

1. Keep the handoff pack clean and canonical.
   - Source folder: `Webpages`.
   - Page sheets stay in Markdown.
   - JSX previews stay marked as visual prototypes.
   - `Webpages/README.md` explains previews, page sheets, and final handoff references.

2. Convert page-sheet decisions into governed route slices.
   - Confirm each route exists in `docs/surface-navigation-map.md`.
   - Confirm each task exists in `apps/common/src/policy.ts`.
   - Do not introduce unmapped routes or forms.
   - Use `POLICY_MISSING_MAPPING` behavior for anything not mapped.

3. Build server-rendered route shells before richer interaction.
   - Use `apps/common/src/design-tokens.ts` through `/brand.css`.
   - Keep one primary task and at most one `data-primary-action`.
   - Keep member navigation and admin navigation separate.
   - Keep state-changing actions behind mapped APIs, policy checks, CSRF, and audit.

4. Replace shells with production components only after route behavior is stable.
   - Member pages should graduate from shell panels into typed components for status summaries, visibility badges, event cards, directory entries, and notification rows.
   - Admin pages should graduate into typed stewardship components for tables, filters, audit labels, confirmation dialogs, and import-readiness panels.
   - Component contracts should include surface, visibility, consent gate, audit label, and token references.

5. Verify every slice in three layers.
   - Unit/API tests for policy, CSRF, audit, privacy projection, and mutation behavior.
   - Web tests for route rendering, single primary action, surface-scoped navigation, and safe copy.
   - Browser E2E checks for page identity, nonblank render, console health, mobile layout, focus/44px controls, and key interactions.

## Acceptance Matrix For Build

| Area | Build requirement | Verification |
| --- | --- | --- |
| Route governance | Route appears in `docs/surface-navigation-map.md` and calls the shared policy layer before privileged rendering. | Web route tests and policy tests. |
| Surface separation | Member routes never show admin links; admin routes never show member self-service controls. | Web tests plus browser DOM check. |
| Primary action | Each page has no more than one `data-primary-action`. | Web tests and UX check. |
| Token usage | Production styles use `/brand.css` values derived from `apps/common/src/design-tokens.ts`; no inline styles or hard-coded colors in route source. | `npm run ux:check`. |
| Consent/privacy | Consent-gated member pages do not render private feature content before consent. | Web tests and policy tests. |
| Audit/CSRF | State-changing admin/member actions use mapped APIs with CSRF and audit evidence. | API and web integration tests. |
| Mobile/accessibility | No clipping, 44px controls, visible focus, text-labelled status badges, respectful warnings. | Browser E2E visual sweep before release. |

## Immediate Next Build Tasks

1. Add browser E2E coverage for the integrated route shells:
   - `/member/dashboard`
   - `/member/profile`
   - `/member/directory`
   - `/member/notifications`
   - `/member/consent-required`
   - `/member/standing`
   - `/admin`
   - `/admin/members`
   - `/admin/import/preview`
   - `/admin/public-review`

2. Convert the member dashboard shell into typed component helpers:
   - `StatusSummary`
   - `PriorityPanel`
   - `VisibilityBadge`
   - `InfoCallout`

3. Convert the admin members shell into a fuller stewardship workflow:
   - create confirmation,
   - edit confirmation,
   - delete confirmation,
   - audit-aware success messages,
   - clean-slate separation.

4. Create a design-to-code trace table for each page:
   - page sheet source,
   - route,
   - policy task,
   - production file,
   - test coverage,
   - open decision.

## Repeatable Local Smoke Check

Use `npm run design:smoke` to start isolated in-memory API and web servers, create member/admin sessions through the normal sign-in route, and verify authenticated design routes without adding a special test-only browser route.

This helper checks:

- member/admin authenticated route rendering,
- required page markers,
- absence of cross-surface links,
- no more than one `data-primary-action` per page.

It is safe for local verification because it uses the same HTTP sign-in route and in-memory repositories as the web integration tests. It does not create a production route, bypass policy checks, or import JSX previews.

## Halt Conditions

- A page sheet recommends a route missing from `docs/surface-navigation-map.md`.
- A production route uses local JSX preview tokens or hard-coded colors.
- A member route exposes admin navigation or admin controls.
- An admin route uses member self-service language such as "your profile".
- A consent or standing fallback renders protected content behind the gate.
- Browser verification finds clipped text, hidden focus, overlapping controls, or inaccessible status-only-by-color cues.
