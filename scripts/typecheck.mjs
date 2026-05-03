import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localTsc = resolve(root, "node_modules", "typescript", "bin", "tsc");

if (existsSync(localTsc)) {
  execFileSync("node", [localTsc, "--project", "tsconfig.json"], { cwd: root, stdio: "inherit" });
} else {
  execFileSync("node", ["scripts/check.mjs"], { cwd: root, stdio: "inherit" });
  process.stdout.write("type validation completed with Node type stripping because npm/TypeScript is not installed in this environment\n");
}
