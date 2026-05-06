# IWFSA Page-Specific Design Sheets

Purpose: provide practical page-by-page design sheets for the IWFSA member and admin working surfaces. Each sheet defines layout, component choices, interaction states, mobile behavior, and open decisions for design and implementation review.

Scope: working pages only. This excludes the accepted home page and sign-in page.

Global visual principles:

- Use Georgia for page titles, section headings, dignified welcome copy, and editorial framing.
- Use Inter, Segoe UI, or system sans-serif for controls, metadata, tables, compact rows, badges, and forms.
- Maintain surface separation: public, member, and admin pages must never visually collapse into one another.
- Member pages should feel personal, dignified, and privacy-first.
- Admin pages should feel like stewardship tools: denser, more operational, and audit-aware.
- Every page has one primary task and no more than one visually dominant primary action.
- Use the IWFSA logo clearly in the workspace header.
- Use design tokens rather than hard-coded color values in implementation.
- Do not use real private member data in mockups.

---

## 1. Member Dashboard

Route: `/member/dashboard`

Primary task: orient the member and guide her to the next useful action.

### Desktop layout

- Workspace header with IWFSA logo, organisation name, and member-only navigation: Dashboard, Profile, Events, Directory, Notifications.
- Warm welcome band using Georgia heading such as "Welcome back" or "Member workspace".
- 12-column layout:
  - Left 7 columns: priority panel with one clear next action.
  - Right 5 columns: compact status summary.
- Below the main band: four status cards for Profile, Events, Directory, and Notifications.
- Secondary links should be quieter text links or secondary buttons.

### Component choices

- `WorkspaceHeader` with `surface="member"`.
- `WelcomeBand` with Georgia heading.
- `StatusSummaryCard` for profile, events, directory, notifications.
- `PrimaryActionPanel` for the single strongest next step.
- `InfoCallout` for privacy or consent reminder if required.
- `SurfaceScopedNav` with member routes only.

### States

- Empty: warm panel explaining that the workspace will populate as profile, events, and notices become available.
- Loading: skeleton status cards and a reserved welcome panel height.
- Success: soft green confirmation after profile/event/notification action.
- Warning: amber callout if standing or consent limits a member action.
- Error: calm error panel with a route-safe recovery action back to dashboard.

### Mobile behavior

- Header compresses into logo/title plus horizontal scroll or compact menu.
- Welcome band becomes a single stacked block.
- Primary action becomes full-width.
- Status cards stack one per row.
- Avoid dense dashboard widgets; preserve the "one next action" rule.

### Open decisions

- What determines the primary next action: incomplete profile, upcoming RSVP, unread notification, or consent renewal?
- Should the dashboard show member standing explicitly, or only when action is needed?
- Should event reminders appear here, or remain only on Member Events and Notifications?

---

## 2. Member Profile

Routes: `/member/profile`, `/member/profile/edit`, `/member/profile/visibility`, `/member/profile/confirmation`

Primary task: let the member control her profile identity and visibility.

### Desktop layout

- Member workspace header with member-only navigation.
- Top band with Georgia title: "Profile visibility control" or "Your member profile".
- 12-column layout:
  - Left 7 columns: editable profile fields grouped by purpose.
  - Right 5 columns: visibility model, consent status, and public review explanation.
- Profile image or dignified placeholder appears near the page title, not as a public biography hero.
- Visibility controls appear next to relevant fields, not hidden at the bottom.

### Component choices

- `ProfileHeader` with portrait placeholder and member-safe metadata.
- `FieldGroup` with labels, helper text, and validation.
- `VisibilityBadge`: Private, Members only, Public-safe.
- `VisibilitySelector` with accessible radio group behavior.
- `InfoCallout` for public visibility review.
- `ConfirmationPanel` for save confirmation and audit label.

### States

- Empty: no optional profile fields completed; invite member to complete one section.
- Loading: skeleton field groups and placeholder portrait block.
- Success: "Your profile changes have been saved" with audit-safe language.
- Warning: public-safe visibility requires approval before public rendering.
- Error: field validation messages are instructive and respectful.
- Consent missing: route should fall back to Consent Required.

### Mobile behavior

- Profile header stacks above field groups.
- Visibility badges remain visible under each field label.
- Public review callout appears before final save.
- Save button is full-width and fixed only if it does not obscure content.

### Open decisions

- Which fields can ever become Public-safe?
- Should public-safe preview be a separate route or an inline preview panel?
- What exact audit label appears after a field visibility change?

---

