import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const promptPath = resolve(root, ".github/prompts/slice-brief-from-recommendations.prompt.md");
const promptText = readFileSync(promptPath, "utf8");
const promptTextLower = promptText.toLowerCase();
const refusalPrefix = "REFUSAL: Missing provenance fields:";

const requiredMarkers = [
  refusalPrefix.toLowerCase(),
  "commit hash, or explicit local-only marker",
  "test count or verification summary",
  "ci status",
  "updated documentation list",
  "test-strategy.md",
  "docs/ci-pipeline.md"
];

for (const marker of requiredMarkers) {
  if (!promptTextLower.includes(marker)) {
    throw new Error(`prompt contract drift: missing marker: ${marker}`);
  }
}

function evaluateProvenance(input) {
  const missing = [];

  if (!input.commitHash && !input.localOnlyStatus) {
    missing.push("commit_hash_or_local_only_status");
  }

  if (!input.testCount && !input.verificationSummary) {
    missing.push("test_count_or_verification_summary");
  }

  if (!input.ciStatus) {
    missing.push("ci_status");
  }

  if (!input.updatedDocs || input.updatedDocs.length === 0) {
    missing.push("updated_documentation_list");
  }

  if (missing.length > 0) {
    return `${refusalPrefix} ${missing.join(", ")}. Provide these before slice brief generation. Required gates remain defined in test-strategy.md and docs/ci-pipeline.md.`;
  }

  return "ok";
}

const refusal = evaluateProvenance({
  verificationSummary: "77/77 tests",
  updatedDocs: ["audit-event-catalog.md"]
});

if (!refusal.startsWith(refusalPrefix)) {
  throw new Error("prompt refusal simulation failed for incomplete provenance");
}

if (refusal.includes("# ") || refusal.includes("## ")) {
  throw new Error("prompt refusal simulation produced brief-like markdown instead of a refusal");
}

process.stdout.write("slice brief prompt refusal contract passed\n");