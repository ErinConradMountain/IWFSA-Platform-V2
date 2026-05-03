import crypto from "node:crypto";

import type { Role } from "@iwfsa/common/auth";

export type Standing = "active" | "good" | "review" | "grace" | "outstanding" | "blocked" | "anonymous";
export type ConsentState = "granted" | "missing" | "revoked" | "not_required";
export type SessionRotationReason = "login" | "admin_elevation" | "standing_change" | "credential_reset";

export type Session = {
  token: string;
  role: Role | null;
  subject: string;
  standing: Standing;
  consent: ConsentState;
  createdAt: string;
  createdAtMs: number;
  rotatedAt?: string;
  expiresAtMs: number;
  csrfTokenHash: string | null;
};

export type CreateSessionInput = {
  role: Role | null;
  subject: string;
  standing?: Standing;
  consent?: ConsentState;
};

export type SessionRepository = {
  readonly ttlMs: number;
  createSession(input: CreateSessionInput): Session;
  getSession(token: string): Session | null;
  rotateSession(token: string, reason: SessionRotationReason, updates?: Partial<CreateSessionInput>): Session | null;
  rotateSessionsForSubject(subject: string, reason: SessionRotationReason, updates?: Partial<CreateSessionInput>): Session[];
  issueCsrfToken(token: string): string | null;
  consumeCsrfToken(token: string, submittedToken: string): boolean;
  deleteSession(token: string): boolean;
  clear(): void;
  size(): number;
};

export type PostgreSqlSessionClient = {
  query<T>(sql: string, params: unknown[]): { rows: T[] };
  execute(sql: string, params: unknown[]): void;
};

export function createOpaqueSessionId(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret).digest("base64url");
}

function createCsrfToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function createInMemorySessionRepository(options: { ttlMs?: number; now?: () => number } = {}): SessionRepository {
  const { ttlMs = 30 * 60 * 1000, now = () => Date.now() } = options;
  const sessions = new Map<string, Session>();

  function purgeExpiredSessions(): void {
    const currentTime = now();

    for (const [token, session] of sessions.entries()) {
      if (session.expiresAtMs <= currentTime) {
        sessions.delete(token);
      }
    }
  }

  return {
    createSession(input) {
      purgeExpiredSessions();

      const currentTime = now();
      const token = createOpaqueSessionId();
      const session: Session = {
        token,
        role: input.role,
        subject: input.subject,
        standing: input.standing || (input.role ? "active" : "anonymous"),
        consent: input.consent || (input.role ? "missing" : "not_required"),
        createdAt: new Date(currentTime).toISOString(),
        createdAtMs: currentTime,
        expiresAtMs: currentTime + ttlMs,
        csrfTokenHash: null
      };

      sessions.set(token, session);
      return session;
    },

    getSession(token) {
      purgeExpiredSessions();
      return sessions.get(token) || null;
    },

    rotateSession(token, reason, updates = {}) {
      purgeExpiredSessions();
      const existing = sessions.get(token);

      if (!existing) {
        return null;
      }

      sessions.delete(token);
      const currentTime = now();
      const nextToken = createOpaqueSessionId();
      const rotated: Session = {
        ...existing,
        ...updates,
        token: nextToken,
        standing: updates.standing || existing.standing,
        consent: updates.consent || existing.consent,
        createdAt: existing.createdAt,
        createdAtMs: existing.createdAtMs,
        rotatedAt: new Date(currentTime).toISOString(),
        expiresAtMs: currentTime + ttlMs,
        csrfTokenHash: null
      };

      sessions.set(nextToken, rotated);
      void reason;
      return rotated;
    },

    rotateSessionsForSubject(subject, reason, updates = {}) {
      purgeExpiredSessions();
      const matchingTokens = [...sessions.values()].filter((session) => session.subject === subject).map((session) => session.token);
      return matchingTokens.map((token) => this.rotateSession(token, reason, updates)).filter((session): session is Session => Boolean(session));
    },

    issueCsrfToken(token) {
      purgeExpiredSessions();
      const session = sessions.get(token);

      if (!session) {
        return null;
      }

      const csrfToken = createCsrfToken();
      session.csrfTokenHash = hashSecret(csrfToken);
      return csrfToken;
    },

    consumeCsrfToken(token, submittedToken) {
      purgeExpiredSessions();
      const session = sessions.get(token);

      if (!session || !session.csrfTokenHash) {
        return false;
      }

      const submittedHash = hashSecret(submittedToken);
      const valid = crypto.timingSafeEqual(Buffer.from(session.csrfTokenHash), Buffer.from(submittedHash));
      session.csrfTokenHash = null;
      return valid;
    },

    deleteSession(token) {
      return sessions.delete(token);
    },

    clear() {
      sessions.clear();
    },

    ttlMs,

    size() {
      purgeExpiredSessions();
      return sessions.size;
    }
  };
}

