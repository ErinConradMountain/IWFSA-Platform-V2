import test from "node:test";
import assert from "node:assert/strict";
import type http from "node:http";

import { createInMemoryAuditRepository } from "@iwfsa/common/audit";
import { createInMemoryPersistenceAdapter } from "@iwfsa/common/persistence";
import { evaluate, type PolicyInput } from "@iwfsa/common/policy";
import { createInMemoryRepositories } from "@iwfsa/common/repositories";
import { createInMemorySessionRepository } from "@iwfsa/common/session-repository";
import { createEventRepositories } from "@iwfsa/common/events";
import { createStandingRepositories, openMembershipYear } from "@iwfsa/common/standing";
import { createAuditEventEmitter } from "@iwfsa/common/audit";
import { createApiServer } from "../src/server.ts";

function createTestApiConfig(overrides: Record<string, unknown> = {}) {
  return {
    serviceName: "api",
    environment: "test",
    host: "127.0.0.1",
    port: 0,
    startedAt: "now",
    secureCookies: false,
    sessionTtlMs: 30 * 60 * 1000,
    allowRoleSelfSelection: true,
    localDevelopment: true,
    persistenceTarget: "memory" as const,
    ...overrides
  };
}

async function withServer(server: http.Server, callback: (baseUrl: string) => Promise<void>): Promise<void> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  assert.ok(address && typeof address === "object");

  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

async function getCsrf(baseUrl: string, cookie = "") {
  const response = await fetch(`${baseUrl}/api/csrf-token`, {
    headers: cookie ? { cookie } : {}
  });
  const body = (await response.json()) as { csrfToken: string };

  return {
    csrfToken: body.csrfToken,
    cookie: response.headers.get("set-cookie") || cookie
  };
}

async function createSession(baseUrl: string, role: string, subject = "session.user") {
  const csrf = await getCsrf(baseUrl);
  const response = await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrf.csrfToken,
      cookie: csrf.cookie
    },
    body: JSON.stringify({ role, subject })
  });

  return {
    response,
    body: (await response.json()) as Record<string, unknown>,
    sessionCookie: response.headers.get("set-cookie") || csrf.cookie,
    originalCookie: csrf.cookie
  };
}

test("api health endpoint exposes telemetry correlation and persistence status", async () => {
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository(),
    persistenceAdapter: createInMemoryPersistenceAdapter({ environment: "test" })
  });

  await withServer(server, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: {
        "x-correlation-id": "phase2-correlation"
      }
    });
    const body = (await response.json()) as Record<string, any>;

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-correlation-id"), "phase2-correlation");
    assert.equal(body.telemetry.correlationId, "phase2-correlation");
    assert.match(body.telemetry.traceId, /^[a-f0-9]{32}$/);
  });
});

test("api telemetry log redacts cookies, tokens, and authorization material", async () => {
  const logs: Record<string, unknown>[] = [];
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository(),
    logSink: (entry) => logs.push(entry)
  });

  await withServer(server, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: {
        cookie: "iwfsa_session=raw-session-id",
        authorization: "Bearer raw-token"
      }
    });

    assert.equal(response.status, 200);
  });

  assert.equal(logs[0].cookie, "[REDACTED]");
  assert.equal(logs[0].authorization, "[REDACTED]");
  assert.equal(JSON.stringify(logs).includes("raw-session-id"), false);
});

test("csrf token is required, tied to session, and single use", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository(),
    auditRepository
  });

  await withServer(server, async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/auth/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "member" })
    });
    assert.equal(missing.status, 403);

    const csrf = await getCsrf(baseUrl);
    const accepted = await fetch(`${baseUrl}/api/auth/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf.csrfToken,
        cookie: csrf.cookie
      },
      body: JSON.stringify({ role: "member" })
    });
    assert.equal(accepted.status, 202);

    const replay = await fetch(`${baseUrl}/api/auth/session/rotate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf.csrfToken,
        cookie: accepted.headers.get("set-cookie") || ""
      },
      body: JSON.stringify({ reason: "credential_reset" })
    });
    assert.equal(replay.status, 403);
  });

  assert.ok(auditRepository.list().some((event) => event.action === "CSRF_BLOCKED"));
});

