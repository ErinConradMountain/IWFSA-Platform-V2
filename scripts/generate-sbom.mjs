import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifests = ["package.json", "apps/common/package.json", "apps/api/package.json", "apps/web/package.json"];
const components = manifests.map((manifest) => {
  const pkg = JSON.parse(readFileSync(resolve(root, manifest), "utf8"));
  return {
    type: "library",
    name: pkg.name,
    version: pkg.version,
    path: manifest,
    dependencies: pkg.dependencies || {},
    devDependencies: pkg.devDependencies || {}
  };
});

const sbom = {
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  serialNumber: "urn:uuid:phase1-iwfsa-platform-v2",
  version: 1,
  metadata: {
    component: {
      type: "application",
      name: "iwfsa-platform-v2",
      version: "0.1.0"
    }
  },
  components
};

mkdirSync(resolve(root, "build"), { recursive: true });
writeFileSync(resolve(root, "build", "sbom.cdx.json"), `${JSON.stringify(sbom, null, 2)}\n`);
process.stdout.write("SBOM generated at build/sbom.cdx.json\n");
