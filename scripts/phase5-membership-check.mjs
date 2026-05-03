import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function mustContain(file, markers) {
  const text = readFileSync(resolve(root, file), "utf8");
  for (const marker of markers) {
    if (!text.includes(marker)) {
      throw new Error(`${file} is missing Phase 5 marker: ${marker}`);
    }
  }
}

mustContain("apps/common/src/import-pipeline.ts", ["previewImport", "commitImport", "idempotencyKey", "IMPORT_PREVIEWED", "IMPORT_COMMITTED"]);
mustContain("apps/common/src/activation.ts", ["issueActivationToken", "consumeActivationToken", "SHA-256", "GENERIC_AUTH_RESPONSE"]);
mustContain("apps/common/src/consent.ts", ["transitionProfileVisibility", "previewPublicProfile", "CONSENT_VISIBILITY_CHANGED"]);
mustContain("apps/api/src/server.ts", ["/api/admin/import/preview", "/api/admin/import/commit", "/api/auth/activation-token", "STANDING_DENIED"]);
mustContain("apps/api/migrations/0001_phase4_foundation.sql", ["import_batch_row", "outbox_message"]);
mustContain("docs/import-pipeline-spec.md", ["Quarantine", "Preview", "Commit", "Privacy Rules"]);
mustContain("docs/consent-state-machine.md", ["member_only -> public", "consent=granted", "Public Preview"]);
mustContain("test-strategy.md", ["P5-IMPORT-001", "P5-TOKEN-001", "P5-STANDING-001"]);

process.stdout.write("Phase 5 membership pipeline check passed\n");