export function createPostgreSqlSessionRepository(client: PostgreSqlSessionClient, options: { ttlMs?: number; now?: () => number } = {}): SessionRepository {
  const { ttlMs = 30 * 60 * 1000, now = () => Date.now() } = options;

  function purgeExpiredSessions(): void {
    client.execute("delete from app_session where expires_at_ms <= $1", [now()]);
  }

  function fromRow(row: Record<string, unknown>): Session {
    return {
      token: String(row.token),
      role: row.role ? (String(row.role) as Role) : null,
      subject: String(row.subject),
      standing: String(row.standing) as Standing,
      consent: String(row.consent) as ConsentState,
      createdAt: String(row.created_at),
      createdAtMs: Number(row.created_at_ms),
      rotatedAt: row.rotated_at ? String(row.rotated_at) : undefined,
      expiresAtMs: Number(row.expires_at_ms),
      csrfTokenHash: row.csrf_token_hash ? String(row.csrf_token_hash) : null
    };
  }

  return {
    ttlMs,

    createSession(input) {
      purgeExpiredSessions();
      const currentTime = now();
      const session: Session = {
        token: createOpaqueSessionId(),
        role: input.role,
        subject: input.subject,
        standing: input.standing || (input.role ? "active" : "anonymous"),
        consent: input.consent || (input.role ? "missing" : "not_required"),
        createdAt: new Date(currentTime).toISOString(),
        createdAtMs: currentTime,
        expiresAtMs: currentTime + ttlMs,
        csrfTokenHash: null
      };

      client.execute(
        "insert into app_session (token, role, subject, standing, consent, created_at, created_at_ms, expires_at_ms, csrf_token_hash) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [session.token, session.role, session.subject, session.standing, session.consent, session.createdAt, session.createdAtMs, session.expiresAtMs, session.csrfTokenHash]
      );
      return session;
    },

    getSession(token) {
      purgeExpiredSessions();
      const result = client.query<Record<string, unknown>>("select * from app_session where token = $1 and expires_at_ms > $2 limit 1", [token, now()]);
      return result.rows[0] ? fromRow(result.rows[0]) : null;
    },

    rotateSession(token, reason, updates = {}) {
      const existing = this.getSession(token);

      if (!existing) {
        return null;
      }

      const currentTime = now();
      const rotated: Session = {
        ...existing,
        ...updates,
        token: createOpaqueSessionId(),
        standing: updates.standing || existing.standing,
        consent: updates.consent || existing.consent,
        rotatedAt: new Date(currentTime).toISOString(),
        expiresAtMs: currentTime + ttlMs,
        csrfTokenHash: null
      };

      client.execute("delete from app_session where token = $1", [token]);
      client.execute(
        "insert into app_session (token, role, subject, standing, consent, created_at, created_at_ms, rotated_at, expires_at_ms, csrf_token_hash) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        [rotated.token, rotated.role, rotated.subject, rotated.standing, rotated.consent, rotated.createdAt, rotated.createdAtMs, rotated.rotatedAt, rotated.expiresAtMs, rotated.csrfTokenHash]
      );
      void reason;
      return rotated;
    },

    rotateSessionsForSubject(subject, reason, updates = {}) {
      const tokens = client.query<{ token: string }>("select token from app_session where subject = $1 and expires_at_ms > $2", [subject, now()]).rows.map((row) => row.token);
      return tokens.map((token) => this.rotateSession(token, reason, updates)).filter((session): session is Session => Boolean(session));
    },

    issueCsrfToken(token) {
      const session = this.getSession(token);

      if (!session) {
        return null;
      }

      const csrfToken = createCsrfToken();
      client.execute("update app_session set csrf_token_hash = $1 where token = $2", [hashSecret(csrfToken), token]);
      return csrfToken;
    },

    consumeCsrfToken(token, submittedToken) {
      const session = this.getSession(token);

      if (!session?.csrfTokenHash) {
        return false;
      }

      const submittedHash = hashSecret(submittedToken);
      const valid = crypto.timingSafeEqual(Buffer.from(session.csrfTokenHash), Buffer.from(submittedHash));
      client.execute("update app_session set csrf_token_hash = null where token = $1", [token]);
      return valid;
    },

    deleteSession(token) {
      client.execute("delete from app_session where token = $1", [token]);
      return true;
    },

    clear() {
      client.execute("delete from app_session", []);
    },

    size() {
      purgeExpiredSessions();
      const result = client.query<{ count: number | string }>("select count(*) as count from app_session", []);
      return Number(result.rows[0]?.count || 0);
    }
  };
}
