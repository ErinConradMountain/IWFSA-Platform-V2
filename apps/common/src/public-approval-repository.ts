import type { PublicationAction, PublicationState } from "@iwfsa/common/public-approval";
import { sanitizeReviewNotes, transitionPublicationState } from "@iwfsa/common/public-approval";

export type PublicApprovalRecord = {
  id: string;
  profileId: string;
  memberId: string;
  profileVersion: string;
  requestedAt: string;
  reviewedBy: string | null;
  status: PublicationState;
  reviewNotesSanitized: string;
  approvedAt: string | null;
  revokedAt: string | null;
  correlationId: string;
};

export type CreateReviewRequestInput = {
  id: string;
  profileId: string;
  memberId: string;
  profileVersion: string;
  requestedAt: string;
  correlationId: string;
};

export type TransitionApprovalInput = {
  id: string;
  action: Exclude<PublicationAction, "request">;
  actorId: string;
  reviewNotes?: string;
  correlationId: string;
  now: string;
};

export type PublicApprovalRepository = {
  createReviewRequest(input: CreateReviewRequestInput): PublicApprovalRecord;
  transitionApproval(input: TransitionApprovalInput): PublicApprovalRecord;
  getPendingReviews(): PublicApprovalRecord[];
  revokeApproval(input: Omit<TransitionApprovalInput, "action">): PublicApprovalRecord;
  findById(id: string): PublicApprovalRecord | null;
};

export type PublicApprovalSqlClient = {
  query<T>(sql: string, params: unknown[]): { rows: T[] };
  execute(sql: string, params: unknown[]): void;
};

export function createInMemoryPublicApprovalRepository(): PublicApprovalRepository {
  const records = new Map<string, PublicApprovalRecord>();

  return {
    createReviewRequest(input) {
      const existing = records.get(input.id);
      if (existing) {
        return existing;
      }

      const record: PublicApprovalRecord = {
        id: input.id,
        profileId: input.profileId,
        memberId: input.memberId,
        profileVersion: input.profileVersion,
        requestedAt: input.requestedAt,
        reviewedBy: null,
        status: "pending_review",
        reviewNotesSanitized: "",
        approvedAt: null,
        revokedAt: null,
        correlationId: input.correlationId
      };
      records.set(record.id, record);
      return record;
    },

    transitionApproval(input) {
      const existing = records.get(input.id);
      if (!existing) {
        throw new Error("approval_record_missing");
      }

      if (input.action === "approve" && existing.status === "approved") {
        return existing;
      }

      const transition = transitionPublicationState(existing.status, input.action);
      const reviewNotesSanitized = sanitizeReviewNotes(input.reviewNotes || existing.reviewNotesSanitized);
      const next: PublicApprovalRecord = {
        ...existing,
        status: transition.newState,
        reviewedBy: input.actorId,
        reviewNotesSanitized,
        approvedAt: transition.newState === "approved" ? input.now : existing.approvedAt,
        revokedAt: transition.newState === "revoked" ? input.now : existing.revokedAt,
        correlationId: input.correlationId
      };
      records.set(next.id, next);
      return next;
    },

    getPendingReviews() {
      return [...records.values()].filter((record) => record.status === "pending_review");
    },

    revokeApproval(input) {
      return this.transitionApproval({ ...input, action: "revoke" });
    },

    findById(id) {
      return records.get(id) || null;
    }
  };
}

export function createPostgreSqlPublicApprovalRepository(client: PublicApprovalSqlClient): PublicApprovalRepository {
  function fromRow(row: Record<string, unknown>): PublicApprovalRecord {
    return {
      id: String(row.id),
      profileId: String(row.profile_id ?? row.profileId),
      memberId: String(row.member_id ?? row.memberId),
      profileVersion: String(row.profile_version ?? row.profileVersion),
      requestedAt: String(row.requested_at ?? row.requestedAt),
      reviewedBy: row.reviewed_by || row.reviewedBy ? String(row.reviewed_by ?? row.reviewedBy) : null,
      status: String(row.status) as PublicationState,
      reviewNotesSanitized: String(row.review_notes_sanitized ?? row.reviewNotesSanitized ?? ""),
      approvedAt: row.approved_at || row.approvedAt ? String(row.approved_at ?? row.approvedAt) : null,
      revokedAt: row.revoked_at || row.revokedAt ? String(row.revoked_at ?? row.revokedAt) : null,
      correlationId: String(row.correlation_id ?? row.correlationId)
    };
  }

  return {
    createReviewRequest(input) {
      const existing = this.findById(input.id);
      if (existing) {
        return existing;
      }

      client.execute(
        "insert into public_approval_record (id, profile_id, member_id, profile_version, requested_at, reviewed_by, status, review_notes_sanitized, approved_at, revoked_at, correlation_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [input.id, input.profileId, input.memberId, input.profileVersion, input.requestedAt, null, "pending_review", "", null, null, input.correlationId]
      );
      return this.findById(input.id)!;
    },

    transitionApproval(input) {
      const existing = this.findById(input.id);
      if (!existing) {
        throw new Error("approval_record_missing");
      }

      if (input.action === "approve" && existing.status === "approved") {
        return existing;
      }

      const transition = transitionPublicationState(existing.status, input.action);
      const reviewNotesSanitized = sanitizeReviewNotes(input.reviewNotes || existing.reviewNotesSanitized);
      const approvedAt = transition.newState === "approved" ? input.now : existing.approvedAt;
      const revokedAt = transition.newState === "revoked" ? input.now : existing.revokedAt;
      client.execute(
        "update public_approval_record set reviewed_by = $1, status = $2, review_notes_sanitized = $3, approved_at = $4, revoked_at = $5, correlation_id = $6 where id = $7",
        [input.actorId, transition.newState, reviewNotesSanitized, approvedAt, revokedAt, input.correlationId, input.id]
      );
      return this.findById(input.id)!;
    },

    getPendingReviews() {
      return client.query<Record<string, unknown>>("select id, profile_id, member_id, profile_version, requested_at, reviewed_by, status, review_notes_sanitized, approved_at, revoked_at, correlation_id from public_approval_record where status = 'pending_review' order by requested_at asc", []).rows.map(fromRow);
    },

    revokeApproval(input) {
      return this.transitionApproval({ ...input, action: "revoke" });
    },

    findById(id) {
      const result = client.query<Record<string, unknown>>("select id, profile_id, member_id, profile_version, requested_at, reviewed_by, status, review_notes_sanitized, approved_at, revoked_at, correlation_id from public_approval_record where id = $1 limit 1", [id]);
      return result.rows[0] ? fromRow(result.rows[0]) : null;
    }
  };
}
