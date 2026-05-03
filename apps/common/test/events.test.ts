import test from "node:test";
import assert from "node:assert/strict";

import { createAuditEventEmitter, createInMemoryAuditRepository } from "@iwfsa/common/audit";
import {
  cancelRsvpAndPromote,
  consumeDocumentAccess,
  createEventRepositories,
  issueDocumentAccess,
  rsvpToEvent,
  transitionEventStatus,
  type EventParticipant,
  type EventRecord
} from "@iwfsa/common/events";

function seedEvent(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    id: "event-1",
    title: "Leadership Circle",
    status: "published",
    maxCapacity: 2,
    registeredCount: 0,
    waitlistCount: 0,
    audience: { mode: "groups", groups: ["leaders"] },
    version: 0,
    ...overrides
  };
}

function participant(id: string, overrides: Partial<EventParticipant> = {}): EventParticipant {
  return {
    memberId: id,
    role: "member",
    standing: "active",
    consent: "granted",
    groups: ["leaders"],
    ...overrides
  };
}

test("event state transitions emit audit and reject invalid jumps", () => {
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);
  const draft = seedEvent({ status: "draft" });
  const published = transitionEventStatus(draft, "published", "admin", audit, "corr-event-state");

  assert.equal(published.status, "published");
  assert.throws(() => transitionEventStatus(published, "draft" as never, "admin", audit, "corr-event-state"));
  assert.ok(auditRepo.list().some((event) => event.action === "EVENT_STATE_CHANGED" && event.correlationId === "corr-event-state"));
});

test("parallel RSVP simulation never exceeds capacity and preserves waitlist order", async () => {
  const repositories = createEventRepositories();
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);
  repositories.events.set("event-1", seedEvent());

  const results = await Promise.all(["m1", "m2", "m3", "m4"].map(async (id) => rsvpToEvent(repositories, "event-1", participant(id), audit, `corr-${id}`)));
  const registered = results.filter((rsvp) => rsvp.state === "registered");
  const waitlisted = results.filter((rsvp) => rsvp.state === "waitlisted");

  assert.equal(registered.length, 2);
  assert.equal(waitlisted.length, 2);
  assert.deepEqual(waitlisted.map((rsvp) => rsvp.waitlistPosition), [1, 2]);
  assert.equal(repositories.events.get("event-1")?.registeredCount, 2);
  assert.ok(auditRepo.list().some((event) => event.action === "WAITLIST_JOINED"));
});

test("cancellation promotes next waitlisted member and enqueues outbox notice", () => {
  const repositories = createEventRepositories();
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);
  repositories.events.set("event-1", seedEvent({ maxCapacity: 1 }));

  rsvpToEvent(repositories, "event-1", participant("m1"), audit, "corr-m1");
  rsvpToEvent(repositories, "event-1", participant("m2"), audit, "corr-m2");
  const promoted = cancelRsvpAndPromote(repositories, "event-1", "m1", audit, "corr-promote");

  assert.equal(promoted?.memberId, "m2");
  assert.equal(promoted?.state, "registered");
  assert.equal(repositories.outbox.length, 1);
  assert.ok(auditRepo.list().some((event) => event.action === "WAITLIST_PROMOTED" && event.correlationId === "corr-promote"));
});

test("audience eligibility denies blocked or consent-missing members with audit", () => {
  const repositories = createEventRepositories();
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);
  repositories.events.set("event-1", seedEvent());

  assert.throws(() => rsvpToEvent(repositories, "event-1", participant("blocked", { standing: "blocked" }), audit, "corr-deny"));
  assert.throws(() => rsvpToEvent(repositories, "event-1", participant("missing-consent", { consent: "missing" }), audit, "corr-deny-2"));
  assert.ok(auditRepo.list().some((event) => event.action === "EVENT_ACCESS_DENIED"));
});

test("document access tokens are eligibility checked, single use, and expiring", () => {
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);
  const event = seedEvent();
  const issued = issueDocumentAccess(event, participant("m1"), audit, "corr-doc");
  const consumed = consumeDocumentAccess(issued.record, issued.rawToken, Date.now());

  assert.ok(consumed?.usedAt);
  assert.equal(consumeDocumentAccess(consumed, issued.rawToken, Date.now()), null);
  assert.equal(consumeDocumentAccess({ ...issued.record, expiresAt: "2000-01-01T00:00:00.000Z" }, issued.rawToken, Date.now()), null);
  assert.throws(() => issueDocumentAccess(event, participant("m2", { consent: "missing" }), audit, "corr-doc-deny"));
  assert.ok(auditRepo.list().some((eventRecord) => eventRecord.action === "DOCUMENT_ACCESS_GRANTED"));
  assert.ok(auditRepo.list().some((eventRecord) => eventRecord.action === "DOCUMENT_ACCESS_DENIED"));
});
