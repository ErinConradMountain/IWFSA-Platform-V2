import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function mustContain(file, markers) {
  const text = readFileSync(resolve(root, file), "utf8");

  for (const marker of markers) {
    if (!text.includes(marker)) {
      throw new Error(`${file} is missing Phase 3 marker: ${marker}`);
    }
  }
}

mustContain("apps/common/src/design-tokens.ts", [
  "semantic",
  "private",
  "members",
  "public",
  "audit"
]);

mustContain("apps/common/src/component-contracts.ts", [
  "visibility",
  "consentGate",
  "auditLabel",
  "SingleTaskPageContract"
]);

mustContain("apps/web/src/server.ts", [
  "/member/profile/edit",
  "/member/profile/visibility",
  "/admin/import/preview",
  "/admin/import/resolve-duplicate",
  "/admin/import/commit",
  "/public/profile-submission",
  "aria-label=\"Biography, visible to members only\"",
  "Audit label:"
]);

mustContain("docs/design-system.md", [
  "Single-Task Page Rule",
  "Component Governance Props",
  "WCAG 2.2 AA",
  "Member profile edit"
]);

mustContain("docs/governance/privacy-by-design.md", [
  "private",
  "members",
  "public",
  "audit-only",
  "Consent Language"
]);

mustContain("apps/web/README.md", [
  "Surface-Aware Routing",
  "Single-Task Pages",
  "Brand",
  "Accessibility"
]);

mustContain("slice-brief-template.md", [
  "Governance Annotations",
  "Audit label",
  "More than one primary CTA"
]);

process.stdout.write("Phase 3 design system check passed\n");
