import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function mustContain(file, markers) {
  const text = readFileSync(resolve(root, file), "utf8");
  for (const marker of markers) {
    if (!text.includes(marker)) {
      throw new Error(`${file} is missing Phase 10 readiness marker: ${marker}`);
    }
  }
}

mustContain("docs/phase10-rc-checklist.md", ["v2.0-rc.1", "E2E Sweep", "Halt Conditions"]);
mustContain("docs/backup-restore-drill.md", ["Audit records remain queryable by correlation ID", "repository contract tests"]);
mustContain("docs/security-regression-checklist.md", ["CSRF", "Public data", "Notifications", "P0/P1 Halt Conditions"]);
mustContain("docs/migration-runbook.md", ["Phase 10 Rehearsal", "Reconciliation"]);
mustContain("docs/release-runbook.md", ["Phase 10 RC", "Rollback Authority", "Evidence Pack"]);
mustContain("docs/support-playbook.md", ["Phase 10 Support Readiness", "correlation ID"]);
mustContain("test-strategy.md", ["P10-CI-001", "P10-RESTORE-001", "P10-E2E-001"]);

process.stdout.write("Phase 10 operational readiness check passed\n");
