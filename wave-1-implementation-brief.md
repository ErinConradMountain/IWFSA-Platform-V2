# Wave 1 Implementation Brief

Status: Closed on 2026-05-03.

This brief defines the first protected delivery slice for IWFSA Platform V2.

Wave 1 exists to prove the identity and access boundary before any protected business workflow becomes real. It should establish the minimum server-enforced authentication and RBAC structure needed for later member, admin, and event work.

## Trace Coverage

- `TRC-001`: Unified sign-in with role-based routing
- `TRC-002`: Public, member, and admin boundary enforcement

## Goal

Create a minimal but defensible auth and RBAC skeleton that:

- preserves one sign-in entry concept,
- enforces public vs member vs admin access on the server,
- proves role-based routing and denied-access handling,
- stays narrow enough to avoid premature credential or database complexity.

## In Scope

- Shared auth request context model
- Role resolution for `member`, `admin`, and `chief_admin`
- Server-side authorization helpers for public, member, and admin surfaces
- Placeholder sign-in route that can express role-based next-step routing
- Access-denied handling for protected member and admin routes
- Tests proving public access remains open and member/admin routes are protected

## Out Of Scope

- Real user credential storage
- Password hashing or account activation implementation
- Membership standing enforcement beyond placeholder hooks
- Database-backed session storage
- Event-scoped permissions
- MFA or production-grade privileged access controls

## Delivery Strategy

Wave 1 should land in two internal steps:

1. Auth and RBAC skeleton without persistence.
2. Minimal session persistence boundary after access tests pass.

This keeps the first proof focused on server-enforced boundaries rather than on storage details.

## Proposed Skeleton Approach

### Step A: Pre-persistence auth skeleton

- Introduce a shared auth context parser.
- Support a temporary request header identity mechanism for tests and local boundary validation.
- Centralize route access decisions in one RBAC policy helper.
- Make member and admin routes depend on the shared policy helper rather than inline conditionals.

### Step B: Minimal persistence addition

- Add an explicit session repository boundary.
- Provide an in-memory session adapter only.
- Support a sign-in action that issues a session token and a sign-out action that clears it.
- Preserve the same RBAC policy surface so persistence does not change route semantics.

## Acceptance Criteria

- Public routes remain reachable without authentication.
- Member routes reject anonymous requests and admin-only sessions are still accepted where member access is valid.
- Admin routes reject anonymous and member-only requests.
- The sign-in entry can determine the correct target surface from the authenticated role.
- Denied access responses are controlled and do not leak protected data.
- Auth-related events expose enough information for later audit integration without locking in a final audit implementation.

## Test Plan

- Public route test: anonymous request reaches the public shell.
- Member route test: anonymous request is denied.
- Member route test: authenticated member request succeeds.
- Admin route test: member request is denied.
- Admin route test: admin request succeeds.
- Role-routing test: sign-in endpoint returns the correct next route for a requested role.

## Persistence Rule For This Wave

Do not add persistence until the non-persistent access tests are passing.

When persistence is added, keep it minimal and reversible:

- in-memory only,
- clear boundary interface,
- no external dependencies,
- no commitment yet to long-term storage.

## Exit Criteria

- Shared auth and RBAC modules exist.
- Public/member/admin route behavior is proven by executable tests.
- A minimal in-memory session repository exists behind an explicit boundary.
- The scaffold remains dependency-free and consistent with `architecture-decisions.md`.

## Completion Notes

- Completed: shared auth and RBAC modules now protect public, member, and admin boundaries.
- Completed: the web `/signin` surface now delegates session creation to the API-owned in-memory session flow.
- Completed: the web layer inspects and clears sessions through the API instead of relying on header-only demo auth for protected routes.
- Completed: role-to-route resolution remains preserved for `member`, `admin`, and `chief_admin`.
- Completed: sign-out clears the session and protected routes reject the invalidated cookie.
- Completed: local-development-only role self-selection is gated, sessions expire, production cookies are strengthened, and auth-service failures are surfaced explicitly.
- Remaining for later waves: real credentials, standing-aware eligibility, and durable session storage.