test("login rotates anonymous csrf session into opaque authenticated session", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const sessionRepository = createInMemorySessionRepository();
  const server = createApiServer(createTestApiConfig({ secureCookies: true }), {
    sessionRepository,
    auditRepository
  });

  await withServer(server, async (baseUrl) => {
    const { response, body, sessionCookie, originalCookie } = await createSession(baseUrl, "member", "member.user");

    assert.equal(response.status, 202);
    assert.deepEqual(body, {
      status: "accepted",
      message: "If the request can be completed, the session will be updated."
    });
    assert.match(sessionCookie, /iwfsa_session=/);
    assert.match(sessionCookie, /HttpOnly/);
    assert.match(sessionCookie, /SameSite=Lax/);
    assert.match(sessionCookie, /Path=\//);
    assert.match(sessionCookie, /Max-Age=/);
    assert.match(sessionCookie, /Secure/);
    assert.notEqual(sessionCookie.match(/iwfsa_session=([^;]+)/)?.[1], originalCookie.match(/iwfsa_session=([^;]+)/)?.[1]);
    assert.equal(sessionCookie.includes("member"), false);
    assert.equal(sessionCookie.includes("member.user"), false);

    const inspect = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { cookie: sessionCookie }
    });
    const inspectBody = (await inspect.json()) as Record<string, unknown>;
    assert.equal(inspectBody.role, "member");
  });

  assert.ok(auditRepository.list().some((event) => event.action === "SESSION_CREATED"));
  assert.ok(auditRepository.list().some((event) => event.action === "SESSION_ROTATED" && event.redactedMetadata.reason === "login"));
});

test("session rotates on admin elevation, standing change, and credential reset", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository(),
    auditRepository
  });

  await withServer(server, async (baseUrl) => {
    const login = await createSession(baseUrl, "member", "rotate.user");
    let cookie = login.sessionCookie;
    const seen = new Set<string>([cookie.match(/iwfsa_session=([^;]+)/)?.[1] || ""]);

    for (const body of [
      { reason: "admin_elevation", role: "admin", standing: "active", consent: "granted" },
      { reason: "standing_change", standing: "blocked" },
      { reason: "credential_reset" }
    ]) {
      const csrf = await getCsrf(baseUrl, cookie);
      const response = await fetch(`${baseUrl}/api/auth/session/rotate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf.csrfToken,
          cookie
        },
        body: JSON.stringify(body)
      });
      cookie = response.headers.get("set-cookie") || cookie;
      const token = cookie.match(/iwfsa_session=([^;]+)/)?.[1] || "";

      assert.equal(response.status, 202);
      assert.equal(seen.has(token), false);
      seen.add(token);
    }
  });

  for (const reason of ["admin_elevation", "standing_change", "credential_reset"]) {
    assert.ok(auditRepository.list().some((event) => event.action === "SESSION_ROTATED" && event.redactedMetadata.reason === reason));
  }
});

test("login, reset, and activation responses are generic", async () => {
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository()
  });

  await withServer(server, async (baseUrl) => {
    const valid = await createSession(baseUrl, "member", "valid.user");
    const invalidCsrf = await getCsrf(baseUrl);
    const invalid = await fetch(`${baseUrl}/api/auth/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": invalidCsrf.csrfToken,
        cookie: invalidCsrf.cookie
      },
      body: JSON.stringify({ role: "not_a_role", subject: "unknown" })
    });
    assert.deepEqual(await invalid.json(), valid.body);

    let cookie = valid.sessionCookie;
    for (const path of ["/api/auth/reset", "/api/auth/activation"]) {
      const csrf = await getCsrf(baseUrl, cookie);
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf.csrfToken,
          cookie
        },
        body: JSON.stringify({ email: "person@example.test", token: "raw-token" })
      });
      const body = await response.json();

      assert.equal(response.status, 202);
      assert.deepEqual(body, valid.body);
      cookie = response.headers.get("set-cookie") || cookie;
    }
  });
});

