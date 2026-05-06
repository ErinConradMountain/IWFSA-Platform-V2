## Admin Import Preview Page Sheet
## Page Acceptance Matrix

| Route | Surface | Primary task | One primary action | Required states | Policy/fallback requirement | Privacy or audit note | Open decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin/import/preview` with related resolve/commit flow routes | Admin | Review staged import rows before any live record mutation. | `Review flagged rows` on preview; commit controls are disabled until the commit step. | Empty, loading, review-saved success, warning, error, duplicate resolution, commit readiness. | Requires admin/chief admin, admin surface, active standing, audit trail on; commit route is the first live mutation point and must use CSRF and audit trail. | Preview and duplicate resolution must not mutate live records; audit preview appears before commit. | Confirm duplicate rules, invalid-row correction, and partial commit policy. |

## Strengthened Governance Notes

- Import preview is read-only against live records. It may stage review metadata, but must not create, update, delete, publish, approve, or alter live member records.
- Duplicate decisions remain staged until `/admin/import/commit` passes policy, CSRF, validation, and audit readiness checks.
- Invalid rows must be corrected or skipped before commit; the preview must make blockers visible without exposing unnecessary private fields.
- Commit messaging must distinguish `review saved` from `records changed` so administrators do not mistake preview work for live mutation.

### Route

`/admin/import/preview`

Related flow:
`/admin/import/preview` -> `/admin/import/resolve-duplicate` -> `/admin/import/commit` -> `/admin/audit`

### Primary task

Allow an administrator to review imported member data before any live record mutation occurs.

This page is a stewardship checkpoint, not an editor. Its purpose is to make imported changes visible, resolve conflicts, and commit only reviewed changes.

### Desktop layout

Use admin-only workspace shell with IWFSA logo and admin navigation.

12-column layout:

* **Top band, full width**

  * Georgia page title: `Import preview`
  * Short operational line: `Review staged member records before committing them to the admin register.`
  * Step indicator: `Preview` -> `Resolve duplicates` -> `Commit` -> `Audit`

* **Left/main area, 8 columns**

  * Import summary table
  * Rows grouped by:

    * New records
    * Updated records
    * Duplicate/conflict records
    * Rejected or invalid rows
  * Each row shows:

    * Row number
    * Proposed name or initials-safe identifier
    * Import action chip
    * Consent status chip
    * Visibility status chip
    * Approval status chip
    * Validation status
    * Review status

* **Right/side area, 4 columns**

  * Commit readiness panel
  * Audit preview panel
  * Warnings and blocking issues
  * Current step action

No card nesting. Use full-width sections, refined borders, and restrained admin density.

### Mobile layout

Single-column stacked layout:

1. Admin header
2. Page title and purpose line
3. Step indicator as horizontal scroll or stacked ordered list
4. Commit readiness summary
5. Filter controls
6. Import row cards
7. Audit preview summary
8. Primary action fixed near bottom only if it does not obscure content

Each import row becomes a compact review card with action chips and a clear review status.

### Components

* `AdminWorkspaceHeader`
* `StepIndicator`
* `ImportSummaryPanel`
* `ImportPreviewTable`
* `ImportPreviewRowCard`
* `StatusChip`

  * New
  * Update
  * Duplicate
  * Conflict
  * Invalid
  * Reviewed
  * Blocked
* `VisibilityChip`

  * Private
  * Members only
  * Public-safe
* `ConsentChip`
* `ApprovalChip`
* `AuditPreviewPanel`
* `CommitReadinessPanel`
* `ImportWarningCallout`
* `DuplicateResolutionPrompt`
* `EmptyState`
* `LoadingState`
* `ErrorState`

Use `apps/common/src/design-tokens.ts`; do not hard-code colors. Token guidance is already anchored in the project design system, where import preview is explicitly defined as a non-mutating preview step before commit. 

### Primary action

One primary action per step:

* **Preview step:** `Review flagged rows`
* **Resolve duplicates step:** `Save duplicate decision`
* **Commit step:** `Commit reviewed import`
* **Audit step:** `View audit record`

On `/admin/import/preview`, the primary action is:

`Review flagged rows`

Disable commit actions on this route.

### Empty/loading/success/warning/error states

**Empty state**

* Title: `No import preview available`
* Text: `Upload or stage an import file before reviewing changes.`
* Action: `Return to imports`
* No commit controls shown.

**Loading state**

* Skeleton rows for summary table.
* Skeleton commit readiness panel.
* Text: `Preparing import preview. No live records are being changed.`

**Success state**

* Used after review status updates, not after live mutation.
* Text: `Review saved. This import is still staged and has not been committed.`

**Warning state**

* Amber, restrained.
* Used for:

  * Duplicate rows
  * Missing consent
  * Visibility conflicts
  * Public-safe approval mismatch
  * Invalid required fields
* Text must state the practical fix without blame.

**Error state**

* Text: `The import preview could not be loaded. No live records were changed.`
* Action: `Retry preview`
* Do not expose raw stack traces, database names, or private record internals.

### Duplicate resolution state

Route: `/admin/import/resolve-duplicate`

Triggered when imported rows match existing temporary or governed member records.

Layout:

* Side-by-side desktop comparison:

  * Existing record snapshot
  * Imported row proposal
* Mobile:

  * Existing record first
  * Imported proposal second
  * Decision controls after comparison

Decision options:

* `Keep existing`
* `Apply imported update`
* `Create separate temporary record`
* `Skip row`

Rules:

* One duplicate decision per screen or selected row.
* Primary action: `Save duplicate decision`
* Secondary action: `Back to preview`
* No live mutation occurs when saving the decision.
* Decision is stored as staged import review metadata.

Show:

* Matching reason
* Fields that differ
* Consent differences
* Visibility differences
* Approval differences
* Audit preview note

Do not show member-facing profile styling or private contact examples.

### Commit readiness state

Route: `/admin/import/commit`

The import is commit-ready only when:

* All duplicate/conflict rows have saved decisions.
* All invalid rows are corrected or skipped.
* All rows marked for commit are reviewed.
* Audit preview is available.
* Admin role, active standing, and audit trail requirements pass.

Readiness panel states:

**Not ready**

* Title: `Import not ready to commit`
* Shows blocking count.
* Primary action: `Resolve flagged rows`

**Ready**

* Title: `Reviewed import ready`
* Shows:

  * Number of new records
  * Number of updates
  * Number of skipped rows
  * Audit label
* Primary action: `Commit reviewed import`

**Committed**

* Title: `Import committed`
* Shows audit reference summary.
* Primary action: `View audit record`

The commit page is the first point where live mutation may occur. Preview and duplicate resolution must not mutate live records.

### Accessibility notes

* Target WCAG 2.2 AA.
* Table rows must have keyboard-accessible review controls.
* Step indicator must expose current step with `aria-current="step"`.
* Status chips need accessible labels, not color alone.
* Duplicate comparison must announce changed fields clearly.
* Error and warning summaries should be linked to affected rows.
* Buttons and inputs minimum 44px high.
* Focus ring uses the focus token from `apps/common/src/design-tokens.ts`.

### Privacy/governance notes

* Admin-only route and navigation only.
* Must require `role=admin/chief_admin`, `surface=admin`, `standing=active`, and `audit_trail=on`, matching the mapped admin import routes. 
* Preview must not mutate live records.
* Commit only reviewed changes.
* Audit preview must be visible before commit.
* Do not render member self-service controls.
* Do not render public profile/gallery styling.
* Do not expose private member details beyond what is required for admin stewardship.
* Use stewardship language: `review`, `resolve`, `commit`, `audit`.
* Use restrained warning and destructive styling.

### Open decisions

* Confirm whether `/admin/imports` is the upload/staging entry before `/admin/import/preview`.
* Confirm exact duplicate matching rules: name, email, member ID, organisation, or combined heuristic.
* Confirm whether invalid rows can be corrected inline or must be skipped and re-imported.
* Confirm audit reference format shown after commit.
* Confirm whether commit is all-or-nothing or can commit reviewed valid rows while skipping unresolved rows.

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