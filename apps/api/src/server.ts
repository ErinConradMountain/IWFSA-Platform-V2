import http, { type IncomingMessage, type ServerResponse } from "node:http";

import { buildSessionCookie, clearSessionCookie, normalizeRole, resolveAuthContext } from "@iwfsa/common/auth";
import { createAuditEventEmitter, type AuditAction, type AuditRepository } from "@iwfsa/common/audit";
import { consumeActivationToken } from "@iwfsa/common/activation";
import {
  createEventRepositories,
  issueDocumentAccess,
  rsvpToEvent,
  transitionEventStatus,
  type EventParticipant,
  type EventRepositories,
  type EventStatus
} from "@iwfsa/common/events";
import { commitImport, previewImport } from "@iwfsa/common/import-pipeline";
import type { PlatformRepositoryAdapter } from "@iwfsa/common/persistence";
import { evaluate, type Surface, type TaskId } from "@iwfsa/common/policy";
import type { PlatformRepositories } from "@iwfsa/common/repositories";
import { emitPublicationAudit, evaluatePublicApprovalPolicy, transitionPublicationState, type PublicationState } from "@iwfsa/common/public-approval";
import { createInMemoryPublicApprovalRepository, type PublicApprovalRepository } from "@iwfsa/common/public-approval-repository";
import { createPublicProfileRepository, type PublicProfileRepository } from "@iwfsa/common/public-profile-repository";
import { buildHealthPayload, readRequestBody, sendJson, type ServiceConfig } from "@iwfsa/common/runtime";
import type { ConsentState, Session, SessionRepository, SessionRotationReason, Standing } from "@iwfsa/common/session-repository";
import {
  applyPayment,
  applyStandingChange,
  createStandingRepositories,
  evaluateStanding,
  recordFee,
  waiveFee,
  type StandingRepositories
} from "@iwfsa/common/standing";
import {
  attachTelemetryHeaders,
  closeTraceSpan,
  createTraceSpan,
  emitStructuredLog,
  getCorrelationId,
  type LogSink
} from "@iwfsa/common/telemetry";
import { publicCacheHeaders, publicRequestCacheKey } from "./middleware/public-cache.ts";

const traceIndex = {
  identity: ["TRC-001", "TRC-002"],
  memberOperations: ["TRC-003", "TRC-004", "TRC-005", "TRC-006"],
  events: ["TRC-007A", "TRC-007B", "TRC-007C", "TRC-007D", "TRC-007E", "TRC-007F", "TRC-008"],
  operations: ["TRC-009", "TRC-010"]
};

type ApiDependencies = {
  sessionRepository?: SessionRepository;
  persistenceAdapter?: PlatformRepositoryAdapter;
  auditRepository?: AuditRepository;
  repositories?: PlatformRepositories;
  publicApprovalRepository?: PublicApprovalRepository;
  publicProfileRepository?: PublicProfileRepository;
  eventRepositories?: EventRepositories;
  standingRepositories?: StandingRepositories;
  logSink?: LogSink;
};

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);
const CSRF_HEADER = "x-csrf-token";

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const rawBody = (await readRequestBody(request)).toString("utf8").trim();
  return rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
}

function sessionCookieFor(config: ServiceConfig, session: Session): string {
  const maxAgeSeconds = Math.max(1, Math.floor((session.expiresAtMs - Date.now()) / 1000));
  return buildSessionCookie(session.token, {
    maxAgeSeconds,
    secure: config.secureCookies
  });
}

function emitAudit(
  auditRepository: AuditRepository | undefined,
  action: AuditAction,
  correlationId: string,
  metadata: Record<string, unknown>,
  actor = "system",
  targetType = "session",
  targetId = "opaque"
): void {
  if (!auditRepository) {
    return;
  }

  createAuditEventEmitter(auditRepository).emit({
      action,
      actor,
      targetType,
      targetId,
      correlationId,
      metadata
    });
}

