import type { AuditEventEmitter } from "@iwfsa/common/audit";

export type NotificationEventType = "birthday" | "rsvp" | "standing_change" | "celebration" | "admin_operational";
export type NotificationOutboxStatus = "pending" | "sent" | "failed" | "cancelled";

export type NotificationOutboxMessage = {
  id: string;
  eventType: NotificationEventType;
  payloadRef: string;
  status: NotificationOutboxStatus;
  attempts: number;
  createdAt: string;
  nextRetryAt: string | null;
  correlationId: string;
};

export type NotificationOutboxRepository = {
  enqueue(message: NotificationOutboxMessage): NotificationOutboxMessage;
  listDue(now: string, limit?: number): NotificationOutboxMessage[];
  markSent(id: string, sentAt: string): NotificationOutboxMessage | null;
  markFailed(id: string, failedAt: string): NotificationOutboxMessage | null;
  cancelByPayloadRef(payloadRef: string, cancelledAt: string): NotificationOutboxMessage[];
  list(): NotificationOutboxMessage[];
};

export type NotificationDeliveryResult = {
  status: "sent" | "failed";
  providerRef?: string;
  reason?: string;
};

export function createNotificationOutboxMessage(input: {
  id: string;
  eventType: NotificationEventType;
  payloadRef: string;
  createdAt: string;
  correlationId: string;
}): NotificationOutboxMessage {
  return {
    id: input.id,
    eventType: input.eventType,
    payloadRef: input.payloadRef,
    status: "pending",
    attempts: 0,
    createdAt: input.createdAt,
    nextRetryAt: input.createdAt,
    correlationId: input.correlationId
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
      return update(id, (message) => ({ ...message, status: "sent", nextRetryAt: null, createdAt: message.createdAt || sentAt }));
    },

    markFailed(id, failedAt) {
      return update(id, (message) => {
        const attempts = message.attempts + 1;
        const retryDelayMs = Math.min(24 * 60 * 60 * 1000, 60 * 1000 * 2 ** Math.max(0, attempts - 1));
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
    }
  };
}

export function processNotificationOutboxBatch(input: {
  repository: NotificationOutboxRepository;
  deliver: (message: NotificationOutboxMessage) => Promise<NotificationDeliveryResult> | NotificationDeliveryResult;
  audit: AuditEventEmitter;
  now: string;
  limit?: number;
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
              payloadRef: message.payloadRef,
              providerRef: result.providerRef || "provider-accepted"
            }
          });
          return sent;
        }
      } catch {
        // Retry handling below intentionally hides provider detail from callers.
      }

      const failed = input.repository.markFailed(message.id, input.now) || message;
      input.audit.emit({
        action: "notification.failed",
        actor: "system",
        targetType: "outbox_message",
        targetId: message.id,
        correlationId: message.correlationId,
        metadata: {
          eventType: message.eventType,
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
        payloadRef: message.payloadRef
      }
    });
  }
  return cancelled;
}
