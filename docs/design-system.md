# Design System

## Purpose

The IWFSA Platform V2 design system creates a calm, dignified, privacy-aware experience across public, member, and admin surfaces. Design is a governance control: every interface must preserve member control, prevent accidental private-to-public leakage, and support auditability.

## Token Source

Design tokens live in `apps/common/src/design-tokens.ts`.

Required token groups:

- `colors.primary`: IWFSA blue.
- `colors.secondary`: IWFSA gold.
- `colors.semantic.private`: private/member-controlled indicator.
- `colors.semantic.members`: members-only visibility indicator.
- `colors.semantic.public`: approved-public indicator.
- `colors.semantic.audit`: audit-preview indicator.
- `typography`: readable, dignified scale.
- `motion`: subtle purposeful transitions only.
- `spacing`: calm rhythm for single-task pages.

Hard-coded UI colors and inline style attributes are prohibited outside the token file.

## Surface-Aware Layout

Every layout receives or derives a surface: `public`, `member`, or `admin`.

Surface navigation rules:

- Public navigation: discovery and sign-in only.
- Member navigation: dashboard, profile, events, directory, notifications only.
- Admin navigation: stewardship console, imports, standing, review queue, audit, support notes only.

Cross-surface navigation links are not allowed.

## Single-Task Page Rule

Each page has one primary task and at most one primary CTA. Secondary choices must move into surface navigation, progressive disclosure, or a later route.

Current P0 prototype tasks:

| Flow | Route Sequence | Primary Task | Governance Annotation |
| --- | --- | --- | --- |
| Member profile edit | `/member/profile/edit` -> `/member/profile/visibility` -> `/member/profile/confirmation` | Update one profile field and visibility | Field-level visibility, consent gate, audit label |
| Admin import preview | `/admin/import/preview` -> `/admin/import/resolve-duplicate` -> `/admin/import/commit` -> `/admin/audit` | Resolve one import decision before commit | Preview does not mutate live records; audit preview visible |
| Public profile approval | `/public/profile-submission` -> `/admin/public-review` -> `/admin/public-review/approve` -> `/public/profile/seed-ayanda` | Approve public render | Hidden fields absent; approval audit-labelled |

## Component Governance Props

Interactive components must include:

- `surface`
- `visibility`
- `consentGate`
- `auditLabel`
- design token reference

The typed contract lives in `apps/common/src/component-contracts.ts`.

## InfoCallout

`InfoCallout` is the standard contextual hint pattern for consent, visibility, and publication-gate explanations. It must be surface-scoped, token-styled, and linked to assistive technology with `aria-labelledby` and `aria-describedby`.

Member profile publication copy:

> Your profile will only appear publicly when your standing is Good and a curator approves it. You retain full control and can withdraw visibility at any time.

This copy belongs on member profile visibility/edit routes only and must not be rendered on public or admin surfaces.

## Accessibility and Dignity

Minimum target: WCAG 2.2 AA.

Standards:

- Screen reader labels include visibility state, for example: `Biography, visible to members only`.
- Validation messages must be instructive, not punitive.
- Keyboard navigation must follow the single primary task in page order.
- Motion must never be required to understand state.

## Joyful UX Patterns

Joy is implemented through restraint:

- focused pages,
- encouraging completion copy,
- visibility previews before publication,
- clear audit confirmations,
- subtle motion tokens,
- legacy visual assets used only where public-safe.
