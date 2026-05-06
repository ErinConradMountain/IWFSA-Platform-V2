# Standing / Restricted Access Page Sheet
## Page Acceptance Matrix

| Route | Surface | Primary task | One primary action | Required states | Policy/fallback requirement | Privacy or audit note | Open decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/member/standing` | Member | Explain limited access respectfully and provide one practical next step. | `Return to dashboard`; `Contact administrator` remains secondary until support workflow is mapped. | Default restricted, empty/unavailable, loading, success if support exists, warning, error. | Fallback for blocked member actions such as event access and RSVP; do not reveal restricted route existence beyond safe fallback. | Do not expose standing reasons, payment state, discipline language, audit IDs, or admin-only notes. | Confirm the support/contact workflow and final dignity-first copy. |

## Route

`/member/standing`

Fallback route for blocked member actions, especially:

* `/member/events`
* member RSVP actions
* any member route where `standing=blocked`

Policy behavior must follow the member surface map: blocked member event access falls back to `/member/standing`; notification fallback remains `/member/dashboard` where mapped. 

## Primary task

Explain that access is temporarily limited, preserve member dignity, and give one practical next step.

## Desktop layout

* Use the shared member workspace shell with visible IWFSA logo and member-only navigation: Dashboard, Profile, Events, Directory, Notifications.
* Warm off-white page background using `apps/common/src/design-tokens.ts`.
* Top page band:

  * Georgia heading: **Standing review required**
  * Short purpose line: "Some member actions are temporarily unavailable. We will guide you to the right next step."
* Main content in a centered 12-column layout:

  * Main warning panel spans 7 to 8 columns.
  * Secondary support panel spans 4 to 5 columns.
* Do not use a full red or danger page. Use warning amber sparingly, as a left border, icon accent, or small status chip. 

## Mobile layout

* Single-column layout.
* Header compresses to logo, workspace label, and compact member navigation.
* Warning panel appears first.
* Primary action appears directly below the explanation.
* Secondary support text follows after the primary action.
* All buttons are full-width or minimum 44px high.
* No text, badge, or button may overflow.

## Components

* `MemberWorkspaceHeader`

  * Surface: `member`
  * Navigation: member routes only.
  * No admin links.
* `PageIntro`

  * Georgia heading.
  * Short, non-shaming explanation.
* `InfoCallout`

  * Surface-scoped warning callout.
  * Token-styled.
  * Uses `aria-labelledby` and `aria-describedby` as required by the design system. 
* `RestrictedAccessPanel`

  * Warm panel background.
  * Warning accent from `colors.semantic.warning` or equivalent token.
  * Copy must not reveal standing reason, internal notes, payment details, or audit trail.
* `NextStepActions`

  * One primary button.
  * One secondary text/button action only if needed.
* `SupportNote`

  * Plain-language note explaining that an administrator can help.

## Primary action

Primary action: **Return to dashboard**

Use this as the default because it is safe, non-accusatory, and always available.

Secondary action: **Contact administrator**

Use as a secondary button or link, not a competing primary CTA.

Primary action rule:

1. If the blocked route has a safe dashboard fallback, primary action is **Return to dashboard**.
2. For launch, **Contact administrator** remains secondary until a support workflow is configured.
3. Never show both as equal-weight primary buttons.

## Empty / loading / success / warning / error states

### Empty state

Use when no standing status payload is available but access is still restricted.

Copy direction:

"Access to this member action is not available right now. Please return to your dashboard or contact the IWFSA administrator for assistance."

Action: **Return to dashboard**

### Loading state

* Show subdued skeleton panel.
* Text: "Checking access..."
* Do not flash restricted copy until the policy result is known.
* Keep navigation visible.

### Success state

Use only after a support contact/request action exists and succeeds. Do not design this as active for launch unless the support workflow is confirmed.

Copy direction:

"Your message has been sent. The administrator will have the context needed to assist."

Action: **Return to dashboard**

### Warning state

Default page state.

Copy direction:

"Access to this member action is temporarily limited. This page does not show private standing details. Please use the next step below."

Action: **Return to dashboard**

### Error state

Use when the standing/support lookup fails.

Copy direction:

"We could not load the access guidance right now. Please return to your dashboard and try again."

Action: **Return to dashboard**

Do not expose API errors, policy internals, standing reasons, audit IDs, or admin-only fields.

## Accessibility notes

* Target WCAG 2.2 AA. 
* Page heading must be the only `h1`.
* Warning callout must be announced with accessible label and description.
* Primary action must appear before secondary support links in keyboard order.
* Focus ring must use the focus token from `apps/common/src/design-tokens.ts`.
* Warning color must not be the only indicator; include text and icon/label.
* Buttons must be at least 44px high.
* Language must be instructive, not punitive.

## Privacy / governance notes

* Member surface only; no admin controls.
* Do not show private standing reasons.
* Do not show audit detail, internal notes, payment state, disciplinary language, or administrator-only metadata.
* Do not reveal whether another route exists beyond the safe fallback.
* Keep copy dignity-first and practical.
* Styling must use `apps/common/src/design-tokens.ts`; do not hard-code UI colors outside token definitions. 
* The page must preserve public, member, and admin surface separation. 

## Open decisions

* Confirm whether **Contact administrator** opens an email link, support form, or internal message action.
* Launch decision: keep **Return to dashboard** as the primary action for all blocked member routes. **Contact administrator** remains secondary until a support workflow is available.
* Confirm final copy for the restricted-access message before implementation.


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