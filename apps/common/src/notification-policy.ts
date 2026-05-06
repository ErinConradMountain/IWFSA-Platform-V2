import type { ConsentState, Standing } from "@iwfsa/common/session-repository";
import type { NotificationEventType } from "@iwfsa/common/outbox";

export type NotificationChannel = "email" | "in_app" | "sms";
export type NotificationPreferenceMap = Partial<Record<NotificationEventType, Partial<Record<NotificationChannel, boolean>>>>;

export type NotificationPreferences = {
  memberId: string;
  consentScopeYear: number;
  preferences: NotificationPreferenceMap;
  updatedAt: string;
};

export type NotificationPreferenceRepository = {
  save(preferences: NotificationPreferences): NotificationPreferences;
  findByMemberId(memberId: string): NotificationPreferences | null;
};

export type NotificationPolicyInput = {
  eventType: NotificationEventType;
  channel: NotificationChannel;
  consent: ConsentState;
  visibility: "public" | "member_only" | "hidden";
  standing: Standing;
  preferences?: NotificationPreferences | null;
  currentYear: number;
};

export type NotificationPolicyResult = {
  decision: "ALLOW" | "DENY";
  reason: string;
};

const CELEBRATORY_EVENTS = new Set<NotificationEventType>(["birthday", "celebration"]);

export function createInMemoryNotificationPreferenceRepository(): NotificationPreferenceRepository {
  const records = new Map<string, NotificationPreferences>();

  return {
    save(preferences) {
      records.set(preferences.memberId, preferences);
      return preferences;
    },
    findByMemberId(memberId) {
      return records.get(memberId) || null;
    }
  };
}

export function sanitizeNotificationPreferences(input: {
  memberId: string;
  consentScopeYear: number;
  preferences: unknown;
  updatedAt: string;
}): NotificationPreferences {
  const raw = input.preferences && typeof input.preferences === "object" ? input.preferences as Record<string, unknown> : {};
  const next: NotificationPreferenceMap = {};

  for (const eventType of ["birthday", "rsvp", "rsvp.confirmation", "standing_change", "celebration", "admin_operational", "admin_broadcast"] as const) {
    const rawChannels = raw[eventType];
    if (!rawChannels || typeof rawChannels !== "object") {
      continue;
    }
    const channelMap: Partial<Record<NotificationChannel, boolean>> = {};
    for (const channel of ["email", "in_app", "sms"] as const) {
      const value = (rawChannels as Record<string, unknown>)[channel];
      if (typeof value === "boolean") {
        channelMap[channel] = value;
      }
    }
    next[eventType] = channelMap;
  }

  return {
    memberId: input.memberId,
    consentScopeYear: input.consentScopeYear,
    preferences: next,
    updatedAt: input.updatedAt
  };
}

export type BroadcastAudienceCandidate = {
  memberId: string;
  standing: Standing;
  consent: ConsentState;
  visibility: "public" | "member_only" | "hidden";
  preferences?: NotificationPreferences | null;
};

export type BroadcastAudienceResult = {
  included: BroadcastAudienceCandidate[];
  excluded: Array<{ memberId: string; reason: string }>;
};

export function evaluateBroadcastAudience(input: {
  candidates: BroadcastAudienceCandidate[];
  channel: NotificationChannel;
  eventType?: NotificationEventType;
  currentYear: number;
}): BroadcastAudienceResult {
  const eventType = input.eventType || "admin_broadcast";
  const included: BroadcastAudienceCandidate[] = [];
  const excluded: Array<{ memberId: string; reason: string }> = [];

  for (const candidate of input.candidates) {
    if (candidate.standing !== "good") {
      excluded.push({ memberId: candidate.memberId, reason: "STANDING_NOT_ELIGIBLE" });
      continue;
    }
    if (candidate.consent !== "granted") {
      excluded.push({ memberId: candidate.memberId, reason: "CONSENT_REQUIRED" });
      continue;
    }
    if (candidate.visibility === "hidden") {
      excluded.push({ memberId: candidate.memberId, reason: "PRIVATE_VISIBILITY" });
      continue;
    }
    if (!candidate.preferences || candidate.preferences.consentScopeYear !== input.currentYear) {
      excluded.push({ memberId: candidate.memberId, reason: "CONSENT_SCOPE_EXPIRED" });
      continue;
    }
    if (candidate.preferences.preferences[eventType]?.[input.channel] !== true) {
      excluded.push({ memberId: candidate.memberId, reason: "BROADCAST_OPT_IN_REQUIRED" });
      continue;
    }
    included.push(candidate);
  }

  return { included, excluded };
}

export function evaluateNotificationPolicy(input: NotificationPolicyInput): NotificationPolicyResult {
  if (input.standing === "blocked" || input.standing === "review") {
    return { decision: "DENY", reason: "STANDING_NOT_ELIGIBLE" };
  }

  if (input.preferences && input.preferences.consentScopeYear !== input.currentYear) {
    return { decision: "DENY", reason: "CONSENT_SCOPE_EXPIRED" };
  }

  const explicit = input.preferences?.preferences[input.eventType]?.[input.channel];

  if (CELEBRATORY_EVENTS.has(input.eventType)) {
    if (input.consent !== "granted") {
      return { decision: "DENY", reason: "CONSENT_REQUIRED" };
    }
    if (input.visibility === "hidden") {
      return { decision: "DENY", reason: "PRIVATE_VISIBILITY" };
    }
    if (explicit !== true) {
      return { decision: "DENY", reason: "CELEBRATION_OPT_IN_REQUIRED" };
    }
    return { decision: "ALLOW", reason: "CELEBRATION_ALLOWED" };
  }

  if (input.eventType === "rsvp.confirmation" && input.consent !== "granted") {
    return { decision: "DENY", reason: "CONSENT_REQUIRED" };
  }

  if (explicit === false) {
    return { decision: "DENY", reason: "MEMBER_OPTED_OUT" };
  }

  return { decision: "ALLOW", reason: "OPERATIONAL_ALLOWED" };
}
