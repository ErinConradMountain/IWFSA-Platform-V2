import crypto from "node:crypto";

import type { AuditEventEmitter } from "@iwfsa/common/audit";
import type { Role } from "@iwfsa/common/auth";
import type { ConsentState, Standing } from "@iwfsa/common/session-repository";

export type EventStatus = "draft" | "published" | "closed" | "archived";
export type RsvpState = "registered" | "waitlisted" | "cancelled";

export type EventAudienceRules = {
  mode: "all" | "standing_active" | "groups" | "roles";
  groups?: string[];
  roles?: Role[];
};

export type EventRecord = {
  id: string;
  title: string;
  status: EventStatus;
  maxCapacity: number;
  registeredCount: number;
  waitlistCount: number;
  audience: EventAudienceRules;
  version: number;
};

export type RsvpRecord = {
  eventId: string;
  memberId: string;
  state: RsvpState;
  waitlistPosition: number | null;
  createdAt: string;
};

export type EventParticipant = {
  memberId: string;
  role: Role;
  standing: Exclude<Standing, "anonymous">;
  consent: ConsentState;
  groups: string[];
};

export type EventRepositories = {
  events: Map<string, EventRecord>;
  rsvps: Map<string, RsvpRecord>;
  outbox: Array<{ id: string; eventType: string; payloadRef: string; state: "pending"; createdAt: string }>;
};

export function createEventRepositories(): EventRepositories {
  return { events: new Map(), rsvps: new Map(), outbox: [] };
}

function rsvpKey(eventId: string, memberId: string): string {
  return `${eventId}:${memberId}`;
}

export function transitionEventStatus(event: EventRecord, nextStatus: EventStatus, actorId: string, audit: AuditEventEmitter, correlationId: string): EventRecord {
  const allowed: Record<EventStatus, EventStatus[]> = {
    draft: ["published", "archived"],
    published: ["closed", "archived"],
    closed: ["archived"],
    archived: []
  };

  if (!allowed[event.status].includes(nextStatus)) {
    throw new Error("invalid_event_state_transition");
  }

  const updated = { ...event, status: nextStatus, version: event.version + 1 };
  audit.emit({ action: "EVENT_STATE_CHANGED", actor: actorId, targetType: "event", targetId: event.id, correlationId, metadata: { previousState: event.status, newState: nextStatus } });
  return updated;
}

export function isEligibleForEvent(event: EventRecord, participant: EventParticipant): boolean {
  if (participant.standing === "blocked" || participant.consent !== "granted") {
    return false;
  }

  if (event.audience.mode === "all") {
    return true;
  }

  if (event.audience.mode === "standing_active") {
    return participant.standing === "active" || participant.standing === "good";
  }

  if (event.audience.mode === "roles") {
    return Boolean(event.audience.roles?.includes(participant.role));
  }

  return Boolean(event.audience.groups?.some((group) => participant.groups.includes(group)));
}

export function rsvpToEvent(repositories: EventRepositories, eventId: string, participant: EventParticipant, audit: AuditEventEmitter, correlationId: string): RsvpRecord {
  const event = repositories.events.get(eventId);

  if (!event || event.status !== "published" || !isEligibleForEvent(event, participant)) {
    audit.emit({ action: "EVENT_ACCESS_DENIED", actor: participant.memberId, targetType: "event", targetId: eventId, correlationId, metadata: { reason: event ? "not_eligible_or_closed" : "event_missing" } });
    throw new Error("event_access_denied");
  }

  const key = rsvpKey(eventId, participant.memberId);
  const existing = repositories.rsvps.get(key);
  if (existing && existing.state !== "cancelled") {
    return existing;
  }

  const registered = [...repositories.rsvps.values()].filter((rsvp) => rsvp.eventId === eventId && rsvp.state === "registered").length;
  const waitlisted = [...repositories.rsvps.values()].filter((rsvp) => rsvp.eventId === eventId && rsvp.state === "waitlisted").length;
  const state: RsvpState = participant.standing === "review" || registered >= event.maxCapacity ? "waitlisted" : "registered";
  const record: RsvpRecord = {
    eventId,
    memberId: participant.memberId,
    state,
    waitlistPosition: state === "waitlisted" ? waitlisted + 1 : null,
    createdAt: new Date().toISOString()
  };

  repositories.rsvps.set(key, record);
  repositories.events.set(eventId, { ...event, registeredCount: registered + (state === "registered" ? 1 : 0), waitlistCount: waitlisted + (state === "waitlisted" ? 1 : 0), version: event.version + 1 });
  audit.emit({ action: state === "registered" ? "RSVP_REGISTERED" : "WAITLIST_JOINED", actor: participant.memberId, targetType: "event", targetId: eventId, correlationId, metadata: { state } });
  return record;
}

export function cancelRsvpAndPromote(repositories: EventRepositories, eventId: string, memberId: string, audit: AuditEventEmitter, correlationId: string): RsvpRecord | null {
  const key = rsvpKey(eventId, memberId);
  const existing = repositories.rsvps.get(key);
  const event = repositories.events.get(eventId);

  if (!existing || existing.state !== "registered" || !event) {
    return null;
  }

  repositories.rsvps.set(key, { ...existing, state: "cancelled" });
  const next = [...repositories.rsvps.values()]
    .filter((rsvp) => rsvp.eventId === eventId && rsvp.state === "waitlisted")
    .sort((a, b) => Number(a.waitlistPosition) - Number(b.waitlistPosition))[0];

  if (!next) {
    repositories.events.set(eventId, { ...event, registeredCount: Math.max(0, event.registeredCount - 1), version: event.version + 1 });
    return null;
  }

  const promoted = { ...next, state: "registered" as const, waitlistPosition: null };
  repositories.rsvps.set(rsvpKey(eventId, next.memberId), promoted);
  repositories.outbox.push({ id: `waitlist_${eventId}_${next.memberId}`, eventType: "waitlist_promoted", payloadRef: `${eventId}:${next.memberId}`, state: "pending", createdAt: new Date().toISOString() });
  audit.emit({ action: "WAITLIST_PROMOTED", actor: "system", targetType: "event", targetId: eventId, correlationId, metadata: { memberId: next.memberId } });
  return promoted;
}

export type DocumentAccessToken = {
  tokenHash: string;
  eventId: string;
  memberId: string;
  expiresAt: string;
  usedAt: string | null;
};

export function issueDocumentAccess(event: EventRecord, participant: EventParticipant, audit: AuditEventEmitter, correlationId: string): { rawToken: string; record: DocumentAccessToken } {
  if (!isEligibleForEvent(event, participant)) {
    audit.emit({ action: "DOCUMENT_ACCESS_DENIED", actor: participant.memberId, targetType: "event_document", targetId: event.id, correlationId, metadata: { reason: "not_eligible" } });
    throw new Error("document_access_denied");
  }

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("base64url");
  const record = { tokenHash, eventId: event.id, memberId: participant.memberId, expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), usedAt: null };
  audit.emit({ action: "DOCUMENT_ACCESS_GRANTED", actor: participant.memberId, targetType: "event_document", targetId: event.id, correlationId, metadata: { expiresAt: record.expiresAt } });
  return { rawToken, record };
}

export function consumeDocumentAccess(record: DocumentAccessToken, rawToken: string, now = Date.now()): DocumentAccessToken | null {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("base64url");
  if (record.usedAt || record.tokenHash !== tokenHash || Date.parse(record.expiresAt) <= now) {
    return null;
  }
  return { ...record, usedAt: new Date(now).toISOString() };
}
