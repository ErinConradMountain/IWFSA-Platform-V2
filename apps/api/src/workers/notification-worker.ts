import type { AuditEventEmitter } from "@iwfsa/common/audit";
import {
  DEFAULT_NOTIFICATION_RETRY_POLICY,
  type NotificationDeliveryResult,
  type NotificationOutboxMessage,
  type NotificationOutboxRepository,
  type NotificationRetryPolicy
} from "@iwfsa/common/outbox";

export type NotificationProvider = {
  send(message: NotificationOutboxMessage): Promise<NotificationDeliveryResult> | NotificationDeliveryResult;
};

export type FakeNotificationProviderMode = "success" | "failure" | "fail_once";

export class FakeNotificationProvider implements NotificationProvider {
  readonly delivered: NotificationOutboxMessage[] = [];
  readonly attempts: string[] = [];
  private readonly options: { mode?: FakeNotificationProviderMode; delayMs?: number };
  private failedOnce = new Set<string>();

  constructor(options: { mode?: FakeNotificationProviderMode; delayMs?: number } = {}) {
    this.options = options;
  }

  async send(message: NotificationOutboxMessage): Promise<NotificationDeliveryResult> {
    this.attempts.push(message.id);
    if (this.options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
    }

    const mode = this.options.mode || "success";
    if (mode === "failure") {
      return { status: "failed", reason: "fake_provider_failure" };
    }
    if (mode === "fail_once" && !this.failedOnce.has(message.id)) {
      this.failedOnce.add(message.id);
      return { status: "failed", reason: "fake_provider_first_failure" };
    }

    this.delivered.push(message);
    return { status: "sent", providerRef: `fake:${message.id}` };
  }
}

export async function processNotificationWorkerBatch(input: {
  repository: NotificationOutboxRepository;
  provider: NotificationProvider;
  audit: AuditEventEmitter;
  now: string;
  limit?: number;
  retryPolicy?: NotificationRetryPolicy;
}): Promise<NotificationOutboxMessage[]> {
  const retryPolicy = input.retryPolicy || DEFAULT_NOTIFICATION_RETRY_POLICY;
  const processed: NotificationOutboxMessage[] = [];

  for (const message of input.repository.listDue(input.now, input.limit)) {
    let result: NotificationDeliveryResult = { status: "failed", reason: "provider_exception" };
    try {
      result = await input.provider.send(message);
    } catch {
      result = { status: "failed", reason: "provider_exception" };
    }

    if (result.status === "sent") {
      const sent = input.repository.markSent(message.id, input.now) || message;
      input.audit.emit({
        action: "notification.outbox_processed",
        actor: "system",
        targetType: "outbox_message",
        targetId: message.id,
        correlationId: message.correlationId,
        metadata: {
          eventType: message.eventType,
          payloadRef: message.payloadRef,
          attempts: sent.attempts,
          result: "sent"
        }
      });
      processed.push(sent);
      continue;
    }

    const failed = input.repository.markFailed(message.id, input.now, retryPolicy) || message;
    input.audit.emit({
      action: "notification.outbox_processed",
      actor: "system",
      targetType: "outbox_message",
      targetId: message.id,
      correlationId: message.correlationId,
      metadata: {
        eventType: message.eventType,
        payloadRef: message.payloadRef,
        attempts: failed.attempts,
        result: failed.status === "failed" ? "dead_letter" : "retry_scheduled"
      }
    });
    processed.push(failed);
  }

  return processed;
}
