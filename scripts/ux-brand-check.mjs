import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function listFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const absolute = resolve(directory, entry);
    if (statSync(absolute).isDirectory()) {
      return listFiles(absolute);
    }
    return [absolute];
  });
}

const webSources = listFiles(resolve(root, "apps", "web", "src")).filter((file) => file.endsWith(".ts"));
for (const file of webSources) {
  const text = readFileSync(file, "utf8");

  if (/\sstyle=/.test(text)) {
    throw new Error(`${file} contains an inline style attribute.`);
  }

  const hardCodedHex = text.match(/#[0-9A-Fa-f]{3,8}/g);
  if (hardCodedHex) {
    throw new Error(`${file} contains hard-coded color values: ${hardCodedHex.join(", ")}`);
  }
}

const serverSource = readFileSync(resolve(root, "apps", "web", "src", "server.ts"), "utf8");
for (const marker of ["data-primary-action", "data-surface-nav", "Complete profile", "Review imports"]) {
  if (!serverSource.includes(marker)) {
    throw new Error(`web server is missing UX marker: ${marker}`);
  }
}

const seed = JSON.parse(readFileSync(resolve(root, "seed", "legacy-members.json"), "utf8"));
if (!Array.isArray(seed.members) || seed.members.length < 4) {
  throw new Error("legacy seed members must include at least four visual seed records.");
}

for (const member of seed.members) {
  if (!member.publicImage?.startsWith("/legacy-assets/")) {
    throw new Error(`seed member ${member.seedId} has an invalid asset path.`);
  }

  const assetPath = resolve(root, "apps", "web", "public", member.publicImage.slice(1));
  if (!statSync(assetPath).isFile()) {
    throw new Error(`seed member ${member.seedId} points to a missing asset: ${member.publicImage}`);
  }

  const serialized = JSON.stringify(member).toLowerCase();
  if (serialized.includes("@") || serialized.includes("phone") || serialized.includes("mobile")) {
    throw new Error(`seed member ${member.seedId} appears to contain private contact data.`);
  }
}

process.stdout.write("UX, brand, and seed asset check passed\n");
