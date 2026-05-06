# Member Directory Page Sheet
## Page Acceptance Matrix

| Route | Surface | Primary task | One primary action | Required states | Policy/fallback requirement | Privacy or audit note | Open decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/member/directory` | Member | Search and browse a consent-scoped member directory. | Search/browse only; optional `View visible profile` remains secondary unless a member-only profile route is approved. | Empty, loading, result update, warning, error, consent missing. | Requires member-capable role, member surface, standing not blocked, and consent granted; fallback is `/member/consent-required`. | Show only consent-scoped fields; exclude contact methods and private/admin data. | Confirm searchable fields and whether `View visible profile` is deferred. |

## Strengthened Governance Notes

- Searchable fields for launch should be limited to visible display name, visible organisation, visible role/title, and approved member-safe keyword text.
- Fields that must never appear in the directory include private email, phone, physical address, internal IDs, audit records, standing reasons, admin notes, import metadata, private biography drafts, and unapproved images.
- Public-safe visibility in the directory does not mean public web publication.
- Do not reveal hidden members or hidden private fields through counts, empty-state copy, filters, disabled controls, or API-derived messages.

## Route

`/member/directory`

Surface: `member`

Task ID: `member.directory.view`

Access requirements: authenticated member/admin/chief_admin on the member surface, standing not blocked, and consent granted. Fallback: `/member/consent-required`.

## Primary task

Help a signed-in member search and browse a consent-scoped directory, showing only member information allowed by visibility and consent rules.

This page is a protected member workspace. It is not a public profile gallery, not an admin record screen, and not a contact database.

## Desktop layout

* Member workspace shell with visible IWFSA logo.
* Member-only navigation: Dashboard, Profile, Events, Directory, Notifications.
* Warm member workspace background using `apps/common/src/design-tokens.ts`.
* Top page band:

  * Georgia heading: "Member directory"
  * Purpose line: "Search visible member profiles according to each member's consent settings."
  * Privacy note: "Directory results follow member consent and visibility choices."
* Main content:

  * Full-width search and visibility filter area.
  * Results summary below search controls.
  * Compact member entries in a two-column card grid on wide desktop.
  * Full-width compact rows may be used later if the directory becomes dense.

## Mobile layout

* Single-column layout.
* Header compresses to logo, workspace title, and compact member navigation.
* Search input appears first after the page purpose line.
* Visibility filter appears below search.
* Member entries stack as compact cards.
* Buttons, inputs, filter controls, and reset controls must be at least 44px high.
* No horizontal scrolling, clipped text, or overlapping badges.

## Components

* `MemberWorkspaceHeader`

  * Logo from approved legacy asset path.
  * Member navigation only.
  * Active state on Directory.
* `PageBand`

  * Georgia title.
  * Short purpose line.
  * Privacy-aware helper copy.
* `DirectorySearch`

  * Persistent visible label.
  * Placeholder: "Search by name, organisation, role, or keyword".
* `DirectoryVisibilityFilter`

  * First-release filter only.
  * Options: All visible, Members only, Public-safe.
  * Do not include sector, region, or member group filters for launch.
* `DirectoryResultSummary`

  * Example: "Showing 18 visible members."
* `MemberDirectoryEntry`

  * Initials placeholder by default.
  * Approved portrait thumbnail only when already available and consent-scoped.
  * Name.
  * Role/title, if visible.
  * Organisation, if visible.
  * Visibility badge.
  * Optional secondary action: "View visible profile", only if a member-only profile route is approved.
* `VisibilityBadge`

  * Members only: `colors.semantic.members`.
  * Public-safe: `colors.semantic.public`.
  * Private: avoid showing private entries at launch unless policy explicitly approves limited placeholders.
* `InfoCallout`

  * Explains that visibility is consent-scoped and member-controlled.

Use `apps/common/src/design-tokens.ts` for all colors, spacing, radius, typography, focus states, and motion. Hard-coded UI colors are not allowed.

## Primary action

No heavy page-level primary CTA.

Primary interaction: search and browse the visible directory.

Per-entry action:

* Optional secondary action: "View visible profile".
* Show only when member consent and visibility allow it and the route is approved.
* No contact methods at launch.
* Do not show phone numbers, email addresses, physical addresses, social links, or personal websites.
* Do not include sector, region, or member group filters for launch.
* Do not include admin controls.
* Do not expose private profile data, admin notes, standing details, audit details, import state, or internal IDs.

## Empty / loading / success / warning / error states

Empty:

* Warm panel.
* Message: "No visible members match this search."
* Secondary action: "Clear search".
* Do not imply hidden private members exist.

Loading:

* Skeleton search field, visibility filter, result summary, and 5-8 directory entries.
* Preserve layout height to avoid page jump.
* Use subtle motion tokens only.

Success:

* Use quiet result feedback after search/filter changes.
* Example: "Showing 18 visible members."
* No celebratory success banner.

Warning:

* Use only when directory results are limited by consent rules.
* Message: "Some profile details may be hidden because members control what appears in the directory."
* Keep amber restrained.

Error:

* Message: "The directory could not be loaded. Please try again."
* Provide a retry control.
* Do not expose technical details, IDs, permission logic, policy internals, or private data.

## Accessibility notes

* Target WCAG 2.2 AA.
* Search input has a persistent visible label.
* Visibility filter uses labelled controls, not icon-only controls.
* Results count is visible and announced politely after search/filter changes.
* Keyboard order: header, page title, search, visibility filter, result summary, member entries, per-entry actions.
* Use tokenized focus styling from `apps/common/src/design-tokens.ts`.
* Visibility badges include readable text labels and screen-reader text, for example: "Visible to members only."
* Initials placeholders should expose the member's name through nearby text, not through decorative avatar labels.
* Portrait thumbnails need meaningful alt text only when they identify the member; otherwise use empty decorative alt text.

## Privacy / governance notes

* This is a protected member surface.
* Member navigation only; no admin controls, create/edit/delete, lifecycle tools, audit queues, or record management actions.
* Show only consent-scoped member information.
* Contact methods are fully excluded for launch, even where future consent rules may allow member-visible contact details.
* Admin-capable users on this route still see member-only navigation and member-surface controls.
* Directory styling must feel protected and member-only, not like public profile promotion.
* Visibility states must use semantic tokens.
* Public-safe does not mean public rendering from this page.
* Do not imply hidden private members or hidden private fields exist behind the interface.
* Use seed/example data only; no real private member details in mockups.

## Final open decisions

1. Confirm whether private members are excluded entirely at launch. Recommended: exclude them.
2. Confirm whether "View visible profile" opens a member-only profile route or is deferred. Recommended: defer unless the route is already approved.
3. Confirm result sorting. Recommended: alphabetical by surname for dignity and neutrality.

## Implementation Notes For Development

- Replace preview-only token constants, local color objects, inline styles, and hard-coded color values with `apps/common/src/design-tokens.ts` before production implementation.
- Remove demo-only `Preview states` panels from production member and admin routes.
- Add `data-primary-action` to the single main CTA for the route, and keep secondary actions visually and semantically secondary.
- Keep loading, empty, success, warning, error, waitlist, blocked, and consent demo states in a review/demo environment, not inside live member or admin pages.
- Route rendering must call the policy layer before privileged content or state-changing logic renders.
- State-changing requests must use the mapped route/API, session-bound single-use CSRF tokens, and audit labels where required by the surface map.
## Mobile And Accessibility Sign-Off

- No text, badges, table cells, buttons, or inputs may clip or overlap on mobile or desktop.
- Buttons, inputs, selects, toggles, and row actions must be at least 44px high.
- Keyboard focus must be visible and use the shared focus token.
- State badges must include text labels and accessible names; they must not rely on color alone.
- Mobile navigation must remain surface-scoped and must not expose public/member/admin controls across surfaces.
- Warning and error messages must be respectful, practical, and non-shaming, with no policy internals, stack traces, raw IDs, or private member details.