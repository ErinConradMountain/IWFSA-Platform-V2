# Privacy By Design In UX

## Principle

The interface must make the safest privacy choice the easiest choice. Member dignity and consent come before operational convenience.

## Controls

| UX Risk | Control |
| --- | --- |
| Private fields appear public | Visibility tokens and screen-reader labels distinguish private, members-only, and public states. |
| Consent feels bureaucratic | Single-task pages and progressive disclosure reduce checkbox fatigue. |
| Admin overreach | Admin prototypes show what will change before commit and include audit labels. |
| Mobile leakage | Surface navigation and protected route fallbacks apply consistently across viewport sizes. |
| Audit invisibility | Interactive prototypes show audit-preview copy before privileged commits. |
| Consent erosion | Member profile visibility routes explain that public publication requires good standing, curator approval, and member-controlled visibility withdrawal. |

## Data Classification In Wireframes

Every P0 wireframe must annotate fields as:

- `private`
- `members`
- `public`
- `audit-only`

Public render prototypes must not contain private or members-only content.

## Consent Language

Consent prompts must explain:

- what will be visible,
- who can see it,
- how to change it later,
- whether an audit event is recorded.

For profile publication, the member-facing hint must state that public appearance requires Good standing and curator approval, and that the member can withdraw visibility at any time.

## Current Prototype Coverage

- Member profile edit flow: visibility and consent annotation.
- Admin import preview flow: duplicate resolution and audit preview.
- Public profile approval flow: approved render only.
