import test from "node:test";
import assert from "node:assert/strict";

import { createAuditEventEmitter, createInMemoryAuditRepository } from "@iwfsa/common/audit";
import { createInMemorySessionRepository } from "@iwfsa/common/session-repository";
import {
  applyPayment,
  applyStandingChange,
  createStandingRepositories,
  evaluateStanding,
  openMembershipYear,
  recordFee,
  waiveFee
} from "@iwfsa/common/standing";

function openYear() {
  return {
    id: "year-2026",
    label: "2026",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    gracePeriodDays: 30,
    status: "open" as const
  };
}

test("membership cycle opening rejects overlaps and emits standing review", () => {
  const repositories = createStandingRepositories();
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);

  openMembershipYear(repositories, openYear(), "admin", audit, "corr-cycle");
  assert.throws(() => openMembershipYear(repositories, { ...openYear(), id: "overlap" }, "admin", audit, "corr-cycle"));
  assert.ok(auditRepo.list().some((event) => event.action === "MEMBERSHIP_CYCLE_OPENED"));
  assert.ok(auditRepo.list().some((event) => event.action === "STANDING_REVIEW"));
});

test("fee state machine accumulates partial payments and waivers lock payment", () => {
  const repositories = createStandingRepositories();
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);

  const fee = recordFee(repositories, {
    id: "fee-1",
    memberId: "member-1",
    membershipYearId: "year-2026",
    type: "dues",
    amountCents: 10000,
    transactionRef: null,
    recordedAt: "2026-05-03T00:00:00.000Z"
  }, "admin", audit, "corr-fee");
  const partial = applyPayment(repositories, fee.id, 4000, "eft-1", "admin", audit, "corr-fee");
  const paid = applyPayment(repositories, fee.id, 6000, "eft-2", "admin", audit, "corr-fee");

  assert.equal(partial.status, "partial");
  assert.equal(paid.status, "paid");

  const waiver = recordFee(repositories, { ...fee, id: "fee-waive", amountCents: 5000 }, "admin", audit, "corr-waiver");
  const waived = waiveFee(repositories, waiver.id, "approved hardship waiver", "admin", audit, "corr-waiver");
  assert.equal(waived.status, "waived");
  assert.throws(() => applyPayment(repositories, waiver.id, 1000, "eft-3", "admin", audit, "corr-waiver"));
  assert.ok(auditRepo.list().some((event) => event.action === "FEE_PAYMENT_APPLIED"));
  assert.ok(auditRepo.list().some((event) => event.action === "FEE_WAIVED"));
});

test("standing determination maps paid, partial, overdue, and manual block", () => {
  const year = openYear();
  const paidFee = { id: "paid", memberId: "member-1", membershipYearId: year.id, type: "dues" as const, amountCents: 100, amountPaidCents: 100, status: "paid" as const, transactionRef: "eft", waiverReason: null, recordedAt: "2026-05-03T00:00:00.000Z" };
  const partialFee = { ...paidFee, id: "partial", amountPaidCents: 50, status: "partial" as const };
  const pendingFee = { ...paidFee, id: "pending", amountPaidCents: 0, status: "pending" as const };

  assert.equal(evaluateStanding({ year, fees: [paidFee] }).standing, "good");
  assert.equal(evaluateStanding({ year, fees: [partialFee] }).standing, "review");
  assert.equal(evaluateStanding({ year, fees: [pendingFee], now: "2027-03-01T00:00:00.000Z" }).standing, "blocked");
  assert.equal(evaluateStanding({ year, fees: [paidFee], manualBlock: true }).reason, "manual_block");
});

test("standing change appends history, emits audit, and rotates active member sessions", () => {
  const repositories = createStandingRepositories();
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);
  const sessionRepository = createInMemorySessionRepository();
  const session = sessionRepository.createSession({ role: "member", subject: "member-1", standing: "good", consent: "granted" });

  applyStandingChange({
    repositories,
    sessionRepository,
    memberId: "member-1",
    previousStanding: "good",
    nextStanding: "blocked",
    reason: "overdue",
    actorId: "admin",
    audit,
    correlationId: "corr-standing-change",
    effectiveFrom: "2026-05-03T00:00:00.000Z"
  });

  assert.equal(sessionRepository.getSession(session.token), null);
  assert.equal(sessionRepository.size(), 1);
  assert.equal(repositories.standingHistory.get("member-1")?.at(-1)?.standing, "blocked");
  assert.ok(auditRepo.list().some((event) => event.action === "STANDING_CHANGED" && event.correlationId === "corr-standing-change"));
});
