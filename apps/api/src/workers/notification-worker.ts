import type { AuditEventEmitter } from "@iwfsa/common/audit";
import type { NotificationChannel } from "@iwfsa/common/notification-policy";
import {
  FakeNotificationProvider,
  type FakeNotificationProviderMode,
  type NotificationProvider,
  type NotificationProviderFactory
} from "@iwfsa/common/notification-provider";
import {
  DEFAULT_NOTIFICATION_RETRY_POLICY,
  type NotificationDeliveryResult,
  type NotificationOutboxMessage,
  type NotificationOutboxRepository,
  type NotificationRetryPolicy
} from "@iwfsa/common/outbox";

export async function processNotificationWorkerBatch(input: {
  repository: NotificationOutboxRepository;
  provider?: NotificationProvider;
  providerFactory?: NotificationProviderFactory;
  audit: AuditEventEmitter;
  now: string;
  limit?: number;
  retryPolicy?: NotificationRetryPolicy;
}): Promise<NotificationOutboxMessage[]> {
  const retryPolicy = input.retryPolicy || DEFAULT_NOTIFICATION_RETRY_POLICY;
  const processed: NotificationOutboxMessage[] = [];

  for (const message of input.repository.listDue(input.now, input.limit)) {
    const channel = message.channel;
    const provider = input.providerFactory
      ? input.providerFactory({ channel, message })
      : input.provider;

    if (!provider) {
      throw new Error("notification worker requires provider or providerFactory");
    }

    let result: NotificationDeliveryResult = { status: "failed", reason: "provider_exception" };

    if (!provider.validateChannel(channel)) {
      result = { status: "failed", reason: "provider_channel_mismatch" };
    } else {
      try {
        result = await provider.send({ message, channel });
      } catch {
        result = { status: "failed", reason: "provider_exception" };
      }
    }

    if (result.status === "sent") {
      const sent = input.repository.markSent(message.id, input.now) || message;
      input.audit.emit({
        action: "notification.provider_sent",
        actor: "system",
        targetType: "outbox_message",
        targetId: message.id,
        correlationId: message.correlationId,
        metadata: {
          eventType: message.eventType,
          channel,
          payloadRef: message.payloadRef,
          providerRef: result.providerRef || "provider-accepted"
        }
      });
      input.audit.emit({
        action: "notification.outbox_processed",
        actor: "system",
        targetType: "outbox_message",
        targetId: message.id,
        correlationId: message.correlationId,
        metadata: {
          eventType: message.eventType,
          channel,
          payloadRef: message.payloadRef,
          attempts: sent.attempts,
          providerRef: result.providerRef || "provider-accepted",
          result: "sent"
        }
      });
      processed.push(sent);
      continue;
    }

    const failed = input.repository.markFailed(message.id, input.now, retryPolicy) || message;
    input.audit.emit({
      action: "notification.provider_failed",
      actor: "system",
      targetType: "outbox_message",
      targetId: message.id,
      correlationId: message.correlationId,
      metadata: {
        eventType: message.eventType,
        channel,
        payloadRef: message.payloadRef,
        reason: result.reason || "provider_exception"
      }
    });
    input.audit.emit({
      action: "notification.outbox_processed",
      actor: "system",
      targetType: "outbox_message",
      targetId: message.id,
      correlationId: message.correlationId,
      metadata: {
        eventType: message.eventType,
        channel,
        payloadRef: message.payloadRef,
        attempts: failed.attempts,
        result: failed.status === "failed" ? "dead_letter" : "retry_scheduled"
      }
    });
    processed.push(failed);
  }

  return processed;
}

export { FakeNotificationProvider, type FakeNotificationProviderMode };
