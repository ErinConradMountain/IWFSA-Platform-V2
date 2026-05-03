import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifests = ["package.json", "apps/common/package.json", "apps/api/package.json", "apps/web/package.json"];
const allowedLicenses = new Set(["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC"]);
const secretPattern = /(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{12,}["']/i;

for (const manifest of manifests) {
  const text = readFileSync(resolve(root, manifest), "utf8");
  if (secretPattern.test(text)) {
    throw new Error(`Potential secret found in ${manifest}`);
  }

  const pkg = JSON.parse(text);
  if (pkg.license && !allowedLicenses.has(pkg.license)) {
    throw new Error(`Unsupported license marker in ${manifest}: ${pkg.license}`);
  }
}

const sbom = JSON.parse(readFileSync(resolve(root, "build", "sbom.cdx.json"), "utf8"));
if (sbom.bomFormat !== "CycloneDX" || !Array.isArray(sbom.components)) {
  throw new Error("SBOM is missing CycloneDX structure.");
}

process.stdout.write("supply-chain check passed\n");
