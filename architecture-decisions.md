# Architecture Decisions

This document records the initial architecture decisions for the V2 rebuild.

These decisions are intentionally scoped to the current planning and scaffold phase. They should guide repository structure and first implementation slices now, while remaining reviewable as deeper delivery evidence emerges.

## Decision Format

Each decision includes:

- `Status`: `Accepted for scaffold`, `Accepted for MVP`, or `Needs review later`
- `Decision`: the chosen direction
- `Reasoning`: why it is the current best fit
- `Consequences`: what this choice enables and constrains

## ADR-001: Monorepo With Explicit App Boundaries

- Status: Accepted for scaffold
- Decision: Use one repository with separate `apps/web`, `apps/api`, and `apps/common` boundaries.
- Reasoning:
  - V1 already proves the value of separate web and API surfaces inside one delivery unit.
  - The backlog sequence requires shared models and policies without early distributed-system overhead.
  - This structure supports future extraction without forcing it before trace-backed scope is proven.
- Consequences:
  - Shared code must remain deliberate and small.
  - Future service extraction remains possible, but current delivery stays operationally simple.

## ADR-002: Node.js 22 With Native ESM And Minimal Runtime Dependencies

- Status: Accepted for scaffold
- Decision: Use Node.js 22+, native ESM modules, and built-in Node capabilities for the initial scaffold.
- Reasoning:
  - The V1 baseline already uses Node 22 and ESM successfully.
  - The current user instruction explicitly avoids dependency installation at this stage.
  - The planning phase benefits from a runnable skeleton without framework lock-in or setup drag.
- Consequences:
  - The first scaffold should rely on `node:http`, built-in test tooling, and plain modules.
  - Any framework introduction later must justify itself against the delivery and operability constraints already documented.

## ADR-003: Modular Monolith First, Extraction Later

- Status: Accepted for MVP
- Decision: Implement V2 initially as a modular monolith with strong internal boundaries rather than multiple deployable services.
- Reasoning:
  - The trace-backed backlog is still evolving and benefits from transactional simplicity.
  - Security, RBAC, and audit decisions are easier to make coherent before distribution.
  - The expected early waves do not justify the operational cost of service fragmentation.
- Consequences:
  - Modules should be organized by domain boundaries, not technical layers alone.
  - Internal contracts must stay clean so later extraction remains possible.

## ADR-004: One TLS Boundary For MVP Web And API Hosting

- Status: Accepted for MVP
- Decision: Co-host the web and API surfaces behind one trusted boundary for the MVP and early controlled rollout.
- Reasoning:
  - Unified sign-in and protected member/admin routing are simpler under one origin strategy.
  - This reduces deployment and cookie/session complexity in early waves.
  - The product surfaces remain logically distinct without requiring separate infrastructure immediately.
- Consequences:
  - Reverse-proxy or container hosting should treat web and API as separate app entry points under one deployment envelope.
  - Cross-origin complexity can be postponed until there is a proven need.

## ADR-005: Server-Enforced RBAC With Event-Scoped Permissions

- Status: Accepted for MVP
- Decision: All privileged behavior must be enforced server-side, with global roles plus event-scoped delegation where required.
- Reasoning:
  - V1 behavior and the threat model both make broken access control a top risk.
  - Event collaboration requires narrower permissions than simple global role checks.
  - Client-only hiding is insufficient for member, admin, and restricted-event boundaries.
- Consequences:
  - Authorization policies should be centralized and testable.
  - Event delegation changes must be auditable and visible in support tooling.

## ADR-006: Privacy And Public Visibility As Domain State, Not UI Decoration

- Status: Accepted for MVP
- Decision: Profile visibility, public-review state, and restricted content eligibility should be modeled explicitly in the domain and enforced in read paths.
- Reasoning:
  - V1 requirements treat member visibility and public storytelling as governed workflows.
  - Privacy mistakes are harder to recover from than presentation mistakes.
  - Directory, profile, and document visibility all depend on explicit state, not just route choice.
