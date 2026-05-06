---
name: "Slice Brief From Recommendations"
description: "Generate an implementation-ready slice brief from a validated phase recommendation set. Use after the phase-slice-validation-next-steps skill when you need trace-to-test mapping, audit schema additions, CI gate updates, rollback checkpoints, and migration notes."
argument-hint: "Paste the validated recommendation set, commit hash, test count, CI status, and updated docs list."
agent: "agent"
model: "GPT-5 (copilot)"
---

Generate a slice brief from the provided validated recommendation set.

## Required Inputs

Do not proceed unless all of the following are present:
- Slice validation output from [phase-slice-validation-next-steps](../skills/phase-slice-validation-next-steps/SKILL.md)
- Commit hash, or explicit local-only marker when push is pending
- Test count or verification summary
- CI status
- Updated documentation list

If any required field is missing, stop and return a concise missing-field list.

Use this refusal shape when provenance is incomplete:
`REFUSAL: Missing provenance fields: <comma-separated fields>. Provide these before slice brief generation. Required gates remain defined in test-strategy.md and docs/ci-pipeline.md.`

## Constraints

- Preserve the evidence-first boundary: verified provenance before planning.
- Keep the brief aligned to [slice-brief-template.md](../../slice-brief-template.md).
- Reference the governing anchors explicitly: [audit-event-catalog.md](../../audit-event-catalog.md), [security-controls-matrix.md](../../security-controls-matrix.md), and [test-strategy.md](../../test-strategy.md).
- Include exact file paths and section names for governance references. Include line numbers when they are available from the supplied material.
- Do not invent migration work, audit events, or rollback steps that are not justified by the validated recommendations.

## Output Sections

Produce the brief in this order:
1. Slice ID
2. Slice Name
3. Source Provenance
4. Recommendation Trace
5. Trace-to-Test Mapping
6. Migration / Backward Compatibility Notes
7. Audit Event Schema Additions
8. CI Gate Updates
9. Rollback Checkpoints
10. Documentation Updates
11. Open Risks / Deferred Work

## Section Requirements

### Slice ID
- Use the repository naming shape from [slice-brief-template.md](../../slice-brief-template.md).

### Source Provenance
- Record commit hash or local-only marker.
- Record test count or verification evidence.
- Record CI state.
- Record updated documentation list.

### Recommendation Trace
- Map each chosen recommendation to the briefed implementation scope.
- If the upstream output contained more than 3 potential threads, state which ones were deferred.

### Trace-to-Test Mapping
- Map the slice to existing test IDs when available.
- If new tests are needed, propose new IDs using the existing repository pattern.
- Keep the mapping scoped to one safe slice.

### Migration / Backward Compatibility Notes
- State whether the slice changes storage, contracts, providers, routing, or replay semantics.
- If no migration is needed, say so explicitly.

### Audit Event Schema Additions
- Name every new or changed audit event.
- State the intended correlation fields and redaction rules.

### CI Gate Updates
- State the exact expected gates, using the repository's current CI language.
- Call out any new documentation control or provenance checks.

### Rollback Checkpoints
- Give concrete rollback boundaries tied to code, schema, or configuration changes.
- Preserve audit and replay traceability in the rollback notes.

### Documentation Updates
- Name the specific files to update.
- Keep the list consistent with the validated recommendation output.

## Final Check

Before finishing, verify that the brief:
- is directly traceable to the validated recommendations,
- contains provenance evidence before planning details,
- references governance files explicitly,
- preserves outbox-first, consent-aware, audit-first discipline,
- and does not exceed one implementation slice.