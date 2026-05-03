import crypto from "node:crypto";

export type AuditAction =
  | "SESSION_CREATED"
  | "SESSION_ROTATED"
  | "POLICY_DENY"
  | "CSRF_BLOCKED"
  | "PROFILE_VISIBILITY_CHANGED"
  | "IMPORT_COMMITTED"
  | "STANDING_CHANGED"
  | "PUBLIC_PROFILE_APPROVED"
  | "IMPORT_PREVIEWED"
  | "IMPORT_RESOLVED"
  | "IMPORT_FAILED"
  | "MEMBER_ONBOARDED"
  | "CONSENT_VISIBILITY_CHANGED"
  | "STANDING_VISIBILITY_CHANGED"
  | "STANDING_DENIED"
  | "EVENT_STATE_CHANGED"
  | "RSVP_REGISTERED"
  | "WAITLIST_JOINED"
  | "WAITLIST_PROMOTED"
  | "EVENT_ACCESS_DENIED"
  | "DOCUMENT_ACCESS_GRANTED"
  | "DOCUMENT_ACCESS_DENIED"
  | "MEMBERSHIP_CYCLE_OPENED"
  | "MEMBERSHIP_CYCLE_CLOSED"
  | "MEMBERSHIP_GRACE_STARTED"
  | "FEE_RECORDED"
  | "FEE_PAYMENT_APPLIED"
  | "FEE_WAIVED"
  | "FEE_BALANCE_ADJUSTED"
  | "STANDING_REVIEW"
  | "STANDING_CHANGED";

export type AuditEvent = {
  action: AuditAction;
  actor: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  correlationId: string;
  redactedMetadata: Record<string, unknown>;
  metadataHash: string;
};

export type AuditRepository = {
  emit(event: AuditEvent): void;
  list(): AuditEvent[];
};

export type AuditEventEmitter = {
  emit(input: {
    action: AuditAction;
    actor: string;
    targetType: string;
    targetId: string;
    correlationId: string;
    metadata?: Record<string, unknown>;
  }): AuditEvent;
};

const SENSITIVE_METADATA_KEY = /(email|phone|mobile|token|secret|password|cookie|session|id_number|name)/i;

export function redactAuditMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (SENSITIVE_METADATA_KEY.test(key)) {
        return [key, "[REDACTED]"];
      }

      if (Array.isArray(value)) {
        return [key, value.map((entry) => (typeof entry === "object" && entry ? redactAuditMetadata(entry as Record<string, unknown>) : entry))];
      }

      if (value && typeof value === "object") {
        return [key, redactAuditMetadata(value as Record<string, unknown>)];
      }

      return [key, value];
    })
  );
}

export function hashAuditMetadata(metadata: Record<string, unknown>): string {
  return crypto.createHash("sha256").update(JSON.stringify(metadata)).digest("base64url");
}

export function createInMemoryAuditRepository(now: () => number = () => Date.now()): AuditRepository {
  const events: AuditEvent[] = [];

  return {
    emit(event) {
      events.push({
        ...event,
        timestamp: event.timestamp || new Date(now()).toISOString()
      });
    },
    list() {
      return [...events];
    }
  };
}

export function buildAuditEvent(input: Omit<AuditEvent, "timestamp" | "redactedMetadata" | "metadataHash"> & { timestamp?: string; metadata?: Record<string, unknown> }): AuditEvent {
  const redactedMetadata = redactAuditMetadata(input.metadata || {});

  return {
    action: input.action,
    actor: input.actor || "anonymous",
    targetType: input.targetType,
    targetId: input.targetId || "none",
    correlationId: input.correlationId,
    timestamp: input.timestamp || new Date().toISOString(),
    redactedMetadata,
    metadataHash: hashAuditMetadata(redactedMetadata)
  };
}

export function createAuditEventEmitter(repository: AuditRepository): AuditEventEmitter {
  return {
    emit(input) {
      const event = buildAuditEvent(input);
      repository.emit(event);
      return event;
    }
  };
}