- Consequences:
  - Data models must carry visibility and review-state fields.
  - APIs and renderers must default to least visibility when state is ambiguous.

## ADR-007: Auditability Is A First-Class Platform Capability

- Status: Accepted for MVP
- Decision: Capture audit events as a dedicated platform concern from the first protected slices onward.
- Reasoning:
  - Trace records already require attributable administrative and event-governance behavior.
  - Supportability and rollback awareness depend on coherent event history.
  - Retrofitting audit semantics later creates data gaps and trust issues.
- Consequences:
  - Protected workflows should emit audit events from their first real implementation.
  - Support views must consume structured audit data rather than ad hoc log parsing.

## ADR-008: Background Work Behind Explicit Job Boundaries

- Status: Needs review later
- Decision: Model notifications, imports, invitations, and similar async operations as job boundaries even if the earliest scaffold runs them inline or as placeholders.
- Reasoning:
  - The backlog already includes async-heavy workflows.
  - The non-functional requirements call for retry safety and operational visibility.
  - Full queue infrastructure is premature during scaffold, but pretending the workflows are always synchronous would be misleading.
- Consequences:
  - Module interfaces should distinguish command submission from eventual processing.
  - Queue technology can remain undecided until the first async slice is implemented.

## ADR-009: Persistence Boundary Before Database Commitment

- Status: Superseded by ADR-012
- Decision: Scaffold the app with a clear persistence boundary, but do not hard-code a production database choice into the first runnable skeleton.
- Reasoning:
  - The current task is to scaffold, not to finalize infrastructure.
  - V1 uses SQLite successfully, but V2 may still confirm its long-term data posture during later planning.
  - Early waves can progress with in-memory or placeholder adapters as long as domain boundaries are explicit.
- Consequences:
  - The initial scaffold should separate domain logic from persistence adapters.
  - A later data decision can be introduced with less churn.

## ADR-010: Documentation-Led Delivery Control

- Status: Accepted for scaffold
- Decision: Treat the trace register, backlog mapping, delivery sequence, and architecture decisions as controlling artifacts for early implementation.
- Reasoning:
  - The repo currently exists to convert V1 evidence into disciplined V2 delivery.
  - This reduces the chance of code-first drift before governance and acceptance expectations are aligned.
  - The user explicitly asked for planning artifacts before scaffolding.
- Consequences:
  - New implementation work should reference the relevant trace IDs and decision records.
  - Scaffold structure should mirror the documented boundaries rather than inventing a separate design language.

## ADR-011: Stack Convergence On Strict TypeScript

- Status: Accepted for MVP
- Decision: `apps/common` and `apps/api` are strict TypeScript boundaries with app-level `tsconfig.json`, root path aliases, `noImplicitAny`, and `strictNullChecks`.
- Reasoning:
  - Domain, policy, repository, audit, and session contracts are governance controls.
  - JavaScript drift in these layers can silently weaken authorization, validation, and privacy guarantees.
  - Web framework choice remains reviewable, but common/API contracts must be stable now.
- Consequences:
  - New common/API code must be TypeScript.
  - CI must reject syntax/config drift and direct cross-app imports.
  - Legacy ESM compatibility is limited to local tooling scripts.

## ADR-012: PostgreSQL Production Persistence With Adapter Pattern

- Status: Accepted for MVP
- Decision: PostgreSQL is the production persistence target. Route handlers must use repository interfaces; direct SQL belongs only inside persistence adapters and migrations.
- Reasoning:
  - Member identity, activation, import, standing, and audit workflows require durable transactional storage.
  - Adapter contracts keep local/test development fast while preserving production integrity.
  - PostgreSQL supports constraints, indexes, append-only audit rules, and migration rehearsal.
- Consequences:
  - `apps/common/src/repositories.ts` owns repository contracts and adapters.
  - `apps/api/src` is blocked from direct DB access by CI.
  - In-memory repositories are local/test parity adapters only.
