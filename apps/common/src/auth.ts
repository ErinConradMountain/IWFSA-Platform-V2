import type { IncomingMessage } from "node:http";

import type { ConsentState, SessionRepository, Standing } from "@iwfsa/common/session-repository";

export type Role = "member" | "admin" | "chief_admin";
export type SurfaceRequirement = "public" | "member" | "admin";
export type AuthSource = "anonymous" | "header" | "session";

const ROLE_TARGETS: Record<Role, string> = {
  member: "/member",
  admin: "/admin",
  chief_admin: "/admin"
};

export const SESSION_COOKIE_NAME = "iwfsa_session";

const ACCESS_RULES: Record<SurfaceRequirement, Role[]> = {
  public: [],
  member: ["member", "admin", "chief_admin"],
  admin: ["admin", "chief_admin"]
};

export type AuthContext = {
  isAuthenticated: boolean;
  role: Role | null;
  subject: string | null;
  standing: Standing;
  consent: ConsentState;
  sessionToken: string | null;
  authenticationSource: AuthSource;
};

export type AuthorizationDecision = {
  allowed: boolean;
  statusCode: number;
  reason: "public" | "authentication_required" | "insufficient_role" | "authorized";
};

export function normalizeRole(role: unknown): Role | null {
  if (typeof role !== "string") {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  return Object.hasOwn(ROLE_TARGETS, normalized) ? (normalized as Role) : null;
}

export function parseCookieHeader(cookieHeader: string | string[] | undefined): Record<string, string> {
  if (typeof cookieHeader !== "string" || cookieHeader.length === 0) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, entry) => {
      const separatorIndex = entry.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      cookies[key] = value;
      return cookies;
    }, {});
}

export function buildSessionCookie(token: string, options: { maxAgeSeconds?: number; secure?: boolean } = {}): string {
  const { maxAgeSeconds, secure = false } = options;
  const attributes = [`${SESSION_COOKIE_NAME}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax"];

  if (Number.isInteger(maxAgeSeconds) && Number(maxAgeSeconds) > 0) {
    attributes.push(`Max-Age=${maxAgeSeconds}`);
  }

  if (secure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function clearSessionCookie(options: { secure?: boolean } = {}): string {
  const { secure = false } = options;
  const attributes = [`${SESSION_COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];

  if (secure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function resolveAuthContext(
  request: IncomingMessage,
  options: { sessionRepository?: SessionRepository; allowHeaderAuth?: boolean } = {}
): AuthContext {
  const { sessionRepository, allowHeaderAuth = false } = options;
  const role = normalizeRole(request.headers["x-iwfsa-role"]);
  const subject = typeof request.headers["x-iwfsa-user"] === "string" ? request.headers["x-iwfsa-user"].trim() : null;

  if (allowHeaderAuth && role) {
    return {
      isAuthenticated: true,
      role,
      subject: subject || `demo:${role}`,
      standing: "active",
      consent: "granted",
      sessionToken: null,
      authenticationSource: "header"
    };
  }

  const cookies = parseCookieHeader(request.headers.cookie);
  const sessionToken = cookies[SESSION_COOKIE_NAME];
  const session = sessionRepository && sessionToken ? sessionRepository.getSession(sessionToken) : null;

  if (session) {
    return {
      isAuthenticated: Boolean(session.role),
      role: session.role,
      subject: session.subject,
      standing: session.standing,
      consent: session.consent,
      sessionToken,
      authenticationSource: "session"
    };
  }

  return {
    isAuthenticated: false,
    role: null,
    subject: null,
    standing: "anonymous",
    consent: "not_required",
    sessionToken: sessionToken || null,
    authenticationSource: "anonymous"
  };
}

export function resolveRouteForRole(role: unknown): string | null {
  const normalized = normalizeRole(role);
  return normalized ? ROLE_TARGETS[normalized] : null;
}

export function authorize(authContext: Pick<AuthContext, "isAuthenticated" | "role">, requirement: SurfaceRequirement): AuthorizationDecision {
  const allowedRoles = ACCESS_RULES[requirement];

  if (requirement === "public") {
    return { allowed: true, statusCode: 200, reason: "public" };
  }

  if (!authContext.isAuthenticated) {
    return { allowed: false, statusCode: 401, reason: "authentication_required" };
  }

  if (!authContext.role || !allowedRoles.includes(authContext.role)) {
    return { allowed: false, statusCode: 403, reason: "insufficient_role" };
  }

  return { allowed: true, statusCode: 200, reason: "authorized" };
}

export function buildAuthEvent(
  authContext: Pick<AuthContext, "role" | "subject">,
  action: string,
  outcome: string,
  detail: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    action,
    outcome,
    role: authContext.role,
    subject: authContext.subject,
    ...detail
  };
}
