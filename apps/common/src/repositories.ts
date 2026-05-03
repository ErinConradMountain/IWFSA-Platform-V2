import type { AuditEvent } from "@iwfsa/common/audit";
import type { ConsentState, Standing } from "@iwfsa/common/session-repository";

export type AuthState = "pending_activation" | "active" | "locked";
export type ProfileVisibility = "hidden" | "member_only" | "public";
export type ImportBatchState = "preview" | "committed" | "failed";

export type MemberAccount = {
  id: string;
  emailHash: string;
  authState: AuthState;
  createdAt: string;
  updatedAt: string;
};

export type MemberProfile = {
  memberId: string;
  displayName: string;
  biography: string;
  visibility: ProfileVisibility;
  consent: ConsentState;
  approvedForPublic: boolean;
  updatedAt: string;
};

export type MembershipStatus = {
  memberId: string;
  standing: Exclude<Standing, "anonymous">;
  effectiveAt: string;
  issuer: string;
};

export type ActivationToken = {
  tokenHash: string;
  memberId: string;
  purpose: "activation" | "reset";
  expiresAt: string;
  usedAt: string | null;
};

export type ImportBatch = {
  id: string;
  sourceChecksum: string;
  state: ImportBatchState;
  rowCount: number;
  createdAt: string;
  committedAt: string | null;
};

export type ImportRowAction = "create" | "update" | "skip" | "fail";

export type ImportBatchRow = {
  batchId: string;
  rowNumber: number;
  sourceKey: string;
  verifiedEmailHash: string | null;
  displayName: string;
  action: ImportRowAction;
  issues: string[];
  rawSnapshotHash: string;
};

export type OutboxMessage = {
  id: string;
  eventType: "activation_invite";
  payloadRef: string;
  state: "pending" | "sent" | "failed";
  createdAt: string;
};

export type MemberAccountRepo = {
  upsert(account: MemberAccount): MemberAccount;
  findById(id: string): MemberAccount | null;
};

export type MemberProfileRepo = {
  upsert(profile: MemberProfile): MemberProfile;
  findByMemberId(memberId: string): MemberProfile | null;
};

export type MembershipStatusRepo = {
  append(status: MembershipStatus): MembershipStatus;
  latest(memberId: string): MembershipStatus | null;
};

export type ActivationTokenRepo = {
  create(token: ActivationToken): ActivationToken;
  consume(tokenHash: string, usedAt: string): ActivationToken | null;
};

export type ImportBatchRepo = {
  upsertPreview(batch: ImportBatch): ImportBatch;
  commit(id: string, committedAt: string): ImportBatch | null;
  findById(id: string): ImportBatch | null;
};

export type ImportBatchRowRepo = {
  replacePreviewRows(batchId: string, rows: ImportBatchRow[]): ImportBatchRow[];
  listByBatch(batchId: string): ImportBatchRow[];
};

export type OutboxRepo = {
  enqueue(message: OutboxMessage): OutboxMessage;
  list(): OutboxMessage[];
};

export type AuditEventRepo = {
  append(event: AuditEvent): AuditEvent;
  list(): AuditEvent[];
};

export type PlatformRepositories = {
  memberAccounts: MemberAccountRepo;
  memberProfiles: MemberProfileRepo;
  membershipStatuses: MembershipStatusRepo;
  activationTokens: ActivationTokenRepo;
  importBatches: ImportBatchRepo;
  importBatchRows: ImportBatchRowRepo;
  outbox: OutboxRepo;
  auditEvents: AuditEventRepo;
};

export type SqlClient = {
  query<T>(sql: string, params: unknown[]): { rows: T[] };
  execute(sql: string, params: unknown[]): void;
  transaction<T>(work: () => T): T;
};

