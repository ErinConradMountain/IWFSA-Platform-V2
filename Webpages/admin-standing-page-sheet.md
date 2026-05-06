## Admin Standing Page Sheet

### Route

`/admin/standing`

### Primary task

Allow administrators to review and update a member's standing with care, clear access implications, and audit awareness.

### Desktop layout

* Admin workspace header with IWFSA logo and admin-only navigation.
* Warm-neutral admin page shell using `apps/common/src/design-tokens.ts`.
* Georgia page title: **Member standing stewardship**.
* Short purpose line: "Review standing carefully before changing access."
* 12-column layout:

  * Left/main 8 columns: searchable member standing table.
  * Right 4 columns: selected member standing review panel.
* No standing update controls appear until a member row is selected.

### Mobile layout

* Header collapses to logo, admin label, and compact admin navigation.
* Search and filter controls stack above the list.
* Member records display as compact rows/cards.
* Selecting a member opens the standing review panel below the selected record or as a full-width step.
* Confirmation appears as a dedicated mobile step before any restrictive change is saved.

### Components

* Admin header with logo and admin-only navigation.
* Page title band.
* Search input.
* Simple standing filter.
* Member standing table/list:

  * Member name or safe identifier.
  * Current standing chip.
  * Access implication summary.
  * Last updated date.
  * Last updated by.
  * Audit status chip.
* Selected member review panel:

  * Current standing.
  * Proposed standing.
  * Plain-language access impact.
  * Required reason selector or short governance note field if supported.
  * Audit preview.
* Standing chips:

  * Good / active.
  * Review required.
  * Restricted.
  * Blocked.
* Confirmation dialog or confirmation step.
* Restrained success, warning, and error callouts.

### Primary action

Only shown after a member and a standing update are selected:

**Confirm standing update**

No page-level primary CTA before selection.

### Empty/loading/success/warning/error states

* **Empty:** "No member standing records are available for review." Provide no destructive or bulk action.
* **Loading:** Skeleton rows for table/list and disabled review panel placeholder.
* **Success:** "Standing updated. Access implications and audit record have been saved."
* **Warning:** Used when the proposed change restricts access. Explain the access impact plainly before confirmation.
* **Error:** "Standing update could not be saved. Review the details and try again." Do not expose technical detail or private audit internals.

### Standing change confirmation state

Required before any restrictive standing change, especially changes that limit member access.

Confirmation content:

* Member safe display name or identifier.
* Current standing.
* Proposed standing.
* Access implication summary, for example:

  * "This member may lose access to member events."
  * "This member may be redirected from restricted member routes."
* Audit preview:

  * Changed by.
  * Timestamp.
  * Standing before and after.
  * Governance reason category, if supported.
* Confirmation checkbox:

  * "I understand this change may affect member access."
* Primary action: **Confirm standing update**
* Secondary action: **Cancel**

Use restrained warning styling, not full danger styling. Restrictive standing changes should feel serious, not punitive.

### Accessibility notes

* Target WCAG 2.2 AA.
* Buttons, inputs, selects, and row actions must be at least 44px high.
* Standing chips must include text labels, not color alone.
* Confirmation dialog must trap focus and return focus to the selected member row after close.
* Keyboard order: search/filter -> member list -> selected review panel -> confirmation.
* Use visible focus states from `apps/common/src/design-tokens.ts`.
* Validation messages must be specific and respectful.

### Privacy/governance notes

* Admin-only route and navigation.
* No member self-service styling.
* No public profile or gallery styling.
* No private notes exposed in list view.
* Standing changes must show access implications before save.
* Restrictive changes require confirmation.
* Audit-aware metadata must be visible without exposing sensitive internal reasoning.
* Use stewardship language: "review," "standing," "access implication," "audit record."
* Do not use shaming language such as "bad standing" or "failed member."
* Styling must use `apps/common/src/design-tokens.ts`; no hard-coded UI colors.

### Open decisions

* Confirm the exact standing values supported by policy.
* Confirm whether a reason category is required for every standing change or only restrictive changes.
* Confirm whether standing history appears on this page or only in the audit surface.
* Confirm whether blocked members are hidden from member surfaces immediately or after save confirmation only.

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