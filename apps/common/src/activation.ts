import crypto from "node:crypto";

import type { AuditEventEmitter } from "@iwfsa/common/audit";
import type { PlatformRepositories } from "@iwfsa/common/repositories";

export type ActivationIssueResult = {
  rawToken: string;
  tokenHash: string;
};

export const GENERIC_AUTH_RESPONSE = {
  status: "accepted",
  message: "If the request can be completed, the account will be updated."
} as const;

function hashToken(token: string): string {
  // SHA-256 hash only; raw activation/reset tokens are never stored.
  return crypto.createHash("sha256").update(token).digest("base64url");
}

export function issueActivationToken(memberId: string, repositories: PlatformRepositories, purpose: "activation" | "reset" = "activation"): ActivationIssueResult {
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  repositories.activationTokens.create({ tokenHash, memberId, purpose, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), usedAt: null });
  return { rawToken, tokenHash };
}

export function consumeActivationToken(rawToken: string, repositories: PlatformRepositories, audit: AuditEventEmitter, correlationId: string): typeof GENERIC_AUTH_RESPONSE {
  const tokenHash = hashToken(rawToken);
  const consumed = repositories.activationTokens.consume(tokenHash, new Date().toISOString());

  if (consumed && Date.parse(consumed.expiresAt) > Date.now()) {
    repositories.memberAccounts.upsert({ id: consumed.memberId, emailHash: `hash_${consumed.memberId}`, authState: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    audit.emit({ action: "MEMBER_ONBOARDED", actor: "system", targetType: "member_account", targetId: consumed.memberId, correlationId, metadata: { purpose: consumed.purpose } });
  }

  return GENERIC_AUTH_RESPONSE;
}