test("policy denial and missing task mapping emit audit without route leakage", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository(),
    auditRepository
  });

  await withServer(server, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/placeholder`);
    const body = (await response.json()) as Record<string, unknown>;

    assert.equal(response.status, 403);
    assert.equal(body.message, "The request could not be completed.");

    const missing = await fetch(`${baseUrl}/api/task/unmapped`);
    const missingBody = (await missing.json()) as Record<string, unknown>;
    assert.equal(missing.status, 403);
    assert.equal(missingBody.code, "POLICY_MISSING_MAPPING");
  });

  assert.ok(auditRepository.list().some((event) => event.action === "POLICY_DENY" && event.redactedMetadata.reason === "AUTHENTICATION_REQUIRED"));
  assert.ok(auditRepository.list().some((event) => event.action === "POLICY_DENY" && event.redactedMetadata.reason === "POLICY_MISSING_MAPPING"));
});

test("privileged placeholder writes emit redacted audit events with correlation ID", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository(),
    auditRepository
  });

  await withServer(server, async (baseUrl) => {
    const member = await createSession(baseUrl, "member", "member.actor");
    const memberCsrf = await getCsrf(baseUrl, member.sessionCookie);
    const visibility = await fetch(`${baseUrl}/api/member/profile/visibility`, {
      method: "PATCH",
      headers: {
        "x-csrf-token": memberCsrf.csrfToken,
        cookie: member.sessionCookie,
        "x-correlation-id": "corr-profile"
      }
    });
    assert.equal(visibility.status, 202);

    const admin = await createSession(baseUrl, "admin", "admin.actor");
    const importCsrf = await getCsrf(baseUrl, admin.sessionCookie);
    const commit = await fetch(`${baseUrl}/api/admin/import/commit`, {
      method: "POST",
      headers: {
        "x-csrf-token": importCsrf.csrfToken,
        cookie: admin.sessionCookie,
        "x-correlation-id": "corr-import"
      }
    });
    assert.equal(commit.status, 202);

    const standingCsrf = await getCsrf(baseUrl, admin.sessionCookie);
    const standing = await fetch(`${baseUrl}/api/admin/standing`, {
      method: "PATCH",
      headers: {
        "x-csrf-token": standingCsrf.csrfToken,
        cookie: admin.sessionCookie,
        "x-correlation-id": "corr-standing"
      }
    });
    assert.equal(standing.status, 202);
  });

  const events = auditRepository.list();
  assert.ok(events.some((event) => event.action === "PROFILE_VISIBILITY_CHANGED" && event.correlationId === "corr-profile"));
  assert.ok(events.some((event) => event.action === "IMPORT_COMMITTED" && event.correlationId === "corr-import"));
  assert.ok(events.some((event) => event.action === "STANDING_CHANGED" && event.correlationId === "corr-standing"));
  assert.equal(JSON.stringify(events).includes("member@example.test"), false);
  assert.equal(JSON.stringify(events).includes("person@example.test"), false);
  assert.ok(events.every((event) => event.metadataHash));
});

test("api import preview and commit use durable repositories with idempotency key", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const repositories = createInMemoryRepositories();
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository(),
    auditRepository,
    repositories
  });

  await withServer(server, async (baseUrl) => {
    const admin = await createSession(baseUrl, "admin", "admin.import");
    const previewCsrf = await getCsrf(baseUrl, admin.sessionCookie);
    const preview = await fetch(`${baseUrl}/api/admin/import/preview`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": previewCsrf.csrfToken,
        cookie: admin.sessionCookie,
        "x-correlation-id": "corr-api-import-preview"
      },
      body: JSON.stringify({
        filename: "members.csv",
        mimeType: "text/csv",
        content: "source_key,verified_email,display_name\n001,one@example.test,One Member"
      })
    });
    const previewBody = (await preview.json()) as Record<string, any>;

    assert.equal(preview.status, 200);
    assert.equal(previewBody.rowCount, 1);
    assert.equal(repositories.memberAccounts.findById("member_001"), null);

    const commitCsrf = await getCsrf(baseUrl, admin.sessionCookie);
    const commit = await fetch(`${baseUrl}/api/admin/import/commit`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": commitCsrf.csrfToken,
        cookie: admin.sessionCookie,
        "x-correlation-id": "corr-api-import-commit"
      },
      body: JSON.stringify({
        batchId: previewBody.batchId,
        idempotencyKey: previewBody.idempotencyKey
      })
    });

    assert.equal(commit.status, 202);
    assert.equal(repositories.memberAccounts.findById("member_001")?.authState, "pending_activation");
    assert.equal(repositories.outbox.list().length, 1);
  });

  assert.ok(auditRepository.list().some((event) => event.action === "IMPORT_PREVIEWED" && event.correlationId === "corr-api-import-preview"));
  assert.ok(auditRepository.list().some((event) => event.action === "IMPORT_COMMITTED" && event.correlationId === "corr-api-import-commit"));
});

test("blocked standing emits standing denied audit on member route", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository(),
    auditRepository
  });

  await withServer(server, async (baseUrl) => {
    const member = await createSession(baseUrl, "member", "blocked.member");
    const csrf = await getCsrf(baseUrl, member.sessionCookie);
    const rotate = await fetch(`${baseUrl}/api/auth/session/rotate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf.csrfToken,
        cookie: member.sessionCookie
      },
      body: JSON.stringify({ reason: "standing_change", standing: "blocked" })
    });
    const blockedCookie = rotate.headers.get("set-cookie") || member.sessionCookie;
    const denied = await fetch(`${baseUrl}/api/member/placeholder`, {
      headers: {
        cookie: blockedCookie,
        "x-correlation-id": "corr-standing-denied"
      }
    });

    assert.equal(denied.status, 403);
  });

  assert.ok(auditRepository.list().some((event) => event.action === "STANDING_DENIED" && event.correlationId === "corr-standing-denied"));
});

