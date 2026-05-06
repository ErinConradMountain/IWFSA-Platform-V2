import type { AuditEventEmitter } from "@iwfsa/common/audit";
import type { NotificationChannel } from "@iwfsa/common/notification-policy";

export type NotificationEventType = "birthday" | "rsvp" | "rsvp.confirmation" | "standing_change" | "celebration" | "admin_operational" | "admin_broadcast";
export type NotificationOutboxStatus = "pending" | "sent" | "failed" | "cancelled";
const VALID_NOTIFICATION_CHANNELS = new Set<NotificationChannel>(["email", "in_app", "sms"]);

export type NotificationOutboxMessage = {
  id: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  payloadRef: string;
  status: NotificationOutboxStatus;
  attempts: number;
  createdAt: string;
  nextRetryAt: string | null;
  correlationId: string;
  parentId?: string | null;
};

export type NotificationOutboxRepository = {
  enqueue(message: NotificationOutboxMessage): NotificationOutboxMessage;
  listDue(now: string, limit?: number): NotificationOutboxMessage[];
  markSent(id: string, sentAt: string): NotificationOutboxMessage | null;
  markFailed(id: string, failedAt: string, retryPolicy?: NotificationRetryPolicy): NotificationOutboxMessage | null;
  cancelByPayloadRef(payloadRef: string, cancelledAt: string): NotificationOutboxMessage[];
  list(): NotificationOutboxMessage[];
  get(id: string): NotificationOutboxMessage | null;
};

export type NotificationRetryPolicy = {
  baseDelayMs: number;
  maxDelayMs: number;
  maxAttempts: number;
};

export type NotificationDeliveryResult = {
  status: "sent" | "failed";
  providerRef?: string;
  reason?: string;
};

export const DEFAULT_NOTIFICATION_RETRY_POLICY: NotificationRetryPolicy = {
  baseDelayMs: 30 * 1000,
  maxDelayMs: 15 * 60 * 1000,
  maxAttempts: 5
};

export function createNotificationOutboxMessage(input: {
  id: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  payloadRef: string;
  createdAt: string;
  correlationId: string;
  parentId?: string | null;
}): NotificationOutboxMessage {
  if (!VALID_NOTIFICATION_CHANNELS.has(input.channel)) {
    throw new Error(`invalid notification channel: ${input.channel}`);
  }

  return {
    id: input.id,
    eventType: input.eventType,
    channel: input.channel,
    payloadRef: input.payloadRef,
    status: "pending",
    attempts: 0,
    createdAt: input.createdAt,
    nextRetryAt: input.createdAt,
    correlationId: input.correlationId,
    parentId: input.parentId || null
  };
}

export function createInMemoryNotificationOutboxRepository(): NotificationOutboxRepository {
  const messages = new Map<string, NotificationOutboxMessage>();

  function update(id: string, updater: (message: NotificationOutboxMessage) => NotificationOutboxMessage): NotificationOutboxMessage | null {
    const existing = messages.get(id);
    if (!existing) {
      return null;
    }
    const next = updater(existing);
    messages.set(id, next);
    return next;
  }

  return {
    enqueue(message) {
      const existing = messages.get(message.id);
      if (existing) {
        return existing;
      }
      messages.set(message.id, message);
      return message;
    },

    listDue(now, limit = 25) {
      const nowMs = Date.parse(now);
      return [...messages.values()]
        .filter((message) => message.status === "pending" && (!message.nextRetryAt || Date.parse(message.nextRetryAt) <= nowMs))
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
        .slice(0, limit);
    },

    markSent(id, sentAt) {
      return update(id, (message) => ({ ...message, status: "sent", attempts: message.attempts + 1, nextRetryAt: null, createdAt: message.createdAt || sentAt }));
    },

    markFailed(id, failedAt, retryPolicy = DEFAULT_NOTIFICATION_RETRY_POLICY) {
      return update(id, (message) => {
        const attempts = message.attempts + 1;
        if (attempts >= retryPolicy.maxAttempts) {
          return {
            ...message,
            status: "failed",
            attempts,
            nextRetryAt: null
          };
        }

        const retryDelayMs = Math.min(retryPolicy.maxDelayMs, retryPolicy.baseDelayMs * 2 ** Math.max(0, attempts - 1));
        return {
          ...message,
          status: "pending",
          attempts,
          nextRetryAt: new Date(Date.parse(failedAt) + retryDelayMs).toISOString()
        };
      });
    },

    cancelByPayloadRef(payloadRef, cancelledAt) {
      const cancelled: NotificationOutboxMessage[] = [];
      for (const message of messages.values()) {
        if (message.payloadRef === payloadRef && message.status === "pending") {
          const next = { ...message, status: "cancelled" as const, nextRetryAt: null, createdAt: message.createdAt || cancelledAt };
          messages.set(next.id, next);
          cancelled.push(next);
        }
      }
      return cancelled;
    },

    list() {
      return [...messages.values()];
    },

    get(id) {
      return messages.get(id) || null;
    }
  };
}

export function processNotificationOutboxBatch(input: {
  repository: NotificationOutboxRepository;
  deliver: (message: NotificationOutboxMessage) => Promise<NotificationDeliveryResult> | NotificationDeliveryResult;
  audit: AuditEventEmitter;
  now: string;
  limit?: number;
  retryPolicy?: NotificationRetryPolicy;
}): Promise<NotificationOutboxMessage[]> {
  return Promise.all(
    input.repository.listDue(input.now, input.limit).map(async (message) => {
      try {
        const result = await input.deliver(message);
        if (result.status === "sent") {
          const sent = input.repository.markSent(message.id, input.now) || message;
          input.audit.emit({
            action: "notification.sent",
            actor: "system",
            targetType: "outbox_message",
            targetId: message.id,
            correlationId: message.correlationId,
            metadata: {
              eventType: message.eventType,
              channel: message.channel,
              payloadRef: message.payloadRef,
              providerRef: result.providerRef || "provider-accepted"
            }
          });
          return sent;
        }
      } catch {
        // Retry handling below intentionally hides provider detail from callers.
      }

      const failed = input.repository.markFailed(message.id, input.now, input.retryPolicy) || message;
      input.audit.emit({
        action: "notification.failed",
        actor: "system",
        targetType: "outbox_message",
        targetId: message.id,
        correlationId: message.correlationId,
        metadata: {
          eventType: message.eventType,
          channel: message.channel,
          payloadRef: message.payloadRef,
          attempts: failed.attempts
        }
      });
      return failed;
    })
  );
}

export function cancelPendingNotifications(input: {
  repository: NotificationOutboxRepository;
  audit: AuditEventEmitter;
  payloadRef: string;
  cancelledAt: string;
  correlationId: string;
}): NotificationOutboxMessage[] {
  const cancelled = input.repository.cancelByPayloadRef(input.payloadRef, input.cancelledAt);
  for (const message of cancelled) {
    input.audit.emit({
      action: "notification.cancelled",
      actor: "system",
      targetType: "outbox_message",
      targetId: message.id,
      correlationId: input.correlationId,
      metadata: {
        eventType: message.eventType,
        channel: message.channel,
        payloadRef: message.payloadRef
      }
    });
  }
  return cancelled;
}
