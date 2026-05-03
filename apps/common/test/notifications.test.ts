import test from "node:test";
import assert from "node:assert/strict";

import { createAuditEventEmitter, createInMemoryAuditRepository } from "@iwfsa/common/audit";
import { evaluateNotificationPolicy, sanitizeNotificationPreferences } from "@iwfsa/common/notification-policy";
import {
  cancelPendingNotifications,
  createInMemoryNotificationOutboxRepository,
  createNotificationOutboxMessage,
  processNotificationOutboxBatch
} from "@iwfsa/common/outbox";

test("celebration notifications require granted consent, non-private visibility, good standing, and opt-in", () => {
  const preferences = sanitizeNotificationPreferences({
    memberId: "member-1",
    consentScopeYear: 2026,
    updatedAt: "2026-05-03T12:00:00.000Z",
    preferences: {
      celebration: { email: true }
    }
  });

  assert.deepEqual(evaluateNotificationPolicy({
    eventType: "celebration",
    channel: "email",
    consent: "granted",
    visibility: "member_only",
    standing: "good",
    preferences,
    currentYear: 2026
  }), { decision: "ALLOW", reason: "CELEBRATION_ALLOWED" });

  assert.equal(evaluateNotificationPolicy({
    eventType: "celebration",
    channel: "email",
    consent: "revoked",
    visibility: "member_only",
    standing: "good",
    preferences,
    currentYear: 2026
  }).decision, "DENY");

  assert.equal(evaluateNotificationPolicy({
    eventType: "celebration",
    channel: "email",
    consent: "granted",
    visibility: "hidden",
    standing: "good",
    preferences,
    currentYear: 2026
  }).reason, "PRIVATE_VISIBILITY");
});

test("operational notifications default to allowed but respect annual opt-out and standing exclusions", () => {
  const preferences = sanitizeNotificationPreferences({
    memberId: "member-2",
    consentScopeYear: 2026,
    updatedAt: "2026-05-03T12:00:00.000Z",
    preferences: {
      standing_change: { in_app: false }
    }
  });

  assert.equal(evaluateNotificationPolicy({
    eventType: "rsvp",
    channel: "email",
    consent: "missing",
    visibility: "hidden",
    standing: "good",
    preferences,
    currentYear: 2026
  }).decision, "ALLOW");

  assert.equal(evaluateNotificationPolicy({
    eventType: "standing_change",
    channel: "in_app",
    consent: "granted",
    visibility: "member_only",
    standing: "good",
    preferences,
    currentYear: 2026
  }).reason, "MEMBER_OPTED_OUT");

  assert.equal(evaluateNotificationPolicy({
    eventType: "rsvp",
    channel: "email",
    consent: "granted",
    visibility: "member_only",
    standing: "review",
    preferences,
    currentYear: 2026
  }).reason, "STANDING_NOT_ELIGIBLE");
});

test("outbox enqueue is idempotent and failed delivery uses exponential retry without double send", async () => {
  const repository = createInMemoryNotificationOutboxRepository();
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);
  const message = createNotificationOutboxMessage({
    id: "notification-1",
    eventType: "birthday",
    payloadRef: "member:1:birthday:2026",
    createdAt: "2026-05-03T12:00:00.000Z",
    correlationId: "corr-notify"
  });

  repository.enqueue(message);
  repository.enqueue(message);
  assert.equal(repository.list().length, 1);

  await processNotificationOutboxBatch({
    repository,
    audit,
    now: "2026-05-03T12:00:00.000Z",
    deliver: () => ({ status: "failed" })
  });

  const failed = repository.list()[0];
  assert.equal(failed.attempts, 1);
  assert.equal(failed.status, "pending");
  assert.equal(failed.nextRetryAt, "2026-05-03T12:01:00.000Z");
  assert.equal(auditRepo.list().filter((event) => event.action === "notification.failed").length, 1);
  assert.equal(repository.listDue("2026-05-03T12:00:30.000Z").length, 0);
});

test("consent revocation cancels pending outbox messages and emits redacted audit evidence", () => {
  const repository = createInMemoryNotificationOutboxRepository();
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);

  repository.enqueue(createNotificationOutboxMessage({
    id: "notification-cancel",
    eventType: "celebration",
    payloadRef: "member:3:celebration",
    createdAt: "2026-05-03T12:00:00.000Z",
    correlationId: "corr-cancel"
  }));

  const cancelled = cancelPendingNotifications({
    repository,
    audit,
    payloadRef: "member:3:celebration",
    cancelledAt: "2026-05-03T12:05:00.000Z",
    correlationId: "corr-cancel"
  });

  assert.equal(cancelled.length, 1);
  assert.equal(repository.list()[0].status, "cancelled");
  assert.equal(auditRepo.list()[0].action, "notification.cancelled");
  assert.equal(JSON.stringify(auditRepo.list()).includes("@"), false);
});
