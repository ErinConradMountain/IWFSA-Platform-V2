# Member Dashboard Page Sheet
## Page Acceptance Matrix

| Route | Surface | Primary task | One primary action | Required states | Policy/fallback requirement | Privacy or audit note | Open decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/member/dashboard` | Member | Orient the member and guide the next useful action. | One priority CTA, such as `Complete profile` or `Review upcoming event`, based on policy-safe priority rules. | Default, empty, loading, success, warning, error. | Requires member-capable role, member surface, and standing not blocked; safe fallback remains `/member/dashboard`. | Do not expose admin controls, private standing reasons, audit internals, or public-profile assumptions. | Confirm the priority order for choosing the dashboard CTA. |

**Route**
`/member/dashboard`

**Purpose**
Orient the member inside her IWFSA workspace and guide her toward one clear next useful action. The page should feel like a personal leadership desk, not a generic portal menu. 

**Primary task**
Help the member quickly understand her profile, event, directory, and notification status, then act on the most important next step.

**Primary action**
One strongest CTA only, for example: **Complete profile** or **Review upcoming event**. Secondary routes should remain quieter text links. 

---

## Desktop Layout

**Shell**

* Member workspace header with clearly visible IWFSA logo.
* Member-only navigation: Dashboard, Profile, Events, Directory, Notifications.
* Warm off-white page background using the accepted member palette.

**Top band**

* Georgia welcome heading: "Welcome back" or "Member workspace".
* Short purpose line in calm, professional language.
* Primary CTA aligned clearly within the welcome area.

**Main grid**

* 12-column layout.
* Left 7 columns: **Today's member priorities**

  * Most important next action.
  * Upcoming event or profile completion prompt.
  * Calm explanatory copy.
* Right 5 columns: **Member status summary**

  * Profile status.
  * Event status.
  * Directory visibility/consent status.
  * Notification status.
* Secondary quick links beneath or beside the status summary, visually lighter than the main CTA.

---

## Mobile Layout

* Header compresses to logo, workspace title, and compact member navigation.
* Single-column stack:

  1. Welcome heading.
  2. Purpose line.
  3. Primary CTA.
  4. Status summary.
  5. Today's priorities.
  6. Secondary links.
* Buttons should be full-width or comfortably thumb-sized.
* No card, label, or button text may clip or overflow.

---

## Components

* `MemberWorkspaceHeader`
* `WelcomeBand`
* `PrimaryActionButton`
* `StatusSummary`
* `StatusChip`
* `PriorityPanel`
* `QuickLinkList`
* `InfoCallout`, where contextual privacy or consent explanation is needed
* Empty/loading/error/success state components using shared member styling

Use Georgia for page and section headings; use sans-serif type for labels, metadata, buttons, status chips, and repeated interface text. 

---

## States

**Default**

* Shows welcome, current status, next priority, and one primary CTA.

**Empty**

* Used when no events, notices, or profile task is available.
* Warm panel copy: "You are up to date for now."
* CTA may become "View profile" or "Browse member events," but only one primary action remains.

**Loading**

* Subtle skeleton rows for status cards and priority area.
* No blank page.

**Success**

* Soft green confirmation after a profile, RSVP, or notification action completes.
* Copy should be concise and reassuring.

**Warning**

* Amber accent only where action is needed, such as standing review or missing consent.
* Provide practical next step.

**Error**

* Restrained red accent.
* Generic, non-technical message.
* No sensitive policy, server, or member data exposed.

---

## Accessibility

* Target WCAG 2.2 AA.
* Keyboard order follows the page task: heading -> purpose -> primary CTA -> status summary -> secondary links.
* Buttons and inputs minimum 44px high.
* Visible focus state using focus blue.
* Status chips must not rely on color alone; include readable text labels.
* Heading hierarchy must be logical: one page `h1`, then section `h2`s.
* Motion should be subtle and never required to understand state. 

---

## Privacy Notes

* This is a member surface only.
* Do not expose admin controls, audit internals, private standing reasons, or public-profile assumptions.
* Directory and profile indicators must respect consent and visibility state.
* Example content must use placeholder data only, with no real contact details or sensitive member information.
* If standing is blocked, route behavior should fall back to the respectful member standing page where required. 

---

## Open Decisions

1. What determines the dashboard's primary CTA priority: incomplete profile, upcoming event, unread notice, or consent status?
2. Should the welcome heading use the member's first name, or remain generic for privacy and shared-screen comfort?
3. Should event status show only the next upcoming RSVP item, or a count of all active member events?
4. Should notification status display unread count, action-needed count, or both?
5. Does the dashboard require a small profile completeness meter, or should completion remain a simple status chip?

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