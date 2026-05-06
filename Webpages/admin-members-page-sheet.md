## Admin Members Page Sheet
## Page Acceptance Matrix

| Route | Surface | Primary task | One primary action | Required states | Policy/fallback requirement | Privacy or audit note | Open decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin/members` plus mapped edit/delete/clean-slate/API routes | Admin | Steward temporary member records safely before production setup. | `Create temporary member`; destructive cleanup stays separated and confirmation-gated. | Empty, loading, success, warning, error, delete confirmation, clean-slate confirmation. | Requires admin/chief admin, admin surface, active standing, audit trail on, policy checks, and CSRF for mutations; fallback is `/`. | Actions affecting records, standing, visibility, approval, or cleanup require confirmation and audit-aware feedback. | Confirm temporary fields, delete semantics, and clean-slate permission level. |

## Strengthened Governance Notes

- Create, edit, delete, clean slate, standing-related changes, public-safe visibility changes, approval changes, and any import-assisted mutation require confirmation and audit-aware outcomes.
- Delete confirmation must identify only the temporary record safely and must not expose private contact data.
- Clean Slate is not ordinary record management; keep it visually separated, high-friction, and limited to temporary seed records.
- Admin list views may show status chips and minimal stewardship metadata, but not raw audit logs or private member identity details beyond what is necessary for the task.

### Route

`/admin/members`

Related mapped routes:

* `/admin/members/{id}/edit`
* `/admin/members/{id}/delete`
* `/admin/members/clean-slate`
* `/api/admin/members`
* `/api/admin/members/{id}`
* `/api/admin/members/clean-slate`

Admin Members is mapped as `admin.members.manage`, and Clean Slate is mapped separately as `admin.members.clean_slate`; both require admin or chief admin role, admin surface, active standing, and audit trail on. 

### Primary task

Steward temporary member records safely before production setup.

The page supports finding, reviewing, creating, editing, and deleting temporary member records. It must feel like an operational stewardship console, not a member profile experience or public gallery.

### Desktop layout

12-column admin layout using `apps/common/src/design-tokens.ts`.

* Header: IWFSA logo, "Admin workspace", admin-only navigation.
* Page band: Georgia title, short operational subtitle, audit-aware helper text.
* Main work area:

  * Left/main 9 columns: searchable member records table.
  * Right 3 columns: stewardship summary panel with counts and warnings.
* Toolbar above table:

  * Search field.
  * Simple filters: Standing, Consent, Visibility, Approval.
  * One primary action: **Create temporary member**.
* Table columns:

  * Member placeholder name or initials.
  * Organisation or role summary.
  * Standing chip.
  * Consent chip.
  * Visibility chip.
  * Approval chip.
  * Last updated metadata.
  * Actions: Edit, Delete.
* Footer metadata row:

  * "Temporary records only."
  * Last import/update timestamp where available.
  * Audit label.

### Mobile layout

Single-column admin layout.

Order:

1. Admin header with compact navigation.
2. Page title and operational subtitle.
3. Primary action: **Create temporary member**.
4. Search field.
5. Filter disclosure button.
6. Member records as compact rows/cards.
7. Stewardship summary.
8. Clean Slate warning entry point, visually separated at the bottom.

Mobile record cards show:

* Initials placeholder.
* Member name or temporary label.
* Key status chips.
* Last updated metadata.
* Edit action.
* Delete action as restrained text/button inside an overflow or secondary action area.

### Components

* `AdminWorkspaceHeader`
* `AdminPageBand`
* `AdminMemberToolbar`
* `SearchInput`
* `FilterSelect`
* `StatusChip`

  * Standing: Good, Review, Blocked, Unknown.
  * Consent: Granted, Missing, Withdrawn, Unknown.
  * Visibility: Private, Members only, Public-safe.
  * Approval: Pending, Approved, Rejected, Not submitted.
* `AdminMemberTable`
* `AdminMemberRow`
* `AdminMemberCompactCard`
* `AuditMetadata`
* `InfoCallout`
* `AdminStewardshipSummary`
* `CreateTemporaryMemberButton`
* `EditMemberButton`
* `DeleteMemberButton`
* `DeleteConfirmationDialog`
* `CleanSlateWarningPanel`
* `CleanSlateConfirmationDialog`

Use Georgia only for page and section headings. Use sans-serif for table text, labels, filters, chips, buttons, and metadata. The design system requires token-based colors and prohibits hard-coded UI colors outside the token file. 

### Primary action

**Create temporary member**

Only one page-level primary action.

Secondary actions:

* Search.
* Filter.
* Edit member.
* Delete member.
* Clean Slate, separated from normal record management and never styled as a primary action.

### Empty state

Title: "No temporary member records"

Copy: "Temporary member records will appear here once they are created or imported."

Action: **Create temporary member**

Secondary text link: "Review import options" only if import route is implemented and mapped.

### Loading state

* Skeleton toolbar.
* Skeleton table rows on desktop.
* Skeleton compact record cards on mobile.
* Do not show empty state until loading completes.

### Success state

For create/edit/delete:

* Soft success banner.
* Copy example: "Temporary member record updated. Audit metadata has been recorded."
* Return focus to the changed row or toolbar.
* Do not expose raw audit internals.

### Warning state

Use for incomplete or governance-sensitive records.

Examples:

* Missing consent.
* Public-safe visibility selected but approval missing.
* Standing requires review.
* Temporary record has incomplete required fields.

Warning style:

* Amber accent from tokens.
* Practical next step.
* No alarm-heavy styling.

### Error state

Use for failed create/edit/delete/search/filter actions.

Copy pattern:

* "The member record could not be updated."
* "Please check the required fields and try again."
* "No private technical detail is shown."

Error style:

* Restrained red token.
* Place error close to affected action.
* Preserve user input where possible.

### Delete confirmation state

Route/workflow: `/admin/members/{id}/delete`

Dialog or dedicated confirmation screen.

Content:

* Title: "Delete temporary member record?"
* Copy: "This removes the temporary record from the admin workspace. This action should only be used for records that are no longer needed before production setup."
* Show minimal identifying information:

  * Initials placeholder.
  * Temporary member display name.
  * Last updated metadata.
* Required confirmation checkbox:

  * "I understand this will delete this temporary member record."
* Primary destructive action:

  * **Delete temporary record**
* Secondary action:

  * **Cancel**

Styling:

* Destructive action is restrained.
* Red outline or quiet red emphasis.
* Avoid full red dominance unless this is the only action in the confirmation view.
* On completion, return to `/admin/members` with success state.

### Clean-slate warning state

Route/workflow: `/admin/members/clean-slate`

This is not part of ordinary delete behavior. It is a separated, highly cautious administrative cleanup for temporary seed members before production setup.

Placement:

* Bottom of the page or separate stewardship panel.
* Never in the primary toolbar.
* Never visually adjacent to normal create/edit actions.

Content:

* Title: "Clean Slate: temporary member cleanup"
* Warning copy: "This action clears temporary seed member records before production setup. Use only when the project owner has confirmed that temporary records may be removed."
* Show impact summary:

  * Number of temporary records affected.
  * Last updated/import timestamp where available.
  * Audit note.
* Required confirmation steps:

  * Checkbox: "I understand this clears temporary seed member records."
  * Typed confirmation: `CLEAN SLATE`
* Primary destructive action:

  * **Clear temporary records**
* Secondary action:

  * **Cancel and return to Admin Members**

Governance behavior:

* No member-facing records should be implied.
* No production records should be included.
* API requires CSRF and audit trail, as mapped. 

### Accessibility notes

* Target WCAG 2.2 AA.
* Inputs and buttons minimum 44px high.
* Filters must have visible labels.
* Status chips must not rely on color alone.
* Each chip needs accessible text, for example: "Consent status: Missing."
* Table must support keyboard navigation and readable column headers.
* Delete and Clean Slate confirmation dialogs must trap focus and return focus after close.
* Validation messages must be instructive, not punitive.
* Focus ring uses the design token focus blue.
* Mobile controls must not overflow or clip.

### Privacy/governance notes

* Admin surface only; no member navigation.
* Do not use member self-service copy such as "your profile" or "manage your visibility."
* Do not use public profile/gallery styling.
* Do not show real contact details or sensitive personal data in mockups.
* Use initials placeholders by default unless approved admin-safe seed imagery exists.
* Show audit-aware metadata, but not raw internal audit logs.
* Create/edit/delete controls appear only where routes and policy mapping allow them.
* Clean Slate is separated from normal record stewardship.
* Public, member, and admin surfaces must remain visually distinct. The design system states that surface navigation must remain scoped, and admin navigation is limited to stewardship areas such as console, imports, standing, review queue, audit, and support notes. 

### Open decisions

* Confirm exact temporary member fields required for launch.
* Confirm whether member creation is manual only or also import-assisted.
* Confirm whether approval status is read-only on this page or edited elsewhere.
* Confirm whether standing changes happen here or only under `/admin/standing`.
* Confirm Clean Slate permission level: admin and chief admin, or chief admin only.
* Confirm audit metadata display: last updated only, or last updated plus actor initials.
* Confirm whether delete is soft-delete, hard-delete, or temporary-record removal only.

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