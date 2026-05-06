# Webpages Handoff Pack

This folder contains design handoff material for the IWFSA Platform V2 member and admin working pages. It is a development-ready design package, not a production component folder.

## Folder Contents

| File group | Purpose | Production status |
| --- | --- | --- |
| `iwfsa-*-preview.jsx` | Visual prototypes used to review layout, tone, component composition, and state examples. | Prototype only. Do not copy into production routes without rebuilding against policy, shared components, and `apps/common/src/design-tokens.ts`. |
| `*-page-sheet.md` | Page sheets for individual member/admin routes. Each sheet records route, surface, primary task, one primary action, states, policy/fallback requirements, privacy/audit notes, mobile/accessibility checks, and open decisions. | Development handoff reference. |
| `iwfsa-page-specific-design-sheets.md` | Consolidated page-specific design guidance covering the broader working-page set. | Design reference. |
| `final-handoff-deliverables-outline.md` | Final leadership/developer handoff outline and checklist. | Final handoff reference. |
| `actual-page-sheets-member-admin.pdf` | Static export/snapshot of the page-sheet package. | Preview/reference artifact. |

## Handoff Rules

- Do not create new surfaces from these files without checking `docs/surface-navigation-map.md` and the policy layer.
- JSX previews are visual prototypes only; production routes must use shared design tokens, policy checks, CSRF requirements for mutations, and audit-aware workflows.
- Page sheets are the acceptance reference for single-task pages, one primary action, state coverage, privacy/consent/fallback behavior, and accessibility sign-off.
- Demo-only preview state panels belong in review environments, not live member or admin pages.