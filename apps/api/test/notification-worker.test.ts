import test from "node:test";
import assert from "node:assert/strict";

import { createAuditEventEmitter, createInMemoryAuditRepository } from "@iwfsa/common/audit";
import { createInMemoryNotificationOutboxRepository, createNotificationOutboxMessage } from "@iwfsa/common/outbox";
import {
  EmailProvider,
  FakeNotificationProvider,
  SMSProvider,
  createNotificationProviderFactory
} from "@iwfsa/common/notification-provider";
import { processNotificationWorkerBatch } from "../src/workers/notification-worker.ts";

test("notification worker processes sent messages once after restart-style rerun", async () => {
  const repository = createInMemoryNotificationOutboxRepository();
  const auditRepo = createInMemoryAuditRepository();
  const provider = new FakeNotificationProvider({ mode: "success", channel: "in_app" });
  repository.enqueue(createNotificationOutboxMessage({
    id: "worker-once",
    eventType: "rsvp.confirmation",
    channel: "in_app",
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
  assert.equal(auditRepo.list().filter((event) => event.action === "notification.provider_sent").length, 1);
});

test("notification worker schedules backoff and dead-letters exhausted messages", async () => {
  const repository = createInMemoryNotificationOutboxRepository();
  const auditRepo = createInMemoryAuditRepository();
  const provider = new FakeNotificationProvider({ mode: "failure" });
  repository.enqueue(createNotificationOutboxMessage({
    id: "worker-fail",
    eventType: "birthday",
    channel: "sms",
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
  assert.deepEqual(
    auditRepo.list()
      .filter((event) => event.action === "notification.outbox_processed")
      .map((event) => event.redactedMetadata.result),
    ["retry_scheduled", "dead_letter"]
  );
  assert.equal(auditRepo.list().filter((event) => event.action === "notification.provider_failed").length, 2);
});

test("notification worker resolves providers by channel and preserves correlation metadata", async () => {
  const repository = createInMemoryNotificationOutboxRepository();
  const auditRepo = createInMemoryAuditRepository();
  const emailProvider = new EmailProvider();
  const smsProvider = new SMSProvider();

  repository.enqueue(createNotificationOutboxMessage({
    id: "worker-email",
    eventType: "rsvp.confirmation",
    channel: "email",
    payloadRef: "event:event-1:member:member-1:rsvp:registered",
    createdAt: "2026-05-03T12:00:00.000Z",
    correlationId: "corr-worker-email"
  }));
  repository.enqueue(createNotificationOutboxMessage({
    id: "worker-sms",
    eventType: "birthday",
    channel: "sms",
    payloadRef: "member:member-2:birthday:2026",
    createdAt: "2026-05-03T12:00:00.000Z",
    correlationId: "corr-worker-sms"
  }));

  await processNotificationWorkerBatch({
    repository,
    providerFactory: createNotificationProviderFactory({ email: emailProvider, sms: smsProvider }),
    audit: createAuditEventEmitter(auditRepo),
    now: "2026-05-03T12:00:00.000Z"
  });

  assert.deepEqual(emailProvider.sent, ["email:worker-email"]);
  assert.deepEqual(smsProvider.sent, ["sms:worker-sms"]);

  const providerSent = auditRepo.list().filter((event) => event.action === "notification.provider_sent");
  assert.equal(providerSent.length, 2);
  assert.deepEqual(providerSent.map((event) => event.correlationId), ["corr-worker-email", "corr-worker-sms"]);
  assert.deepEqual(providerSent.map((event) => event.redactedMetadata.providerRef), ["email:worker-email", "sms:worker-sms"]);
});

test("notification outbox rejects invalid channels instead of silently defaulting", () => {
  assert.throws(
    () => createNotificationOutboxMessage({
      id: "worker-invalid-channel",
      eventType: "birthday",
      channel: "push" as never,
      payloadRef: "member:member-3:birthday:2026",
      createdAt: "2026-05-03T12:00:00.000Z",
      correlationId: "corr-invalid-channel"
    }),
    /invalid notification channel/
  );
});