export function createInMemoryRepositories(): PlatformRepositories {
  const memberAccounts = new Map<string, MemberAccount>();
  const memberProfiles = new Map<string, MemberProfile>();
  const membershipStatuses = new Map<string, MembershipStatus[]>();
  const activationTokens = new Map<string, ActivationToken>();
  const importBatches = new Map<string, ImportBatch>();
  const importBatchRows = new Map<string, ImportBatchRow[]>();
  const outboxMessages: OutboxMessage[] = [];
  const auditEvents: AuditEvent[] = [];

  return {
    memberAccounts: {
      upsert(account) {
        memberAccounts.set(account.id, account);
        return account;
      },
      findById(id) {
        return memberAccounts.get(id) || null;
      }
    },
    memberProfiles: {
      upsert(profile) {
        memberProfiles.set(profile.memberId, profile);
        return profile;
      },
      findByMemberId(memberId) {
        return memberProfiles.get(memberId) || null;
      }
    },
    membershipStatuses: {
      append(status) {
        const current = membershipStatuses.get(status.memberId) || [];
        current.push(status);
        membershipStatuses.set(status.memberId, current);
        return status;
      },
      latest(memberId) {
        const current = membershipStatuses.get(memberId) || [];
        return current.at(-1) || null;
      }
    },
    activationTokens: {
      create(token) {
        activationTokens.set(token.tokenHash, token);
        return token;
      },
      consume(tokenHash, usedAt) {
        const token = activationTokens.get(tokenHash);

        if (!token || token.usedAt) {
          return null;
        }

        const consumed = { ...token, usedAt };
        activationTokens.set(tokenHash, consumed);
        return consumed;
      }
    },
    importBatches: {
      upsertPreview(batch) {
        const existing = importBatches.get(batch.id);
        const next = existing?.state === "committed" ? existing : batch;
        importBatches.set(batch.id, next);
        return next;
      },
      commit(id, committedAt) {
        const batch = importBatches.get(id);

        if (!batch) {
          return null;
        }

        const committed = { ...batch, state: "committed" as const, committedAt };
        importBatches.set(id, committed);
        return committed;
      },
      findById(id) {
        return importBatches.get(id) || null;
      }
    },
    importBatchRows: {
      replacePreviewRows(batchId, rows) {
        importBatchRows.set(batchId, rows);
        return rows;
      },
      listByBatch(batchId) {
        return [...(importBatchRows.get(batchId) || [])];
      }
    },
    outbox: {
      enqueue(message) {
        if (!outboxMessages.some((existing) => existing.id === message.id)) {
          outboxMessages.push(message);
        }
        return message;
      },
      list() {
        return [...outboxMessages];
      }
    },
    auditEvents: {
      append(event) {
        auditEvents.push(event);
        return event;
      },
      list() {
        return [...auditEvents];
      }
    }
  };
}

