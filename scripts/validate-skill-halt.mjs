import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skillPath = resolve(root, ".github/skills/phase-slice-validation-next-steps/SKILL.md");
const haltDirective = "HALT: Missing governance context. Inject {{CONSENT_MODEL}} from PLATFORM_MEMORY.md before execution.";
const skillText = readFileSync(skillPath, "utf8");

const requiredMarkers = [
  "{{GOVERNANCE_PRINCIPLES}}",
  "{{SURFACE_ISOLATION_RULES}}",
  "{{CONSENT_MODEL}}",
  "{{AUDIT_CATALOG_REF}}",
  "{{MAX_RECOMMENDATIONS}}",
  haltDirective,
  "Never output more than 3 recommendations in one handoff.",
  "Keep the total implementation step count across all recommendations at 12 or fewer."
];

for (const marker of requiredMarkers) {
  if (!skillText.includes(marker)) {
    throw new Error(`skill contract drift: missing marker: ${marker}`);
  }
}

function evaluateContext(context) {
  const required = ["GOVERNANCE_PRINCIPLES", "SURFACE_ISOLATION_RULES", "CONSENT_MODEL"];
  const missing = required.filter((key) => !context[key]);

  if (missing.length > 0) {
    return haltDirective;
  }

  return "ok";
}

const missingConsentResult = evaluateContext({
  GOVERNANCE_PRINCIPLES: "privacy before visibility",
  SURFACE_ISOLATION_RULES: "public/member/admin remain isolated"
});

if (missingConsentResult !== haltDirective) {
  throw new Error("skill halt simulation failed for missing consent model");
}

const partialContextResult = evaluateContext({
  CONSENT_MODEL: "current-year consent",
  SURFACE_ISOLATION_RULES: "public/member/admin remain isolated"
});

if (partialContextResult !== haltDirective) {
  throw new Error("skill halt simulation failed for partial governance context");
}

process.stdout.write("skill halt contract passed\n");