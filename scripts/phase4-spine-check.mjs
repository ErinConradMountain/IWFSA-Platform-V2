import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function listFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const absolute = resolve(directory, entry);
    if (statSync(absolute).isDirectory()) {
      return listFiles(absolute);
    }
    return [absolute];
  });
}

function mustContain(file, markers) {
  const text = readFileSync(resolve(root, file), "utf8");
  for (const marker of markers) {
    if (!text.includes(marker)) {
      throw new Error(`${file} is missing Phase 4 marker: ${marker}`);
    }
  }
}

for (const file of listFiles(resolve(root, "apps", "api", "src")).filter((candidate) => candidate.endsWith(".ts"))) {
  const text = readFileSync(file, "utf8");
  if (/from\s+["'].*db|client\.query|client\.execute|select\s+\*|insert\s+into|update\s+/i.test(text)) {
    throw new Error(`Direct DB access is not allowed in API route handlers: ${file}`);
  }
}

mustContain("apps/common/src/repositories.ts", [
  "MemberAccountRepo",
  "MemberProfileRepo",
  "ImportBatchRepo",
  "AuditEventRepo",
  "createPostgreSqlRepositories",
  "on conflict"
]);

mustContain("apps/common/src/audit.ts", [
  "AuditEventEmitter",
  "redactedMetadata",
  "metadataHash",
  "PROFILE_VISIBILITY_CHANGED",
  "IMPORT_COMMITTED",
  "STANDING_CHANGED"
]);

mustContain("apps/api/migrations/0001_phase4_foundation.sql", [
  "member_account",
  "member_profile",
  "membership_status",
  "activation_token",
  "audit_event_no_update",
  "audit_event_no_delete"
]);

mustContain("apps/api/migrations/0001_phase4_foundation.rollback.sql", [
  "drop table if exists audit_event",
  "drop table if exists member_account"
]);

mustContain("docs/data-model.md", ["member_account", "member_profile", "membership_status", "activation_token", "audit_event"]);
mustContain("docs/ci-pipeline.md", ["pre-merge", "main", "RC", "prod"]);
mustContain("docs/runbooks/telemetry.md", ["correlation ID", "redaction", "audit"]);
mustContain("docs/security/session-policy.md", ["CSRF", "rotation", "generic"]);

process.stdout.write("Phase 4 platform spine check passed\n");
