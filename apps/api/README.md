# API App

## TypeScript Boundary

`apps/api` is strict TypeScript. Route handlers must import shared contracts from `@iwfsa/common`.

## Repository Boundary

API route handlers must not issue direct SQL or import DB clients. Use repository interfaces from `apps/common/src/repositories.ts`.

CI enforces this with `scripts/phase4-spine-check.mjs`.

## Session And CSRF

State-changing requests must pass CSRF validation before privileged logic. Session IDs are opaque and rotate on privilege-sensitive changes.

## Audit

Privileged writes emit audit events through the common audit emitter. Audit metadata must be redacted.
