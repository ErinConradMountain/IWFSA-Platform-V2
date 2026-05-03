import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const steps = [
  ["node", ["scripts/check.mjs"]],
  ["node", ["--experimental-strip-types", "scripts/run-tests.mjs"]],
  ["node", ["scripts/typecheck.mjs"]],
  ["node", ["scripts/workspace-ls.mjs"]],
  ["node", ["scripts/docs-control-check.mjs"]],
  ["node", ["scripts/ux-brand-check.mjs"]],
  ["node", ["scripts/phase3-design-check.mjs"]],
  ["node", ["scripts/phase4-spine-check.mjs"]],
  ["node", ["scripts/phase5-membership-check.mjs"]],
  ["node", ["scripts/phase6-events-check.mjs"]],
  ["node", ["scripts/phase7-standing-check.mjs"]],
  ["node", ["scripts/dependency-scan.mjs"]],
  ["node", ["scripts/generate-sbom.mjs"]],
  ["node", ["scripts/supply-chain-check.mjs"]]
];

for (const [command, args] of steps) {
  execFileSync(command, args, { cwd: root, stdio: "inherit" });
}

process.stdout.write("ci passed end-to-end\n");