function completeRequestLog(
  request: IncomingMessage,
  response: ServerResponse,
  logSink: LogSink | undefined,
  span: ReturnType<typeof createTraceSpan>
): void {
  response.on("finish", () => {
    const closedSpan = closeTraceSpan(span);
    emitStructuredLog(logSink, {
      level: "info",
      event: "http.request",
      method: request.method,
      path: request.url?.split("?")[0] || "/",
      statusCode: response.statusCode,
      correlationId: closedSpan.correlationId,
      traceId: closedSpan.traceId,
      spanId: closedSpan.spanId,
      durationMs: closedSpan.durationMs,
      cookie: request.headers.cookie,
      authorization: request.headers.authorization
    });
  });
}

function csrfTokenFrom(request: IncomingMessage): string | null {
  const headerValue = request.headers[CSRF_HEADER];
  return typeof headerValue === "string" && headerValue.trim() ? headerValue.trim() : null;
}

function validateCsrf(
  request: IncomingMessage,
  response: ServerResponse,
  sessionRepository: SessionRepository | undefined,
  sessionToken: string | null,
  correlationId: string,
  auditRepository: AuditRepository | undefined
): boolean {
  if (!STATE_CHANGING_METHODS.has(request.method || "GET")) {
    return true;
  }

  const submittedToken = csrfTokenFrom(request);
  const valid = Boolean(sessionRepository && sessionToken && submittedToken && sessionRepository.consumeCsrfToken(sessionToken, submittedToken));

  if (!valid) {
    emitAudit(auditRepository, "CSRF_BLOCKED", correlationId, { path: request.url?.split("?")[0] || "/", method: request.method }, "anonymous");
    sendJson(response, 403, {
      status: "rejected",
      message: "The request could not be completed."
    });
    return false;
  }

  return true;
}

function applyPolicy(
  response: ServerResponse,
  input: {
    role: ReturnType<typeof resolveAuthContext>["role"];
    surface: Surface;
    standing: Standing;
    consent: ConsentState;
    task?: TaskId;
    auditTrail?: boolean;
    approved?: boolean;
    visibility?: "public" | "member_only" | "hidden";
  },
  auditRepository: AuditRepository | undefined,
  correlationId: string
): boolean {
  const decision = evaluate(input);

  if (decision.decision === "ALLOW") {
    return true;
  }

  emitAudit(auditRepository, "POLICY_DENY", correlationId, { reason: decision.reason, surface: input.surface, task: input.task || "none" });
  if (decision.reason === "STANDING_BLOCKED") {
    emitAudit(auditRepository, "STANDING_DENIED", correlationId, { surface: input.surface, task: input.task || "none" }, "system", "membership_status", "opaque");
  }
  sendJson(response, 403, {
    status: "rejected",
    message: "The request could not be completed.",
    fallback: decision.fallback
  });
  return false;
}

function participantFromAuth(authContext: ReturnType<typeof resolveAuthContext>): EventParticipant {
  return {
    memberId: authContext.subject || "anonymous",
    role: authContext.role || "member",
    standing: authContext.standing === "anonymous" ? "blocked" : authContext.standing,
    consent: authContext.consent,
    groups: ["leaders"]
  };
}

