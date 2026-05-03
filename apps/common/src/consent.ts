import type { AuditEventEmitter } from "@iwfsa/common/audit";
import type { MemberProfile, ProfileVisibility } from "@iwfsa/common/repositories";

export type VisibilityTransitionInput = {
  actorId: string;
  profile: MemberProfile;
  nextVisibility: ProfileVisibility;
  consentGranted: boolean;
  auditLabel: string;
  correlationId: string;
};

export function transitionProfileVisibility(input: VisibilityTransitionInput, audit: AuditEventEmitter): MemberProfile {
  if (input.nextVisibility === "public" && (!input.consentGranted || input.profile.approvedForPublic !== true)) {
    throw new Error("public_visibility_requires_consent_and_approval");
  }

  const nextProfile: MemberProfile = {
    ...input.profile,
    visibility: input.nextVisibility,
    consent: input.consentGranted ? "granted" : input.profile.consent,
    updatedAt: new Date().toISOString()
  };

  audit.emit({
    action: "CONSENT_VISIBILITY_CHANGED",
    actor: input.actorId,
    targetType: "member_profile",
    targetId: input.profile.memberId,
    correlationId: input.correlationId,
    metadata: { visibility: input.nextVisibility, auditLabel: input.auditLabel, displayName: input.profile.displayName }
  });

  return nextProfile;
}

export function previewPublicProfile(profile: MemberProfile): Partial<MemberProfile> {
  if (profile.visibility !== "public" || profile.consent !== "granted" || profile.approvedForPublic !== true) {
    return {};
  }

  return {
    memberId: profile.memberId,
    displayName: profile.displayName,
    biography: profile.biography,
    visibility: "public",
    approvedForPublic: true
  };
}
