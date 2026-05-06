# Consent Required Page Sheet
## Page Acceptance Matrix

| Route | Surface | Primary task | One primary action | Required states | Policy/fallback requirement | Privacy or audit note | Open decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/member/consent-required` | Member | Explain consent requirements and guide the member to review choices. | `Review consent`. | Default, empty/unavailable, loading, success, warning, error. | Fallback target for consent-gated profile and directory routes; protected feature content must not render until consent is granted. | Do not show profile fields, directory entries, portraits, contact details, or previews behind the gate. | Confirm whether review goes to `/member/profile/visibility` or a dedicated consent route. |

## Route

`/member/consent-required`

Fallback target for member routes that require granted consent before rendering, especially:

* `/member/profile`
* `/member/profile/edit`
* `/member/profile/visibility`
* `/member/directory`

Policy basis: profile and directory routes require `consent=granted`; when consent is missing, they fall back to `/member/consent-required`. 

## Primary task

Explain, calmly and plainly, that consent is needed before profile or directory features can continue, then guide the member to review her consent choices.

The page must make the member feel in control, not blocked or blamed.

## Desktop layout

* Member workspace header with visible IWFSA logo and member-only navigation: Dashboard, Profile, Events, Directory, Notifications.
* Warm off-white page background using tokens from `apps/common/src/design-tokens.ts`.
* Top page band:

  * Georgia heading: **Consent required**
  * Short purpose line: "Before this feature can continue, please review how your information may be visible within IWFSA."
* Main 12-column layout:

  * Left 7 columns: explanation panel.
  * Right 5 columns: visibility model summary.
* Footer action row:

  * Primary button: **Review consent**
  * Secondary button/link: **Return to dashboard**

## Mobile layout

* Single-column layout.
* Header compresses to logo, workspace label, and compact member navigation.
* Order:

  1. Page title and purpose line.
  2. Consent explanation.
  3. Visibility badges.
  4. Primary action.
  5. Secondary dashboard return.
* Buttons are full-width or comfortably thumb-sized, minimum 44px high.

## Components

* `MemberWorkspaceHeader`

  * Surface: `member`
  * No admin links or admin controls.
* `PageIntroBand`

  * Georgia title.
  * Short sans-serif explanation.
* `InfoCallout`

  * Use for consent explanation.
  * Must be token-styled and assistive-technology linked with `aria-labelledby` and `aria-describedby`. 
* `VisibilityBadgeGroup`

  * **Private** badge using `colors.semantic.private`.
  * **Members only** badge using `colors.semantic.members`.
  * **Public-safe** badge using `colors.semantic.public`.
* `ActionRow`

  * Primary: `Review consent`.
  * Secondary: `Return to dashboard`.
* `ConsentGateNotice`

  * Plain-language message explaining that profile and directory features will not render until consent is granted.

## Primary action

**Review consent**

* Only page-level primary CTA.
* Navy button with white text and a restrained gold accent or border.
* Navigates to the consent review step or the profile visibility/consent flow once implemented.
* Suggested `data-primary-action="review-consent"`.

Secondary action:

* **Return to dashboard**
* White or warm-panel secondary button with navy text.
* Navigates to `/member/dashboard`.

## Empty/loading/success/warning/error states

### Empty state

Use when consent status is unavailable but no technical error is confirmed.

Copy direction:

"Your consent choices are not available yet. You can return to your dashboard and try again shortly."

Actions:

* Secondary only: **Return to dashboard**
* Do not render profile or directory previews.

### Loading state

* Show skeleton heading line, explanation block, and three badge placeholders.
* Keep the page shell and header visible.
* Do not flash protected profile or directory content while loading.

### Success state

Use after consent is granted.

Copy direction:

"Your consent choices have been saved. You can now continue to the member feature."

Actions:

* Primary: **Continue**
* Secondary: **Return to dashboard**

### Warning state

Use when the member reached this page from a consent-gated route.

Copy direction:

"This feature needs your consent before it can show member information."

* Warm amber accent only.
* No frightening or legal-heavy wording.
* No internal policy or audit detail.

### Error state

Use when consent status cannot be checked or saved.

Copy direction:

"We could not confirm your consent choices. Please try again or return to your dashboard."

* Restrained error styling.
* No stack traces, policy internals, IDs, or private member data.
* Protected feature content remains hidden.

## Accessibility notes

* Target WCAG 2.2 AA.
* Heading order: one `h1`, then clear `h2` headings for explanation and visibility choices.
* Primary action appears after the explanation in keyboard order.
* Buttons and links must have visible focus states using the focus token.
* Badges must not rely on color alone; include visible text labels: Private, Members only, Public-safe.
* Screen reader labels should explain visibility meaning, for example: "Private, visible only to you and authorised support where policy allows."
* Motion, if used, must be subtle and non-essential.

## Privacy/governance notes

* Features requiring consent must not render until consent is granted.
* Do not show profile fields, directory entries, member contact details, portraits, or previews behind the consent gate.
* Member navigation only; no admin controls.
* The page may explain the visibility model, but must not imply that any information is public by default.
* Use `apps/common/src/design-tokens.ts`; no hard-coded UI colors outside the token system. 
* Public, member, and admin surfaces must remain visually distinct. 
* The page's purpose is reassurance and control: "review consent," not "accept terms."

## Open decisions

* Confirm the exact destination for **Review consent**:

  * preferred: `/member/profile/visibility`
  * alternative: dedicated `/member/consent`
* Confirm whether consent review is a standalone form or part of the profile visibility flow.
* Confirm whether success should return members to the originally requested gated route or always to `/member/dashboard`.
* Confirm final approved copy for the three badge explanations.

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