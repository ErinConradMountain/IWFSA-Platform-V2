# Member Notifications Page Sheet
## Page Acceptance Matrix

| Route | Surface | Primary task | One primary action | Required states | Policy/fallback requirement | Privacy or audit note | Open decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/member/notifications` | Member | Review notices and understand notification preferences. | `Save preferences` only if preferences are editable; otherwise no page-level primary CTA. | Empty, loading, success, warning, error, action-needed, unsupported channel. | Requires member-capable role, member surface, and standing not blocked; fallback is `/member/dashboard`. Preference updates require `/api/member/notification-preferences` with CSRF. | Notices must not expose private standing reasons, audit internals, admin commentary, or real contact details. | Confirm which channels are editable at launch. |

## Strengthened Governance Notes

- Active-now channels should be shown only where the backend can actually read or update them; in-app notices can be presented as current if route data supports them.
- Future channels such as SMS or expanded email preferences must be labelled `Unsupported`, `Unavailable`, or `Future`, not shown as active controls.
- Standing notices should use safe language such as `A membership review requires attention` and avoid internal reasons.
- Celebration notices must not imply public visibility or member consent outside the member surface.

## Route

`/member/notifications`

Task ID: `member.notifications.view`

Preference API, if supported: `/api/member/notification-preferences`

Use member-only navigation: Dashboard, Profile, Events, Directory, Notifications. Do not expose admin notification-management controls. The route is confirmed as a member-surface page in the navigation map. 

## Primary task

Help the member review notices and understand or update notification channel preferences in a calm message-centre layout.

One clear task: **review notifications and preferences**.

No heavy page-level CTA unless preferences are editable.

## Desktop layout

Use the shared member workspace shell:

* Header with visible IWFSA logo and member navigation only.
* Warm off-white page background.
* Georgia page title: **Member notifications**
* Short purpose line: "Review notices and manage how IWFSA reaches you."
* 12-column layout:

  * Left 8 columns: grouped notification list.
  * Right 4 columns: notification preference summary and channel controls.
* Use `apps/common/src/design-tokens.ts`; no hard-coded UI colors. The token file is the required source for colors, spacing, typography, motion, and semantic states. 

## Mobile layout

Single-column order:

1. Page title and purpose line.
2. Action-needed notices.
3. Preference summary.
4. Grouped notice sections.
5. Preference controls, if editable.

Use full-width rows/cards, 44px minimum controls, no horizontal scrolling, no clipped status labels.

## Components

* `MemberWorkspaceHeader`

  * Logo
  * "Member workspace" subtitle
  * Member-only nav
  * Active state on Notifications

* `PageIntro`

  * Georgia heading
  * Short sans-serif purpose line

* `PreferenceSummary`

  * Email: Enabled / Disabled / Not provided / Unsupported
  * SMS: Enabled / Disabled / Not provided / Unsupported
  * In-app: Enabled / Disabled / Unsupported
  * Annual preference status: Current / Needs review / Not yet configured

* `PreferenceControls`

  * Checkbox or toggle controls for Email, SMS, and In-app only if the backend supports updates.
  * Disabled state with explanation where a channel is unsupported or unavailable.
  * Use clear labels, not icons alone.

* `NotificationGroup`

  * Events
  * Standing
  * Celebrations
  * Administrative notices

* `NoticeRow`

  * Type label
  * Title
  * Date
  * Status badge: Unread, Sent, Action needed, Informational
  * Optional secondary detail line
  * Optional secondary action link for action-needed notices only

* `StatusBadge`

  * Action needed: strongest visual treatment.
  * Informational and sent: quiet treatment.
  * Unread: visible but restrained.

The notifications page should be grouped and calm rather than styled like a busy email inbox. 

## Primary action

If preferences are editable:

Primary action: **Save preferences**

If preferences are read-only or not yet supported:

No page-level primary CTA. Show preferences as a clear summary and use quiet links only where a notice requires action.

Action-needed notices may have their own local action, such as **Review RSVP** or **Update consent**, but only one primary action should appear in the main page area at a time. The single-task rule requires one primary task and no more than one primary CTA. 

## Empty state

Title: **No current notifications**

Copy: "There are no notices requiring your attention. New IWFSA updates will appear here when available."

Show preference summary if available.

No decorative empty inbox illustration.

## Loading state

* Skeleton rows grouped under the four section headings.
* Preference summary skeleton on desktop right column.
* No blank page.
* Preserve layout height to reduce shifting.

## Success state

For saved preferences:

Title: **Preferences saved**

Copy: "Your notification preferences have been updated."

Use soft success treatment from semantic tokens. Do not show technical audit detail.

## Warning state

Use for:

* Annual preferences need review.
* SMS is unavailable because no verified mobile number exists.
* A notice requires action.

Copy should be practical and non-alarming.

Do not expose private standing reasons.

## Error state

Use for:

* Notifications failed to load.
* Preferences failed to save.
* Channel state is unavailable.

Copy: "We could not load your notifications. Please try again."

Do not expose API errors, audit internals, standing reasons, or private administrative notes.

## Accessibility notes

* Target WCAG 2.2 AA.
* Use Georgia for the page heading and section headings; use sans-serif for notices, controls, labels, metadata, and badges.
* All toggles/checkboxes require visible labels and keyboard focus.
* Each notice row should expose type, title, date, and status to assistive technology.
* Group headings must be semantic headings.
* Status must not rely on color alone.
* Buttons and inputs must be at least 44px high.
* Focus ring uses the design token for focus blue.
* Motion, if used, must be subtle and not required to understand state. 

## Privacy/governance notes

* Member notifications are shown only within the member surface.
* Do not show admin notification-management tools.
* Do not show private standing reasons, audit trail internals, or administrative commentary.
* Standing notices may say "A membership review requires attention" but must not reveal internal reasoning.
* Celebration notices must not imply public visibility or consent beyond the member surface.
* Preference controls must use surface-aware component props where available: `surface`, `visibility`, `consentGate`, `auditLabel`, and token references. 
* No real contact details or sensitive member data in mockups.

## Open decisions

1. Confirm whether notification preferences are editable at launch or read-only.
2. Confirm whether SMS is supported at launch or shown as disabled/unavailable.
3. Confirm whether unread state is persisted or display-only.
4. Confirm allowed local actions for action-needed notices.
5. Confirm final copy for standing-related notices to avoid exposing private reasons.

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