## 3. Member Events

Route: `/member/events`

Primary task: help the member view events and RSVP comfortably.

### Desktop layout

- Member workspace header.
- Georgia page heading: "Choose and manage event participation".
- Intro line explaining that only published member events appear.
- Toolbar with event filter and current RSVP status message.
- Responsive event board:
  - 3-column card grid for event discovery on large screens.
  - 2-column grid on medium screens.
- Each event card prioritises title, date/time, location, status, capacity, and RSVP action.

### Component choices

- `EventBoardToolbar`.
- `EventCard` with title, status chip, capacity chip, waitlist count, date/time/location.
- `RsvpButton` as the primary action inside each event card.
- `RsvpResultMessage` for success, waitlist, and failure.
- `CapacityIndicator` restrained and readable.

### States

- Empty: no available member events under current publishing rules.
- Loading: skeleton event cards.
- Success: confirmed RSVP with soft green confirmation.
- Waitlist: warm amber notice explaining the member has joined the waitlist.
- Failure: restrained red error if RSVP is unavailable or blocked.
- Standing restricted: fallback to Standing / Restricted Access.

### Mobile behavior

- Event cards stack one per row.
- RSVP button appears before secondary metadata.
- Capacity and waitlist information compress into one readable line.
- Filters collapse into a button or compact select.

### Open decisions

- Should members be able to cancel RSVP in this phase?
- What exact capacity threshold triggers waitlist messaging?
- Should past events be hidden, archived, or shown in a separate tab?

---

## 4. Member Directory

Route: `/member/directory`

Primary task: help members browse a consent-scoped directory.

### Desktop layout

- Member workspace header.
- Georgia heading: "Consent-scoped directory".
- Short explanation that entries appear only within consent and visibility rules.
- Search and filter row at the top.
- 12-column layout:
  - Full-width directory controls.
  - Main area: compact member rows or two-column member cards.
- Each entry shows only consent-permitted data.

### Component choices

- `DirectorySearchInput` with visible label.
- `DirectoryFilterRow` for sector, region, visibility, or member group.
- `MemberDirectoryEntry` compact card or row.
- `ConsentVisibilityIndicator`.
- `ResetFiltersButton`.

### States

- Empty: no visible members match current filters.
- Loading: skeleton rows.
- Success: filter applied or preference saved confirmation if applicable.
- Warning: consent boundaries limit visible records.
- Error: unable to load directory; do not expose private record counts.
- Consent missing: fallback to Consent Required.

### Mobile behavior

- Search input full-width.
- Filters collapse into stacked controls.
- Member entries become compact cards.
- Visibility indicator stays close to member name and role.

### Open decisions

- Which fields are searchable under consent rules?
- Should region and sector filters be shown immediately or only once data is available?
- Should members be able to hide themselves from search while remaining visible in direct member contexts?

---

## 5. Member Notifications

Route: `/member/notifications`

Primary task: let members understand notices and notification preferences.

### Desktop layout

- Member workspace header.
- Georgia heading: "Member notifications" or "Notification preferences".
- Top summary panel showing notification channels and preference status.
- Grouped notices by Events, Standing, Celebrations, and Administrative notices.
- 12-column layout:
  - Left 8 columns: grouped notification list.
  - Right 4 columns: preferences and consent summary.

### Component choices

- `NotificationSummaryPanel`.
- `NotificationGroup`.
- `NotificationRow` with type icon, title, date, and status.
- `PreferenceToggle` for email, SMS, and in-app where available.
- `AnnualConsentLabel`.

### States

- Empty: no current notifications.
- Loading: skeleton grouped rows.
- Success: preference change saved.
- Warning: annual consent renewal needed.
- Error: preference update failed; existing preferences remain unchanged.

### Mobile behavior

- Summary panel appears first.
- Preference controls appear before historical notices if consent renewal is required.
- Notification rows stack with clear date and status.
- Toggles remain at least 44px high.

### Open decisions

- Which notification channels are active in Phase 2?
- Should SMS be visible before SMS delivery is implemented?
- What is the retention rule for old administrative notices?

---

## 6. Member Standing / Restricted Access

Route: `/member/standing`

Primary task: explain limited access respectfully and provide next steps.

### Desktop layout

- Member workspace header.
- Centered warm warning panel, not a full danger page.
- Georgia heading: "Standing review required".
- Explanation limited to what the member needs to know.
- Clear next step area with one primary action and secondary return option.

### Component choices

