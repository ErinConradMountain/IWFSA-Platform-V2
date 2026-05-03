import type { AuditEventEmitter } from "@iwfsa/common/audit";
import type { SessionRepository, Standing } from "@iwfsa/common/session-repository";

export type MembershipYearStatus = "open" | "closed";
export type FeeType = "dues" | "waiver" | "event_fee";
export type FeeStatus = "pending" | "partial" | "paid" | "waived";
export type StandingReason = "cycle_open" | "fees_paid" | "partial_payment" | "grace_period" | "overdue" | "manual_block" | "no_active_cycle";

export type MembershipYear = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  gracePeriodDays: number;
  status: MembershipYearStatus;
};

export type FeeRecord = {
  id: string;
  memberId: string;
  membershipYearId: string;
  type: FeeType;
  amountCents: number;
  amountPaidCents: number;
  status: FeeStatus;
  transactionRef: string | null;
  waiverReason: string | null;
  recordedAt: string;
};

export type StandingHistoryRecord = {
  memberId: string;
  standing: Exclude<Standing, "anonymous">;
  reason: StandingReason;
  effectiveFrom: string;
  actorId: string;
};

export type StandingRepositories = {
  membershipYears: Map<string, MembershipYear>;
  feeRecords: Map<string, FeeRecord>;
  standingHistory: Map<string, StandingHistoryRecord[]>;
};

export function createStandingRepositories(): StandingRepositories {
  return {
    membershipYears: new Map(),
    feeRecords: new Map(),
    standingHistory: new Map()
  };
}

export function openMembershipYear(repositories: StandingRepositories, year: MembershipYear, actorId: string, audit: AuditEventEmitter, correlationId: string): MembershipYear {
  const overlaps = [...repositories.membershipYears.values()].some((existing) => existing.status === "open" && existing.startDate <= year.endDate && year.startDate <= existing.endDate);
  if (overlaps) {
    throw new Error("membership_year_overlap");
  }

  repositories.membershipYears.set(year.id, { ...year, status: "open" });
  audit.emit({ action: "MEMBERSHIP_CYCLE_OPENED", actor: actorId, targetType: "membership_year", targetId: year.id, correlationId, metadata: { label: year.label } });
  audit.emit({ action: "STANDING_REVIEW", actor: "system", targetType: "membership_year", targetId: year.id, correlationId, metadata: { reason: "cycle_open" } });
  return repositories.membershipYears.get(year.id)!;
}

export function closeMembershipYear(repositories: StandingRepositories, yearId: string, actorId: string, audit: AuditEventEmitter, correlationId: string): MembershipYear {
  const year = repositories.membershipYears.get(yearId);
  if (!year) {
    throw new Error("membership_year_missing");
  }

  const closed = { ...year, status: "closed" as const };
  repositories.membershipYears.set(yearId, closed);
  audit.emit({ action: "MEMBERSHIP_CYCLE_CLOSED", actor: actorId, targetType: "membership_year", targetId: yearId, correlationId, metadata: { label: year.label } });
  return closed;
}

export function recordFee(repositories: StandingRepositories, fee: Omit<FeeRecord, "amountPaidCents" | "status" | "waiverReason">, actorId: string, audit: AuditEventEmitter, correlationId: string): FeeRecord {
  const record: FeeRecord = { ...fee, amountPaidCents: 0, status: "pending", waiverReason: null };
  repositories.feeRecords.set(record.id, record);
  audit.emit({ action: "FEE_RECORDED", actor: actorId, targetType: "fee_record", targetId: record.id, correlationId, metadata: { type: record.type, amountCents: record.amountCents } });
  return record;
}

