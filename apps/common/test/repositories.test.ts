import test from "node:test";
import assert from "node:assert/strict";

import { buildAuditEvent } from "@iwfsa/common/audit";
import { createInMemoryRepositories, createPostgreSqlRepositories, type PlatformRepositories, type SqlClient } from "@iwfsa/common/repositories";

function createMemorySqlClient(): SqlClient {
  const tables = {
    memberAccount: new Map<string, any>(),
    memberProfile: new Map<string, any>(),
    membershipStatus: [] as any[],
    activationToken: new Map<string, any>(),
    importBatch: new Map<string, any>(),
    auditEvent: [] as any[]
  };

  return {
    execute(sql, params) {
      if (sql.includes("member_account")) {
        tables.memberAccount.set(params[0], { id: params[0], emailHash: params[1], authState: params[2], createdAt: params[3], updatedAt: params[4] });
      } else if (sql.includes("member_profile")) {
        tables.memberProfile.set(params[0], { memberId: params[0], displayName: params[1], biography: params[2], visibility: params[3], consent: params[4], approvedForPublic: params[5], updatedAt: params[6] });
      } else if (sql.includes("membership_status")) {
        tables.membershipStatus.push({ memberId: params[0], standing: params[1], effectiveAt: params[2], issuer: params[3] });
      } else if (sql.includes("activation_token")) {
        tables.activationToken.set(params[0], { tokenHash: params[0], memberId: params[1], purpose: params[2], expiresAt: params[3], usedAt: params[4] });
      } else if (sql.includes("import_batch")) {
        if (sql.includes("state = 'committed'")) {
          const current = tables.importBatch.get(params[1]);
          tables.importBatch.set(params[1], { ...current, state: "committed", committedAt: params[0] });
        } else {
          tables.importBatch.set(params[0], { id: params[0], sourceChecksum: params[1], state: params[2], rowCount: params[3], createdAt: params[4], committedAt: params[5] });
        }
      } else if (sql.includes("audit_event")) {
        tables.auditEvent.push({ action: params[0], actor: params[1], targetType: params[2], targetId: params[3], timestamp: params[4], correlationId: params[5], redactedMetadata: JSON.parse(String(params[6])), metadataHash: params[7] });
      }
    },
    query(sql, params) {
      if (sql.includes("member_account")) {
        return { rows: [tables.memberAccount.get(params[0])].filter(Boolean) };
      }
      if (sql.includes("member_profile")) {
        return { rows: [tables.memberProfile.get(params[0])].filter(Boolean) };
      }
      if (sql.includes("membership_status")) {
        return { rows: tables.membershipStatus.filter((row) => row.memberId === params[0]).slice(-1) };
      }
      if (sql.includes("activation_token") && sql.includes("update")) {
        const current = tables.activationToken.get(params[1]);
        if (!current || current.usedAt) {
          return { rows: [] };
        }
        const consumed = { ...current, usedAt: params[0] };
        tables.activationToken.set(params[1], consumed);
        return { rows: [consumed] };
      }
      if (sql.includes("import_batch") && sql.includes("update")) {
        const current = tables.importBatch.get(params[1]);
        return { rows: current ? [{ ...current, state: "committed", committedAt: params[0] }] : [] };
      }
      if (sql.includes("import_batch")) {
        return { rows: [tables.importBatch.get(params[0])].filter(Boolean) };
      }
      if (sql.includes("audit_event")) {
        return { rows: tables.auditEvent };
      }
      return { rows: [] };
    },
    transaction(work) {
      return work();
    }
  };
}

function runRepositoryContract(label: string, repositories: PlatformRepositories): void {
  test(`repository contract passes for ${label}`, () => {
    const account = repositories.memberAccounts.upsert({
      id: "member-1",
      emailHash: "hash-email",
      authState: "active",
      createdAt: "2026-05-03T00:00:00.000Z",
      updatedAt: "2026-05-03T00:00:00.000Z"
    });

    assert.equal(repositories.memberAccounts.findById(account.id)?.authState, "active");

    repositories.memberProfiles.upsert({
      memberId: "member-1",
      displayName: "Seed Member",
      biography: "Public-safe biography",
      visibility: "member_only",
      consent: "granted",
      approvedForPublic: false,
      updatedAt: "2026-05-03T00:00:00.000Z"
    });
    assert.equal(repositories.memberProfiles.findByMemberId("member-1")?.visibility, "member_only");

    repositories.membershipStatuses.append({ memberId: "member-1", standing: "active", effectiveAt: "2026-05-01", issuer: "admin" });
    repositories.membershipStatuses.append({ memberId: "member-1", standing: "blocked", effectiveAt: "2026-05-02", issuer: "admin" });
    assert.equal(repositories.membershipStatuses.latest("member-1")?.standing, "blocked");

    repositories.activationTokens.create({ tokenHash: "activation-hash", memberId: "member-1", purpose: "activation", expiresAt: "2026-05-04", usedAt: null });
    assert.equal(repositories.activationTokens.consume("activation-hash", "2026-05-03")?.usedAt, "2026-05-03");
    assert.equal(repositories.activationTokens.consume("activation-hash", "2026-05-03"), null);

    const preview = repositories.importBatches.upsertPreview({ id: "batch-1", sourceChecksum: "checksum", state: "preview", rowCount: 1, createdAt: "2026-05-03", committedAt: null });
    assert.equal(preview.state, "preview");
    assert.equal(repositories.importBatches.commit("batch-1", "2026-05-03")?.state, "committed");
    assert.equal(repositories.importBatches.commit("missing", "2026-05-03"), null);

    repositories.auditEvents.append(buildAuditEvent({
      action: "IMPORT_COMMITTED",
      actor: "admin",
      targetType: "import_batch",
      targetId: "batch-1",
      correlationId: "corr-1",
      metadata: { email: "person@example.test", rowCount: 1 }
    }));
    const auditEvent = repositories.auditEvents.list()[0];
    assert.equal(auditEvent.redactedMetadata.email, "[REDACTED]");
    assert.equal(auditEvent.redactedMetadata.rowCount, 1);
    assert.ok(auditEvent.metadataHash);
  });
}

runRepositoryContract("in-memory adapter", createInMemoryRepositories());
runRepositoryContract("PostgreSQL adapter contract client", createPostgreSqlRepositories(createMemorySqlClient()));