- `RestrictedAccessPanel`.
- `WarmWarningCallout`.
- `NextStepList`.
- `ContactAdministratorButton`.
- `ReturnToDashboardLink`.

### States

- Default restricted: access temporarily limited.
- Loading: brief policy check state.
- Success: member returned to allowed area.
- Warning: standing blocks current action.
- Error: unable to verify standing; route safely returns to dashboard.

### Mobile behavior

- Panel fills width with generous padding.
- Actions stack full-width.
- Avoid long paragraphs; use short, practical sentences.

### Open decisions

- Who is the named contact: administrator, secretariat, or generic IWFSA office?
- Should the page include a support email, or route through an internal contact form?
- What language is approved for standing limitation without revealing internal details?

---

## 7. Member Consent Required

Route: `/member/consent-required`

Primary task: explain consent and help the member continue in control.

### Desktop layout

- Member workspace header.
- Centered consent explanation panel with Georgia title: "Consent required".
- Visibility model displayed as three simple badges: Private, Members only, Public-safe.
- One primary action to review consent.
- Secondary path back to dashboard.

### Component choices

- `ConsentRequiredPanel`.
- `VisibilityBadgeGroup`.
- `ReviewConsentButton`.
- `ReturnToDashboardLink`.
- `InfoCallout` for plain-language explanation.

### States

- Default: consent required before continuing.
- Loading: checking consent state.
- Success: consent saved; member can continue.
- Warning: consent incomplete.
- Error: unable to save consent; no feature proceeds without consent.

### Mobile behavior

- Badges stack or wrap cleanly.
- Primary action full-width.
- Avoid legal-heavy copy; keep the model visible at a glance.

### Open decisions

- What exact consent categories are required for directory visibility?
- Is annual re-consent required for all profile visibility, or only notification preferences?
- Should consent withdrawal be accessible from this route or only from profile settings?

---

# Admin Page Sheets

## 8. Admin Dashboard

Route: `/admin`

Primary task: orient administrators to current stewardship work.

### Desktop layout

- Admin workspace header with IWFSA logo and admin-only navigation.
- Georgia heading with operational subtitle.
- 12-column dashboard:
  - Top full-width governance summary band.
  - Four metric cards: members, imports, standing reviews, public approvals.
  - Left 8 columns: priority queue.
  - Right 4 columns: audit health and policy reminders.

### Component choices

- `AdminWorkspaceHeader`.
- `GovernanceSummaryBand`.
- `StewardshipMetricCard`.
- `AdminPriorityQueue`.
- `AuditHealthPanel`.
- `PolicyReminderCallout`.

### States

- Empty: no pending stewardship work.
- Loading: skeleton metrics and queue rows.
- Success: action recorded in audit trail.
- Warning: unresolved policy mapping or standing issue.
- Error: admin data unavailable; no sensitive system detail exposed.
- Restricted: non-admin users are redirected to safe fallback.

### Mobile behavior

- Metrics become two columns, then one column on narrow screens.
- Queue rows stack.
- Admin navigation collapses but remains surface-scoped.

### Open decisions

- Which stewardship metric is most important for the first release?
- Should the dashboard expose import status before import workflows are stable?
- What audit health signal is useful without creating unnecessary alarm?

---

## 9. Admin Members

Route: `/admin/members`

Primary task: manage temporary member records under policy and audit controls.

### Desktop layout

- Admin workspace header.
- Georgia heading: "Member stewardship".
- Subtitle: operational, not member-facing.
- Toolbar with search, filters, and one create control.
- Dense but readable table:
  - Member placeholder name.
  - Role/organisation summary.
  - Standing.
  - Consent.
  - Approval/public state.
  - Latest audit signal.
  - Actions.
- Secondary right rail optional for governance queue if screen width allows.

### Component choices

- `AdminTable`.
- `AdminSearchInput`.
- `AdminFilterButton`.
- `StandingChip`.
- `ConsentChip`.
- `ApprovalChip`.
- `AuditLabel`.
- `CreateTemporaryRecordButton`.
- `EditRecordButton`.
- `DeleteRecordButton` with confirmation.

### States

- Empty: no temporary records match current filters.
- Loading: skeleton table rows.
- Success: record created/edited/deleted with audit confirmation.
- Warning: action requires route/policy permission.
- Error: record update failed; no partial publication implied.
- Restricted: non-admin users return to safe fallback.

### Mobile behavior

- Table becomes stacked record cards.
- Primary record facts shown first: name placeholder, standing, consent, approval.
- Actions collapse under "Manage record".
- Delete remains behind confirmation.

