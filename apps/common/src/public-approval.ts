import type { Role } from "@iwfsa/common/auth";
import type { AuditEventEmitter } from "@iwfsa/common/audit";
import type { Surface } from "@iwfsa/common/policy";
import type { Standing } from "@iwfsa/common/session-repository";

export type PublicationState = "pending_review" | "approved" | "published" | "revoked";
export type PublicationAction = "request" | "review" | "approve" | "publish" | "revoke";

export type PublicApprovalPolicyInput = {
  role: Role | null;
  surface: Surface;
  memberStanding: Standing;
  auditTrail: boolean;
};

export type PublicApprovalPolicyResult = {
  allowed: boolean;
  reason: "PUBLIC_APPROVAL_ALLOWED" | "ADMIN_ROLE_REQUIRED" | "ADMIN_SURFACE_REQUIRED" | "MEMBER_GOOD_STANDING_REQUIRED" | "AUDIT_TRAIL_REQUIRED";
};

export type PublicationTransition = {
  previousState: PublicationState;
  newState: PublicationState;
  visibility: "hidden" | "public";
  auditAction: "profile.publication_requested" | "profile.publication_reviewed" | "profile.publication_approved" | "profile.publication_revoked";
};

export type PublicationAuditInput = {
  actorId: string;
  memberId: string;
  profileVersion: string;
  previousState: PublicationState;
  newState: PublicationState;
  reviewNotes?: string;
  correlationId: string;
};

export function evaluatePublicApprovalPolicy(input: PublicApprovalPolicyInput): PublicApprovalPolicyResult {
  if (input.surface !== "admin") {
    return { allowed: false, reason: "ADMIN_SURFACE_REQUIRED" };
  }

  if (!["admin", "chief_admin"].includes(input.role || "")) {
    return { allowed: false, reason: "ADMIN_ROLE_REQUIRED" };
  }

  if (input.memberStanding !== "good") {
    return { allowed: false, reason: "MEMBER_GOOD_STANDING_REQUIRED" };
  }

  if (input.auditTrail !== true) {
    return { allowed: false, reason: "AUDIT_TRAIL_REQUIRED" };
  }

  return { allowed: true, reason: "PUBLIC_APPROVAL_ALLOWED" };
}

export function transitionPublicationState(currentState: PublicationState, action: PublicationAction): PublicationTransition {
  if (action === "request" && currentState === "revoked") {
    return {
      previousState: currentState,
      newState: "pending_review",
      visibility: "hidden",
      auditAction: "profile.publication_requested"
    };
  }

  if (action === "review" && currentState === "pending_review") {
    return {
      previousState: currentState,
      newState: "pending_review",
      visibility: "hidden",
      auditAction: "profile.publication_reviewed"
    };
  }

  if (action === "approve" && currentState === "pending_review") {
    return {
      previousState: currentState,
      newState: "approved",
      visibility: "hidden",
      auditAction: "profile.publication_approved"
    };
  }

  if (action === "publish" && currentState === "approved") {
    return {
      previousState: currentState,
      newState: "published",
      visibility: "public",
      auditAction: "profile.publication_approved"
    };
  }

  if (action === "revoke" && ["approved", "published"].includes(currentState)) {
    return {
      previousState: currentState,
      newState: "revoked",
      visibility: "hidden",
      auditAction: "profile.publication_revoked"
    };
  }

  throw new Error("invalid_publication_transition");
}

export function emitPublicationAudit(audit: AuditEventEmitter, input: PublicationAuditInput & { action: PublicationTransition["auditAction"] }): void {
  audit.emit({
    action: input.action,
    actor: input.actorId,
    targetType: "member_profile",
    targetId: input.memberId,
    correlationId: input.correlationId,
    metadata: {
      actorId: input.actorId,
      memberId: input.memberId,
      profileVersion: input.profileVersion,
      previousState: input.previousState,
      newState: input.newState,
      reviewNotes: sanitizeReviewNotes(input.reviewNotes || "")
    }
  });
}

export function sanitizeReviewNotes(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED]")
    .replace(/\+?\d[\d ().-]{7,}\d/g, "[REDACTED]")
    .trim()
    .slice(0, 500);
}
