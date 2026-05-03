# IWFSA Platform V2 Security Controls Matrix

| Control Area | Phase 1 Control | Verification |
| --- | --- | --- |
| Stack convergence | Strict TypeScript configuration with `strict`, `noImplicitAny`, and `strictNullChecks` enabled. | `node scripts/check.mjs`; `node scripts/typecheck.mjs` |
| Workspace isolation | `apps/api` and `apps/web` depend on `@iwfsa/common`; source files use `#common/*` alias. | Boundary scan in `scripts/check.mjs` |
| Persistence target | PostgreSQL is locked as the production target; in-memory adapter throws in production. | Persistence adapter tests through API health and config review |
| Telemetry | Correlation ID propagation, trace/span identifiers, structured request logs. | API health telemetry test |
| PII redaction | Telemetry redacts cookies, authorization, tokens, session fields, names, email, and phone-like fields. | Redaction test in `apps/api/test/server.test.ts` |
| Dependency hygiene | Explicit workspace manifests and dependency scan script. | `node scripts/dependency-scan.mjs` |
| SBOM | CycloneDX-style SBOM generated from root and app manifests. | `node scripts/generate-sbom.mjs` |
| Surface separation | Public, member, and admin routes remain separate placeholders with API authorization checks. | API and web tests |
| Server-side sessions | Opaque CSPRNG session IDs, explicit TTL cookies, session data stored server-side. | `P2-SESSION-001` |
| Session rotation | Rotate on login, admin elevation, standing change, and credential reset. | `P2-SESSION-002` |
| CSRF protection | Synchronizer token tied to session and invalidated after single use for state-changing methods. | `P2-CSRF-001`, `P2-CSRF-002` |
| Generic auth responses | Login, reset, and activation return identical generic payloads. | `P2-AUTH-001` |
| Policy default deny | Unknown, unauthenticated, cross-surface, or unmapped tasks deny by default. | `P2-POLICY-001` |
| Route fallbacks | Member/admin hidden routes redirect to safe fallbacks without leaking existence. | `P2-ROUTE-001` |
| Audit minimums | Session creation, session rotation, policy denial, and CSRF blocks emit audit events with correlation ID. | `P2-AUDIT-001` |
| UX surface isolation | Surface-scoped navigation prevents member pages from exposing admin routes. | `P2-UX-001` |
| Brand compliance | UI colors and motion flow through shared design tokens; inline styles are blocked. | `P2-BRAND-001` |
| Seed asset privacy | V1 seed assets resolve from legacy asset paths without private contact data in seed records. | `P2-SEED-001` |
| Visibility-state design | Private, members-only, public, and audit states use semantic tokens and annotated prototypes. | `P3-DESIGN-001` |
| Design governance props | Interactive component contracts require surface, visibility, consent gate, audit label, and token reference. | `P3-DESIGN-001` |
| Prototype privacy | P0 prototype flows include preview-before-publish and audit-preview annotations. | `P3-PROTOTYPE-001`, `P3-PRIVACY-001` |
| Repository boundary | API route handlers cannot directly query persistence; common repository contracts own data access. | `P4-DB-001` |
| Durable persistence | PostgreSQL migration defines member, profile, standing, activation, import, session, and audit tables. | `P4-MIGRATION-001` |
| Audit redaction | Audit emitter writes `redactedMetadata` and `metadataHash`, stripping raw PII/tokens. | `P4-AUDIT-001` |
| Adapter parity | In-memory and PostgreSQL-style repositories pass the same contract suite. | `P4-REPO-001` |
| Supply chain | CI validates SBOM structure and performs basic secret/license checks. | `P4-CI-001` |
| Import preview boundary | Preview rows persist without mutating live member tables. | `P5-IMPORT-001` |
| Import idempotency | Commit requires `batch_id:checksum` idempotency key and enqueues activation invites once. | `P5-IMPORT-002` |
| Activation replay protection | Token hashes are single-use and invalid/replayed tokens return generic responses. | `P5-TOKEN-001` |
| Consent-gated visibility | Public profile visibility requires consent plus admin approval and emits audit. | `P5-CONSENT-001` |
| Standing denial evidence | Blocked standing route access emits `STANDING_DENIED`. | `P5-STANDING-001` |
| Public query pushdown | Approved public profile reads push standing, visibility, consent, and approval predicates into the repository query and project only public-safe fields. | `P8-PUBLIC-QUERY-001` |
| Member publication clarity | Member profile visibility pages show dignified publication-gate copy on member routes only. | `P8-MEMBER-HINT-001` |
| Admin publication approval | Public profile approval requires admin/chief_admin, admin surface policy, audit trail, and member standing re-validation before approval audit emission. | `P8-APPROVAL-001` |
| Approval persistence sanitization | Public approval records persist only sanitized, length-limited review notes and preserve restart-safe queue state. | `P8-APPROVAL-REPO-001` |
| Public cache isolation | Public profile endpoint emits public cache headers, ignores auth/session inputs, strips cookies, and returns public-safe fields only. | `P8-CACHE-001` |
| Public SSR isolation | Public gallery and story pages render only approved public projection fields and no hidden private state in DOM, meta tags, or structured data. | `P8-SSR-001` |
| Dual approval stewardship | Honorary and memorial content requires first admin approval plus chief admin final approval before publication audit events emit. | `P8-DUAL-APPROVAL-001` |
| Consent-aware notifications | Celebrations require current-year consent, non-private visibility, good standing, and explicit channel opt-in before enqueue. | `P9-NOTIFICATION-POLICY-001` |
| Outbox delivery boundary | Notification delivery uses deterministic outbox IDs, retry scheduling, cancellation, and redacted audit events. | `P9-OUTBOX-001` |

## Phase 1 Residual Risks

- Full `tsc` validation requires installing `typescript` through npm. The environment currently has Node but not npm on PATH.
- PostgreSQL session repository is represented by a typed adapter boundary in Phase 2; real schema-bound SQL contract parity arrives in Phase 3.
- CI provider configuration is represented by scripts in Phase 1; remote CI wiring should be added once repository hosting is confirmed.
