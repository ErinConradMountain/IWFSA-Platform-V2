import type { ConsentState, Standing } from "@iwfsa/common/session-repository";
import type { ProfileVisibility } from "@iwfsa/common/repositories";

export type PublicVisibilityInput = {
  standing: Standing;
  requestedVisibility?: ProfileVisibility;
  consent: ConsentState;
  approved?: boolean;
};

export type PublicVisibilityResult = {
  effectiveVisibility: ProfileVisibility;
  eligibleForPublicRender: boolean;
  reason: "PUBLIC_ELIGIBLE" | "PUBLIC_STANDING_REQUIRED" | "PUBLIC_CONSENT_REQUIRED" | "PUBLIC_APPROVAL_REQUIRED" | "PUBLIC_VISIBILITY_REQUIRED";
};

export function resolvePublicProfileVisibility(input: PublicVisibilityInput): PublicVisibilityResult {
  if (input.requestedVisibility !== "public") {
    return {
      effectiveVisibility: "hidden",
      eligibleForPublicRender: false,
      reason: "PUBLIC_VISIBILITY_REQUIRED"
    };
  }

  if (input.standing !== "good") {
    return {
      effectiveVisibility: "hidden",
      eligibleForPublicRender: false,
      reason: "PUBLIC_STANDING_REQUIRED"
    };
  }

  if (input.consent !== "granted") {
    return {
      effectiveVisibility: "hidden",
      eligibleForPublicRender: false,
      reason: "PUBLIC_CONSENT_REQUIRED"
    };
  }

  if (input.approved !== true) {
    return {
      effectiveVisibility: "hidden",
      eligibleForPublicRender: false,
      reason: "PUBLIC_APPROVAL_REQUIRED"
    };
  }

  return {
    effectiveVisibility: "public",
    eligibleForPublicRender: true,
    reason: "PUBLIC_ELIGIBLE"
  };
}
