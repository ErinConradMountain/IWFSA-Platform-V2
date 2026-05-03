import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifests = ["package.json", "apps/common/package.json", "apps/api/package.json", "apps/web/package.json"];
const blocked = new Set(["left-pad"]);

for (const manifest of manifests) {
  const pkg = JSON.parse(readFileSync(resolve(root, manifest), "utf8"));
  const dependencies = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

  for (const name of Object.keys(dependencies)) {
    if (blocked.has(name)) {
      throw new Error(`Blocked dependency found in ${manifest}: ${name}`);
    }
  }
}

process.stdout.write("dependency scan passed: no blocked packages found\n");