### Open decisions

- What temporary member fields are editable in Phase 2?
- Does delete mean soft delete, archive, or hard removal from temporary seed data?
- Should administrators see member contact details in this page, or only in a deeper support route?

---

## 10. Admin Member Edit

Route: `/admin/members/{id}/edit`

Primary task: edit one temporary member record safely.

### Desktop layout

- Admin workspace header.
- Georgia heading: "Edit member record".
- Record identity summary at top with audit status.
- 12-column layout:
  - Left 8 columns: editable operational fields.
  - Right 4 columns: governance summary and audit notes.
- One primary action: Save changes.
- Secondary action: cancel/return to members.

### Component choices

- `RecordIdentitySummary`.
- `AdminFieldGroup`.
- `StandingSelector`.
- `ConsentStatusReadout`.
- `ApprovalStatusReadout`.
- `AuditPreviewPanel`.
- `SaveChangesButton`.

### States

- Empty: record not found route-safe fallback.
- Loading: form skeleton.
- Success: saved with audit label.
- Warning: changing standing may restrict member access.
- Error: validation or save failure.
- Restricted: admin-only access required.

### Mobile behavior

- Governance summary appears before form if it affects edit risk.
- Form fields stack.
- Save button full-width.
- Audit panel follows the save area.

### Open decisions

- Which fields require confirmation before changing?
- Should standing changes require a reason note?
- Should consent be editable by admins or only displayed as member-controlled status?

---

## 11. Admin Member Delete

Route: `/admin/members/{id}/delete`

Primary task: confirm deletion or removal of a temporary member record.

### Desktop layout

- Admin workspace header.
- Centered confirmation page, not a table view.
- Georgia heading: "Confirm record removal".
- Clear summary of what will and will not be removed.
- Restrained destructive button appears only after confirmation language.
- Cancel remains visually stronger than usual secondary actions if accidental deletion risk is high.

### Component choices

- `DestructiveConfirmationPanel`.
- `RecordSummaryBlock`.
- `AuditWarningCallout`.
- `ConfirmDeleteButton`.
- `CancelButton`.

### States

- Loading: checking record and policy.
- Success: record removed/archived with audit confirmation.
- Warning: deletion affects temporary records only.
- Error: delete failed; record remains unchanged.
- Restricted: safe fallback.

### Mobile behavior

- Confirmation panel full-width.
- Destructive action full-width but visually restrained.
- Cancel action appears adjacent or above destructive action.

### Open decisions

- Is deletion allowed for all temporary member records?
- Should deleted records remain in audit search?
- What wording distinguishes temporary seed cleanup from production member removal?

---

## 12. Admin Imports / Import Preview

Routes: `/admin/imports`, `/admin/import/preview`

Primary task: review an import preview before any live mutation.

### Desktop layout

- Admin workspace header.
- Georgia heading: "Import preview".
- Explanation that preview does not mutate live records.
- Table of incoming rows with status: new, duplicate, conflict, blocked.
- Right rail summary: counts, risks, audit preview.
- One primary action: continue to resolve duplicate or commit only when safe.

### Component choices

- `ImportPreviewTable`.
- `ImportStatusChip`.
- `DuplicateSignal`.
- `ConflictWarning`.
- `AuditPreviewPanel`.
- `ContinueReviewButton`.

### States

- Empty: no import file or no rows available.
- Loading: parsing/import preview skeleton.
- Success: preview generated.
- Warning: conflicts require resolution.
- Error: file parse failed or invalid schema.
- Restricted: admin-only access required.

### Mobile behavior

- Import rows become cards.
- Conflict status appears near row title.
- Summary appears before row list.

### Open decisions

- What import formats are supported?
- Which fields are required for preview generation?
- Should administrators be allowed to download a rejected-row report?

---

## 13. Admin Resolve Duplicate

Route: `/admin/import/resolve-duplicate`

Primary task: resolve one duplicate import decision before commit.

### Desktop layout

- Admin workspace header.
- Georgia heading: "Resolve duplicate record".
- Two-column comparison:
  - Existing temporary record.
  - Incoming import row.
- Difference highlights use restrained audit/warning accents.
- One primary action: choose resolution.
- Secondary actions: skip row or return to preview.

### Component choices

- `DuplicateComparisonPanel`.
- `FieldDifferenceRow`.
- `ResolutionSelector`.
- `AuditConsequenceCallout`.
- `ConfirmResolutionButton`.

### States

