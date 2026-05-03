import type { Role } from "@iwfsa/common/auth";
import type { ConsentState, Standing } from "@iwfsa/common/session-repository";
import { resolvePublicProfileVisibility } from "@iwfsa/common/visibility";
export { evaluateStanding } from "@iwfsa/common/standing";

export type Surface = "public" | "member" | "admin";
export type PolicyDecision = "ALLOW" | "DENY" | "REDACT";
export type TaskId =
  | "public.home"
  | "public.profiles.approved"
  | "public.honoraries"
  | "public.memorials"
  | "public.contact"
  | "member.dashboard"
  | "member.profile.edit"
  | "member.profile.visibility"
  | "member.events.rsvp"
  | "member.events.view"
  | "member.directory.view"
  | "member.notifications.view"
  | "admin.dashboard"
  | "admin.import.preview"
  | "admin.import.commit"
  | "admin.standing.manage"
  | "admin.events.manage"
  | "admin.public-review.queue"
  | "admin.audit.read"
  | "admin.support-notes.add";

export type PolicyInput = {
  role: Role | null;
  surface: Surface;
  standing: Standing;
  consent: ConsentState;
  task?: TaskId;
  visibility?: "public" | "member_only" | "hidden";
  approved?: boolean;
  auditTrail?: boolean;
};

export type PolicyResult = {
  decision: PolicyDecision;
  reason: string;
  fallback: string;
};

export const SURFACE_TASK_MATRIX: Record<TaskId, { surface: Surface; fallback: string; requiresConsent?: boolean }> = {
  "public.home": { surface: "public", fallback: "/" },
  "public.profiles.approved": { surface: "public", fallback: "/404" },
  "public.honoraries": { surface: "public", fallback: "/404" },
  "public.memorials": { surface: "public", fallback: "/404" },
  "public.contact": { surface: "public", fallback: "/" },
  "member.dashboard": { surface: "member", fallback: "/member/dashboard" },
  "member.profile.edit": { surface: "member", fallback: "/member/consent-required", requiresConsent: true },
  "member.profile.visibility": { surface: "member", fallback: "/member/consent-required", requiresConsent: true },
  "member.events.rsvp": { surface: "member", fallback: "/member/standing" },
  "member.events.view": { surface: "member", fallback: "/member/standing" },
  "member.directory.view": { surface: "member", fallback: "/member/consent-required", requiresConsent: true },
  "member.notifications.view": { surface: "member", fallback: "/member/dashboard" },
  "admin.dashboard": { surface: "admin", fallback: "/admin" },
  "admin.import.preview": { surface: "admin", fallback: "/admin" },
  "admin.import.commit": { surface: "admin", fallback: "/admin" },
  "admin.standing.manage": { surface: "admin", fallback: "/admin" },
  "admin.events.manage": { surface: "admin", fallback: "/admin" },
  "admin.public-review.queue": { surface: "admin", fallback: "/admin" },
  "admin.audit.read": { surface: "admin", fallback: "/admin" },
  "admin.support-notes.add": { surface: "admin", fallback: "/admin" }
};

export function evaluate(input: PolicyInput): PolicyResult {
  const mapping = input.task ? SURFACE_TASK_MATRIX[input.task] : null;

  if (input.task && !mapping) {
    return { decision: "DENY", reason: "POLICY_MISSING_MAPPING", fallback: fallbackForSurface(input.surface) };
  }

  if (mapping && mapping.surface !== input.surface) {
    return { decision: "DENY", reason: "POLICY_SURFACE_MISMATCH", fallback: mapping.fallback };
  }

  if (input.surface === "public") {
    if (input.task && ["public.profiles.approved", "public.honoraries", "public.memorials"].includes(input.task)) {
      const visibility = resolvePublicProfileVisibility({
        standing: input.standing,
        requestedVisibility: input.visibility,
        consent: input.consent,
        approved: input.approved
      });

      if (!visibility.eligibleForPublicRender) {
        return { decision: "REDACT", reason: visibility.reason, fallback: mapping?.fallback || "/404" };
      }
    }

    return { decision: "ALLOW", reason: "PUBLIC_ALLOWED", fallback: mapping?.fallback || "/" };
  }

  if (!input.role) {
    return { decision: "DENY", reason: "AUTHENTICATION_REQUIRED", fallback: input.surface === "member" ? "/signin" : "/" };
  }

  if (input.surface === "member") {
    if (!["member", "admin", "chief_admin"].includes(input.role)) {
      return { decision: "DENY", reason: "MEMBER_ROLE_REQUIRED", fallback: "/signin" };
    }

    if (input.standing === "blocked") {
      return { decision: "DENY", reason: "STANDING_BLOCKED", fallback: "/member/standing" };
    }

    if (mapping?.requiresConsent && input.consent !== "granted") {
      return { decision: "DENY", reason: "CONSENT_REQUIRED", fallback: mapping.fallback };
    }

    return { decision: "ALLOW", reason: "MEMBER_ALLOWED", fallback: mapping?.fallback || "/member/dashboard" };
  }

  if (!["admin", "chief_admin"].includes(input.role)) {
    return { decision: "DENY", reason: "ADMIN_ROLE_REQUIRED", fallback: "/" };
  }

  if (input.standing !== "active") {
    return { decision: "DENY", reason: "ADMIN_ACTIVE_STANDING_REQUIRED", fallback: "/admin" };
  }

  if (input.auditTrail !== true) {
    return { decision: "DENY", reason: "AUDIT_TRAIL_REQUIRED", fallback: "/admin" };
  }

  return { decision: "ALLOW", reason: "ADMIN_ALLOWED", fallback: mapping?.fallback || "/admin" };
}

export function fallbackForSurface(surface: Surface): string {
  if (surface === "member") {
    return "/member/dashboard";
  }

  if (surface === "admin") {
    return "/admin";
  }

  return "/404";
}
