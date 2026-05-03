import test from "node:test";
import assert from "node:assert/strict";

import { createAuditEventEmitter, createInMemoryAuditRepository } from "@iwfsa/common/audit";
import { createInMemoryNotificationOutboxRepository, createNotificationOutboxMessage } from "@iwfsa/common/outbox";
import { FakeNotificationProvider, processNotificationWorkerBatch } from "../src/workers/notification-worker.ts";

test("notification worker processes sent messages once after restart-style rerun", async () => {
  const repository = createInMemoryNotificationOutboxRepository();
  const auditRepo = createInMemoryAuditRepository();
  const provider = new FakeNotificationProvider({ mode: "success" });
  repository.enqueue(createNotificationOutboxMessage({
    id: "worker-once",
    eventType: "rsvp.confirmation",
    payloadRef: "event:event-1:member:member-1:rsvp:registered",
    createdAt: "2026-05-03T12:00:00.000Z",
    correlationId: "corr-worker"
  }));

  await processNotificationWorkerBatch({
    repository,
    provider,
    audit: createAuditEventEmitter(auditRepo),
    now: "2026-05-03T12:00:00.000Z"
  });
  await processNotificationWorkerBatch({
    repository,
    provider,
    audit: createAuditEventEmitter(auditRepo),
    now: "2026-05-03T12:00:00.000Z"
  });

  assert.equal(provider.delivered.length, 1);
  assert.equal(repository.list()[0].status, "sent");
  assert.equal(auditRepo.list().filter((event) => event.action === "notification.outbox_processed").length, 1);
});

test("notification worker schedules backoff and dead-letters exhausted messages", async () => {
  const repository = createInMemoryNotificationOutboxRepository();
  const auditRepo = createInMemoryAuditRepository();
  const provider = new FakeNotificationProvider({ mode: "failure" });
  repository.enqueue(createNotificationOutboxMessage({
    id: "worker-fail",
    eventType: "birthday",
    payloadRef: "member:member-2:birthday:2026",
    createdAt: "2026-05-03T12:00:00.000Z",
    correlationId: "corr-worker-fail"
  }));

  await processNotificationWorkerBatch({
    repository,
    provider,
    audit: createAuditEventEmitter(auditRepo),
    now: "2026-05-03T12:00:00.000Z",
    retryPolicy: { baseDelayMs: 30_000, maxDelayMs: 15 * 60_000, maxAttempts: 2 }
  });

  assert.equal(repository.list()[0].status, "pending");
  assert.equal(repository.list()[0].nextRetryAt, "2026-05-03T12:00:30.000Z");

  await processNotificationWorkerBatch({
    repository,
    provider,
    audit: createAuditEventEmitter(auditRepo),
    now: "2026-05-03T12:00:30.000Z",
    retryPolicy: { baseDelayMs: 30_000, maxDelayMs: 15 * 60_000, maxAttempts: 2 }
  });

  assert.equal(repository.list()[0].status, "failed");
  assert.equal(repository.list()[0].nextRetryAt, null);
  assert.deepEqual(auditRepo.list().map((event) => event.redactedMetadata.result), ["retry_scheduled", "dead_letter"]);
});