- Empty: no duplicate selected; return to preview.
- Loading: loading comparison.
- Success: duplicate decision saved.
- Warning: selected resolution changes sensitive field.
- Error: resolution failed.

### Mobile behavior

- Existing and incoming sections stack.
- Differences remain grouped by field.
- Resolution control appears after comparison.

### Open decisions

- Are merge, replace, skip, and create-new all allowed?
- Which fields are considered sensitive changes?
- Does each duplicate decision require a reason note?

---

## 14. Admin Import Commit

Route: `/admin/import/commit`

Primary task: commit a reviewed import safely.

### Desktop layout

- Admin workspace header.
- Centered confirmation panel with Georgia heading: "Commit reviewed import".
- Summary of rows to create, update, skip, or block.
- Audit preview before final commit.
- One primary action: Commit import.
- Secondary action: return to preview.

### Component choices

- `CommitSummaryPanel`.
- `ImportCountBreakdown`.
- `AuditPreviewPanel`.
- `CommitImportButton`.
- `ReturnToPreviewButton`.

### States

- Loading: preparing commit.
- Success: import committed with audit trail.
- Warning: unresolved rows cannot be committed.
- Error: commit failed; no partial status hidden.
- Restricted: safe fallback.

### Mobile behavior

- Count breakdown stacks.
- Audit preview appears before commit button.
- Commit button full-width.

### Open decisions

- Is partial commit allowed?
- What rollback or reconciliation message appears after failure?
- Where does the administrator go after successful commit: members table, audit, or imports index?

---

## 15. Admin Standing

Route: `/admin/standing`

Primary task: manage member standing responsibly.

### Desktop layout

- Admin workspace header.
- Georgia heading: "Standing management".
- Intro explaining that standing changes affect member access.
- Table or structured list of records requiring review.
- Right rail explaining governance consequences.
- One primary action per selected record: update standing.

### Component choices

- `StandingReviewTable`.
- `StandingStatusChip`.
- `StandingChangeForm`.
- `ReasonNoteField`.
- `AccessImpactCallout`.
- `AuditConfirmationPanel`.

### States

- Empty: no standing reviews currently required.
- Loading: skeleton standing rows.
- Success: standing updated with audit note.
- Warning: update will limit member access.
- Error: standing update failed.
- Restricted: admin-only fallback.

### Mobile behavior

- Standing records become cards.
- Access impact appears before update control.
- Reason note field remains visible and readable.

### Open decisions

- Which standing values exist: active, review, blocked, suspended?
- Does every standing change require a reason note?
- Which standing states allow member login but restrict actions?

---

## 16. Admin Events

Routes: `/admin/events`, `/admin/events/{id}/edit`, `/admin/events/{id}/delete`

Primary task: steward event records safely.

### Desktop layout

- Admin workspace header.
- Georgia heading: "Event stewardship".
- Operational subtitle.
- Toolbar with create event and filters.
- Event table with lifecycle status, capacity, RSVP count, waitlist count, and audit metadata.
- Edit/delete/lifecycle controls are admin-only.

### Component choices

- `AdminEventTable`.
- `LifecycleStatusChip`.
- `CapacityReadout`.
- `WaitlistReadout`.
- `CreateEventButton`.
- `EditEventButton`.
- `DeleteEventButton` with confirmation.
- `LifecycleControl`.

### States

- Empty: no temporary event records.
- Loading: skeleton table rows.
- Success: event created/edited/deleted or lifecycle changed.
- Warning: published events may affect member RSVP visibility.
- Error: validation or mutation failed.
- Restricted: admin-only safe fallback.

### Mobile behavior

- Event table becomes stacked admin cards.
- Lifecycle and capacity visible before secondary metadata.
- Destructive controls stay behind confirmation.

### Open decisions

- Which lifecycle states exist: draft, published, closed, archived?
- Should capacity changes be blocked after RSVPs exist?
- Should deleting an event with RSVPs be allowed, archived, or disabled?

---

## 17. Admin Public Review

Routes: `/admin/public-review`, `/admin/public-review/approve`

Primary task: approve public-safe profile projections only after consent, standing, and curator review.

### Desktop layout

- Admin workspace header.
- Georgia heading: "Public profile review".
- Split review layout:
  - Left: member-submitted public-safe content.
  - Right: governance checklist.
- Hidden/private fields must be absent, not merely greyed out.
- One primary action: approve public-safe projection.
- Secondary action: request changes or return to queue.

### Component choices

