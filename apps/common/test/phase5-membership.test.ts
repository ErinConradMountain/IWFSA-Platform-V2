import test from "node:test";
import assert from "node:assert/strict";

import { createAuditEventEmitter, createInMemoryAuditRepository } from "@iwfsa/common/audit";
import { consumeActivationToken, issueActivationToken } from "@iwfsa/common/activation";
import { previewPublicProfile, transitionProfileVisibility } from "@iwfsa/common/consent";
import { commitImport, previewImport } from "@iwfsa/common/import-pipeline";
import { createInMemoryRepositories, type MemberProfile } from "@iwfsa/common/repositories";

test("import preview stores rows without mutating member accounts", () => {
  const repositories = createInMemoryRepositories();
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);
  const result = previewImport({
    filename: "members.csv",
    mimeType: "text/csv",
    sizeBytes: 120,
    content: "source_key,verified_email,display_name\n001,one@example.test,One Member\n,two@example.test,Two Member"
  }, repositories, audit, "corr-import-preview");

  assert.equal(result.rows.length, 2);
  assert.equal(repositories.importBatchRows.listByBatch(result.batch.id).length, 2);
  assert.equal(repositories.memberAccounts.findById("member_001"), null);
  assert.ok(auditRepo.list().some((event) => event.action === "IMPORT_PREVIEWED"));
});

test("import commit is idempotent and enqueues activation invites once", () => {
  const repositories = createInMemoryRepositories();
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);
  const preview = previewImport({
    filename: "members.csv",
    mimeType: "text/csv",
    sizeBytes: 120,
    content: "source_key,verified_email,display_name\n001,one@example.test,One Member"
  }, repositories, audit, "corr-import-preview");
  const idempotencyKey = `${preview.batch.id}:${preview.batch.sourceChecksum}`;
  const first = commitImport(preview.batch.id, idempotencyKey, repositories, audit, "corr-import-commit");
  const second = commitImport(preview.batch.id, idempotencyKey, repositories, audit, "corr-import-commit");

  assert.equal(first.state, "committed");
  assert.equal(second.state, "committed");
  assert.equal(repositories.outbox.list().length, 1);
  assert.equal(auditRepo.list().filter((event) => event.action === "IMPORT_COMMITTED").length, 1);
});

test("activation token lifecycle rejects replay with generic response", () => {
  const repositories = createInMemoryRepositories();
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);
  const issued = issueActivationToken("member-activation", repositories);
  const first = consumeActivationToken(issued.rawToken, repositories, audit, "corr-activation");
  const replay = consumeActivationToken(issued.rawToken, repositories, audit, "corr-activation-replay");

  assert.deepEqual(first, replay);
  assert.equal(repositories.memberAccounts.findById("member-activation")?.authState, "active");
  assert.equal(auditRepo.list().filter((event) => event.action === "MEMBER_ONBOARDED").length, 1);
});

test("visibility transition blocks public without consent and renders exact public preview", () => {
  const auditRepo = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(auditRepo);
  const profile: MemberProfile = {
    memberId: "member-profile",
    displayName: "Visible Member",
    biography: "Approved biography",
    visibility: "member_only",
    consent: "missing",
    approvedForPublic: false,
    updatedAt: "2026-05-03"
  };

  assert.throws(() => transitionProfileVisibility({ actorId: "member-profile", profile, nextVisibility: "public", consentGranted: false, auditLabel: "profile.visibility", correlationId: "corr-consent" }, audit));

  const approved = transitionProfileVisibility({ actorId: "member-profile", profile: { ...profile, approvedForPublic: true }, nextVisibility: "public", consentGranted: true, auditLabel: "profile.visibility", correlationId: "corr-consent" }, audit);
  const publicPreview = previewPublicProfile(approved);

  assert.equal(publicPreview.displayName, "Visible Member");
  assert.equal(publicPreview.visibility, "public");
  assert.equal(JSON.stringify(publicPreview).includes("consent"), false);
  assert.ok(auditRepo.list().some((event) => event.action === "CONSENT_VISIBILITY_CHANGED"));
  assert.equal(JSON.stringify(auditRepo.list()).includes("Visible Member"), false);
});
