import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const requiredMarkers = [
  ["AGENTS.md", "Phase 2 Active Control Contract"],
  ["AGENTS.md", "POLICY_MISSING_MAPPING"],
  ["docs/surface-navigation-map.md", "Missing Mapping Rule"],
  ["docs/surface-navigation-map.md", "admin.import.commit"],
  ["test-strategy.md", "P2-CSRF-001"],
  ["security-controls-matrix.md", "Session rotation"],
  ["audit-event-catalog.md", "SESSION_ROTATED"],
  ["decision-log.md", "Phase 2 Session and CSRF Spine"]
  ,
  ["PLATFORM_MEMORY.md", "Every page has one primary task"],
  ["AGENTS.md", "UX, Brand, and Seed Asset Rules"],
  ["docs/surface-navigation-map.md", "UX Contract"],
  ["docs/design-system.md", "Component Governance Props"],
  ["docs/governance/privacy-by-design.md", "Consent Language"],
  ["slice-brief-template.md", "Governance Annotations"],
  ["docs/data-model.md", "member_account"],
  ["docs/audit-event-catalog.md", "redactedMetadata"],
  ["docs/ci-pipeline.md", "pre-merge"],
  ["docs/release-runbook.md", "Rollback Authority"],
  ["docs/support-playbook.md", "correlation ID"],
  ["docs/security/session-policy.md", "Generic Responses"],
  ["docs/runbooks/telemetry.md", "redaction"],
  ["docs/import-pipeline-spec.md", "Privacy Rules"],
  ["docs/consent-state-machine.md", "Public Preview"]
];

for (const [file, marker] of requiredMarkers) {
  const text = readFileSync(resolve(root, file), "utf8");

  if (!text.includes(marker)) {
    throw new Error(`${file} is missing required Phase 2 control marker: ${marker}`);
  }
}

process.stdout.write("documentation control check passed\n");
