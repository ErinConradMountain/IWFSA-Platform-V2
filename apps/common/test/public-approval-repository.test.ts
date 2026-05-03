import test from "node:test";
import assert from "node:assert/strict";

import {
  createInMemoryPublicApprovalRepository,
  createPostgreSqlPublicApprovalRepository,
  type PublicApprovalRecord
} from "@iwfsa/common/public-approval-repository";

function runPublicApprovalRepositoryContract(name: string, createRepository: () => ReturnType<typeof createInMemoryPublicApprovalRepository>) {
  test(`public approval repository contract passes for ${name}`, () => {
    const repository = createRepository();
    const requested = repository.createReviewRequest({
      id: "approval-1",
      profileId: "profile-1",
      memberId: "member-1",
      profileVersion: "profile-v1",
      requestedAt: "2026-05-03T10:00:00.000Z",
      correlationId: "corr-request"
    });

    assert.equal(requested.status, "pending_review");
    assert.equal(repository.getPendingReviews().length, 1);
    assert.equal(repository.createReviewRequest({ ...requested, requestedAt: requested.requestedAt }).id, requested.id);

    assert.throws(() => repository.revokeApproval({
      id: "approval-1",
      actorId: "admin-1",
      reviewNotes: "not reviewed yet",
      correlationId: "corr-revoke",
      now: "2026-05-03T10:05:00.000Z"
    }), /invalid_publication_transition/);

    const reviewed = repository.transitionApproval({
      id: "approval-1",
      action: "review",
      actorId: "admin-1",
      reviewNotes: "<b>Ready</b> after checking person@example.test and +27 82 123 4567.",
      correlationId: "corr-review",
      now: "2026-05-03T10:10:00.000Z"
    });

    assert.equal(reviewed.reviewNotesSanitized.includes("<b>"), false);
    assert.equal(reviewed.reviewNotesSanitized.includes("person@example.test"), false);
    assert.equal(reviewed.reviewNotesSanitized, "Ready after checking [REDACTED] and [REDACTED].");

    const approved = repository.transitionApproval({
      id: "approval-1",
      action: "approve",
      actorId: "admin-1",
      correlationId: "corr-approve",
      now: "2026-05-03T10:15:00.000Z"
    });

    assert.equal(approved.status, "approved");
    assert.equal(approved.approvedAt, "2026-05-03T10:15:00.000Z");
    assert.equal(repository.getPendingReviews().length, 0);

    const duplicateApproved = repository.transitionApproval({
      id: "approval-1",
      action: "approve",
      actorId: "admin-1",
      correlationId: "corr-approve-again",
      now: "2026-05-03T10:16:00.000Z"
    });
    assert.equal(duplicateApproved.status, "approved");
    assert.equal(duplicateApproved.approvedAt, "2026-05-03T10:15:00.000Z");

    const duplicateApproval = repository.transitionApproval({
      id: "approval-1",
      action: "publish",
      actorId: "system",
      correlationId: "corr-publish",
      now: "2026-05-03T10:20:00.000Z"
    });
    assert.equal(duplicateApproval.status, "published");

    const revoked = repository.revokeApproval({
      id: "approval-1",
      actorId: "admin-2",
      reviewNotes: "Revoked.",
      correlationId: "corr-revoke",
      now: "2026-05-03T10:25:00.000Z"
    });

    assert.equal(revoked.status, "revoked");
    assert.equal(revoked.revokedAt, "2026-05-03T10:25:00.000Z");
  });
}

runPublicApprovalRepositoryContract("in-memory adapter", createInMemoryPublicApprovalRepository);

runPublicApprovalRepositoryContract("PostgreSQL adapter contract client", () => {
  const records = new Map<string, PublicApprovalRecord>();
  return createPostgreSqlPublicApprovalRepository({
    execute(sql, params) {
      if (sql.startsWith("insert into public_approval_record")) {
        records.set(String(params[0]), {
          id: String(params[0]),
          profileId: String(params[1]),
          memberId: String(params[2]),
          profileVersion: String(params[3]),
          requestedAt: String(params[4]),
          reviewedBy: null,
          status: "pending_review",
          reviewNotesSanitized: "",
          approvedAt: null,
          revokedAt: null,
          correlationId: String(params[10]),
          contentType: String(params[11] || "profile") as PublicApprovalRecord["contentType"],
          requiresDualApproval: Boolean(params[12]),
          finalApprovedBy: null,
          finalApprovedAt: null
        });
      }

      if (sql.startsWith("update public_approval_record")) {
        const current = records.get(String(params[6]));
        assert.ok(current);
        records.set(current.id, {
          ...current,
          reviewedBy: String(params[0]),
          status: String(params[1]) as PublicApprovalRecord["status"],
          reviewNotesSanitized: String(params[2]),
          approvedAt: params[3] ? String(params[3]) : null,
          revokedAt: params[4] ? String(params[4]) : null,
          correlationId: String(params[5])
        });
      }

      if (sql.startsWith("update public_approval_record set status = 'published'")) {
        const current = records.get(String(params[3]));
        assert.ok(current);
        records.set(current.id, {
          ...current,
          status: "published",
          finalApprovedBy: String(params[0]),
          finalApprovedAt: String(params[1]),
          correlationId: String(params[2])
        });
      }
    },
    query(sql, params) {
      if (sql.includes("where id = $1")) {
        const row = records.get(String(params[0]));
        return { rows: row ? [toSqlRow(row)] : [] };
      }

      return {
        rows: [...records.values()].filter((record) => record.status === "pending_review").map(toSqlRow)
      };
    }
  });
});

test("public approval repository records dual approval final signer", () => {
  const repository = createInMemoryPublicApprovalRepository();
  repository.createReviewRequest({
    id: "approval-dual",
    profileId: "profile-dual",
    memberId: "member-dual",
    profileVersion: "profile-v1",
    requestedAt: "2026-05-03T11:00:00.000Z",
    correlationId: "corr-dual",
    contentType: "memorial",
    requiresDualApproval: true
  });
  repository.transitionApproval({
    id: "approval-dual",
    action: "approve",
    actorId: "admin-1",
    correlationId: "corr-dual-approve",
    now: "2026-05-03T11:05:00.000Z"
  });
  const final = repository.finalApprove({
    id: "approval-dual",
    actorId: "chief-1",
    correlationId: "corr-dual-final",
    now: "2026-05-03T11:10:00.000Z"
  });
  assert.equal(final.status, "published");
  assert.equal(final.contentType, "memorial");
  assert.equal(final.finalApprovedBy, "chief-1");
  assert.equal(final.finalApprovedAt, "2026-05-03T11:10:00.000Z");
});

function toSqlRow(record: PublicApprovalRecord): Record<string, unknown> {
  return {
    id: record.id,
    profile_id: record.profileId,
    member_id: record.memberId,
    profile_version: record.profileVersion,
    requested_at: record.requestedAt,
    reviewed_by: record.reviewedBy,
    status: record.status,
    review_notes_sanitized: record.reviewNotesSanitized,
    approved_at: record.approvedAt,
    revoked_at: record.revokedAt,
    correlation_id: record.correlationId,
    content_type: record.contentType,
    requires_dual_approval: record.requiresDualApproval,
    final_approved_by: record.finalApprovedBy,
    final_approved_at: record.finalApprovedAt
  };
}
