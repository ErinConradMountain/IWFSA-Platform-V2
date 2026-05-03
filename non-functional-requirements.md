# Non-Functional Requirements

This document captures baseline non-functional requirements for IWFSA Platform V2. These targets should be refined once architecture, expected load, hosting model, and compliance scope are confirmed.

## Principles

- Prefer measurable requirements over qualitative statements.
- Design for secure operation by default.
- Treat observability, recoverability, and maintainability as first-class requirements.
- Where exact figures are not yet known, define a minimum baseline suitable for production planning.

## Baseline Requirements

| Category | Requirement | Baseline Target |
| --- | --- | --- |
| Availability | Platform availability for core user-facing capabilities | 99.9% monthly uptime excluding approved maintenance |
| Performance | Interactive page or API response for normal operations | p95 under 2 seconds for standard read operations |
| Performance | Write or workflow submission completion | p95 under 5 seconds excluding third-party latency outside platform control |
| Scalability | Horizontal growth path | Core stateless services must scale horizontally without application redesign |
| Reliability | Background job handling | Jobs must be retry-safe, idempotent where practical, and dead-letter failures for investigation |
| Security | Authentication and session management | Strong authentication, secure session handling, and enforced timeout / renewal controls |
| Security | Authorization | Server-side authorization required for all privileged operations |
| Security | Secrets handling | Secrets must not be stored in source control or embedded in client code |
| Security | Encryption | TLS in transit and encryption at rest for sensitive data stores and backups |
| Privacy | Personal and sensitive data minimization | Only collect and retain data required for business and regulatory purpose |
| Auditability | Critical event logging | Create immutable logs for authentication, authorization, configuration changes, sensitive data access, and critical workflow decisions |
| Observability | Operational telemetry | Centralized logs, metrics, traces, dashboards, and actionable alerts for critical services |
| Recoverability | Backup and restore | Backups must be automated, monitored, and restoration-tested on a defined schedule |
| Recoverability | Recovery objectives | Define and validate RPO and RTO per service before production cutover |
| Data integrity | Validation and reconciliation | Critical workflows require input validation, transactional integrity where needed, and reconciliation for integration boundaries |
| Interoperability | External interfaces | All APIs and integration payloads must be versioned and documented |
| Accessibility | User interface accessibility | Meet WCAG 2.1 AA for public and internal UI surfaces where applicable |
| Maintainability | Code quality and operability | Code must support automated testing, repeatable deployment, and documented ownership |
| Portability | Environment promotion | Application must support consistent deployment across dev, test, staging, and production |
| Supportability | Incident diagnosis | Support staff must be able to identify failed transactions, root cause category, and remediation path without direct database manipulation |

## Security and Compliance Expectations

- Least-privilege access must be enforced for users, services, and administrators.
- Administrative actions must be attributable to a named identity.
- Sensitive exports must be controlled, logged, and limited to authorized roles.
- Vulnerability remediation timelines should be defined by severity.
- Third-party dependencies must be inventoried and monitored for security advisories.

## Operational Requirements

- Production deployments must be repeatable and automated.
- Configuration changes must be traceable by environment and approver.
- Health checks must distinguish between liveness, readiness, and degraded dependency states.
- Alerts should be actionable and mapped to service ownership.
- No critical business process should depend on undocumented manual intervention.

## Verification Approach

| Area | Verification Method |
| --- | --- |
| Availability and performance | Load testing, synthetic monitoring, operational review |
| Security | Threat modeling, secure code review, dependency scanning, penetration testing |
| Recoverability | Backup verification and restore exercises |
| Accessibility | Automated scans plus targeted manual review |
| Auditability | Event log review against required scenarios |
| Maintainability | CI checks, test coverage on critical flows, deployment rehearsal |

## Open Items

- Confirm expected user volume, concurrency, and peak periods.
- Confirm formal compliance obligations and retention schedules.
- Define service-specific RPO and RTO targets.
- Confirm hosting constraints and integration SLAs.