test("event RSVP route enforces policy, capacity, waitlist, and audit", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const eventRepositories = createEventRepositories();
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository(),
    auditRepository,
    eventRepositories
  });

  await withServer(server, async (baseUrl) => {
    const memberOne = await createSession(baseUrl, "member", "member.one");
    const memberOneCsrf = await getCsrf(baseUrl, memberOne.sessionCookie);
    const first = await fetch(`${baseUrl}/api/events/event-1/rsvp`, {
      method: "POST",
      headers: {
        "x-csrf-token": memberOneCsrf.csrfToken,
        cookie: memberOne.sessionCookie,
        "x-correlation-id": "corr-api-rsvp-1"
      }
    });
    assert.equal(first.status, 202);
    assert.equal(((await first.json()) as Record<string, unknown>).status, "registered");

    const memberTwo = await createSession(baseUrl, "member", "member.two");
    const memberTwoCsrf = await getCsrf(baseUrl, memberTwo.sessionCookie);
    await fetch(`${baseUrl}/api/events/event-1/rsvp`, {
      method: "POST",
      headers: { "x-csrf-token": memberTwoCsrf.csrfToken, cookie: memberTwo.sessionCookie }
    });

    const memberThree = await createSession(baseUrl, "member", "member.three");
    const memberThreeCsrf = await getCsrf(baseUrl, memberThree.sessionCookie);
    const waitlist = await fetch(`${baseUrl}/api/events/event-1/rsvp`, {
      method: "POST",
      headers: { "x-csrf-token": memberThreeCsrf.csrfToken, cookie: memberThree.sessionCookie }
    });
    const waitlistBody = (await waitlist.json()) as Record<string, unknown>;

    assert.equal(waitlist.status, 202);
    assert.equal(waitlistBody.status, "waitlisted");
    assert.equal(waitlistBody.waitlistPosition, 1);
  });

  assert.equal(eventRepositories.events.get("event-1")?.registeredCount, 2);
  assert.ok(auditRepository.list().some((event) => event.action === "RSVP_REGISTERED" && event.correlationId === "corr-api-rsvp-1"));
  assert.ok(auditRepository.list().some((event) => event.action === "WAITLIST_JOINED"));
});

