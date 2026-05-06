# IWFSA Member Section Visual Design Brief

Purpose: provide a designer-ready description of the member section pages so the front-end design can be built into the application with consistent IWFSA styling, typography, page structure, and user comfort.

Scope: visual design only. This brief does not change policy, data, authentication, or workflow rules.

## Global Member Section Look

The member section should feel like a calm, elegant working space for accomplished women leaders. It should not look like a plain admin database, a generic portal, or a marketing landing page. The experience should combine the professional confidence of the current home page with clearer task surfaces for daily member use.

Use a refined editorial layout with a strong IWFSA header, generous spacing, clean panels, and warm accent details. The layout should feel polished, South African, contemporary, and dignified without being overdecorated.

## Typography

Use Georgia as the primary display and editorial text voice for headings and page titles:

- Main page headings: Georgia, 34-44px desktop, 28-34px mobile, regular or semibold weight.
- Section headings: Georgia, 22-28px desktop, 20-24px mobile.
- Pull quotes or welcome lines: Georgia italic, 18-22px.
- Body and controls: keep a highly readable sans-serif such as Inter, Segoe UI, or system sans-serif at 16px.

The visual effect should be:

- Georgia for warmth, dignity, and institutional character.
- Sans-serif for form labels, buttons, metadata, cards, and repeated controls.
- No negative letter spacing.
- Uppercase labels should be small, restrained, and not overused.

## IWFSA Color System

Use the existing IWFSA design tokens as the base:

- Primary navy: `#003366`
- Gold: `#D4AF37`
- White background: `#FFFFFF`
- Soft surface: `#F8F9FA`
- Main text: `#1A1A1A`
- Muted text: `#4D5A66`
- Focus blue: `#005FCC`

Home-page warmth may be used to connect member pages visually to the front page:

- Warm page top: `#F7F3EC`
- Warm page mid: `#F2EFE8`
- Warm page bottom: `#EDE9E2`
- Warm panel: `#FBF7EF`
- Deep hero ink: `#07131D`, `#0D1824`, `#111D29`
- Orange accent: `#E96F00`
- Warm accent: `#D88A2F`
- Dark accent: `#C75500`

Semantic colors:

- Member-only content: `#00695C`
- Public-safe content: `#2E7D32`
- Private content: `#5B4B8A`
- Audit/stewardship notes: `#6A4A00`
- Warning: `#ED6C02`
- Error: `#C62828`
- Success: `#2E7D32`

Use navy for structure and trust, gold for primary highlights, warm neutrals for page backgrounds, and green/teal only where member status or member-only access needs a clear signal.

## Shared Header

Every member page should carry a consistent header inspired by the home page:

- Left: IWFSA logo, large enough to be clearly recognised, not a small favicon.
- Beside logo: "International Women's Forum South Africa" in Georgia or a refined serif treatment.
- Subtitle: "Member workspace" or the current section name.
- Right: member-scoped navigation only: Dashboard, Profile, Events, Directory, Notifications.
- Header background: deep navy or warm off-white depending on page depth.
- Active navigation item: gold underline or gold-filled pill.

Avoid exposing admin links in member navigation. The header should immediately tell the user they are in the member workspace.

## Page Shell

All member pages should use the same visual shell:

- Warm off-white page background.
- Top page band with a Georgia heading, short explanatory line, and one primary task.
- Main content in a 12-column responsive grid.
- Cards should be simple, 8px radius or less, with subtle border and soft shadow.
- No cards inside cards.
- Page sections should feel open, not boxed in repeatedly.
- Keep controls close to the content they affect.
- Use clear completion and empty states.

## Member Dashboard

Route: `/member/dashboard`

Purpose: orient the member and help her choose the next useful action.

Visual feel:

- Warm welcome page with the logo/header clearly present.
- Large Georgia heading such as "Welcome back" or "Member workspace".
- A refined summary panel showing the member's current standing, profile visibility, event status, and notifications.
- A calm two-column layout on desktop:
  - Left: today's member priorities.
  - Right: status and quick links.
