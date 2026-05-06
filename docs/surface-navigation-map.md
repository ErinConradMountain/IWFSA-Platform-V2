# Surface Navigation Map

## Purpose

This file is the source of truth for Phase 2 route generation, policy checks, task alignment, and fallback behavior. Code must not introduce a public, member, or admin task unless it is represented here and in `apps/common/src/policy.ts`.

## Public Surface

| Route | Task ID | Allowed Task | Required Policy Inputs | Fallback |
| --- | --- | --- | --- | --- |
| `/` | `public.home` | View homepage | `surface=public` | `/` |
| `/public-profiles` | `public.profiles.approved` | View approved public profiles | `surface=public`, `standing=good`, `visibility=public`, `consent=granted`, `approved=true` | `/404` |
| `/api/public/profiles` | `public.profiles.approved` | Read approved public-safe profile projection | `surface=public`, `standing=good`, `visibility=public`, `consent=granted`, `approved=true`, cache headers | `/404` |
| `/public/gallery` | `public.profiles.approved` | Render approved public-safe gallery | `surface=public`, projection allowlist, anonymous cache-safe rendering | `/404` |
| `/public/story/{id}` | `public.profiles.approved` | Render one approved public-safe story | `surface=public`, projection allowlist, noindex on missing/revoked paths | `/404` |
| `/robots.txt` | `public.home` | Publish crawler rules for protected and revoked paths | `surface=public` | `/` |
| `/honoraries` | `public.honoraries` | View approved honorary entries | `surface=public`, `standing=good`, `visibility=public`, `consent=granted`, `approved=true` | `/404` |
| `/memorials` | `public.memorials` | View approved memorial entries | `surface=public`, `standing=good`, `visibility=public`, `consent=granted`, `approved=true` | `/404` |
| `/contact` | `public.contact` | View public contact information | `surface=public` | `/` |

## Member Surface

| Route | Task ID | Allowed Task | Required Policy Inputs | Fallback |
| --- | --- | --- | --- | --- |
| `/member` | `member.dashboard` | Redirect-compatible member entry | `role=member/admin/chief_admin`, `surface=member`, `standing!=blocked` | `/member/dashboard` |
| `/member/dashboard` | `member.dashboard` | View member dashboard | `role=member/admin/chief_admin`, `surface=member`, `standing!=blocked` | `/member/dashboard` |
| `/member/profile` | `member.profile.edit` | Edit profile | `role=member/admin/chief_admin`, `surface=member`, `standing!=blocked`, `consent=granted` | `/member/consent-required` |
| `/member/profile/edit` | `member.profile.edit` | Update one profile field | `role=member/admin/chief_admin`, `surface=member`, `standing!=blocked`, `consent=granted` | `/member/consent-required` |
| `/member/profile/visibility` | `member.profile.visibility` | Set field visibility | `role=member/admin/chief_admin`, `surface=member`, `standing!=blocked`, `consent=granted` | `/member/consent-required` |
| `/member/profile/confirmation` | `member.profile.edit` | Confirm profile audit trail | `role=member/admin/chief_admin`, `surface=member`, `standing!=blocked`, `consent=granted` | `/member/dashboard` |
| `/member/profile` | `member.profile.visibility` | Set visibility and consent | `role=member/admin/chief_admin`, `surface=member`, `standing!=blocked`, `consent=granted` | `/member/consent-required` |
| `/member/events` | `member.events.view` | View member-only events | `role=member/admin/chief_admin`, `surface=member`, `standing!=blocked` | `/member/standing` |
| `/member/events` | `member.events.rsvp` | RSVP to events | `role=member/admin/chief_admin`, `surface=member`, `standing!=blocked` | `/member/standing` |
| `/member/directory` | `member.directory.view` | View consent-scoped directory | `role=member/admin/chief_admin`, `surface=member`, `standing!=blocked`, `consent=granted` | `/member/consent-required` |
| `/member/notifications` | `member.notifications.view` | View notifications | `role=member/admin/chief_admin`, `surface=member`, `standing!=blocked` | `/member/dashboard` |
| `/api/member/notification-preferences` | `member.notifications.view` | Update annual notification channel preferences | `role=member/admin/chief_admin`, `surface=member`, `standing!=blocked`, CSRF token | `/member/dashboard` |

## Admin Surface

| Route | Task ID | Allowed Task | Required Policy Inputs | Fallback |
| --- | --- | --- | --- | --- |
| `/admin` | `admin.dashboard` | View admin dashboard | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/members` | `admin.members.manage` | Manage temporary member records | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/members/{id}/edit` | `admin.members.manage` | Edit temporary member record | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/members/{id}/delete` | `admin.members.manage` | Delete temporary member record | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/api/admin/members` | `admin.members.manage` | List or create temporary member records | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on`, CSRF token for create | `/` |
| `/api/admin/members/{id}` | `admin.members.manage` | Update or delete temporary member records | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on`, CSRF token | `/` |
| `/admin/imports` | `admin.import.preview` | Import preview | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/import/preview` | `admin.import.preview` | Review import preview | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/import/resolve-duplicate` | `admin.import.preview` | Resolve duplicate row | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/import/commit` | `admin.import.commit` | Commit reviewed import | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/imports` | `admin.import.commit` | Import commit | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/standing` | `admin.standing.manage` | Manage standing | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/members/clean-slate` | `admin.members.clean_slate` | Clear temporary seed members before production setup | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/api/admin/members/clean-slate` | `admin.members.clean_slate` | Execute temporary seed member cleanup | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on`, CSRF token | `/` |
| `/admin/events` | `admin.events.manage` | Manage temporary event records | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/events/{id}/edit` | `admin.events.manage` | Edit temporary event record | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/events/{id}/delete` | `admin.events.manage` | Delete temporary event record | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/api/admin/events` | `admin.events.manage` | List or create temporary event records | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on`, CSRF token for create | `/` |
| `/api/admin/events/{id}` | `admin.events.manage` | Update or delete temporary event records | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on`, CSRF token | `/` |
| `/api/admin/events/{id}/state` | `admin.events.manage` | Change temporary event lifecycle state | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on`, CSRF token | `/` |

## Missing Mapping Rule

If a requested route, privileged task, state-changing API handler, form, or workflow is not represented in this map, implementation must stop before adding business logic. The route must return or follow `POLICY_MISSING_MAPPING` behavior through the policy layer, use a surface-safe fallback, and record the unresolved mapping in `decision-log.md` before the route is added to this document.

## UX Contract

- Every page represented here must have one primary task and no more than one `data-primary-action`.
- Public navigation may expose public routes only.
- Member navigation may expose member routes only.
- Admin navigation may expose admin routes only.
- Member pages must not render admin controls, even when an admin-capable user is allowed to view a member surface for support.
- Admin pages must use stewardship language and audit-aware controls, not member self-service styling.
- Page styling must use design tokens from `apps/common/src/design-tokens.ts`; hard-coded UI colors and inline style attributes are not allowed in route rendering.
