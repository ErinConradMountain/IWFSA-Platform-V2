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

  for (const eventType of ["birthday", "rsvp", "standing_change", "celebration", "admin_operational"] as const) {
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

  if (explicit === false) {
    return { decision: "DENY", reason: "MEMBER_OPTED_OUT" };
  }

  return { decision: "ALLOW", reason: "OPERATIONAL_ALLOWED" };
}
