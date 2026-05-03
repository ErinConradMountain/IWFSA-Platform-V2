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
| `/admin/imports` | `admin.import.preview` | Import preview | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/import/preview` | `admin.import.preview` | Review import preview | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/import/resolve-duplicate` | `admin.import.preview` | Resolve duplicate row | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/import/commit` | `admin.import.commit` | Commit reviewed import | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/imports` | `admin.import.commit` | Import commit | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/standing` | `admin.standing.manage` | Manage standing | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/public-review` | `admin.public-review.queue` | Review public profile queue | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/public-review/approve` | `admin.public-review.queue` | Approve public render | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/api/admin/public-profiles/queue` | `admin.public-review.queue` | List public approval records by status | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/api/admin/public-profiles/{id}/approve` | `admin.public-review.queue` | Approve public profile publication request | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on`, `member_standing=good` | `/` |
| `/api/admin/public-profiles/{id}/revoke` | `admin.public-review.queue` | Revoke public profile publication | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on`, `member_standing=good` | `/` |
| `/api/admin/public-profiles/{id}/final-approve` | `admin.public-review.queue` | Complete honorary or memorial final approval | `role=chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on`, `member_standing=good` | `/` |
| `/api/admin/notifications/broadcast/preview` | `admin.notifications.broadcast` | Preview eligible notification broadcast audience without enqueueing | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on`, CSRF token | `/` |
| `/admin/audit` | `admin.audit.read` | Read audit logs | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |
| `/admin/support-notes` | `admin.support-notes.add` | Add support notes | `role=admin/chief_admin`, `surface=admin`, `standing=active`, `audit_trail=on` | `/` |

## Missing Mapping Rule

If a requested route or task is not listed here, the API must return `403` with `POLICY_MISSING_MAPPING` and emit `POLICY_DENY`. The web surface must redirect to the surface-safe fallback without exposing whether the restricted route exists.

## UX Contract

- Each mapped page has one primary task.
- Member dashboard primary CTA: Complete profile.
- Admin dashboard primary CTA: Review imports.
- Public homepage primary CTA: Sign in.
- Secondary choices must be represented through surface navigation, not competing primary buttons.
- No route may show navigation links from another protected surface.
