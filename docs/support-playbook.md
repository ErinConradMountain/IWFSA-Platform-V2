# Support Playbook

## Purpose

Support workflows must protect member dignity and avoid exposing private data during triage.

## First Response

1. Capture correlation ID.
2. Identify surface: public, member, or admin.
3. Check whether the issue is access, consent, standing, import, or audit related.
4. Avoid requesting raw passwords, tokens, or unnecessary personal information.

## Escalation

- Access or standing issue: security/support lead.
- Import issue: operations lead.
- Public profile issue: governance/review lead.
- Audit gap: security lead.

## Records

Use audit correlation IDs and redacted metadata. Do not copy raw PII into support notes.

## Phase 10 Support Readiness

Before RC promotion, support must be able to:

1. Ask for and record a correlation ID.
2. Identify whether the issue is public, member, admin, import, event, standing, notification, or audit related.
3. Confirm whether the user is seeing a generic denial by design.
4. Escalate suspected privacy leaks or audit gaps immediately.
5. Use runbook links rather than raw database screenshots in support notes.
