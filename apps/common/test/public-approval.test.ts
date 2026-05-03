import test from "node:test";
import assert from "node:assert/strict";

import { createAuditEventEmitter, createInMemoryAuditRepository } from "@iwfsa/common/audit";
import {
  emitPublicationAudit,
  evaluatePublicApprovalPolicy,
  sanitizeReviewNotes,
  transitionPublicationState
} from "@iwfsa/common/public-approval";

test("public approval policy requires admin role, admin surface, good member standing, and audit trail", () => {
  assert.deepEqual(evaluatePublicApprovalPolicy({
    role: "admin",
    surface: "admin",
    memberStanding: "good",
    auditTrail: true
  }), { allowed: true, reason: "PUBLIC_APPROVAL_ALLOWED" });

  assert.equal(evaluatePublicApprovalPolicy({ role: "member", surface: "admin", memberStanding: "good", auditTrail: true }).reason, "ADMIN_ROLE_REQUIRED");
  assert.equal(evaluatePublicApprovalPolicy({ role: "chief_admin", surface: "member", memberStanding: "good", auditTrail: true }).reason, "ADMIN_SURFACE_REQUIRED");
  assert.equal(evaluatePublicApprovalPolicy({ role: "chief_admin", surface: "admin", memberStanding: "review", auditTrail: true }).reason, "MEMBER_GOOD_STANDING_REQUIRED");
  assert.equal(evaluatePublicApprovalPolicy({ role: "admin", surface: "admin", memberStanding: "good", auditTrail: false }).reason, "AUDIT_TRAIL_REQUIRED");
});

test("publication state machine allows approval path and explicit revocation", () => {
  const reviewed = transitionPublicationState("pending_review", "review");
  assert.equal(reviewed.newState, "pending_review");
  assert.equal(reviewed.visibility, "hidden");

  const approved = transitionPublicationState("pending_review", "approve");
  assert.equal(approved.newState, "approved");
  assert.equal(approved.visibility, "hidden");

  const published = transitionPublicationState("approved", "publish");
  assert.equal(published.newState, "published");
  assert.equal(published.visibility, "public");

  const revoked = transitionPublicationState("published", "revoke");
  assert.equal(revoked.newState, "revoked");
  assert.equal(revoked.visibility, "hidden");

  assert.throws(() => transitionPublicationState("pending_review", "revoke"), /invalid_publication_transition/);
  assert.throws(() => transitionPublicationState("published", "approve"), /invalid_publication_transition/);
});

test("publication audit metadata redacts review notes and hashes metadata", () => {
  const repository = createInMemoryAuditRepository();
  const audit = createAuditEventEmitter(repository);

  emitPublicationAudit(audit, {
    action: "profile.publication_approved",
    actorId: "admin.actor",
    memberId: "member-001",
    profileVersion: "profile-v1",
    previousState: "pending_review",
    newState: "approved",
    reviewNotes: "Ready after checking person@example.test and +27 82 123 4567.",
    correlationId: "corr-public-approval"
  });

  const [event] = repository.list();
  assert.equal(event.action, "profile.publication_approved");
  assert.equal(event.correlationId, "corr-public-approval");
  assert.equal(event.redactedMetadata.reviewNotes, "Ready after checking [REDACTED] and [REDACTED].");
  assert.equal(JSON.stringify(event.redactedMetadata).includes("person@example.test"), false);
  assert.ok(event.metadataHash);
});

test("review note sanitizer strips markup, redacts email and phone-like values, and truncates", () => {
  assert.equal(sanitizeReviewNotes("<b>Contact</b> a@b.co or +27 82 000 1111"), "Contact [REDACTED] or [REDACTED]");
  assert.equal(sanitizeReviewNotes("x".repeat(700)).length, 500);
});
