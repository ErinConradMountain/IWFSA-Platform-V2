## Member Profile Page Sheet
## Page Acceptance Matrix

| Route | Surface | Primary task | One primary action | Required states | Policy/fallback requirement | Privacy or audit note | Open decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/member/profile`, `/member/profile/edit`, `/member/profile/visibility`, `/member/profile/confirmation` | Member | Let the member review, edit, and govern profile visibility. | `Edit profile`, `Save profile changes`, `Save visibility choices`, or `Return to dashboard`, depending on the single active step. | Default, empty, loading, success, warning, error, consent missing, public-safe preview. | Requires member-capable role, member surface, standing not blocked, and consent granted; fallback is `/member/consent-required` except confirmation fallback to dashboard. | Public-safe content is never automatically public; private and members-only fields must be absent from public projections. | Confirm the launch field visibility allowlist and public-safe preview route behavior. |

## Strengthened Governance Notes

- Private fields may include personal contact details, administrative support notes visible only through approved support workflows, non-public biography drafts, internal identifiers, and any data the member has not consented to share.
- Members-only fields may include member-facing display name, role or organisation summary, member-safe biography, member-safe interests, and approved portrait only when the member has granted member-surface visibility.
- Public-safe fields may include only approved display name, role/title, organisation, short public biography, and approved image/story assets after standing, consent, visibility, and curator approval all pass.
- Optional contact details must default to private and must not appear in member directory or public-safe preview unless a later mapped policy explicitly permits it.

### Scope

**Routes:** `/member/profile`, `/member/profile/edit`, `/member/profile/visibility`, `/member/profile/confirmation`
**Primary purpose:** help a member control profile information, visibility, consent, and public-safe preview.

The profile flow should remain privacy-first and member-controlled, with clear separation between editable private/member information and any public-safe preview. 

---

## 1. `/member/profile` - Profile Overview

**Primary task:** review current profile status and choose the next profile action.

**Primary CTA:** `Edit profile`

**Secondary actions:**

* `Manage visibility`
* `Preview public-safe profile`

**Layout:**

* Member workspace header with IWFSA logo and member-only navigation.
* Georgia page title: `Your member profile`
* Short purpose line: `Review your profile information and control how it is seen.`
* Profile identity area with portrait placeholder or approved image.
* Summary cards:

  * Profile completion
  * Consent status
  * Visibility status
  * Public-safe review status
* Right-side panel showing current visibility counts:

  * Private
  * Members only
  * Public-safe

**Design note:** this page is an overview, not a combined edit screen.

---

## 2. `/member/profile/edit` - Edit Profile Details

**Primary task:** update profile fields.

**Primary CTA:** `Save profile changes`

**Layout:**

* Georgia title: `Edit profile details`
* Field groups for:

  * Display name
  * Leadership role
  * Organisation
  * Biography
  * Optional contact details
* Each field includes:

  * Label
  * Helper text
  * Input
  * Current visibility badge
  * Validation message area

**Rule:** private contact details must never look like public biography content.

---

## 3. `/member/profile/visibility` - Manage Visibility

**Primary task:** set field-level visibility.

**Primary CTA:** `Save visibility choices`

**Visibility states:**

* **Private** - purple `#5B4B8A`
* **Members only** - teal `#00695C`
* **Public-safe** - green `#2E7D32`

**Layout:**

* Georgia title: `Profile visibility control`
* Field-by-field visibility selector.
* Side explanation panel: `Who can see this?`
* Public visibility review callout.

**Required callout copy:**
`Your profile will only appear publicly when your standing is Good and a curator approves it. You retain full control and can withdraw visibility at any time.` 

---

## 4. `/member/profile/confirmation` - Confirm Changes

**Primary task:** confirm what has been saved.

**Primary CTA:** `Return to dashboard`

**Secondary action:** `Review profile again`

**Layout:**

* Georgia title: `Profile changes saved`
* Confirmation panel grouped by:

  * Private fields
  * Members-only fields
  * Public-safe fields
* Clear note that public-safe content is not automatically published.
* Audit-style confirmation message using restrained stewardship styling.

---

## 5. Public-Safe Preview

The public-safe preview must be visually separate from editable profile fields.

**Use:**

* White or warm-panel preview surface.
* `Preview only` label.
* Public-safe green badge.
* Only fields marked Public-safe.
* No private or members-only contact information.

**Preview message:**
`This is a public-safe preview only. It appears publicly only after standing, consent, and curator approval are confirmed.`

---

## 6. Consent Handling

If consent is missing, route to `/member/consent-required`. The profile routes require consent according to the member surface map. 
When consent is missing, profile editing and public-safe preview must not render; the member should see only the consent-required fallback.

**Consent state:**

* Georgia heading: `Consent required`
* Short explanation of why consent is needed.
* Visibility badges for Private, Members only, and Public-safe.
* Primary CTA: `Review consent`
* Secondary link: `Return to dashboard`

Tone: reassuring, plain, and non-legalistic.

---

## 7. Components

* Member workspace header
* Profile overview summary
* Portrait placeholder or approved image area
* Field group
* Visibility badge
* Visibility selector
* Public visibility review callout
* Public-safe preview panel
* Confirmation panel
* Empty, loading, success, warning, and error states

---

## 8. States

**Loading:** skeleton rows for profile fields and preview panels.
**Empty:** `No profile information has been added yet.` CTA: `Add profile information`
**Success:** `Your profile choices have been saved.`
**Warning:** `Public-safe fields still require review before publication.`
**Error:** `Changes could not be saved. Please try again.`

Do not expose technical detail, audit internals, or private data in error messages.

---

## 9. Typography and Visual Style

* Page titles: Georgia, 34-44px desktop, 28-34px mobile.
* Section headings: Georgia, 22-28px.
* Controls and metadata: Inter, Segoe UI, or system sans-serif.
* Use navy and gold for trust and hierarchy.
* Use warm neutrals for page background.
* Use purple, teal, and green only for visibility states.

Use `apps/common/src/design-tokens.ts` for implementation colors and styling; do not hard-code UI colors outside the token system.

Buttons and inputs must be at least 44px high, with visible focus states. 

---

## 10. Mobile Behavior

Mobile order:

1. Header
2. Page title and purpose line
3. Primary CTA
4. Profile overview or field content
5. Visibility summary
6. Public-safe preview
7. Confirmation or state message

Visibility controls stack vertically. Buttons become full-width where helpful. No badges, labels, or buttons may overflow.

---

## Final Decision

`/member/profile` should be an **overview with edit entry points**.

Keep:

* `/member/profile/edit` for profile field editing.
* `/member/profile/visibility` for visibility choices.
* `/member/profile/confirmation` for saved-change confirmation.

This keeps each page single-task, calmer, and easier to implement.



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