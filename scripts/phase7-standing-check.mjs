import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function mustContain(file, markers) {
  const text = readFileSync(resolve(root, file), "utf8");
  for (const marker of markers) {
    if (!text.includes(marker)) {
      throw new Error(`${file} is missing Phase 7 marker: ${marker}`);
    }
  }
}

mustContain("apps/common/src/standing.ts", ["openMembershipYear", "recordFee", "applyPayment", "waiveFee", "evaluateStanding", "applyStandingChange"]);
mustContain("apps/common/src/session-repository.ts", ["rotateSessionsForSubject", "review"]);
mustContain("apps/common/test/standing.test.ts", ["membership cycle opening", "fee state machine", "standing change"]);
mustContain("apps/api/src/server.ts", ["/api/admin/fees/payment", "/api/admin/fees/waiver", "applyStandingChange"]);
mustContain("apps/api/migrations/0001_phase4_foundation.sql", ["membership_year", "fee_record", "standing_history"]);
mustContain("docs/membership-standing-spec.md", ["Standing Determination", "Fee Ledger", "Session Propagation"]);
mustContain("docs/audit-event-catalog.md", ["FEE_PAYMENT_APPLIED", "MEMBERSHIP_CYCLE_OPENED", "STANDING_CHANGED"]);
mustContain("test-strategy.md", ["P7-CYCLE-001", "P7-FEE-001", "P7-STANDING-001"]);

process.stdout.write("Phase 7 standing and fee governance check passed\n");
