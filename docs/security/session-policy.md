# Session Policy

## Purpose

Browser identity must be server-governed, opaque, CSRF-protected, and resistant to enumeration.

## Session ID

- Generated with CSPRNG.
- At least 128 bits; current implementation uses 256-bit random IDs.
- Contains no role, subject, member ID, email, or standing data.

## Cookie Rules

- `HttpOnly`
- `SameSite=Lax`
- `Path=/`
- explicit `Max-Age`
- `Secure` in secure environments, with localhost development exception.

## Rotation

rotation rule: session identifiers rotate on each privilege-sensitive transition.

Rotate session ID on:

- login,
- admin elevation,
- standing change,
- credential reset,
- activation scaffold.

## CSRF

All state-changing browser/API requests require synchronizer CSRF tokens.

- Token is tied to the session.
- Token is single-use.
- Missing, invalid, or replayed token returns generic 403 and emits `CSRF_BLOCKED`.

## Generic Responses

Login, reset, and activation responses must not reveal whether an account, token, role, or credential exists.
