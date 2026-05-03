import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const scopeDirectory = resolve(root, "node_modules", "@iwfsa");
const commonLink = resolve(scopeDirectory, "common");
const commonSource = "../../../../apps/common/src";
const modules = ["activation", "audit", "auth", "component-contracts", "consent", "design-tokens", "events", "import-pipeline", "persistence", "policy", "public-approval", "public-approval-repository", "public-profile-repository", "repositories", "runtime", "session-repository", "standing", "telemetry", "visibility"];

mkdirSync(resolve(commonLink, "src"), { recursive: true });

writeFileSync(
  resolve(commonLink, "package.json"),
  `${JSON.stringify(
    {
      name: "@iwfsa/common",
      version: "0.1.0",
      private: true,
      type: "module",
      exports: Object.fromEntries(modules.map((name) => [`./${name}`, `./src/${name}.js`]))
    },
    null,
    2
  )}\n`
);

for (const moduleName of modules) {
  writeFileSync(resolve(commonLink, "src", `${moduleName}.js`), `export * from "${commonSource}/${moduleName}.ts";\n`);
}

process.stdout.write("local workspace links ready\n");
