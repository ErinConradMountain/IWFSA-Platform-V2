## Admin Public Review Queue Page Sheet

### Route

`/admin/public-review`

Related approval step: `/admin/public-review/approve`

### Primary task

Review member-submitted public-safe profile projections and approve only profiles that satisfy consent, standing, visibility, approval, and projection allowlist requirements.

### Desktop layout

Admin workspace shell using `apps/common/src/design-tokens.ts`.

* Header: IWFSA logo, "Admin workspace", admin-only navigation.
* Page band: Georgia title, short operational subtitle, restrained audit note.
* Main 12-column layout:

  * Left 4 columns: review queue list with search, status filter, and compact profile rows.
  * Right 8 columns: selected profile review workspace.
* Selected profile workspace:

  * Public-safe preview at top.
  * Approval checklist below preview.
  * Audit metadata strip below checklist.
  * Approval confirmation panel appears only after eligibility is met and approval is selected.

No member self-service controls. No public gallery styling. The preview is an admin review artifact, not a public page.

### Mobile layout

Single-column admin workflow.

Order:

1. Header with compact admin navigation.
2. Page title and purpose line.
3. Queue controls.
4. Review queue list.
5. Selected profile public-safe preview.
6. Approval checklist.
7. Audit confirmation.
8. Primary action, sticky at bottom only when eligible.

Preview and checklist stack vertically. Long profile text collapses behind "Show more" to prevent page fatigue.

### Components

* `AdminWorkspaceHeader`
* `PageTitleBand`
* `ReviewQueueToolbar`
* `PublicReviewQueueList`
* `PublicReviewQueueItem`
* `PublicSafeProfilePreview`
* `ApprovalChecklist`
* `VisibilityBadge`
* `ConsentBadge`
* `StandingBadge`
* `ApprovalStatusBadge`
* `AuditMetadataStrip`
* `ApprovalBlockerPanel`
* `ApprovalConfirmationPanel`
* `InfoCallout`
* `StateMessage`

Checklist items:

* Consent granted.
* Standing is Good or otherwise approved by policy.
* Visibility is Public-safe.
* Public approval not already revoked.
* Projection contains allowlisted public fields only.
* Hidden/private/member-only fields are absent.
* Portrait or image asset is approved and consent-scoped, if displayed.
* Audit label is ready for approval event.

### Primary action

`Approve public profile`

Rules:

* Hidden until a profile is selected.
* Disabled until all approval checks pass.
* Becomes the only primary action when selected profile is eligible.
* Opens approval confirmation before commit.
* Confirmation copy: "Approve this public-safe projection for publication."

Secondary actions: "Return to queue", "Request correction", "Hold for review". These must remain visually quieter than the primary action.

### Empty/loading/success/warning/error states

**Empty**
No profiles awaiting public review. Show warm admin panel with "The public review queue is clear." Include no primary CTA.

**Loading**
Skeleton queue rows and skeleton preview panel. Do not show partial approval actions while checks are loading.

**Success**
Soft success panel: "Public-safe profile approved." Show audit timestamp, approving admin, and approved projection version.

**Warning**
Amber audit-aware warning when the profile is reviewable but not ready: "This profile needs attention before approval." Link warning to the failed checklist items.

**Error**
Restrained error panel: "The review could not be completed." Do not expose system traces or private field contents. Provide "Retry review checks" as the recovery action.

### Approval blocker state

Show `ApprovalBlockerPanel` when any required condition fails.

Blocker examples:

* Consent is missing or withdrawn.
* Standing is not eligible for public publication.
* Visibility is not set to Public-safe.
* Approval was revoked or superseded.
* Public-safe projection includes a non-allowlisted field.
* Required preview data is unavailable.
* Audit trail is unavailable.

Design rule: blocked fields must not appear greyed out. Hidden/private/member-only fields must be completely absent from the preview.

Blocked state copy:

"Approval is paused because this profile does not yet meet public-safe publication requirements."

The panel lists only safe reasons, such as "Consent not granted" or "Visibility is not Public-safe." It must not reveal private profile content.

### Accessibility notes

* Target WCAG 2.2 AA.
* Queue list uses keyboard-selectable rows with clear selected state.
* Checklist items expose pass/fail state through text and icon, not color alone.
* Primary action has clear disabled reason via `aria-describedby`.
* Public-safe preview has a heading structure distinct from admin controls.
* Inputs and buttons are at least 44px high.
* Focus ring uses the focus token.
* Confirmation dialog traps focus and returns focus to the approved queue item after close.
* Loading states use `aria-busy`.
* Success and error messages use appropriate live regions.

### Privacy/governance notes

* Admin-only route and navigation.
* Requires `role=admin/chief_admin`, `surface=admin`, active admin standing, and audit trail enabled.
* Public approval must evaluate consent, standing, visibility, approved status, and projection allowlist before rendering or committing.
* Hidden/private/member-only fields are absent from the preview and DOM, not masked.
* The preview represents the public-safe projection only.
* Approval creates an audit-labelled event with admin identity, timestamp, projection version, and decision.
* No real contact details or sensitive member data in examples.
* Styling must use `apps/common/src/design-tokens.ts`; no hard-coded UI colors.
* This page follows the admin surface rule: stewardship language, operational density, and no member self-service styling.

### Open decisions

* Confirm final route mapping for `/admin/public-review` and `/admin/public-review/approve`, since the surface map describes the public profile approval flow but does not yet list these admin routes in the admin route table.
* Define the exact public projection allowlist for launch.
* Decide whether "Request correction" creates a member notification, admin task, or both.
* Confirm whether eligible standing is strictly `Good` or mapped to another production standing value.
* Decide whether portrait approval is required for all public profiles or only when an image is displayed.
* Confirm whether approval applies to the whole projection version or field-by-field projection changes.

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