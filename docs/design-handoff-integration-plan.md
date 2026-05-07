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

## Design-To-Code Trace

| Review route | Source guidance | Policy task | Production surface | Verification |
| --- | --- | --- | --- | --- |
| `/` | Public homepage direction and public-safe route map | `public.home` | `apps/web/src/server.ts` public landing | `npm run reviewer:smoke`, web tests |
| `/public-profiles` and `/public/gallery` | Public storytelling and approved profile projection guidance | `public.profiles.approved` | `apps/web/src/server.ts` public gallery | `npm run reviewer:smoke`, `npm run preview:smoke`, web tests |
| `/public/story/{id}` | Public story allowlist and revoked fallback guidance | `public.profiles.approved` | `apps/web/src/server.ts` public story | `npm run reviewer:smoke`, web tests |
| `/honoraries` | Public recognition route in `docs/surface-navigation-map.md` | `public.honoraries` | `apps/web/src/server.ts` honorary recognition page | `npm run reviewer:smoke`, web tests |
| `/memorials` | Public remembrance route in `docs/surface-navigation-map.md` | `public.memorials` | `apps/web/src/server.ts` memorial recognition page | `npm run reviewer:smoke`, web tests |
| `/contact` | Public contact route in `docs/surface-navigation-map.md` | `public.contact` | `apps/web/src/server.ts` public contact page | `npm run reviewer:smoke`, web tests |
| `/member/dashboard` | `Webpages/member-dashboard-page-sheet.md` | `member.dashboard` | `apps/web/src/server.ts` member dashboard | `npm run design:smoke`, `npm run reviewer:smoke`, web tests |
| `/member/profile` | `Webpages/member-profile-page-sheet.md` | `member.profile.edit`, `member.profile.visibility` | `apps/web/src/server.ts` profile visibility shell | `npm run design:smoke`, `npm run reviewer:smoke`, web tests |
| `/member/events` | `Webpages/member-events-page-sheet.md` | `member.events.view`, `member.events.rsvp` | `apps/web/src/server.ts` member events | `npm run reviewer:smoke`, API/web tests |
| `/member/directory` | `Webpages/member-directory-page-sheet.md` | `member.directory.view` | `apps/web/src/server.ts` member directory | `npm run design:smoke`, `npm run reviewer:smoke`, web tests |
| `/member/notifications` | `Webpages/member-notifications-page-sheet.md` | `member.notifications.view` | `apps/web/src/server.ts` notifications shell | `npm run design:smoke`, `npm run reviewer:smoke`, notification tests |
| `/admin` | Admin dashboard and reviewer pilot guidance | `admin.dashboard` | `apps/web/src/server.ts` admin dashboard | `npm run design:smoke`, `npm run reviewer:smoke`, web tests |
| `/admin/members` | `Webpages/admin-members-page-sheet.md` | `admin.members.manage` | `apps/web/src/server.ts` admin members | `npm run reviewer:smoke`, API/web tests |
| `/admin/events` | `Webpages/admin-events-page-sheet.md` | `admin.events.manage` | `apps/web/src/server.ts` admin events | `npm run reviewer:smoke`, API/web tests |
| `/admin/import/preview` | `Webpages/admin-import-preview-page-sheet.md` | `admin.import.preview` | `apps/web/src/server.ts` import preview | `npm run design:smoke`, `npm run reviewer:smoke`, import tests |
| `/admin/public-review` | `Webpages/admin-public-review-queue-page-sheet.md` | `admin.public-review.queue` | `apps/web/src/server.ts` public review queue | `npm run design:smoke`, `npm run reviewer:smoke`, public approval tests |
| `/admin/audit` | Admin audit route and audit catalog references | `admin.audit.read` | `apps/web/src/server.ts` audit readiness page | `npm run reviewer:smoke`, audit tests |

## Immediate Next Build Tasks

1. Add browser E2E coverage for the integrated route shells after the scripted reviewer smoke is stable:
   - desktop and mobile visual pass for public, member, and admin review paths,
   - console health,
   - focus visibility,
   - no clipping or overlap.

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

Use `npm run reviewer:smoke` for the broader reviewer walkthrough across public, member, and admin paths. It verifies public-safe recognition/contact routes, real preview credentials, member RSVP, admin member creation, admin event creation, surface-scoped navigation, and primary-action limits through the serverless preview handler.

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
