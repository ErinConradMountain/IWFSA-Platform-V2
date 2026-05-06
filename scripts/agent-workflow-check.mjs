import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const briefPath = resolve(root, "slices/phase9-slice3-brief.md");

execFileSync("node", ["scripts/validate-skill-halt.mjs"], { cwd: root, stdio: "inherit" });
execFileSync("node", ["scripts/validate-slice-brief-prompt.mjs"], { cwd: root, stdio: "inherit" });

if (!existsSync(briefPath)) {
  throw new Error("missing archived chain artifact: slices/phase9-slice3-brief.md");
}

const briefText = readFileSync(briefPath, "utf8");
const requiredSections = [
  "# Phase 9 Slice 3 Brief",
  "## Slice ID",
  "## Slice Name",
  "## Source Provenance",
  "## Recommendation Trace",
  "## Trace-to-Test Mapping",
  "## Migration / Backward Compatibility Notes",
  "## Audit Event Schema Additions",
  "## CI Gate Updates",
  "## Rollback Checkpoints",
  "## Documentation Updates",
  "## Open Risks / Deferred Work",
  "## Implementation Steps",
  "notification.outbox_processed",
  "notification.sent",
  "notification.failed",
  "test-strategy.md",
  "security-controls-matrix.md",
  "audit-event-catalog.md"
];

for (const section of requiredSections) {
  if (!briefText.includes(section)) {
    throw new Error(`archived brief missing required section or reference: ${section}`);
  }
}

const implementationSection = briefText.split("## Implementation Steps")[1]?.split("## Rollback Checkpoints")[0] ?? "";
const stepCount = implementationSection
  .split("\n")
  .filter((line) => /^\d+\. /.test(line.trim())).length;

if (stepCount === 0) {
  throw new Error("archived brief is missing numbered implementation steps");
}

if (stepCount > 12) {
  throw new Error(`archived brief exceeds slice discipline: ${stepCount} implementation steps`);
}

process.stdout.write("agent workflow check passed\n");