test("event document route returns generic denial and audits missing consent", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const sessionRepository = createInMemorySessionRepository();
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository,
    auditRepository
  });

  await withServer(server, async (baseUrl) => {
    const member = await createSession(baseUrl, "member", "member.no-consent");
    const csrf = await getCsrf(baseUrl, member.sessionCookie);
    const rotate = await fetch(`${baseUrl}/api/auth/session/rotate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf.csrfToken,
        cookie: member.sessionCookie
      },
      body: JSON.stringify({ reason: "standing_change", consent: "missing" })
    });
    const missingConsentCookie = rotate.headers.get("set-cookie") || member.sessionCookie;
    const documentCsrf = await getCsrf(baseUrl, missingConsentCookie);
    const denied = await fetch(`${baseUrl}/api/events/event-1/documents`, {
      method: "POST",
      headers: {
        "x-csrf-token": documentCsrf.csrfToken,
        cookie: missingConsentCookie,
        "x-correlation-id": "corr-doc-denied"
      }
    });
    const body = (await denied.json()) as Record<string, unknown>;

    assert.equal(denied.status, 403);
    assert.equal(body.detail, "The request could not be completed.");
  });

  assert.ok(auditRepository.list().some((event) => event.action === "DOCUMENT_ACCESS_DENIED" && event.correlationId === "corr-doc-denied"));
});

test("admin event state route emits transition audit", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const eventRepositories = createEventRepositories();
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository(),
    auditRepository,
    eventRepositories
  });

  await withServer(server, async (baseUrl) => {
    const admin = await createSession(baseUrl, "admin", "admin.events");
    const csrf = await getCsrf(baseUrl, admin.sessionCookie);
    const closed = await fetch(`${baseUrl}/api/admin/events/event-1/state`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf.csrfToken,
        cookie: admin.sessionCookie,
        "x-correlation-id": "corr-event-state-api"
      },
      body: JSON.stringify({ status: "closed" })
    });

    assert.equal(closed.status, 202);
    assert.equal(((await closed.json()) as Record<string, unknown>).eventStatus, "closed");
  });

  assert.ok(auditRepository.list().some((event) => event.action === "EVENT_STATE_CHANGED" && event.correlationId === "corr-event-state-api"));
});

test("admin fee payment updates standing and rotates member session before next request", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepository);
  const sessionRepository = createInMemorySessionRepository();
  const standingRepositories = createStandingRepositories();
  openMembershipYear(standingRepositories, {
    id: "year-2026",
    label: "2026",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    gracePeriodDays: 30,
    status: "open"
  }, "admin", audit, "corr-year");

  const server = createApiServer(createTestApiConfig(), {
    sessionRepository,
    auditRepository,
    standingRepositories
  });

  await withServer(server, async (baseUrl) => {
    const member = await createSession(baseUrl, "member", "member-standing");
    const admin = await createSession(baseUrl, "admin", "admin-fees");
    const csrf = await getCsrf(baseUrl, admin.sessionCookie);
    const payment = await fetch(`${baseUrl}/api/admin/fees/payment`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf.csrfToken,
        cookie: admin.sessionCookie,
        "x-correlation-id": "corr-api-fee"
      },
      body: JSON.stringify({
        memberId: "member-standing",
        feeId: "fee-standing",
        membershipYearId: "year-2026",
        totalAmountCents: 10000,
        amountCents: 10000,
        transactionRef: "eft-standing"
      })
    });
    const body = (await payment.json()) as Record<string, unknown>;

    assert.equal(payment.status, 202);
    assert.equal(body.standing, "good");
    assert.equal(sessionRepository.getSession(member.sessionCookie.match(/iwfsa_session=([^;]+)/)?.[1] || ""), null);

    const oldCookieAccess = await fetch(`${baseUrl}/api/member/placeholder`, {
      headers: { cookie: member.sessionCookie }
    });
    assert.equal(oldCookieAccess.status, 403);
  });

  assert.ok(auditRepository.list().some((event) => event.action === "FEE_PAYMENT_APPLIED" && event.correlationId === "corr-api-fee"));
  assert.ok(auditRepository.list().some((event) => event.action === "STANDING_CHANGED" && event.correlationId === "corr-api-fee"));
});

test("admin public profile approval requires good standing and emits publication audit", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository(),
    auditRepository
  });

  await withServer(server, async (baseUrl) => {
    const member = await createSession(baseUrl, "member", "member-public-approval");
    const memberCsrf = await getCsrf(baseUrl, member.sessionCookie);
    const memberDenied = await fetch(`${baseUrl}/api/admin/public-profiles/member-public-approval/approve`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": memberCsrf.csrfToken,
        cookie: member.sessionCookie,
        "x-correlation-id": "corr-public-member-denied"
      },
      body: JSON.stringify({ memberStanding: "good" })
    });
    assert.equal(memberDenied.status, 403);

    const admin = await createSession(baseUrl, "admin", "admin-public-approval");
    const reviewCsrf = await getCsrf(baseUrl, admin.sessionCookie);
    const reviewDenied = await fetch(`${baseUrl}/api/admin/public-profiles/member-public-approval/approve`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": reviewCsrf.csrfToken,
        cookie: admin.sessionCookie,
        "x-correlation-id": "corr-public-review-denied"
      },
      body: JSON.stringify({ memberStanding: "review" })
    });
    assert.equal(reviewDenied.status, 403);

    const approveCsrf = await getCsrf(baseUrl, admin.sessionCookie);
    const approved = await fetch(`${baseUrl}/api/admin/public-profiles/member-public-approval/approve`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": approveCsrf.csrfToken,
        cookie: admin.sessionCookie,
        "x-correlation-id": "corr-public-approved"
      },
      body: JSON.stringify({
        memberStanding: "good",
        currentState: "pending_review",
        profileVersion: "profile-v1",
        reviewNotes: "Approved after email person@example.test was removed."
      })
    });
    const body = (await approved.json()) as Record<string, unknown>;

    assert.equal(approved.status, 202);
    assert.equal(body.correlationId, "corr-public-approved");
    assert.equal(body.publicationState, "approved");
    assert.equal(body.visibility, "hidden");
  });

  const events = auditRepository.list();
  assert.ok(events.some((event) => event.action === "POLICY_DENY" && event.correlationId === "corr-public-member-denied"));
  assert.ok(events.some((event) => event.action === "POLICY_DENY" && event.correlationId === "corr-public-review-denied" && event.redactedMetadata.reason === "MEMBER_GOOD_STANDING_REQUIRED"));
  const approvalEvent = events.find((event) => event.action === "profile.publication_approved" && event.correlationId === "corr-public-approved");
  assert.ok(approvalEvent);
  assert.equal(approvalEvent.redactedMetadata.reviewNotes, "Approved after email [REDACTED] was removed.");
});

test("public profile endpoint applies cache isolation and public-safe projection", async () => {
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository: createInMemorySessionRepository(),
    publicProfileRepository: {
      findApprovedPublicProfiles() {
        return [
          {
            displayName: "Approved Member",
            biography: "Public-safe biography.",
            updatedAt: "2026-05-03T10:00:00.000Z",
            internal_id: "must-not-leak",
            consent: "granted"
          } as never
        ];
      }
    }
  });

  await withServer(server, async (baseUrl) => {
    const member = await createSession(baseUrl, "member", "cache.member");
    const response = await fetch(`${baseUrl}/api/public/profiles?limit=5`, {
      headers: {
        authorization: "Bearer private-token",
        cookie: member.sessionCookie
      }
    });
    const body = (await response.json()) as Record<string, any>;

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "public, max-age=300, s-maxage=3600, stale-while-revalidate=60");
    assert.equal(response.headers.get("vary"), "Accept-Encoding");
    assert.equal(response.headers.get("x-surface"), "public");
    assert.equal(response.headers.get("set-cookie"), null);
    assert.deepEqual(Object.keys(body.profiles[0]).sort(), ["biography", "displayName", "updatedAt"].sort());
    assert.equal(JSON.stringify(body).includes("private-token"), false);
    assert.equal(JSON.stringify(body).includes("iwfsa_session"), false);
    assert.equal(JSON.stringify(body).includes("internal_id"), false);
    assert.equal(JSON.stringify(body).includes("consent"), false);
  });
});

test("review standing member is waitlisted even when event capacity is available", async () => {
  const auditRepository = createInMemoryAuditRepository();
  const sessionRepository = createInMemorySessionRepository();
  const server = createApiServer(createTestApiConfig(), {
    sessionRepository,
    auditRepository,
    eventRepositories: createEventRepositories()
  });

  await withServer(server, async (baseUrl) => {
    const member = await createSession(baseUrl, "member", "review.member");
    const csrf = await getCsrf(baseUrl, member.sessionCookie);
    const rotate = await fetch(`${baseUrl}/api/auth/session/rotate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf.csrfToken,
        cookie: member.sessionCookie
      },
      body: JSON.stringify({ reason: "standing_change", standing: "review" })
    });
    const reviewCookie = rotate.headers.get("set-cookie") || member.sessionCookie;
    const rsvpCsrf = await getCsrf(baseUrl, reviewCookie);
    const rsvp = await fetch(`${baseUrl}/api/events/event-1/rsvp`, {
      method: "POST",
      headers: {
        "x-csrf-token": rsvpCsrf.csrfToken,
        cookie: reviewCookie,
        "x-correlation-id": "corr-review-rsvp"
      }
    });
    const body = (await rsvp.json()) as Record<string, unknown>;

    assert.equal(rsvp.status, 202);
    assert.equal(body.status, "waitlisted");
  });
});