export function createPostgreSqlRepositories(client: SqlClient): PlatformRepositories {
  return {
    memberAccounts: {
      upsert(account) {
        client.execute(
          "insert into member_account (id, email_hash, auth_state, created_at, updated_at) values ($1,$2,$3,$4,$5) on conflict (id) do update set email_hash = excluded.email_hash, auth_state = excluded.auth_state, updated_at = excluded.updated_at",
          [account.id, account.emailHash, account.authState, account.createdAt, account.updatedAt]
        );
        return account;
      },
      findById(id) {
        const result = client.query<MemberAccount>("select id, email_hash as \"emailHash\", auth_state as \"authState\", created_at as \"createdAt\", updated_at as \"updatedAt\" from member_account where id = $1", [id]);
        return result.rows[0] || null;
      }
    },
    memberProfiles: {
      upsert(profile) {
        client.execute(
          "insert into member_profile (member_id, display_name, biography, visibility, consent, approved_for_public, updated_at) values ($1,$2,$3,$4,$5,$6,$7) on conflict (member_id) do update set display_name = excluded.display_name, biography = excluded.biography, visibility = excluded.visibility, consent = excluded.consent, approved_for_public = excluded.approved_for_public, updated_at = excluded.updated_at",
          [profile.memberId, profile.displayName, profile.biography, profile.visibility, profile.consent, profile.approvedForPublic, profile.updatedAt]
        );
        return profile;
      },
      findByMemberId(memberId) {
        const result = client.query<MemberProfile>(
          "select member_id as \"memberId\", display_name as \"displayName\", biography, visibility, consent, approved_for_public as \"approvedForPublic\", updated_at as \"updatedAt\" from member_profile where member_id = $1",
          [memberId]
        );
        return result.rows[0] || null;
      }
    },
    membershipStatuses: {
      append(status) {
        client.execute("insert into membership_status (member_id, standing, effective_at, issuer) values ($1,$2,$3,$4)", [status.memberId, status.standing, status.effectiveAt, status.issuer]);
        return status;
      },
      latest(memberId) {
        const result = client.query<MembershipStatus>(
          "select member_id as \"memberId\", standing, effective_at as \"effectiveAt\", issuer from membership_status where member_id = $1 order by effective_at desc limit 1",
          [memberId]
        );
        return result.rows[0] || null;
      }
    },
    activationTokens: {
      create(token) {
        client.execute("insert into activation_token (token_hash, member_id, purpose, expires_at, used_at) values ($1,$2,$3,$4,$5)", [token.tokenHash, token.memberId, token.purpose, token.expiresAt, token.usedAt]);
        return token;
      },
      consume(tokenHash, usedAt) {
        const result = client.query<ActivationToken>(
          "update activation_token set used_at = $1 where token_hash = $2 and used_at is null returning token_hash as \"tokenHash\", member_id as \"memberId\", purpose, expires_at as \"expiresAt\", used_at as \"usedAt\"",
          [usedAt, tokenHash]
        );
        return result.rows[0] || null;
      }
    },
    importBatches: {
      upsertPreview(batch) {
        client.execute(
          "insert into import_batch (id, source_checksum, state, row_count, created_at, committed_at) values ($1,$2,$3,$4,$5,$6) on conflict (id) do update set source_checksum = excluded.source_checksum, row_count = excluded.row_count where import_batch.state <> 'committed'",
          [batch.id, batch.sourceChecksum, batch.state, batch.rowCount, batch.createdAt, batch.committedAt]
        );
        return batch;
      },
      commit(id, committedAt) {
        const result = client.query<ImportBatch>(
          "update import_batch set state = 'committed', committed_at = $1 where id = $2 returning id, source_checksum as \"sourceChecksum\", state, row_count as \"rowCount\", created_at as \"createdAt\", committed_at as \"committedAt\"",
          [committedAt, id]
        );
        return result.rows[0] || null;
      },
      findById(id) {
        const result = client.query<ImportBatch>("select id, source_checksum as \"sourceChecksum\", state, row_count as \"rowCount\", created_at as \"createdAt\", committed_at as \"committedAt\" from import_batch where id = $1", [id]);
        return result.rows[0] || null;
      }
    },
    importBatchRows: {
      replacePreviewRows(batchId, rows) {
        client.transaction(() => {
          client.execute("delete from import_batch_row where batch_id = $1", [batchId]);
          for (const row of rows) {
            client.execute(
              "insert into import_batch_row (batch_id, row_number, source_key, verified_email_hash, display_name, action, issues, raw_snapshot_hash) values ($1,$2,$3,$4,$5,$6,$7,$8)",
              [row.batchId, row.rowNumber, row.sourceKey, row.verifiedEmailHash, row.displayName, row.action, JSON.stringify(row.issues), row.rawSnapshotHash]
            );
          }
        });
        return rows;
      },
      listByBatch(batchId) {
        return client.query<ImportBatchRow>(
          "select batch_id as \"batchId\", row_number as \"rowNumber\", source_key as \"sourceKey\", verified_email_hash as \"verifiedEmailHash\", display_name as \"displayName\", action, issues, raw_snapshot_hash as \"rawSnapshotHash\" from import_batch_row where batch_id = $1 order by row_number asc",
          [batchId]
        ).rows;
      }
    },
    outbox: {
      enqueue(message) {
        client.execute(
          "insert into outbox_message (id, event_type, payload_ref, state, created_at) values ($1,$2,$3,$4,$5) on conflict (id) do nothing",
          [message.id, message.eventType, message.payloadRef, message.state, message.createdAt]
        );
        return message;
      },
      list() {
        return client.query<OutboxMessage>("select id, event_type as \"eventType\", payload_ref as \"payloadRef\", state, created_at as \"createdAt\" from outbox_message order by created_at asc", []).rows;
      }
    },
    auditEvents: {
      append(event) {
        client.execute(
          "insert into audit_event (action, actor, target_type, target_id, timestamp, correlation_id, redacted_metadata, metadata_hash) values ($1,$2,$3,$4,$5,$6,$7,$8)",
          [event.action, event.actor, event.targetType, event.targetId, event.timestamp, event.correlationId, JSON.stringify(event.redactedMetadata), event.metadataHash]
        );
        return event;
      },
      list() {
        return client.query<AuditEvent>("select action, actor, target_type as \"targetType\", target_id as \"targetId\", timestamp, correlation_id as \"correlationId\", redacted_metadata as \"redactedMetadata\", metadata_hash as \"metadataHash\" from audit_event order by timestamp asc", []).rows;
      }
    }
  };
}
