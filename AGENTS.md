# AGENTS.md — IWFSA Platform V2

## Project Identity

This repository is the V2 rebuild of the IWFSA platform.

Treat V1 as a proof-of-concept trace, not as a source to copy blindly. V1 may be used to understand intended flows, screen ideas, data needs, and risks, but V2 must be built as a clearer, safer, governance-grade platform.

The platform serves three controlled surfaces:

- Public Surface: public mission, contact, approved storytelling, public-safe profiles, honorary members, and memorial content.
- Member Surface: authenticated member services, member-controlled profiles, event participation, privacy settings, member directory, and member-only content.
- Admin Surface: governance, approvals, imports, notifications, events, audit, membership status, and operational control.

## Core Principles

Privacy before visibility.
Consent before publication.
Audit before trust.
Member control before admin convenience.
Policy before page logic.
Validation before persistence.
Types before assumptions.
Documentation before handover.

## Governance Rules

Public pages must never expose private member information, internal member activity, admin operations, member-only content, event participation, documents, or unapproved profile material.

Member identity is member-controlled. Admins may support, review, approve, import, correct, and govern, but must not silently publish private member identity or profile information without consent and approval logic.

Any action that changes access, identity, visibility, money, documents, public representation, membership status, or governance state must be auditable.

## Technical Direction

Preserve the V2 architectural direction unless project documentation explicitly changes it:

- TypeScript-first modular monolith.
- Next.js web application.
- Modular TypeScript backend.
- PostgreSQL database.
- Policy-based access control.
- Audit-first governance.
- Background jobs where required.
- Secure media and document handling.
- Automated tests and CI/CD.

Do not introduce production dependencies casually. Prefer clear, maintainable, boring code over clever abstractions.

## Source Of Truth

When documents disagree, prefer this order:

1. docs/build-playbook.md
2. docs/roadmap.md
3. docs/product-requirements.md
4. docs/governance/
5. docs/privacy/
6. docs/knowledge-source/current-state.md
7. AGENTS.md

## Development Behaviour

Before making changes:

1. Read the relevant documentation.
2. Search for existing patterns before adding new ones.
3. Make the smallest useful change.
4. Keep public, member, and admin concerns separated.
5. Add or update tests when behaviour changes.
6. Run the documented verification commands.
7. Update documentation when the change affects product meaning, governance, privacy, architecture, roadmap, or delivery sequence.

## Agent Workflow Chain

Use the workspace skill [phase-slice-validation-next-steps](.github/skills/phase-slice-validation-next-steps/SKILL.md) when turning a completed slice into governance-aligned recommendations.

Use the workspace prompt [slice-brief-from-recommendations.prompt.md](.github/prompts/slice-brief-from-recommendations.prompt.md) only after the validation output contains provenance evidence, updated docs, and a bounded three-recommendation handoff.

For this workflow:

- Inject canonical governance context before running the skill: platform principles, surface isolation, consent model, and audit catalog reference.
- Treat missing provenance evidence as a stop condition, not a drafting invitation.
- Keep each validation handoff to three recommendations maximum unless a P0 security or cutover exception is explicitly justified.
- Split overflow into the next slice rather than widening the current handoff.

## Phase 2 Active Control Contract

Before generating or changing any route, form, API handler, policy rule, session behavior, or privileged workflow:

1. Read `docs/surface-navigation-map.md`.
2. Confirm the route/task exists in the surface matrix.
3. Confirm the route calls the policy engine before privileged logic.
4. Confirm state-changing requests require a session-bound CSRF token.
5. Confirm the fallback does not reveal restricted route existence.
6. Log any exception or unresolved choice in `decision-log.md` before implementation.

If a requested task or route is not listed in `docs/surface-navigation-map.md`, do not invent the route. Return or implement `POLICY_MISSING_MAPPING` behavior and request clarification before adding business logic.

Navigation and policy rules:

- Public routes are read-only and approval-gated.
- Member routes require a member-capable role, non-blocked standing, and consent where the matrix marks consent as required.
- Admin routes require `admin` or `chief_admin`, active standing, and audit trail enabled.
- Unknown member/admin routes redirect to surface-safe fallbacks rather than exposing route existence.
- Policy logic belongs in `apps/common`; UI components and web route rendering must not own business authorization rules.

Session and CSRF rules:

- Session IDs must be opaque CSPRNG values and must not embed role, subject, member ID, email, or standing.
- Cookies must use `Secure` in secure environments, `HttpOnly`, `SameSite=Lax`, `Path=/`, and explicit TTL.
- Session IDs rotate on login, admin elevation, standing change, and credential reset.
- All POST, PUT, PATCH, and DELETE requests require a synchronizer CSRF token tied to the current session.
- CSRF tokens are single-use.

Audit rules:

- Emit `SESSION_CREATED`, `SESSION_ROTATED`, `POLICY_DENY`, and `CSRF_BLOCKED` with correlation ID from day one.
- Audit events must not include raw PII, tokens, cookies, or session IDs.

## UX, Brand, and Seed Asset Rules

These rules are non-negotiable for every future phase:

- Every page must have one primary task and no more than one `data-primary-action`.
- Navigation must be surface-scoped. Public navigation may expose public routes only; member navigation may expose member routes only; admin navigation may expose admin routes only.
- Pages must use IWFSA design tokens from `apps/common/src/design-tokens.ts`; hard-coded UI colors and inline style attributes are not allowed.
- UX tone should create calm confidence and joyful discovery through focused tasks, progressive disclosure, encouraging completion states, and subtle token-based motion.
- V1 visual seed assets must resolve through `/legacy-assets/{filename}` and be backed by `apps/web/public/legacy-assets`.
- Seed member data must stay illustrative and must not include real contact details, credentials, private member records, or raw PII.
- `PLATFORM_MEMORY.md` records cross-cutting platform constraints and must be updated when a rule becomes permanent.

## V1 Usage Rule

Use V1 only as:

- a feature inventory,
- a user-flow prototype,
- a data-discovery source,
- a cautionary map.

Do not copy V1 architecture, naming, access assumptions, public/member/admin leakage, or accidental implementation shortcuts unless they have been reviewed and accepted in V2 documentation.

## Final Response Expectations

When completing work, summarize:

- what changed,
- which files changed,
- what verification was run,
- what documentation was updated,
- risks, assumptions, and follow-up steps.
