# Wave 2 Implementation Brief

Status: Planned.

This brief defines the second delivery wave for IWFSA Platform V2.

Wave 2 should establish the operational foundation for member intake and onboarding without yet widening into broader membership governance, directory visibility, or profile self-service. The goal is to create a reliable first member record model, an admin-operated import preview workflow, and a secure first-time activation path that later waves can build on.

## Trace And Backlog Alignment

Primary trace coverage:

- `TRC-003`: Member import
- `TRC-004`: Onboarding and reset

Direct backlog items:

- Epic 2: Member Import and Membership Operations
- `TRC-003` backlog mapping: Member Import Workspace
- `TRC-004` backlog mapping: Identity Lifecycle

Downstream dependencies this wave must prepare for, but not fully implement:

- `TRC-005`: Membership standing
- `TRC-006`: Member directory and profiles

## Goal

Deliver the first durable member record foundation and the first secure member-intake workflow by enabling administrators to preview an Excel import, create or update member records through a controlled commit path, and issue first-time onboarding invitations backed by activation tokens.

This wave should prove:

- member data can be staged and validated before mutation,
- imported records can create a usable account foundation,
- onboarding can begin without exposing credentials to administrators,
- later standing, directory, and profile work will have a stable member record to build on.

## Affected Modules

- `apps/api`: member import API, onboarding token API, member record service
- `apps/web`: admin import surface, onboarding activation surface
- `apps/common`: shared validation, member status model, import result types, token and audit event types

Logical V2 modules in scope:

- Member Import Workspace
- Member Record Foundation
- Identity Lifecycle
- Audit event hooks for import and invite actions

## Scope Boundaries

In scope:

- Import preview and import commit for member records
- First member record model and persistence boundary
- Invite issuance for imported members
- Activation token generation and completion flow
- Minimal reset-path placeholder only if it reuses the same token primitives cleanly

Out of scope:

- Membership standing enforcement rules beyond initial fields and defaults
- Member directory display
- Profile self-service editing beyond onboarding-required completion fields
- Bulk notification channels beyond what is needed to represent invite issuance
- Event access, directory visibility, or fee-cycle enforcement

## First Data Model

Wave 2 should introduce the first persistent member record model with enough structure to support import, onboarding, and later governance work.

Recommended initial entities:

### MemberRecord

- `memberId`
- `email`
- `username`
- `firstName`
- `lastName`
- `displayName`
- `phone`
- `organisation`
- `membershipYear`
- `memberStatus`
- `standingStatus`
- `onboardingStatus`
- `profileCompletionStatus`
- `source`
- `lastImportedAt`
- `createdAt`
- `updatedAt`

### MemberImportBatch

- `batchId`
- `uploadedBy`
- `uploadedAt`
- `fileName`
- `previewStatus`
- `commitStatus`
- `summaryCounts`
- `defaultsApplied`

### MemberImportRowResult

- `rowNumber`
- `sourceKey`
- `proposedAction`
- `validationStatus`
- `fieldErrors`
- `matchedMemberId`

### MemberActivationToken

- `tokenId`
- `memberId`
- `tokenHash`
- `purpose`
- `issuedBy`
- `issuedAt`
- `expiresAt`
- `consumedAt`
- `deliveryState`

Design rule:

- Keep `memberStatus`, `standingStatus`, and `onboardingStatus` separate so Wave 2 does not collapse later governance distinctions into one field.

## Member Status Fields

Wave 2 should define, but not fully operationalize, the following core statuses:

- `memberStatus`:
  - `draft_import`
  - `active_member_record`
  - `inactive_member_record`
  - `blocked_member_record`
- `standingStatus`:
  - `unknown`
  - `good_standing`
  - `not_in_good_standing`
- `onboardingStatus`:
  - `not_invited`
  - `invited`
  - `activation_started`
  - `activated`
  - `invite_expired`
- `profileCompletionStatus`:
  - `not_started`
  - `required_fields_pending`
  - `complete`

Wave 2 rule:

- Import may set defaults for year and standing, but standing enforcement against protected routes belongs to Wave 3.

## Import Preview Flow

Wave 2 should implement import in two steps: preview first, commit second.

Recommended flow:

1. Admin uploads the spreadsheet into the Import Workspace.
2. The system maps source headers to the first member record fields.
3. The system validates each row for required fields, email format, duplicates, and update-vs-create eligibility.
4. The system produces a preview summary with counts for `create`, `update`, `skip`, and `fail`.
5. The admin reviews row-level validation outcomes before any mutation happens.
6. The admin confirms commit.
7. The system writes member records and stores import batch evidence.

