---
name: phase-slice-validation-next-steps
description: 'Validate a completed platform slice and produce governance-aligned next steps. Use when assessing implementation status, test evidence, audit/consent/privacy posture, provider boundaries, operational runbooks, provenance readiness, and immediate follow-up actions for an IWFSA phase or slice.'
argument-hint: 'Paste the slice status, verification evidence, and any candidate recommendations to assess.'
user-invocable: true
---

# Phase Slice Validation And Next Steps

## Required Context Injection

This skill is workspace-specific and must stay aligned to the current canonical governance documents.

Inject these values before executing the workflow:
- `{{GOVERNANCE_PRINCIPLES}}`
- `{{SURFACE_ISOLATION_RULES}}`
- `{{CONSENT_MODEL}}`
- `{{AUDIT_CATALOG_REF}}`
- `{{MAX_RECOMMENDATIONS}}`

Default `{{MAX_RECOMMENDATIONS}}` to `3`.

If `{{GOVERNANCE_PRINCIPLES}}`, `{{SURFACE_ISOLATION_RULES}}`, or `{{CONSENT_MODEL}}` is missing, halt and ask for canonical alignment before continuing.

Use this exact halt directive when required governance context is missing:
`HALT: Missing governance context. Inject {{CONSENT_MODEL}} from PLATFORM_MEMORY.md before execution.`

## What This Skill Produces

Use this skill to turn a completed or near-complete delivery slice into a decision-ready validation note.

The output should:
- Confirm what is actually verified versus only proposed.
- Assess governance fit against privacy, consent, audit, and surface-isolation rules.
- Produce targeted next-step recommendations in a fixed format.
- End with an immediate action checklist and cross-phase guidance.

## When To Use

Use this skill when the user asks for any of the following:
- Validate a phase, milestone, or slice after local or CI verification.
- Turn test results and implementation evidence into governance-aligned recommendations.
- Decide what should come next after worker, policy, audit, import, notification, or delivery work.
- Prepare a checkpoint summary before push, tagging, release, or provenance sync.
- Convert a technical completion report into structured program guidance.

Common trigger phrases:
- phase validation
- slice validation
- governance assessment
- next steps
- recommendations
- checkpoint
- provenance
- push pending
- verified complete

## Required Inputs

Gather or request these inputs before finalizing the output:
- Current slice or phase name.
- Commit hash or explicit local-only status.
- Verification status: local tests, CI status, supply-chain or provenance status, push state.
- Updated documentation list.
- Implemented behaviors or boundaries that were actually added.
- Governance-sensitive details: consent, standing, privacy, audit, RBAC, public/member/admin isolation.
- Candidate follow-up work, if any exists.

If commit hash, test evidence, CI state, or updated documentation list is missing, stop and request the missing evidence instead of drafting recommendations.

## Core Rules

- Distinguish verified facts from recommended future work.
- Never treat local success as remote provenance completion.
- Do not recommend UI expansion ahead of policy, audit, and consent controls.
- Preserve the platform rules from [AGENTS.md](../../../AGENTS.md): privacy before visibility, consent before publication, audit before trust, member control before admin convenience, and documentation before handover.
- Parameterize governance constants through the injected values above; do not generalize away IWFSA-specific controls.
- Keep every recommendation tied to governance risk, affected surface, implementation steps, verification, and documentation impact.
- Prefer transport-neutral, policy-first, audit-first designs over convenience shortcuts.
- Emit exactly 3 recommendations by default.
- Never output more than 3 recommendations in one handoff. If more work exists, defer the overflow into the next slice unless the user explicitly marks a P0 security or cutover exception.

## Procedure

1. Identify the slice boundary.
Record the slice name, current status, and the concrete implementation surface that was validated.

2. Separate evidence from interpretation.
List the hard evidence first: test counts, CI result, audit behavior, policy outcomes, outbox behavior, provider state, push state, or provenance state.

3. Write the governance assessment.
State whether the implementation respects `{{GOVERNANCE_PRINCIPLES}}`, `{{CONSENT_MODEL}}`, auditability, RBAC, and `{{SURFACE_ISOLATION_RULES}}`. Use direct language tied to the delivered behavior, not generic praise.

4. Derive targeted recommendations.
Choose the 3 most important next steps that logically follow from the delivered slice. If more than 3 are needed, split them into later slices or flag a P0 security or cutover exception.