test("policy matrix covers role, surface, standing, and consent permutations", () => {
  const cases: Array<[PolicyInput, string]> = [
    [{ role: null, surface: "public", standing: "anonymous", consent: "not_required", task: "public.home" }, "ALLOW"],
    [{ role: null, surface: "public", standing: "review", consent: "granted", task: "public.profiles.approved", visibility: "public", approved: true }, "REDACT"],
    [{ role: null, surface: "public", standing: "good", consent: "missing", task: "public.profiles.approved", visibility: "public", approved: true }, "REDACT"],
    [{ role: null, surface: "public", standing: "good", consent: "granted", task: "public.profiles.approved", visibility: "hidden", approved: true }, "REDACT"],
    [{ role: null, surface: "public", standing: "good", consent: "granted", task: "public.profiles.approved", visibility: "public", approved: false }, "REDACT"],
    [{ role: null, surface: "public", standing: "good", consent: "granted", task: "public.profiles.approved", visibility: "public", approved: true }, "ALLOW"],
    [{ role: null, surface: "member", standing: "anonymous", consent: "not_required", task: "member.dashboard" }, "DENY"],
    [{ role: "member", surface: "member", standing: "active", consent: "granted", task: "member.dashboard" }, "ALLOW"],
    [{ role: "member", surface: "member", standing: "blocked", consent: "granted", task: "member.dashboard" }, "DENY"],
    [{ role: "member", surface: "member", standing: "active", consent: "missing", task: "member.profile.edit" }, "DENY"],
    [{ role: "member", surface: "member", standing: "active", consent: "granted", task: "member.profile.edit" }, "ALLOW"],
    [{ role: "member", surface: "member", standing: "grace", consent: "granted", task: "member.events.rsvp" }, "ALLOW"],
    [{ role: "member", surface: "member", standing: "outstanding", consent: "granted", task: "member.directory.view" }, "ALLOW"],
    [{ role: "admin", surface: "member", standing: "active", consent: "granted", task: "member.directory.view" }, "ALLOW"],
    [{ role: "chief_admin", surface: "member", standing: "active", consent: "granted", task: "member.events.view" }, "ALLOW"],
    [{ role: "member", surface: "admin", standing: "active", consent: "granted", task: "admin.dashboard", auditTrail: true }, "DENY"],
    [{ role: "admin", surface: "admin", standing: "active", consent: "granted", task: "admin.dashboard", auditTrail: true }, "ALLOW"],
    [{ role: "chief_admin", surface: "admin", standing: "active", consent: "granted", task: "admin.import.commit", auditTrail: true }, "ALLOW"],
    [{ role: "admin", surface: "admin", standing: "blocked", consent: "granted", task: "admin.audit.read", auditTrail: true }, "DENY"],
    [{ role: "admin", surface: "admin", standing: "active", consent: "granted", task: "admin.audit.read", auditTrail: false }, "DENY"],
    [{ role: "admin", surface: "admin", standing: "active", consent: "granted", task: "admin.events.manage", auditTrail: true }, "ALLOW"],
    [{ role: "admin", surface: "public", standing: "active", consent: "granted", task: "public.contact" }, "ALLOW"],
    [{ role: null, surface: "admin", standing: "anonymous", consent: "not_required", task: "admin.import.preview", auditTrail: true }, "DENY"],
    [{ role: "member", surface: "member", standing: "active", consent: "revoked", task: "member.directory.view" }, "DENY"],
    [{ role: "chief_admin", surface: "admin", standing: "active", consent: "granted", task: "admin.support-notes.add", auditTrail: true }, "ALLOW"]
  ];

  for (const [input, expected] of cases) {
    assert.equal(evaluate(input).decision, expected);
  }
});
