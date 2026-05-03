import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ignored = new Set([".git", "build", "node_modules"]);

function listFiles(directory) {
  return readdirSync(directory)
    .filter((entry) => !ignored.has(entry))
    .flatMap((entry) => {
      const absolute = resolve(directory, entry);
      const relativePath = relative(root, absolute);

      if (statSync(absolute).isDirectory()) {
        return listFiles(absolute);
      }

      return [relativePath];
    });
}

const rg = listFiles(root).filter((file) => file.endsWith(".ts") || file.endsWith(".json"));

const tsFiles = rg.filter((file) => file.endsWith(".ts"));

for (const file of tsFiles) {
  execFileSync("node", ["--experimental-strip-types", "--check", file], { cwd: root, stdio: "inherit" });
}

const tsconfig = JSON.parse(readFileSync(resolve(root, "tsconfig.json"), "utf8"));
const compilerOptions = tsconfig.compilerOptions || {};
const requiredStrictOptions = ["strict", "noImplicitAny", "strictNullChecks"];

for (const option of requiredStrictOptions) {
  if (compilerOptions[option] !== true) {
    throw new Error(`tsconfig.json must set compilerOptions.${option}=true`);
  }
}

for (const file of tsFiles.filter((candidate) => candidate.includes("/src/") || candidate.includes("\\src\\"))) {
  const source = readFileSync(resolve(root, file), "utf8");
  const crossAppRelative = /from\s+["']\.\.\/\.\.\/(api|web|common)\//.exec(source);

  if (crossAppRelative) {
    throw new Error(`Workspace isolation violation in ${file}: use module path aliases instead of cross-app relative imports.`);
  }
}

const packageFiles = rg.filter((file) => file.endsWith("package.json"));
for (const file of packageFiles) {
  const pkg = JSON.parse(readFileSync(resolve(root, file), "utf8"));
  const appDir = relative(root, dirname(resolve(root, file)));

  if (appDir.startsWith("apps") && (!pkg.dependencies || !Object.hasOwn(pkg.dependencies, "@iwfsa/common")) && appDir !== "apps\\common" && appDir !== "apps/common") {
    throw new Error(`${file} must declare @iwfsa/common as an explicit dependency.`);
  }
}

process.stdout.write(`check passed: ${tsFiles.length} TypeScript files and ${packageFiles.length} package manifests validated\n`);
