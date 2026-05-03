import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function git(args) {
  try {
    return execFileSync("git", ["-c", `safe.directory=${root.replaceAll("\\", "/")}`, ...args], { cwd: root, encoding: "utf8" }).trim();
  } catch (error) {
    if (error?.code === "EPERM" || error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function readHeadFromGitDir() {
  const headFile = readFileSync(resolve(root, ".git", "HEAD"), "utf8").trim();
  if (!headFile.startsWith("ref: ")) {
    return headFile;
  }

  return readFileSync(resolve(root, ".git", headFile.replace("ref: ", "")), "utf8").trim();
}

function readTagsAtHeadFromGitDir(head) {
  const tagRoot = resolve(root, ".git", "refs", "tags");
  if (!existsSync(tagRoot)) {
    return [];
  }

  return readdirSync(tagRoot)
    .filter((tag) => readFileSync(resolve(tagRoot, tag), "utf8").trim() === head);
}

const gitHead = git(["rev-parse", "HEAD"]);
const head = gitHead || readHeadFromGitDir();
const status = git(["status", "--porcelain"]);
if (status != null && status) {
  throw new Error(`Provenance check requires a clean tracked working tree:\n${status}`);
}

const tagOutput = git(["tag", "--points-at", "HEAD"]);
const tagsAtHead = tagOutput == null ? readTagsAtHeadFromGitDir(head) : tagOutput.split(/\r?\n/).filter(Boolean);
const description = git(["describe", "--tags", "--always"]) || (tagsAtHead[0] || head.slice(0, 12));

if (process.env.REQUIRE_TAGGED_HEAD === "1" && tagsAtHead.length === 0) {
  throw new Error(`HEAD ${head} is not tagged; refusing release provenance check.`);
}

for (const tag of tagsAtHead) {
  const tagCommit = git(["rev-parse", `${tag}^{commit}`]) || readFileSync(resolve(root, ".git", "refs", "tags", tag), "utf8").trim();
  if (tagCommit !== head) {
    throw new Error(`Tag ${tag} resolves to ${tagCommit}, expected ${head}.`);
  }
}

const sbomPath = resolve(root, "build", "sbom.cdx.json");
if (!existsSync(sbomPath)) {
  throw new Error("SBOM must exist before provenance check.");
}

const sbom = JSON.parse(readFileSync(sbomPath, "utf8"));
if (sbom.metadata?.component?.name !== "iwfsa-platform-v2") {
  throw new Error("SBOM metadata component does not match iwfsa-platform-v2.");
}

process.stdout.write(`provenance check passed: head=${head.slice(0, 12)} describe=${description} tags=${tagsAtHead.join(",") || "none"}\n`);
