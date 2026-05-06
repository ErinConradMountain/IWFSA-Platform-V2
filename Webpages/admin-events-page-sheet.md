# Admin Events Page Sheet
## Page Acceptance Matrix

| Route | Surface | Primary task | One primary action | Required states | Policy/fallback requirement | Privacy or audit note | Open decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin/events` plus mapped edit/delete/API routes | Admin | Steward temporary event records, capacity, lifecycle, and audit-aware changes. | `Create event` on the list route; row actions remain secondary and confirmation-gated where destructive. | Empty, loading, success, warning, error, delete confirmation, lifecycle update. | Requires admin/chief admin, admin surface, active standing, audit trail on, policy checks, and CSRF for state-changing API routes; fallback is `/`. | Show counts and audit labels, not private attendee lists or member controls. | Confirm supported lifecycle states and delete/archive semantics. |

## Route

* `/admin/events`
* Related workflow routes:

  * `/admin/events/{id}/edit`
  * `/admin/events/{id}/delete`
* Related API routes:

  * `/api/admin/events`
  * `/api/admin/events/{id}`
  * `/api/admin/events/{id}/state`

Admin events are mapped as `admin.events.manage` and require `role=admin/chief_admin`, `surface=admin`, `standing=active`, and `audit_trail=on`. Fallback is `/`. 

## Primary task

Allow administrators to steward event records safely: create, review, edit, change lifecycle status where supported, and delete temporary event records with audit awareness.

One primary page action: **Create event**.

## Desktop layout

* Admin workspace shell using `apps/common/src/design-tokens.ts`.
* Header:

  * IWFSA logo.
  * "Admin workspace" label.
  * Admin-only navigation.
  * No member navigation.
* Top band:

  * Georgia page title: **Event stewardship**
  * Short subtitle: "Create and manage member event records with capacity, lifecycle, and audit visibility."
  * Primary button: **Create event**
* Main 12-column layout:

  * Columns 1 to 8: event records table/list.
  * Columns 9 to 12: operational summary panel.
* Event record row:

  * Event title.
  * Date/time/location if available.
  * Lifecycle status chip: display the status value supplied by the backend or mapped admin event state endpoint; do not invent unsupported lifecycle labels in the UI.
  * Capacity summary: confirmed RSVPs, remaining capacity, waitlist count.
  * Audit metadata: last updated date, updated by role/name where safe, audit label.
  * Row actions: Edit, Change status, Delete.
* Secondary panel:

  * Count of active/published events.
  * Capacity pressure summary.
  * Waitlist attention summary.
  * Recent audit-aware activity summary.

Admin pages should feel like careful stewardship tools, not member self-service pages; admin event pages should support create, edit, delete, lifecycle status, capacity, and audit awareness. 

## Mobile layout

* Single-column admin layout.
* Header compresses to logo, admin label, and compact admin navigation.
* Top band remains first:

  * Title.
  * Purpose line.
  * Full-width **Create event** button.
* Event records become stacked operational rows:

  * Title and lifecycle chip first.
  * Date/location second.
  * Capacity and RSVP/waitlist summary third.
  * Audit metadata fourth.
  * Actions last in a clear button group.
* Delete remains visually restrained and never appears as the first action.

## Components

* `AdminWorkspaceHeader`
* `PageTitleBand`
* `PrimaryActionButton`
* `EventRecordsTable` / `EventRecordList`
* `LifecycleStatusChip`
* `CapacitySummary`
* `RsvpWaitlistSummary`
* `AuditMetadataLabel`
* `CreateEventForm`
* `EditEventForm`
* `LifecycleStatusControl`
* `DeleteEventButton`
* `DeleteConfirmationDialog`
* `InfoCallout`
* `StatePanel`

Use token groups from `apps/common/src/design-tokens.ts`, including `colors.primary`, `colors.secondary`, `colors.semantic.audit`, `colors.semantic.public`, `colors.semantic.warning`, `colors.semantic.error`, typography, spacing, and motion. Hard-coded UI colors and inline style attributes are prohibited outside the token file. 

## Primary action

**Create event**

* Opens an inline create workflow on `/admin/events` and uses the mapped `/api/admin/events` create capability. Do not introduce a separate create route unless it is formally added to `docs/surface-navigation-map.md` and the policy layer.
* After successful creation, return to `/admin/events` with the new record visible.

## Empty/loading/success/warning/error states

### Empty

* Message: "No event records have been created yet."
* Supporting text: "Create the first event record when programme details are ready for stewardship."
* Action: **Create event**

### Loading

* Skeleton rows for event records.
* Loading label: "Loading event records."
* No blank table.

### Success

* Create: "Event record created."
* Edit: "Event record updated."
* Lifecycle: "Event status updated."
* Delete: "Event record deleted."
* Include audit-aware confirmation text where supported: "This action has been recorded."

### Warning

* Capacity warning when confirmed RSVPs approach or meet capacity.
* Waitlist warning when waitlist count is greater than zero.
* Lifecycle warning before publishing incomplete event details.
* Copy remains operational, not alarming.

### Error

* Generic error panel:

  * "We could not complete this event update."
  * "Please review the fields and try again."
* Do not expose stack traces, database errors, policy internals, or private member details.

## Delete confirmation state

* Triggered only from a restrained **Delete** action on an existing event record.
* Destructive styling:

  * Red text or red border only.
  * Avoid full red filled button unless inside the final confirmation dialog.
* Confirmation dialog:

  * Title: **Delete event record?**
  * Body: "This removes the temporary event record from the admin workspace. Confirm only if this record is no longer needed."
  * Show safe event identifier: event title and date if available.
  * Do not show member RSVP names or private participant details.
  * Primary destructive action: **Confirm delete**
  * Secondary action: **Cancel**
* After deletion:

  * Return to `/admin/events`.
  * Show success state.
  * Record audit metadata where supported.

## Accessibility notes

* Target WCAG 2.2 AA.
* Georgia for title and section headings; sans-serif for dense admin controls, labels, metadata, and table text.
* Buttons and inputs minimum 44px high.
* Table/list rows must be keyboard navigable.
* Row actions must have clear labels:

  * "Edit [event title]"
  * "Change status for [event title]"
  * "Delete [event title]"
* Delete confirmation must trap focus, support Escape/cancel, and return focus to the triggering Delete button.
* Status chips need text labels, not color alone.
* Validation messages must be instructive and respectful.
* Motion must be subtle and not required to understand state.

The universal handoff requires visible logo, surface-scoped navigation, one clear primary task, no more than one primary action, token-based styling, strong state coverage, and WCAG-aligned focus/contrast behavior. 

## Privacy/governance notes

* Admin-only surface. No member RSVP controls.
* No public storytelling layout or public event-promotion styling.
* Do not expose private member participant details in event rows.
* RSVP and waitlist are shown as counts/summaries only unless a later mapped admin route explicitly permits detailed participant review.
* Lifecycle changes must use admin policy checks and CSRF protection through mapped admin API routes.
* Audit metadata should be visible enough for operational confidence but must not expose unnecessary internal audit detail.
* Cross-surface navigation is not allowed; admin navigation remains separate from member and public navigation. 

## Open decisions

* Confirm the backend-supported event status values exposed by `/api/admin/events/{id}/state`; until then, render a generic backend status chip rather than hard-coded lifecycle labels.
* Launch decision: event creation stays inline on `/admin/events`; do not design a separate create route unless it is formally mapped later.
* Confirm whether RSVP/waitlist summaries are counts only for launch.
* Confirm whether deletion is hard delete, soft delete, or archive once production event records replace temporary records.
* Confirm exact audit metadata fields allowed in the admin list view.




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