Wave 2 constraints:

- Preview must not mutate the durable member store.
- Commit must be traceable to one batch and one administrator.
- Row-level errors must be understandable without reading raw logs.

## Onboarding Flow

Wave 2 should support first-time activation for imported members.

Recommended flow:

1. Admin selects one or more eligible imported members for invitation.
2. The system issues a short-lived, single-use activation token and stores only a token hash.
3. The system records invitation issuance and delivery intent.
4. The member opens the activation route.
5. The token is validated for existence, expiry, and unused state.
6. The member sets initial credentials and completes required onboarding fields.
7. The token is consumed and cannot be reused.
8. The member record moves to `activated` onboarding state.

Wave 2 constraints:

- Admins must never be able to retrieve raw activation tokens after issuance.
- Activation should not imply directory eligibility or good standing by itself.
- Reset support may share token primitives, but first-time activation is the primary target for this wave.

## Privacy, RBAC, And Audit Rules

Privacy:

- Imported files and row results contain personal member data and must only be visible to authorized admins.
- Validation output should show only the information needed to correct the record.
- Activation tokens must be stored hashed, never in retrievable plaintext form.
- Onboarding routes must reveal only whether the token is valid enough to proceed, not internal administrative context.

RBAC:

- Import preview and commit actions must be limited to `admin` and `chief_admin` roles.
- Invitation issuance must be limited to authorized admins.
- Activation routes must be token-gated and not require prior member authentication.
- Member-facing activation completion must not grant access outside the intended onboarding flow.

Audit:

- Record import preview creation, commit execution, and invite issuance as auditable events.
- Audit events must include actor, action, target batch or member, and timestamp.
- Token consumption should produce a distinct onboarding audit event.

## Acceptance Criteria

- An authorized admin can upload an import file and receive a preview with row-level validation results.
- The preview clearly distinguishes create, update, skip, and fail outcomes before commit.
- Import commit creates or updates member records and records a batch summary.
- Imported member records contain enough data to support later standing, directory, and onboarding workflows.
- An admin can issue a first-time activation invite without seeing the eventual password or raw token.
- A valid activation token can be consumed exactly once before expiry.
- An expired or reused token is rejected safely.
- Activation completion updates onboarding state and required profile completion state.
- Public, member, and admin route protections from Wave 1 remain intact while Wave 2 features are added.

## Tests Required

API tests:

- import preview validates rows without mutating committed member records
- import commit creates new member records
- import commit updates matching member records according to dedupe rules
- invite issuance creates hashed activation tokens only
- activation token validation rejects expired or already-consumed tokens
- activation completion updates onboarding and profile completion state
- unauthorized roles cannot access import preview, commit, or invite endpoints

Web tests:

- admin import preview page is protected and only visible to admin-capable sessions
- preview results render create/update/skip/fail outcomes clearly
- invite action is restricted to admin-capable sessions
- activation page handles valid, expired, and reused tokens distinctly

Model and service tests:

- member status transitions are valid for Wave 2 paths
- import row classification is deterministic for duplicate and update cases
- token storage never exposes raw retrievable values after issuance

## Documentation Updates

Update these documents as part of Wave 2 implementation:

- `backlog-mapping.md`: mark `TRC-003` and `TRC-004` as actively implemented once work begins
- `v2-delivery-sequence.md`: record Wave 2 as in progress and then closed when exit evidence is met
- `architecture-decisions.md`: add or refine the first persistence-boundary decision if implementation settles the first member storage adapter shape
- `data model` planning note or equivalent: capture the first member record schema and status semantics
- operational notes for import preview, commit, and activation support handling

## Exit Evidence

Wave 2 is complete only when all of the following are true:

- Admins can run an import preview and see row-level outcomes without mutating data.
- Admins can commit an approved import batch and produce a reviewable batch summary.
- The first member record foundation exists with explicit status fields and audit hooks.
- Activation invites are issued through hashed, expiring, single-use tokens.
- Activation completion updates the member record correctly and rejects invalid tokens safely.
- Executable tests cover the import preview, commit, onboarding, RBAC, expiry, and audit-sensitive paths.
- Planning and operational documents are updated to reflect the final Wave 2 scope and evidence.

## Recommended Build Order Inside Wave 2

1. Member record persistence boundary and first record model
2. Import preview service and preview UI
3. Import commit path with audit hooks
4. Activation token service
5. Activation completion route and onboarding state updates

This order keeps data shape and validation stable before invitation and activation logic depends on it.