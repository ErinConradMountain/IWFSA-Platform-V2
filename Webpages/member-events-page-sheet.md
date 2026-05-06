# Member Events Page Sheet
## Page Acceptance Matrix

| Route | Surface | Primary task | One primary action | Required states | Policy/fallback requirement | Privacy or audit note | Open decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/member/events` | Member | View published member events and complete one RSVP decision per event. | Per event: `RSVP`, `Join waitlist`, `View RSVP`, or `View waitlist status`; never simultaneous competing primary actions. | Empty, loading, success, waitlist, warning, error, blocked standing, cancelled event. | Requires member-capable role, member surface, and standing not blocked; fallback is `/member/standing`. RSVP changes require mapped policy and CSRF. | Show aggregate capacity only; do not expose attendee lists or admin event lifecycle controls. | Confirm whether members may cancel or change RSVP in this phase. |

## Strengthened Governance Notes

- RSVP success changes the event card to confirmation state and records the member action through the mapped RSVP policy/audit path when implemented.
- Waitlist success changes the card to waitlist status and explains that notification may follow if a place becomes available.
- Blocked standing must route to `/member/standing` before RSVP controls render; do not show private standing reasons.
- Cancelled events must be read-only, clearly labelled, and must not show an active RSVP or waitlist CTA.

## Route

`/member/events`

Task mapping:

* `member.events.view`
* `member.events.rsvp`

Fallback when standing is blocked: `/member/standing` 

---

## Primary task

Help a member view published member-only events and complete one clear RSVP action per event.

The page must feel like a calm IWFSA member service, not an admin event editor. Member pages must not expose admin create, edit, delete, or lifecycle controls. 

---

## Desktop layout

Use the standard member workspace shell with visible IWFSA logo, member-only navigation, warm off-white background, and Georgia page heading. 

**12-column layout:**

* **Top page band, full width**

  * Georgia heading: `Member events`
  * Purpose line: `View published member events and manage your RSVP.`
  * Small members-only reassurance line: `Only available member events are shown here.`

* **Toolbar, full width**

  * Left: `Available events`
  * Right: optional filters only if already supported:

    * Upcoming
    * RSVP confirmed
    * Waitlist
  * Filters must be secondary; they must not compete with RSVP.

* **Event board**

  * Preferred default: responsive event cards in a 3-column grid.
  * Use rows only if the event list becomes dense later.
  * Each card is a single surface, not nested inside another card.
  * Cards use subtle border, restrained shadow, and radius of 8px or less. 

---

## Mobile layout

Single-column event board.

Order inside each card:

1. Event title
2. Date/time/location summary
3. Event visibility/status chip
4. RSVP state
5. Capacity/waitlist note
6. One primary action button

Buttons must be at least 44px high and full-width or comfortably tappable. Text must not overflow or wrap awkwardly inside controls. 

---

## Components

### Page header

* IWFSA logo
* Section label: `Member workspace`
* Member navigation only:

  * Dashboard
  * Profile
  * Events
  * Directory
  * Notifications

No public or admin links.

### Page title band

* Georgia heading
* One short purpose line
* Optional member-only callout using the members-only semantic token

### Event card

Each card includes:

* Event title, Georgia or strong serif subheading
* Event status chip:

  * `Member event`
  * `RSVP open`
  * `RSVP closed`
  * `Waitlist available`
* Date/time
* Location or format:

  * Venue
  * Online
  * To be confirmed
* Capacity summary:

  * `24 of 40 places reserved`
  * `Full - waitlist open`
  * `Limited places remaining`
* Member's RSVP state:

  * `Not yet responded`
  * `RSVP confirmed`
  * `On waitlist`
  * `Unable to RSVP`
* One primary action button
* Optional quiet secondary text only when needed:

  * `You can update your RSVP before the closing date.`

### RSVP result message

Appears near the relevant event card, not as a global banner unless the whole page action fails.

---

## Primary action

Each event card has exactly one primary action.

Priority rule:

1. If the member has not RSVP'd and places are available: `RSVP`
2. If the event is full and waitlist is open: `Join waitlist`
3. If RSVP is confirmed: `View RSVP`
4. If member is already waitlisted: `View waitlist status`
5. If RSVP is closed or unavailable: disabled/read-only state with explanatory text, not a competing button

No event card may show both `RSVP` and `Join waitlist` as simultaneous primary actions.

---

## Empty/loading/success/waitlist/warning/error states

### Empty state

Use a warm panel.

Title: `No available events at the moment`
Text: `Published member events will appear here when they are open for viewing.`
Action: `Return to dashboard`

### Loading state

Use skeleton event cards.

* Skeleton title line
* Skeleton metadata rows
* Skeleton button block
* No spinner-only blank page

### Success state

Soft green confirmation.

Title: `RSVP confirmed`
Text: `Your place has been reserved for this event.`
Action on card changes to: `View RSVP`

### Waitlist state

Warm amber notice.

Title: `You have joined the waitlist`
Text: `This event is currently full. You will be notified if a place becomes available.`
Action on card changes to: `View waitlist status`

### Warning state

Used for closed, full, or standing-related limitations.

Examples:

* `RSVPs are closed for this event.`
* `This event is full and the waitlist is closed.`
* `Standing review is required before RSVP actions are available.`

Use warning color sparingly. Do not make the page feel punitive.

### Error state

Restrained red block.

Title: `RSVP could not be completed`
Text: `Please try again. If the issue continues, contact IWFSA support.`

Do not expose technical errors, policy internals, stack traces, or admin audit details.

---

## Accessibility notes

* Target WCAG 2.2 AA. 
* Each RSVP button must include event context for screen readers, for example:

  * `RSVP for Leadership Roundtable`
  * `Join waitlist for Annual Members Dinner`
* Status chips must not rely on color alone.
* Keyboard order:

  1. Page heading
  2. Toolbar/filter controls
  3. Event cards in visual order
  4. Primary action inside each card
* Focus ring uses the focus token.
* Capacity and waitlist information must be readable as text, not only icons.
* Disabled RSVP actions must explain why.

---

## Privacy/governance notes

* Only published member events appear on this page. 
* The page is member-surface only and must use member navigation only. 
* Do not show admin controls:

  * Create event
  * Edit event
  * Delete event
  * Lifecycle status controls
  * Audit tools
* Do not expose private attendee lists unless explicitly approved by policy.
* RSVP count and waitlist count may be shown as aggregate capacity information only.
* Do not show sensitive member contact details.
* Use design tokens from `apps/common/src/design-tokens.ts`; avoid hard-coded UI colors outside the token system. 

---

## Open decisions

1. Should event display use cards as the permanent default, or switch to rows after a certain event count?
2. Should members be allowed to cancel or change an RSVP from this page, or should `View RSVP` open a separate confirmation route?
3. Are waitlist counts visible to members, or should the card only say `Waitlist available`?
4. Should filters launch in the first implementation, or should the first version show a simple upcoming-events board only?

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