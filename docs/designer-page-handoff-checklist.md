# IWFSA Designer Page Handoff Checklist

Purpose: give designers and front-end developers a practical page-by-page checklist for turning the IWFSA member and admin working pages into polished interface designs.

Scope: visual and interaction handoff only. Do not include the home page or sign-in page in this checklist.

Use with:

- `docs/designer-custom-instructions.md`
- `docs/member-section-visual-design-brief.md`
- `docs/design-system.md`
- `docs/surface-navigation-map.md`

## Universal Page Checklist

Every page design must satisfy these checks before it is handed to development:

- The page has one clear primary task.
- There is no more than one primary action.
- The IWFSA logo is visible in the working page header.
- Navigation is surface-scoped: member pages show member navigation only; admin pages show admin navigation only.
- Georgia is used for page titles, dignified welcome copy, and editorial section headings.
- Sans-serif type is used for controls, labels, tables, cards, and metadata.
- Colors follow IWFSA tokens and palette guidance.
- No text overlaps, clips, or overflows on desktop or mobile.
- Inputs and buttons are at least 44px high.
- Cards use subtle borders, restrained shadows, and radius of 8px or less.
- No cards are placed inside other cards.
- Empty, loading, success, warning, and error states are designed where relevant.
- Focus states, labels, contrast, and keyboard order support WCAG 2.2 AA.
- Private, members-only, public-safe, audit, warning, and error states are visually distinct without becoming decorative noise.
- No real private member information, contact details, credentials, or sensitive examples appear in mockups.

## Member Dashboard

Primary task: orient the member and guide her to the next useful action.

Required design elements:

- IWFSA member workspace header with logo.
- Georgia welcome heading.
- Short purpose line that feels warm and professional.
- Status summary for profile, events, directory, and notifications.
- One strongest next-action button, such as completing the profile or reviewing an event.
- Secondary links kept visually quieter than the primary action.
- Warm page background connected to the accepted home-page palette.
- Responsive two-column desktop layout that becomes one column on mobile.

Quality checks:

- The page feels like a personal leadership desk, not a generic portal menu.
- The member can quickly understand what needs attention.
- The primary action is obvious without competing buttons.
- Status information is scannable within five seconds.

## Member Profile

Primary task: let the member control her profile identity and visibility.

Required design elements:

- Georgia heading focused on profile control or visibility.
- Profile image or dignified placeholder area.
- Field groups with clear labels and helper text.
- Visibility badges for Private, Members only, and Public-safe.
- A public visibility review callout explaining approval and consent in plain language.
- A clear confirmation state before or after changes are saved.
- Distinct visual treatment for editable private fields versus public preview material.

Quality checks:

- The page visually communicates that the member owns her identity.
- Privacy choices are visible without feeling intimidating.
- Public-safe material cannot be confused with private member data.
- The member can understand what will be seen by whom.

## Member Events

Primary task: help the member view events and RSVP comfortably.

Required design elements:

- Georgia heading for the events board.
- Event cards or rows with title, status, capacity, RSVP state, and key details.
- RSVP control that is large, clear, and comfortable.
- Success state for confirmed RSVP.
- Waitlist state for capacity-limited events.
- Failure state for unavailable or blocked RSVP attempts.
- Empty state for no available events.
- No admin create, edit, delete, or lifecycle controls.

Quality checks:

- Events are easy to scan and compare.
- RSVP state is unambiguous.
- The page looks like a member service, not an admin editor.
- Capacity or waitlist information is helpful but not visually overwhelming.

## Member Directory

Primary task: help members browse a consent-scoped directory.

Required design elements:

- Georgia heading for the directory.
- Search input with clear label.
- Filter controls for available directory attributes.
- Compact member entries or cards.
- Consent/visibility indicators on each entry.
- Empty state explaining that no visible members match the current filter.
- Protected member-surface styling, not public-profile styling.

Quality checks:

- Directory entries are compact enough for repeated browsing.
- Consent boundaries are visible and respectful.
- The page never implies that private information is public.
- Search and filters are easy to find and reset.

## Member Notifications

Primary task: let members understand notices and notification preferences.

Required design elements:

- Georgia heading for notifications or preferences.
- Grouped notice sections: events, standing, celebrations, administrative notices.
- Notice rows with title, date, type, and status.
- Preference controls for email, SMS, and in-app where available.
- Clear unread, action-needed, sent, and informational states.
- Empty state for no current notifications.

Quality checks:

- The page feels calm, not like a noisy inbox.
- Action-needed items are stronger than informational notices.
- Preference controls are understandable without long explanation.
- Notification types use restrained accents.

## Standing / Restricted Access

Primary task: explain limited access respectfully and provide next steps.

Required design elements:

- Georgia heading such as "Standing review required".
- Warm warning panel using warning color sparingly.
- Clear next steps: contact administrator, review standing, or return to dashboard.
- No internal admin reasoning, audit detail, or sensitive explanation.
- Calm layout with generous spacing.

Quality checks:

- The page is dignity-first and non-shaming.
- The member understands what to do next.
- The design avoids panic styling or full-page danger treatment.
- Restricted route existence is not exposed beyond the allowed fallback.

## Consent Required

Primary task: explain consent and help the member continue in control.

Required design elements:

- Georgia heading such as "Consent required".
- Simple explanation of why consent is needed.
- Visibility badges for Private, Members only, and Public-safe.
- One primary action to review or update consent.
- Secondary path back to dashboard.

Quality checks:

- The page feels reassuring, not legalistic.
- The privacy model is understandable at a glance.
- The member feels in control of visibility choices.
- No feature appears to proceed without required consent.

## Admin Events

Primary task: let administrators steward event records safely.

Required design elements:

- Admin workspace header with IWFSA logo and admin-only navigation.
- Georgia heading with operational admin subtitle.
- Event list with lifecycle status, capacity, RSVP count, waitlist count, and audit-aware metadata.
- Create event control.
- Edit event control.
- Delete event control with restrained destructive styling and confirmation.
- Lifecycle status control where supported.
- Empty state for no temporary event records.
- Success, validation, warning, and error states for create/edit/delete workflows.

Quality checks:

- The page feels like stewardship, not member self-service.
- Admin controls are clear but not visually aggressive.
- Destructive actions require a clear confirmation moment.
- Audit and lifecycle state are visible enough for operational confidence.
- Member-facing RSVP controls are not used as admin management controls.

## Admin Member And Governance Pages

Primary task: support controlled administration without exposing member self-service styling.

Required design elements:

- Admin-only header and navigation.
- Denser operational layout than member pages.
- Clear tables or structured lists for records.
- Status chips for standing, consent, approval, or audit state where relevant.
- Create/edit/delete controls only where the route and policy map allow them.
- Audit-aware success or confirmation states.
- Restricted access state for non-admin users.

Quality checks:

- Admin pages are visually distinct from member pages.
- Controls communicate responsibility and traceability.
- Private member information is handled with restraint.
- Administrative density does not become visual clutter.

## Handoff Deliverables

For each page, the designer should provide:

- Desktop layout.
- Mobile layout.
- Component list.
- Primary action and secondary actions.
- Empty, loading, success, warning, and error states.
- Token/color notes.
- Typography notes.
- Accessibility notes.
- Privacy/governance notes.
- Any unanswered design decision that needs product or governance approval.

