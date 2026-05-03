import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifests = ["apps/common/package.json", "apps/api/package.json", "apps/web/package.json"];
const packages = new Map(
  manifests.map((manifest) => {
    const pkg = JSON.parse(readFileSync(resolve(root, manifest), "utf8"));
    return [pkg.name, { manifest, dependencies: Object.keys(pkg.dependencies || {}) }];
  })
);

function visit(name, seen = new Set()) {
  if (seen.has(name)) {
    throw new Error(`Circular workspace dependency detected: ${[...seen, name].join(" -> ")}`);
  }

  const current = packages.get(name);
  if (!current) {
    return;
  }

  const nextSeen = new Set(seen);
  nextSeen.add(name);

  for (const dependency of current.dependencies) {
    visit(dependency, nextSeen);
  }
}

for (const name of packages.keys()) {
  visit(name);
}

for (const [name, detail] of packages.entries()) {
  process.stdout.write(`${name} ${detail.manifest} deps=[${detail.dependencies.join(", ")}]\n`);
}

process.stdout.write("workspace dependency graph passed: no circular dependencies\n");