5. Structure each recommendation exactly.
For each recommendation, produce these sections in order:
- Purpose
- Affected Surface
- Governance Risk
- Slice Scope: `Low`, `Medium`, or `High`
- Implementation Steps
- Verification
- Documentation Impact

Keep the total implementation step count across all recommendations at 12 or fewer. If the total would exceed 12, reduce scope and emit a slice-splitting warning.

6. End with execution guidance.
Add two closing sections:
- Next Immediate Action Checklist
- Cross-Phase Guidance

7. Check scope discipline.
Ensure the next steps do not bypass provider abstraction, policy evaluation, replay safety, audit correlation, consent re-evaluation, or provenance rules.

## Decision Points

### If verification is local only
- Mark the slice as locally verified, not fully released.
- Treat push, remote CI, tagging, and provenance sync as follow-up work, not completed work.

### If required evidence is missing
- Halt and request the missing commit hash or local-only marker, test evidence, CI state, or updated document list.
- Do not generate recommendations from partial provenance.

### If a provider or integration boundary is still fake or stubbed
- Recommend contract-first abstraction and provider-neutral interfaces before adding UI or operational complexity.

### If replay, retries, or dead-letter handling exists without current-state policy checks
- Recommend consent, standing, and RBAC re-evaluation at replay time.
- Require traceability via correlation identifiers or parent-child message lineage.

### If the implementation already emits audit events
- Check whether the next recommendation should tighten schema coverage, correlation integrity, or runbook usage before expanding features.

### If the user proposes convenience features first
- Redirect toward policy, audit, documentation, and operational safety if those are not already complete.

### If requested work exceeds one safe handoff
- Keep 3 recommendations only.
- Add a slice-splitting warning and defer the remainder into the next validation cycle.

## Output Format

Use this template.

```markdown
# <Phase / Slice Name>

**Status:** <verified status summary>
**Governance Assessment:** <short governance assessment paragraph>

---

### Recommendation 1: <title>
**Purpose**: <why this is the next right step>
**Affected Surface**: <surface list>
**Governance Risk**: <specific risk>
**Slice Scope**: <Low | Medium | High>
**Implementation Steps**:
1. <step>
2. <step>
3. <step>
4. <step>
**Verification**:
- <check>
- <check>
- <check>
**Documentation Impact**: <docs to update>

---

### Recommendation 2: <title>
...

---

### Recommendation 3: <title>
...

---

## Next Immediate Action Checklist
1. <action>
2. <action>
3. <action>
4. <action>

## Cross-Phase Guidance
- <guidance>
- <guidance>
- <guidance>
- <guidance>
```

## Quality Checks Before Finishing

Confirm all of the following:
- Canonical context injection was provided or explicitly requested.
- Verified work and proposed work are clearly separated.
- Commit hash or explicit local-only status is present.
- Test evidence, CI state, and updated document list are present.
- Every recommendation has an explicit governance risk.
- Exactly 3 recommendations are present unless a P0 security or cutover exception is explicitly stated.
- Total implementation steps across all recommendations are 12 or fewer, or a slice-splitting warning is present.
- Verification checks are executable and falsifiable.
- Documentation impact names concrete files where possible.
- The advice preserves outbox-first, consent-aware, audit-first discipline.
- No recommendation leaks PII into logs, provider payload examples, or admin workflows.
- The immediate checklist is action-oriented and ordered.

## IWFSA-Specific Heuristics

- Treat notification or background-job work as system-boundary design, not just implementation plumbing.
- Re-evaluate consent and standing at enqueue time, execution time, and replay time whenever delivery or visibility can change.
- Prefer admin runbooks and audit evidence before new admin UI.
- Treat tagging, SBOM alignment, and provenance sync as release-governance work that only happens after remote verification.
- When recommending documentation updates, look first at `{{AUDIT_CATALOG_REF}}`, `security-controls-matrix.md`, `decision-log.md`, `PLATFORM_MEMORY.md`, `test-strategy.md`, and `docs/ci-pipeline.md`.

## Ambiguity Handling

If the user provides a strong implementation summary but no format preference, default to the fixed recommendation structure above.

If the user provides recommendations already written, do not rewrite them blindly. Normalize them into the required structure, tighten governance language, and separate verified status from proposed work.

If the user wants a shorter output, compress prose inside each section but keep the section headings intact.

If the user asks for more than 3 recommendations, return the 3 highest-leverage recommendations and state which items should move into the next slice.