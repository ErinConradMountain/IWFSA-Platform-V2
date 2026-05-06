import type { NotificationChannel } from "@iwfsa/common/notification-policy";
import type { NotificationDeliveryResult, NotificationOutboxMessage } from "@iwfsa/common/outbox";

export type NotificationProviderPayload = {
  message: NotificationOutboxMessage;
  channel: NotificationChannel;
};

export type NotificationProviderDeliveryStatus = "accepted" | "unknown";

export type NotificationProviderStatusResult = {
  status: NotificationProviderDeliveryStatus;
  providerRef?: string;
};

export type NotificationProvider = {
  readonly channel: NotificationChannel;
  send(payload: NotificationProviderPayload): Promise<NotificationDeliveryResult> | NotificationDeliveryResult;
  validateChannel(channel: NotificationChannel): boolean;
  getDeliveryStatus(messageId: string): Promise<NotificationProviderStatusResult> | NotificationProviderStatusResult;
};

export type NotificationProviderFactory = (input: {
  channel: NotificationChannel;
  message: NotificationOutboxMessage;
}) => NotificationProvider;

export type FakeNotificationProviderMode = "success" | "failure" | "fail_once";

export class FakeNotificationProvider implements NotificationProvider {
  readonly channel: NotificationChannel;
  readonly delivered: NotificationOutboxMessage[] = [];
  readonly attempts: string[] = [];
  private readonly options: { mode?: FakeNotificationProviderMode; delayMs?: number; channel?: NotificationChannel };
  private readonly deliveryRefs = new Map<string, string>();
  private failedOnce = new Set<string>();

  constructor(options: { mode?: FakeNotificationProviderMode; delayMs?: number; channel?: NotificationChannel } = {}) {
    this.options = options;
    this.channel = options.channel || "email";
  }

  validateChannel(channel: NotificationChannel): boolean {
    return channel === this.channel;
  }

  getDeliveryStatus(messageId: string): NotificationProviderStatusResult {
    const providerRef = this.deliveryRefs.get(messageId);
    if (!providerRef) {
      return { status: "unknown" };
    }

    return {
      status: "accepted",
      providerRef
    };
  }

  async send(payload: NotificationProviderPayload): Promise<NotificationDeliveryResult> {
    this.attempts.push(payload.message.id);
    if (this.options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
    }

    if (!this.validateChannel(payload.channel)) {
      return { status: "failed", reason: "provider_channel_mismatch" };
    }

    const mode = this.options.mode || "success";
    if (mode === "failure") {
      return { status: "failed", reason: "fake_provider_failure" };
    }
    if (mode === "fail_once" && !this.failedOnce.has(payload.message.id)) {
      this.failedOnce.add(payload.message.id);
      return { status: "failed", reason: "fake_provider_first_failure" };
    }

    const existingRef = this.deliveryRefs.get(payload.message.id);
    if (existingRef) {
      return { status: "sent", providerRef: existingRef };
    }

    this.delivered.push(payload.message);
    const providerRef = `fake:${this.channel}:${payload.message.id}`;
    this.deliveryRefs.set(payload.message.id, providerRef);
    return { status: "sent", providerRef };
  }
}

export class EmailProvider implements NotificationProvider {
  readonly channel = "email" as const;
  readonly sent: string[] = [];

  validateChannel(channel: NotificationChannel): boolean {
    return channel === this.channel;
  }

  getDeliveryStatus(messageId: string): NotificationProviderStatusResult {
    const providerRef = this.sent.find((entry) => entry.endsWith(`:${messageId}`));
    return providerRef ? { status: "accepted", providerRef } : { status: "unknown" };
  }

  send(payload: NotificationProviderPayload): NotificationDeliveryResult {
    if (!this.validateChannel(payload.channel)) {
      return { status: "failed", reason: "provider_channel_mismatch" };
    }

    const providerRef = `email:${payload.message.id}`;
    if (!this.sent.includes(providerRef)) {
      this.sent.push(providerRef);
    }
    return { status: "sent", providerRef };
  }
}

export class SMSProvider implements NotificationProvider {
  readonly channel = "sms" as const;
  readonly sent: string[] = [];

  validateChannel(channel: NotificationChannel): boolean {
    return channel === this.channel;
  }

  getDeliveryStatus(messageId: string): NotificationProviderStatusResult {
    const providerRef = this.sent.find((entry) => entry.endsWith(`:${messageId}`));
    return providerRef ? { status: "accepted", providerRef } : { status: "unknown" };
  }

  send(payload: NotificationProviderPayload): NotificationDeliveryResult {
    if (!this.validateChannel(payload.channel)) {
      return { status: "failed", reason: "provider_channel_mismatch" };
    }

    const providerRef = `sms:${payload.message.id}`;
    if (!this.sent.includes(providerRef)) {
      this.sent.push(providerRef);
    }
    return { status: "sent", providerRef };
  }
}

export function createNotificationProviderFactory(providers: Partial<Record<NotificationChannel, NotificationProvider>>): NotificationProviderFactory {
  return ({ channel }) => {
    const provider = providers[channel];
    if (!provider) {
      throw new Error(`missing notification provider for channel: ${channel}`);
    }
    return provider;
  };
}