export function applyPayment(repositories: StandingRepositories, feeId: string, amountCents: number, transactionRef: string, actorId: string, audit: AuditEventEmitter, correlationId: string): FeeRecord {
  const fee = repositories.feeRecords.get(feeId);
  if (!fee || fee.status === "waived") {
    throw new Error("fee_not_payable");
  }

  const amountPaidCents = fee.amountPaidCents + amountCents;
  const status: FeeStatus = amountPaidCents >= fee.amountCents ? "paid" : "partial";
  const updated = { ...fee, amountPaidCents, status, transactionRef };
  repositories.feeRecords.set(feeId, updated);
  audit.emit({ action: "FEE_PAYMENT_APPLIED", actor: actorId, targetType: "fee_record", targetId: feeId, correlationId, metadata: { amountCents, status } });
  return updated;
}

export function waiveFee(repositories: StandingRepositories, feeId: string, reason: string, actorId: string, audit: AuditEventEmitter, correlationId: string): FeeRecord {
  if (!reason.trim()) {
    throw new Error("waiver_reason_required");
  }

  const fee = repositories.feeRecords.get(feeId);
  if (!fee) {
    throw new Error("fee_missing");
  }

  const waived = { ...fee, status: "waived" as const, waiverReason: reason, amountPaidCents: fee.amountCents };
  repositories.feeRecords.set(feeId, waived);
  audit.emit({ action: "FEE_WAIVED", actor: actorId, targetType: "fee_record", targetId: feeId, correlationId, metadata: { reason } });
  return waived;
}

export function evaluateStanding(input: { year: MembershipYear | null; fees: FeeRecord[]; manualBlock?: boolean; now?: string }): { standing: Exclude<Standing, "anonymous">; reason: StandingReason; balanceDueCents: number } {
  if (input.manualBlock) {
    return { standing: "blocked", reason: "manual_block", balanceDueCents: balanceDue(input.fees) };
  }

  if (!input.year || input.year.status !== "open") {
    return { standing: "blocked", reason: "no_active_cycle", balanceDueCents: balanceDue(input.fees) };
  }

  const balanceDueCents = balanceDue(input.fees);
  if (balanceDueCents <= 0) {
    return { standing: "good", reason: "fees_paid", balanceDueCents: 0 };
  }

  const now = Date.parse(input.now || new Date().toISOString());
  const graceEnd = Date.parse(input.year.endDate) + input.year.gracePeriodDays * 24 * 60 * 60 * 1000;
  if (input.fees.some((fee) => fee.status === "partial")) {
    return { standing: "review", reason: "partial_payment", balanceDueCents };
  }

  if (now <= graceEnd) {
    return { standing: "review", reason: "grace_period", balanceDueCents };
  }

  return { standing: "blocked", reason: "overdue", balanceDueCents };
}

export function applyStandingChange(input: {
  repositories: StandingRepositories;
  sessionRepository?: SessionRepository;
  memberId: string;
  previousStanding: Exclude<Standing, "anonymous"> | null;
  nextStanding: Exclude<Standing, "anonymous">;
  reason: StandingReason;
  actorId: string;
  audit: AuditEventEmitter;
  correlationId: string;
  effectiveFrom: string;
}): StandingHistoryRecord {
  const record: StandingHistoryRecord = {
    memberId: input.memberId,
    standing: input.nextStanding,
    reason: input.reason,
    effectiveFrom: input.effectiveFrom,
    actorId: input.actorId
  };
  const history = input.repositories.standingHistory.get(input.memberId) || [];
  history.push(record);
  input.repositories.standingHistory.set(input.memberId, history);

  const rotatedSessions = input.sessionRepository?.rotateSessionsForSubject(input.memberId, "standing_change", { standing: input.nextStanding, subject: input.memberId }) || [];
  input.audit.emit({
    action: "STANDING_CHANGED",
    actor: input.actorId,
    targetType: "membership_status",
    targetId: input.memberId,
    correlationId: input.correlationId,
    metadata: { previous: input.previousStanding || "none", next: input.nextStanding, reason: input.reason, rotatedSessionCount: rotatedSessions.length }
  });
  return record;
}

function balanceDue(fees: FeeRecord[]): number {
  return fees.reduce((total, fee) => {
    if (fee.status === "waived") {
      return total;
    }
    return total + Math.max(0, fee.amountCents - fee.amountPaidCents);
  }, 0);
}
