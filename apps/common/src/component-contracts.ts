import type { BrandTokenPath } from "@iwfsa/common/design-tokens";
import type { Surface } from "@iwfsa/common/policy";

export type VisibilityState = "private" | "members" | "public";
export type ConsentGate = "not_required" | "required_missing" | "granted" | "revoked";
export type PrimaryTaskTone = "calm_confidence" | "joyful_discovery" | "careful_stewardship";

export type GovernanceComponentProps = {
  surface: Surface;
  visibility: VisibilityState;
  consentGate: ConsentGate;
  auditLabel: string;
  token: BrandTokenPath;
};

export type ProfileFieldProps = GovernanceComponentProps & {
  value: string;
  isEditable: boolean;
  screenReaderLabel: string;
  onVisibilityChangeAllowed: boolean;
};

export type SingleTaskPageContract = {
  route: string;
  surface: Surface;
  primaryTask: string;
  primaryActionLabel: string;
  emotionalTone: PrimaryTaskTone;
  governanceAnnotation: string;
  requiresPolicyTask: string;
  accessibilityTarget: "WCAG_2_2_AA";
};