- `PublicSafePreview`.
- `GovernanceChecklist`.
- `ConsentStatusChip`.
- `StandingStatusChip`.
- `ApprovalAuditLabel`.
- `ApproveProjectionButton`.
- `RequestChangesButton`.

### States

- Empty: no public profiles awaiting review.
- Loading: review skeleton.
- Success: public projection approved with audit label.
- Warning: missing consent or standing prevents approval.
- Error: approval failed; projection remains unpublished.
- Restricted: admin-only safe fallback.

### Mobile behavior

- Governance checklist appears before approve button.
- Preview appears after status checks.
- Approve button full-width and only visible when prerequisites are met.

### Open decisions

- What fields are included in the public-safe projection allowlist?
- Who can approve: admin, chief admin, curator role?
- Should approval require two-person review?

---

## 18. Admin Audit

Route: `/admin/audit`

Primary task: let administrators review traceable governance activity.

### Desktop layout

- Admin workspace header.
- Georgia heading: "Audit trail".
- Search and filter controls for actor, route, task, date, record type, and action.
- Dense audit table with timestamp, actor, task, route, record summary, and outcome.
- Detail drawer for selected audit entry.

### Component choices

- `AuditSearchInput`.
- `AuditFilterRow`.
- `AuditTable`.
- `AuditEntryDrawer`.
- `AuditOutcomeChip`.
- `ExportAuditButton` only if policy allows.

### States

- Empty: no audit entries match the filters.
- Loading: skeleton audit rows.
- Success: filter applied or export prepared.
- Warning: export may contain sensitive administrative metadata.
- Error: audit search failed.
- Restricted: safe fallback.

### Mobile behavior

- Audit entries become compact cards.
- Filters collapse into a panel.
- Detail drawer becomes full-screen sheet.

### Open decisions

- Is audit export allowed in this phase?
- Which audit fields are visible to admin versus chief admin?
- What retention period applies to audit entries?

---

## 19. Admin Clean Slate

Route: `/admin/members/clean-slate`

Primary task: clear temporary seed members before production setup.

### Desktop layout

- Admin workspace header.
- High-friction confirmation page with Georgia heading.
- Explanation that this applies to temporary seed members only.
- Summary of affected records.
- Required confirmation phrase or checkbox before primary action activates.
- Destructive action restrained but clear.

### Component choices

- `CleanSlateConfirmationPanel`.
- `AffectedRecordsSummary`.
- `RequiredConfirmationInput`.
- `AuditConsequenceCallout`.
- `ExecuteCleanSlateButton`.
- `CancelButton`.

### States

- Loading: checking temporary records.
- Success: seed records cleared with audit entry.
- Warning: irreversible cleanup warning.
- Error: cleanup failed; records remain unchanged.
- Restricted: chief/admin-only fallback depending on policy.

### Mobile behavior

- Confirmation copy remains short.
- Required confirmation input full-width.
- Destructive button full-width but not visually dominant until confirmation is complete.

### Open decisions

- Who may execute clean slate: admin or chief admin only?
- Is this route hidden after production launch?
- Does clean slate affect events, members, or both?

---

# Cross-Page Implementation Notes

## Shared component inventory

- `WorkspaceHeader`
- `SurfaceScopedNav`
- `InfoCallout`
- `VisibilityBadge`
- `StandingChip`
- `ConsentChip`
- `ApprovalChip`
- `AuditLabel`
- `AdminTable`
- `EmptyState`
- `LoadingSkeleton`
- `SuccessPanel`
- `WarningPanel`
- `ErrorPanel`
- `DestructiveConfirmationPanel`

## Governance requirements

- Public, member, and admin navigation must remain surface-scoped.
- Admin pages must not reuse member self-service controls when the user is performing stewardship work.
- Member pages must never render admin controls.
- Hidden/private data must be absent from public projections, not merely visually muted.
- State-changing actions require mapped routes, policy checks, CSRF where applicable, and audit labels.

## Accessibility requirements

- All buttons and inputs minimum 44px high.
- Visible focus ring using the focus token.
- Form labels always visible.
- Validation copy instructive, not punitive.
- Status chips must not rely on color alone.
- Tables need accessible headers; mobile card conversions need equivalent labels.
- Motion must be subtle and non-essential.

## Handoff checklist for every page

- Desktop layout completed.
- Mobile layout completed.
- Component list confirmed.
- One primary task confirmed.
- One primary action confirmed.
- Empty, loading, success, warning, and error states designed.
- Token and typography notes included.
- Accessibility notes included.
- Privacy/governance notes included.
- Open decisions logged for product or governance approval.