- Single-column stacked layout on mobile.

Main visual elements:

- Welcome band with navy background or warm image-tinted treatment matching the home page.
- Status chips for: Profile, Events, Directory, Notifications.
- One primary action only, visually strongest: "Complete profile" or the most relevant next action.
- Secondary text links for other member areas.

Designer notes:

- This page should feel like a personal landing desk, not a generic menu.
- Use Georgia for the welcome heading and short editorial line.
- Use gold sparingly to guide the eye to the main next action.

## Member Profile

Routes: `/member/profile`, `/member/profile/edit`, `/member/profile/visibility`, `/member/profile/confirmation`

Purpose: allow a member to review and control how her identity/profile information is represented.

Visual feel:

- Trustworthy, private, and member-controlled.
- Use a quieter palette with navy, white, warm panel backgrounds, and privacy/member/public visibility accents.
- Avoid making the profile feel like a public biography page until public visibility is explicitly being previewed.

Main visual elements:

- Profile header with portrait placeholder or approved member image area.
- Georgia page title: "Profile visibility control" or "Your member profile".
- Visibility control area with three visually distinct states:
  - Private: purple accent `#5B4B8A`
  - Members only: teal accent `#00695C`
  - Public-safe: green accent `#2E7D32`
- A callout titled "Public visibility review" explaining approval in warm, plain language.
- Field groups with labels, helper text, and visibility badges.
- Confirmation panel showing what will be saved.

Designer notes:

- Use visible privacy signals, but keep them elegant.
- Make member control obvious: the page should say visually that the member owns her identity.
- The public preview should look different from editable private fields.

## Member Events

Route: `/member/events`

Purpose: show available member events and make RSVP comfortable and clear.

Visual feel:

- Polished event board with strong readability.
- It should feel connected to the home page's leadership/event imagery and warm colors.
- Avoid dense calendar complexity unless needed later.

Main visual elements:

- Page heading in Georgia: "Choose and manage event participation".
- Intro line explaining that only published member events appear.
- Event cards arranged in a responsive grid.
- Each event card should show:
  - Event title in Georgia or strong serif subheading.
  - Status chip, e.g. Published.
  - Capacity chip, registered count, waitlist count.
  - Date/time/location area when those fields are added.
  - RSVP button as the main action on each card.
- Toolbar above cards:
  - "Available events"
  - Current RSVP message or empty state.
- RSVP result message:
  - Success: soft green confirmation.
  - Waitlist: warm amber notice.
  - Failure: restrained red error block.

Designer notes:

- Event cards must be easy to scan.
- Buttons should be comfortable and obvious, not small text links.
- The event page should look like a member service, not an admin event editor.
- Keep admin-only controls such as create/edit/delete completely absent from member view.

## Member Directory

Route: `/member/directory`

Purpose: allow members to browse a consent-scoped directory without exposing private information.

Visual feel:

- Refined professional directory.
- Calm, searchable, and confidence-building.
- The design should make privacy boundaries visible without feeling bureaucratic.

Main visual elements:

- Georgia heading: "Consent-scoped directory".
- Intro line: directory content appears only within member consent rules.
- Search input with clear label.
- Filter row for sector, region, visibility, or member group when available.
- Member cards or compact rows:
  - Name
  - Role/title
  - Organisation
  - Public/member-only indicator
  - Optional portrait thumbnail
- Empty state that says no matching members are visible under current consent/filter settings.

Designer notes:

- Directory entries should be compact enough for scanning.
- Use member teal `#00695C` to signal member-only visibility.
- Avoid public-profile styling here; this is a protected member surface.

## Member Notifications

Route: `/member/notifications`

Purpose: show member notices and allow notification preferences to be understood and eventually managed.

Visual feel:

- Clean message center, not an email inbox clone.
- Notifications should be grouped, readable, and calm.

