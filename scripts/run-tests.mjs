import "./link-workspaces.mjs";

const testFiles = [
  "../apps/common/test/repositories.test.ts",
  "../apps/common/test/phase5-membership.test.ts",
  "../apps/common/test/events.test.ts",
  "../apps/common/test/standing.test.ts",
  "../apps/common/test/visibility.test.ts",
  "../apps/common/test/public-profile-repository.test.ts",
  "../apps/api/test/server.test.ts",
  "../apps/web/test/server.test.ts"
];

for (const file of testFiles) {
  await import(file);
}
