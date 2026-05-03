# Telemetry Runbook

## Purpose

Telemetry provides operational visibility without leaking private information.

## Correlation ID

Each request receives or propagates a correlation ID. The correlation ID must connect web, API, logs, and audit events.

## Redaction

redaction rule: telemetry and audit outputs must remove sensitive values before storage or display.

Logs and audit metadata redact:

- email,
- phone/mobile,
- token,
- secret,
- password,
- cookie,
- session identifiers.

## Audit

Audit events use `redactedMetadata` and `metadataHash`. Incident review should use correlation ID first, then target type and action.

## Incident Steps

1. Locate correlation ID.
2. Review structured request log.
3. Review audit events for the same correlation ID.
4. Confirm no raw PII appears in output.
5. Record findings in the support system without copying sensitive data.