export function createApiServer(config: ServiceConfig, dependencies: ApiDependencies = {}): http.Server {
  const { sessionRepository, persistenceAdapter, auditRepository, repositories, logSink } = dependencies;
  const eventRepositories = dependencies.eventRepositories || createEventRepositories();
  const standingRepositories = dependencies.standingRepositories || createStandingRepositories();
  const publicApprovalRepository = dependencies.publicApprovalRepository || createInMemoryPublicApprovalRepository();
  const publicProfileRepository = dependencies.publicProfileRepository || createPublicProfileRepository({
    query() {
      return { rows: [] };
    }
  });

  if (!eventRepositories.events.has("event-1")) {
    eventRepositories.events.set("event-1", {
      id: "event-1",
      title: "Leadership Circle",
      status: "published",
      maxCapacity: 2,
      registeredCount: 0,
      waitlistCount: 0,
      audience: { mode: "groups", groups: ["leaders"] },
      version: 0
    });
  }

  return http.createServer(async (request, response) => {
    const correlationId = getCorrelationId(request);
    const span = createTraceSpan(`${request.method || "GET"} ${request.url || "/"}`, correlationId);
    attachTelemetryHeaders(response, span);
    completeRequestLog(request, response, logSink, span);

    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const authContext = resolveAuthContext(request, { sessionRepository });

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(
        response,
        200,
        buildHealthPayload(config, {
          traceIndex,
          telemetry: {
            correlationId: span.correlationId,
            traceId: span.traceId,
            spanId: span.spanId
          },
          persistence: persistenceAdapter?.health() || {
            adapter: config.persistenceTarget,
            productionReady: config.persistenceTarget === "postgresql",
            status: "unavailable"
          }
        })
      );
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/public/profiles") {
      const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "25", 10) || 25));
      const profiles = publicProfileRepository.findApprovedPublicProfiles(limit).map((profile) => ({
        displayName: profile.displayName,
        biography: profile.biography,
        updatedAt: profile.updatedAt
      }));

      sendJson(response, 200, {
        surface: "public",
        cacheKey: publicRequestCacheKey(request),
        profiles
      }, publicCacheHeaders());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/csrf-token") {
      if (!sessionRepository) {
        sendJson(response, 500, { status: "rejected", message: "The request could not be completed." });
        return;
      }

      const session = authContext.sessionToken ? sessionRepository.getSession(authContext.sessionToken) : null;
      const csrfSession = session || sessionRepository.createSession({ role: null, subject: "anonymous" });
      const csrfToken = sessionRepository.issueCsrfToken(csrfSession.token);

      if (!session) {
        emitAudit(auditRepository, "SESSION_CREATED", correlationId, { purpose: "csrf" });
      }

      sendJson(
        response,
        200,
        {
          csrfToken,
          correlationId
        },
        {
          "set-cookie": sessionCookieFor(config, csrfSession)
        }
      );
      return;
    }

    if (!validateCsrf(request, response, sessionRepository, authContext.sessionToken, correlationId, auditRepository)) {
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/session") {
      let body: Record<string, unknown> = {};

      try {
        body = await readJsonBody(request);
      } catch {
        body = {};
      }

      const role = config.allowRoleSelfSelection ? normalizeRole(body.role) : null;
      const standing = role ? "active" : "anonymous";
      const consent = role ? "granted" : "not_required";
      const existingToken = authContext.sessionToken;
      const rotated = existingToken && role && sessionRepository
        ? sessionRepository.rotateSession(existingToken, "login", {
            role,
            subject: typeof body.subject === "string" && body.subject.trim() ? body.subject.trim() : `session:${role}`,
            standing,
            consent
          })
        : null;

      if (rotated) {
        emitAudit(auditRepository, "SESSION_ROTATED", correlationId, { reason: "login", role });
      }

      sendJson(
        response,
        202,
        {
          status: "accepted",
          message: "If the request can be completed, the session will be updated."
        },
        rotated ? { "set-cookie": sessionCookieFor(config, rotated) } : {}
      );
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/session/rotate") {
      let body: Record<string, unknown> = {};

      try {
        body = await readJsonBody(request);
      } catch {
        body = {};
      }

      const reason = typeof body.reason === "string" ? body.reason : "";
      const allowedReasons: SessionRotationReason[] = ["admin_elevation", "standing_change", "credential_reset", "login"];
      const typedReason = allowedReasons.includes(reason as SessionRotationReason) ? (reason as SessionRotationReason) : "credential_reset";
      const role = normalizeRole(body.role) || authContext.role;
      const standing = typeof body.standing === "string" ? (body.standing as Standing) : authContext.standing;
      const consent = typeof body.consent === "string" ? (body.consent as ConsentState) : authContext.consent;
      const rotated = authContext.sessionToken && sessionRepository
        ? sessionRepository.rotateSession(authContext.sessionToken, typedReason, {
            role,
            subject: authContext.subject || "session",
            standing,
            consent
          })
        : null;

      if (rotated) {
        emitAudit(auditRepository, "SESSION_ROTATED", correlationId, { reason: typedReason });
      }

      sendJson(
        response,
        202,
        {
          status: "accepted",
          message: "If the request can be completed, the session will be updated."
        },
        rotated ? { "set-cookie": sessionCookieFor(config, rotated) } : {}
      );
      return;
    }

    if (request.method === "POST" && ["/api/auth/reset", "/api/auth/activation"].includes(url.pathname)) {
      const reason: SessionRotationReason = url.pathname.endsWith("reset") ? "credential_reset" : "login";
      const rotated = authContext.sessionToken && sessionRepository && authContext.role
        ? sessionRepository.rotateSession(authContext.sessionToken, reason)
        : null;

      if (rotated) {
        emitAudit(auditRepository, "SESSION_ROTATED", correlationId, { reason });
      }

      sendJson(
        response,
        202,
        {
          status: "accepted",
          message: "If the request can be completed, the session will be updated."
        },
        rotated ? { "set-cookie": sessionCookieFor(config, rotated) } : {}
      );
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/activation-token") {
      let body: Record<string, unknown> = {};
      try {
        body = await readJsonBody(request);
      } catch {
        body = {};
      }

      if (repositories && auditRepository && typeof body.token === "string") {
        consumeActivationToken(body.token, repositories, createAuditEventEmitter(auditRepository), correlationId);
      }

      sendJson(response, 202, {
        status: "accepted",
        message: "If the request can be completed, the account will be updated."
      });
      return;
    }

    if (request.method === "DELETE" && url.pathname === "/api/auth/session") {
      if (sessionRepository && authContext.sessionToken) {
        sessionRepository.deleteSession(authContext.sessionToken);
      }

      sendJson(
        response,
        200,
        {
          status: "accepted",
          message: "The request has been processed."
        },
        {
          "set-cookie": clearSessionCookie({ secure: config.secureCookies })
        }
      );
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/session") {
      sendJson(response, 200, {
        isAuthenticated: authContext.isAuthenticated,
        role: authContext.role,
        standing: authContext.standing,
        consent: authContext.consent
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/trace-index") {
      sendJson(response, 200, {
        generatedFrom: [
          "v1-trace-extraction.md",
          "backlog-mapping.md",
          "v2-delivery-sequence.md",
          "architecture-decisions.md"
        ],
        traceIndex
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/member/placeholder") {
      if (!applyPolicy(response, { ...authContext, surface: "member", task: "member.dashboard" }, auditRepository, correlationId)) {
        return;
      }

      sendJson(response, 200, {
        module: "member",
        message: "Member functionality starts after identity and standing rules are in place."
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/admin/placeholder") {
      if (!applyPolicy(response, { ...authContext, surface: "admin", task: "admin.dashboard", auditTrail: true }, auditRepository, correlationId)) {
        return;
      }

      sendJson(response, 200, {
        module: "admin",
        message: "Admin operations will be delivered after RBAC and audit boundaries are in place."
      });
      return;
    }

    if (request.method === "PATCH" && url.pathname === "/api/member/profile/visibility") {
      if (!applyPolicy(response, { ...authContext, surface: "member", task: "member.profile.visibility" }, auditRepository, correlationId)) {
        return;
      }

      emitAudit(auditRepository, "PROFILE_VISIBILITY_CHANGED", correlationId, { visibility: "member_only", email: "member@example.test" }, authContext.subject || "member", "member_profile", "opaque");
      sendJson(response, 202, {
        status: "accepted",
        message: "The request has been processed."
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/admin/import/commit") {
      if (!applyPolicy(response, { ...authContext, surface: "admin", task: "admin.import.commit", auditTrail: true }, auditRepository, correlationId)) {
        return;
      }

      let body: Record<string, unknown> = {};
      try {
        body = await readJsonBody(request);
      } catch {
        body = {};
      }

      if (repositories && auditRepository && typeof body.batchId === "string" && typeof body.idempotencyKey === "string") {
        commitImport(body.batchId, body.idempotencyKey, repositories, createAuditEventEmitter(auditRepository), correlationId);
      } else {
        emitAudit(auditRepository, "IMPORT_COMMITTED", correlationId, { batchId: "preview-batch", rowCount: 1, sourceEmail: "person@example.test" }, authContext.subject || "admin", "import_batch", "preview-batch");
      }
      sendJson(response, 202, {
        status: "accepted",
        message: "The request has been processed."
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/admin/import/preview") {
      if (!applyPolicy(response, { ...authContext, surface: "admin", task: "admin.import.preview", auditTrail: true }, auditRepository, correlationId)) {
        return;
      }

      let body: Record<string, unknown> = {};
      try {
        body = await readJsonBody(request);
      } catch {
        body = {};
      }

      if (!repositories || !auditRepository || typeof body.content !== "string") {
        sendJson(response, 400, { status: "rejected", message: "The request could not be completed." });
        return;
      }

      const result = previewImport({
        filename: typeof body.filename === "string" ? body.filename : "members.csv",
        mimeType: typeof body.mimeType === "string" ? body.mimeType : "text/csv",
        sizeBytes: Buffer.byteLength(body.content),
        content: body.content
      }, repositories, createAuditEventEmitter(auditRepository), correlationId);

      sendJson(response, 200, {
        batchId: result.batch.id,
        idempotencyKey: `${result.batch.id}:${result.batch.sourceChecksum}`,
        rowCount: result.rows.length,
        actions: result.rows.map((row) => row.action)
      });
      return;
    }

    const approvalMatch = url.pathname.match(/^\/api\/admin\/public-profiles\/([^/]+)\/approve$/);
    if (request.method === "POST" && approvalMatch) {
      if (!applyPolicy(response, { ...authContext, surface: "admin", task: "admin.public-review.queue", auditTrail: true }, auditRepository, correlationId)) {
        return;
      }

      let body: Record<string, unknown> = {};
      try {
        body = await readJsonBody(request);
      } catch {
        body = {};
      }

      const memberStanding = typeof body.memberStanding === "string" ? (body.memberStanding as Standing) : "blocked";
      const approvalPolicy = evaluatePublicApprovalPolicy({
        role: authContext.role,
        surface: "admin",
        memberStanding,
        auditTrail: true
      });

      if (!approvalPolicy.allowed) {
        emitAudit(auditRepository, "POLICY_DENY", correlationId, { reason: approvalPolicy.reason, surface: "admin", task: "admin.public-review.queue" });
        sendJson(response, 403, {
          status: "rejected",
          message: "The request could not be completed."
        });
        return;
      }

      if (!auditRepository) {
        sendJson(response, 500, { status: "rejected", message: "The request could not be completed." });
        return;
      }

      try {
        const currentState = typeof body.currentState === "string" ? (body.currentState as PublicationState) : "pending_review";
        const approvalId = typeof body.approvalId === "string" ? body.approvalId : `approval:${approvalMatch[1]}`;
        publicApprovalRepository.createReviewRequest({
          id: approvalId,
          profileId: approvalMatch[1],
          memberId: approvalMatch[1],
          profileVersion: typeof body.profileVersion === "string" ? body.profileVersion : "profile-v1",
          requestedAt: new Date().toISOString(),
          correlationId
        });
        if (currentState !== "pending_review") {
          const existing = publicApprovalRepository.findById(approvalId);
          if (existing?.status === "pending_review" && currentState === "approved") {
            publicApprovalRepository.transitionApproval({
              id: approvalId,
              action: "approve",
              actorId: authContext.subject || "admin",
              correlationId,
              now: new Date().toISOString()
            });
          }
        }
        const stored = publicApprovalRepository.transitionApproval({
          id: approvalId,
          action: "approve",
          actorId: authContext.subject || "admin",
          reviewNotes: typeof body.reviewNotes === "string" ? body.reviewNotes : "",
          correlationId,
          now: new Date().toISOString()
        });
        const transition = transitionPublicationState(currentState, "approve");
        emitPublicationAudit(createAuditEventEmitter(auditRepository), {
          action: transition.auditAction,
          actorId: authContext.subject || "admin",
          memberId: approvalMatch[1],
          profileVersion: stored.profileVersion,
          previousState: transition.previousState,
          newState: transition.newState,
          reviewNotes: stored.reviewNotesSanitized,
          correlationId
        });

        sendJson(response, 202, {
          status: "accepted",
          correlationId,
          publicationState: stored.status,
          visibility: transition.visibility
        });
      } catch {
        sendJson(response, 409, {
          status: "rejected",
          message: "The request could not be completed."
        });
      }
      return;
    }

    if (request.method === "PATCH" && url.pathname === "/api/admin/standing") {
      if (!applyPolicy(response, { ...authContext, surface: "admin", task: "admin.standing.manage", auditTrail: true }, auditRepository, correlationId)) {
        return;
      }

      emitAudit(auditRepository, "STANDING_CHANGED", correlationId, { standing: "blocked", memberEmail: "person@example.test" }, authContext.subject || "admin", "membership_status", "opaque");
      sendJson(response, 202, {
        status: "accepted",
        message: "The request has been processed."
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/admin/fees/payment") {
      if (!applyPolicy(response, { ...authContext, surface: "admin", task: "admin.standing.manage", auditTrail: true }, auditRepository, correlationId)) {
        return;
      }

      let body: Record<string, unknown> = {};
      try {
        body = await readJsonBody(request);
      } catch {
        body = {};
      }

      if (!auditRepository || typeof body.memberId !== "string" || typeof body.feeId !== "string" || typeof body.amountCents !== "number") {
        sendJson(response, 400, { status: "rejected", message: "The request could not be completed." });
        return;
      }

      const memberId = body.memberId;
      const feeId = body.feeId;
      const audit = createAuditEventEmitter(auditRepository);
      if (!standingRepositories.feeRecords.has(feeId)) {
        recordFee(standingRepositories, {
          id: feeId,
          memberId,
          membershipYearId: typeof body.membershipYearId === "string" ? body.membershipYearId : "current",
          type: "dues",
          amountCents: typeof body.totalAmountCents === "number" ? body.totalAmountCents : body.amountCents,
          transactionRef: null,
          recordedAt: new Date().toISOString()
        }, authContext.subject || "admin", audit, correlationId);
      }

      const updatedFee = applyPayment(standingRepositories, feeId, body.amountCents, typeof body.transactionRef === "string" ? body.transactionRef : "manual", authContext.subject || "admin", audit, correlationId);
      const year = standingRepositories.membershipYears.get(updatedFee.membershipYearId) || null;
      const standing = evaluateStanding({ year, fees: [...standingRepositories.feeRecords.values()].filter((fee) => fee.memberId === memberId && fee.membershipYearId === updatedFee.membershipYearId) });
      applyStandingChange({
        repositories: standingRepositories,
        sessionRepository,
        memberId,
        previousStanding: null,
        nextStanding: standing.standing,
        reason: standing.reason,
        actorId: authContext.subject || "admin",
        audit,
        correlationId,
        effectiveFrom: new Date().toISOString()
      });

      sendJson(response, 202, {
        status: "accepted",
        standing: standing.standing,
        balanceDueCents: standing.balanceDueCents,
        message: "The request has been processed."
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/admin/fees/waiver") {
      if (!applyPolicy(response, { ...authContext, surface: "admin", task: "admin.standing.manage", auditTrail: true }, auditRepository, correlationId)) {
        return;
      }

      let body: Record<string, unknown> = {};
      try {
        body = await readJsonBody(request);
      } catch {
        body = {};
      }

      if (!auditRepository || typeof body.feeId !== "string" || typeof body.reason !== "string") {
        sendJson(response, 400, { status: "rejected", message: "The request could not be completed." });
        return;
      }

      try {
        const audit = createAuditEventEmitter(auditRepository);
        const fee = waiveFee(standingRepositories, body.feeId, body.reason, authContext.subject || "admin", audit, correlationId);
        const year = standingRepositories.membershipYears.get(fee.membershipYearId) || null;
        const standing = evaluateStanding({ year, fees: [...standingRepositories.feeRecords.values()].filter((record) => record.memberId === fee.memberId && record.membershipYearId === fee.membershipYearId) });
        applyStandingChange({
          repositories: standingRepositories,
          sessionRepository,
          memberId: fee.memberId,
          previousStanding: null,
          nextStanding: standing.standing,
          reason: standing.reason,
          actorId: authContext.subject || "admin",
          audit,
          correlationId,
          effectiveFrom: new Date().toISOString()
        });

        sendJson(response, 202, { status: "accepted", standing: standing.standing, message: "The request has been processed." });
      } catch {
        sendJson(response, 400, { status: "rejected", message: "The request could not be completed." });
      }
      return;
    }

    const rsvpMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/rsvp$/);
    if (request.method === "POST" && rsvpMatch) {
      if (!applyPolicy(response, { ...authContext, surface: "member", task: "member.events.rsvp" }, auditRepository, correlationId)) {
        return;
      }

      if (!auditRepository) {
        sendJson(response, 500, { status: "rejected", message: "The request could not be completed." });
        return;
      }

      try {
        const rsvp = rsvpToEvent(eventRepositories, rsvpMatch[1], participantFromAuth(authContext), createAuditEventEmitter(auditRepository), correlationId);
        sendJson(response, 202, {
          status: rsvp.state,
          message: rsvp.state === "registered" ? "You're in. See you there." : "You are on the waitlist.",
          waitlistPosition: rsvp.waitlistPosition
        });
      } catch {
        sendJson(response, 403, {
          type: "about:blank",
          title: "Request rejected",
          status: 403,
          detail: "The request could not be completed."
        });
      }
      return;
    }

    const documentMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/documents$/);
    if (request.method === "POST" && documentMatch) {
      if (!applyPolicy(response, { ...authContext, surface: "member", task: "member.events.view" }, auditRepository, correlationId)) {
        return;
      }

      const event = eventRepositories.events.get(documentMatch[1]);
      if (!event || !auditRepository) {
        sendJson(response, 403, { type: "about:blank", title: "Request rejected", status: 403, detail: "The request could not be completed." });
        return;
      }

      try {
        const access = issueDocumentAccess(event, participantFromAuth(authContext), createAuditEventEmitter(auditRepository), correlationId);
        sendJson(response, 202, {
          status: "accepted",
          accessToken: access.rawToken,
          expiresAt: access.record.expiresAt
        });
      } catch {
        sendJson(response, 403, { type: "about:blank", title: "Request rejected", status: 403, detail: "The request could not be completed." });
      }
      return;
    }

    const eventStateMatch = url.pathname.match(/^\/api\/admin\/events\/([^/]+)\/state$/);
    if (request.method === "PATCH" && eventStateMatch) {
      if (!applyPolicy(response, { ...authContext, surface: "admin", task: "admin.events.manage", auditTrail: true }, auditRepository, correlationId)) {
        return;
      }

      let body: Record<string, unknown> = {};
      try {
        body = await readJsonBody(request);
      } catch {
        body = {};
      }

      const event = eventRepositories.events.get(eventStateMatch[1]);
      const nextStatus = typeof body.status === "string" ? body.status : "";
      if (!event || !auditRepository || !["draft", "published", "closed", "archived"].includes(nextStatus)) {
        sendJson(response, 400, { status: "rejected", message: "The request could not be completed." });
        return;
      }

      try {
        const updated = transitionEventStatus(event, nextStatus as EventStatus, authContext.subject || "admin", createAuditEventEmitter(auditRepository), correlationId);
        eventRepositories.events.set(updated.id, updated);
        sendJson(response, 202, { status: "accepted", eventStatus: updated.status });
      } catch {
        sendJson(response, 409, { status: "rejected", message: "The request could not be completed." });
      }
      return;
    }

    if (url.pathname.startsWith("/api/task/")) {
      emitAudit(auditRepository, "POLICY_DENY", correlationId, { reason: "POLICY_MISSING_MAPPING", path: url.pathname });
      sendJson(response, 403, {
        status: "rejected",
        message: "The request could not be completed.",
        code: "POLICY_MISSING_MAPPING"
      });
      return;
    }

    sendJson(response, 404, {
      status: "not_found",
      message: "The route is unavailable."
    });
  });
}
