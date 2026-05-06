import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function mustContain(file, markers) {
  const text = readFileSync(resolve(root, file), "utf8");
  for (const marker of markers) {
    if (!text.includes(marker)) {
      throw new Error(`${file} is missing Phase 9 marker: ${marker}`);
    }
  }
}

mustContain("PHASE-9-SIGNOFF.md", ["Status: Accepted and closed", "P9-WORKER-001", "rsvp.notification_enqueued"]);
mustContain("apps/common/src/notification-policy.ts", ["evaluateNotificationPolicy", "evaluateBroadcastAudience", "sanitizeNotificationPreferences"]);
mustContain("apps/common/src/outbox.ts", ["createNotificationOutboxMessage", "processNotificationOutboxBatch", "cancelPendingNotifications", "invalid notification channel"]);
mustContain("apps/common/src/providers/notification-provider.ts", ["EmailProvider", "SMSProvider", "createNotificationProviderFactory"]);
mustContain("apps/api/src/workers/notification-worker.ts", ["notification.provider_sent", "notification.outbox_processed", "dead_letter"]);
mustContain("apps/api/src/server.ts", ["/api/member/notification-preferences", "/api/admin/notifications/broadcast/preview", "rsvp.notification_skipped"]);
mustContain("docs/notifications/consent-aware-delivery.md", ["Outbox first", "RSVP Producer", "Provider Boundary"]);
mustContain("test-strategy.md", ["P9-NOTIFICATION-POLICY-001", "P9-BROADCAST-001"]);

process.stdout.write("Phase 9 notifications and celebrations check passed\n");