Main visual elements:

- Georgia heading: "Notification preferences" or "Member notifications".
- Summary panel showing notification channels and preference status.
- Notification list grouped by:
  - Events
  - Membership standing
  - Celebrations
  - Administrative notices
- Each notice row/card should include:
  - Type icon or color accent.
  - Short title.
  - Date.
  - Status, e.g. unread, sent, action needed.
- Preference controls should be visually clear:
  - Toggle or checkbox controls for email, SMS, and in-app.
  - Annual consent/status label.

Designer notes:

- Use subtle color accents by notification type.
- Avoid too many strong colors in one view.
- Make action-needed items visually stronger than informational messages.

## Member Standing / Restricted Access State

Route/fallback: `/member/standing`

Purpose: explain when a member cannot access a member action because standing blocks it.

Visual feel:

- Respectful, clear, and non-shaming.
- This page should never feel punitive.

Main visual elements:

- Georgia heading: "Standing review required" or similar.
- Warm callout explaining that access is temporarily limited.
- Clear next step area:
  - Contact administrator.
  - Review membership standing.
  - Return to dashboard.
- Use warning amber `#ED6C02` sparingly, not as a full danger page.

Designer notes:

- Use dignity-first language.
- Keep the page visually calm.
- Do not expose internal admin reasoning or private audit details.

## Member Consent Required State

Route/fallback: `/member/consent-required`

Purpose: explain that profile/directory features need consent before continuing.

Visual feel:

- Reassuring and transparent.
- The member should feel in control.

Main visual elements:

- Georgia heading: "Consent required".
- Simple explanation panel.
- Visibility badges showing what consent affects:
  - Private
  - Members only
  - Public-safe
- One primary action to review consent.

Designer notes:

- This page should visually reinforce choice and control.
- Avoid legal-heavy design.
- Make the privacy model easy to understand at a glance.

## Empty, Loading, and Error States

Every member page needs designed states:

- Empty state: warm panel, short explanation, one next action.
- Loading state: simple skeleton rows or subdued spinner, not a blank page.
- Success state: soft green accent with concise confirmation.
- Warning state: amber accent and practical next step.
- Error state: red accent, generic wording, no sensitive technical detail.

Use the same border radius, type scale, and button styling across states.

## Visual Asset Guidance

Use existing seed assets through:

- `/legacy-assets/iwfsa-logo.svg`
- `/legacy-assets/iwfsa-logo.jpg`
- `/legacy-assets/iwfsa-home.jpg`
- member portrait seed assets under `/legacy-assets/`

The logo should appear on all member pages. The home image can be used as a subtle page-band background or cropped header image, but member pages should remain functional and readable.

## Button and Control Styling

Primary buttons:

- Navy background `#003366`
- White text
- Gold border or small gold highlight for important actions
- Rounded enough to feel modern, but not oversized

Secondary buttons:

- White or warm panel background
- Navy text
- Navy or gold border

Danger/destructive buttons:

- Use restrained red border/text.
- Avoid full red filled buttons unless deletion is the only task in a confirmation view.

Forms:

- Labels above fields.
- Inputs at least 44px high.
- Clear focus ring using `#005FCC`.
- Helper text in muted text `#4D5A66`.

## Mobile Design

On mobile:

- Header compresses into logo/title plus compact navigation.
- Cards become single column.
- Action buttons should be full-width or easy thumb targets.
- Event cards should show title, date/status, and RSVP before secondary metadata.
- No text should overflow buttons or cards.

## Designer Handoff Summary

The member section should look like a trusted, elegant IWFSA workspace:

- Georgia headings for warmth and institutional tone.
- Navy and gold as core brand colors.
- Warm home-page neutrals for backgrounds.
- Teal/green/purple semantic accents for member-only, public-safe, and private states.
- Strong logo/header continuity with the front page.
- Clear single-task pages with comfortable controls.
- Member dignity and privacy visible in every layout.
