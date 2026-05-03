# Web Surface Conventions

## Surface-Aware Routing

All web routes belong to one surface:

- `public`: discovery and approved content.
- `member`: member participation and profile control.
- `admin`: stewardship, audit, imports, and approvals.

Routes must be listed in `docs/surface-navigation-map.md` before implementation.

## Single-Task Pages

Each route may expose at most one primary CTA marked with `data-primary-action="true"`.

Examples:

- `/member/dashboard`: Complete profile.
- `/member/profile/edit`: Set visibility.
- `/admin`: Review imports.
- `/admin/import/preview`: Resolve duplicate.

## Navigation

Use surface-scoped navigation only:

- `data-surface-nav="public"`
- `data-surface-nav="member"`
- `data-surface-nav="admin"`

Member pages must not render admin links. Public pages must not render protected member/admin route links except sign-in.

## Brand

Do not hard-code UI colors or inline styles. Use tokens from `apps/common/src/design-tokens.ts`.

## Accessibility

New routes must include:

- meaningful headings,
- one primary task,
- keyboard reachable action order,
- screen-reader labels for visibility state where member data is represented.
