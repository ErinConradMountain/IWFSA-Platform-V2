# IWFSA Platform V2 Audit Event Catalog

## Phase 1 Scope

Phase 1 establishes the audit vocabulary placeholder. Privileged write workflows are not implemented yet, so no privileged write events exist in production code.

## Current Events

| Event | Surface | Status | Notes |
| --- | --- | --- | --- |
| `SESSION_CREATED` | API | Active | Emitted when an anonymous CSRF session is created. |
| `SESSION_ROTATED` | API | Active | Emitted on login, admin elevation, standing change, credential reset, and activation scaffold. |
| `POLICY_DENY` | API | Active | Emitted when policy denies a protected route or missing task mapping. |
| `CSRF_BLOCKED` | API | Active | Emitted when CSRF token is missing, invalid, or replayed. |
| `sign_in` | API | Retired | Replaced by generic session update response and `SESSION_ROTATED` audit event in Phase 2. |
| `sign_out` | API | Scaffold | Clears local/test session. |
| `inspect_session` | API | Scaffold | Read-only session inspection. |
| `member_access` | API | Scaffold | Placeholder protected-route authorization outcome. |
| `admin_access` | API | Scaffold | Placeholder protected-route authorization outcome. |
| `resolve_route` | API | Scaffold | Local/test route resolution support. |

## Audit Rules For Future Phases

- Audit events must not contain raw PII.
- Each privileged write must include actor, action, target type, target ID, timestamp, correlation ID, and metadata hash.
- Audit writes must be append-only.
- Admin convenience must never override member consent or visibility decisions.
