import http from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";

import { brand } from "@iwfsa/common/design-tokens";
import { evaluate, type Surface, type TaskId } from "@iwfsa/common/policy";
import { buildHealthPayload, readRequestBody, sendHtml, sendJson, sendRedirect, type ServiceConfig } from "@iwfsa/common/runtime";
import type { ConsentState, Standing } from "@iwfsa/common/session-repository";
import {
  renderInfoCallout,
  renderPriorityPanel,
  renderStatusBadges,
  type PriorityItem
} from "./design-components.ts";

type WebRole = "member" | "admin" | "chief_admin";

type WebAuthSession = {
  isAuthenticated: boolean;
  role: WebRole | null;
  subject: string | null;
  standing: Standing;
  consent: ConsentState;
  nextRoute: string | null;
  authServiceAvailable?: boolean;
  allowRoleSelfSelection?: boolean;
};

type AuthGateway = {
  inspectSession(cookieHeader: string): Promise<WebAuthSession>;
  createSession(input: { role: string | null; subject: string | null }): Promise<{
    ok: boolean;
    status: number;
    body: Record<string, unknown>;
    setCookie: string | null;
  }>;
  clearSession(cookieHeader: string): Promise<{
    ok: boolean;
    status: number;
    body: Record<string, unknown>;
    setCookie: string | null;
  }>;
};

type WebDependencies = {
  authGateway?: AuthGateway;
  fetchImpl?: typeof fetch;
};

type NavSurface = "public" | "member" | "admin";
type TestSeedMember = {
  seedId: string;
  displayName: string;
  status: string;
  organisation?: string;
  roleTitle?: string;
  testIdentifiers?: string[];
};
type AdminMemberView = {
  id: string;
  displayName: string;
  roleTitle: string;
  organisation: string;
  status: string;
  updatedAt: string;
};
type AdminEventView = {
  id: string;
  title: string;
  status: string;
  maxCapacity: number;
  registeredCount: number;
  waitlistCount: number;
  version: number;
};
type PublicApprovalQueueView = {
  id: string;
  profileId: string;
  memberId: string;
  profileVersion: string;
  requestedAt: string;
  status: string;
  contentType: string;
  requiresDualApproval: boolean;
};

const LEGACY_ASSET_ROOT = join(process.cwd(), "apps", "web", "public", "legacy-assets");
const LEGACY_SEED_MEMBER_PATH = join(process.cwd(), "seed", "legacy-members.json");
const BRAND_CSS_VERSION = "2026-05-06-header-actions";
const LEGACY_MEMBER_IMAGES = [
  "/legacy-assets/member-portrait-ayanda.svg",
  "/legacy-assets/member-portrait-lerato.svg",
  "/legacy-assets/member-portrait-nomsa.svg",
  "/legacy-assets/member-portrait-zara.svg"
] as const;
const LEGACY_TEST_PASSWORD_SHA256 = "6NWJSIgTFnsbOom52Qs5etzFoRaW5uKVyfM08roPOCI";
const LEGACY_TEST_ADMIN_IDENTIFIERS = ["akeida", "akeida@iwfsa.local", "admin@iwfsa.local"];

let seedMembersCleared = false;

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeCredentialIdentifier(value: unknown): string {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalized.endsWith("@example.com") ? normalized.slice(0, -"@example.com".length) : normalized;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

function safeHashEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "base64url");
  const rightBuffer = Buffer.from(right, "base64url");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function readLegacySeedMembers(): TestSeedMember[] {
  try {
    const parsed = JSON.parse(readFileSync(LEGACY_SEED_MEMBER_PATH, "utf8")) as { members?: TestSeedMember[] };
    return Array.isArray(parsed.members) ? parsed.members : [];
  } catch {
    return [];
  }
}

function activeLegacySeedMembers(): TestSeedMember[] {
  return seedMembersCleared ? [] : readLegacySeedMembers();
}

function verifyLegacyTestCredentials(input: { subject: string | null; accessCode: string | null }): { role: WebRole; subject: string } | null {
  const subject = normalizeCredentialIdentifier(input.subject);
  const accessCode = typeof input.accessCode === "string" ? input.accessCode : "";

  if (!subject || !safeHashEquals(sha256(accessCode), LEGACY_TEST_PASSWORD_SHA256)) {
    return null;
  }

  if (LEGACY_TEST_ADMIN_IDENTIFIERS.includes(subject)) {
    return { role: "admin", subject: "akeida" };
  }

  const seedMember = activeLegacySeedMembers().find((member) =>
    (member.testIdentifiers || []).map(normalizeCredentialIdentifier).includes(subject)
  );

  if (!seedMember || normalizeCredentialIdentifier(seedMember.status) !== "active") {
    return null;
  }

  return { role: "member", subject: seedMember.seedId };
}

function publicLegacyImage(input: unknown, index = 0): string {
  const candidate = String(input || "");
  return candidate.startsWith("/legacy-assets/") ? candidate : LEGACY_MEMBER_IMAGES[index % LEGACY_MEMBER_IMAGES.length];
}

async function readFormBody(request: http.IncomingMessage): Promise<URLSearchParams> {
  return new URLSearchParams((await readRequestBody(request)).toString("utf8"));
}

function routeForRole(role: string | null): string {
  return role === "member" ? "/member/dashboard" : role === "admin" || role === "chief_admin" ? "/admin" : "/signin";
}

function inferLocalRole(input: { explicitRole: string | null; subject: string | null; allowRoleSelfSelection: boolean }): string | null {
  if (input.explicitRole) {
    return input.explicitRole;
  }

  if (!input.allowRoleSelfSelection) {
    return null;
  }

  const normalizedSubject = String(input.subject || "").toLowerCase();
  if (normalizedSubject.includes("chief")) {
    return "chief_admin";
  }
  if (normalizedSubject.includes("admin")) {
    return "admin";
  }
  return "member";
}

function getApiBaseUrl(config: ServiceConfig): string {
  return config.apiBaseUrl || "http://127.0.0.1:4000";
}

function mergeCookies(first: string | null, second: string | null): string {
  return [first, second].filter(Boolean).join("; ");
}

function createApiAuthGateway(config: ServiceConfig, dependencies: WebDependencies = {}): AuthGateway {
  const baseUrl = getApiBaseUrl(config);
  const customFetch = dependencies.fetchImpl || fetch;

  return {
    async inspectSession(cookieHeader) {
      const response = await customFetch(`${baseUrl}/api/auth/session`, {
        headers: cookieHeader ? { cookie: cookieHeader } : {}
      });

      if (!response.ok) {
        throw new Error(`Failed to inspect session: ${response.status}`);
      }

      const body = (await response.json()) as WebAuthSession;
      return {
        ...body,
        nextRoute: routeForRole(body.role)
      };
    },

    async createSession({ role, subject }) {
      const csrfResponse = await customFetch(`${baseUrl}/api/csrf-token`);
      const csrfBody = (await csrfResponse.json()) as { csrfToken?: string };
      const csrfCookie = csrfResponse.headers.get("set-cookie");
      const response = await customFetch(`${baseUrl}/api/auth/session`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrfBody.csrfToken || "",
          cookie: csrfCookie || ""
        },
        body: JSON.stringify({ role, subject })
      });

      const body = (await response.json()) as Record<string, unknown>;
      return {
        ok: response.ok,
        status: response.status,
        body: {
          ...body,
          nextRoute: routeForRole(role)
        },
        setCookie: response.headers.get("set-cookie")
      };
    },

    async clearSession(cookieHeader) {
      const csrfResponse = await customFetch(`${baseUrl}/api/csrf-token`, {
        headers: cookieHeader ? { cookie: cookieHeader } : {}
      });
      const csrfBody = (await csrfResponse.json()) as { csrfToken?: string };
      const csrfCookie = csrfResponse.headers.get("set-cookie");
      const response = await customFetch(`${baseUrl}/api/auth/session`, {
        method: "DELETE",
        headers: {
          "x-csrf-token": csrfBody.csrfToken || "",
          cookie: mergeCookies(cookieHeader, csrfCookie)
        }
      });

      const body = (await response.json()) as Record<string, unknown>;
      return {
        ok: response.ok,
        status: response.status,
        body,
        setCookie: response.headers.get("set-cookie")
      };
    }
  };
}

async function requestAdminSeedCleanSlate(config: ServiceConfig, cookieHeader: string, fetchImpl: typeof fetch): Promise<boolean> {
  const baseUrl = getApiBaseUrl(config);
  const csrfResponse = await fetchImpl(`${baseUrl}/api/csrf-token`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {}
  });
  const csrfBody = (await csrfResponse.json()) as { csrfToken?: string };
  const csrfCookie = csrfResponse.headers.get("set-cookie");
  const response = await fetchImpl(`${baseUrl}/api/admin/members/clean-slate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfBody.csrfToken || "",
      cookie: mergeCookies(cookieHeader || null, csrfCookie)
    },
    body: JSON.stringify({ confirmation: "clear-temporary-seed-members" })
  });

  return response.ok;
}

async function adminApiRequest(
  config: ServiceConfig,
  cookieHeader: string,
  fetchImpl: typeof fetch,
  input: { method: "GET" | "POST" | "PATCH" | "DELETE"; path: string; body?: Record<string, unknown> }
): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  const baseUrl = getApiBaseUrl(config);
  const headers: Record<string, string> = { accept: "application/json" };

  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  if (input.method !== "GET") {
    const csrfResponse = await fetchImpl(`${baseUrl}/api/csrf-token`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {}
    });
    const csrfBody = (await csrfResponse.json()) as { csrfToken?: string };
    const csrfCookie = csrfResponse.headers.get("set-cookie");
    headers["content-type"] = "application/json";
    headers["x-csrf-token"] = csrfBody.csrfToken || "";
    headers.cookie = mergeCookies(cookieHeader || null, csrfCookie);
  }

  const response = await fetchImpl(`${baseUrl}${input.path}`, {
    method: input.method,
    headers,
    body: input.method === "GET" ? undefined : JSON.stringify(input.body || {})
  });
  let body: Record<string, unknown> = {};
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  return { ok: response.ok, status: response.status, body };
}

async function fetchAdminMembers(config: ServiceConfig, cookieHeader: string, fetchImpl: typeof fetch): Promise<AdminMemberView[]> {
  const response = await adminApiRequest(config, cookieHeader, fetchImpl, { method: "GET", path: "/api/admin/members" });
  return Array.isArray(response.body.members) ? response.body.members as AdminMemberView[] : [];
}

async function fetchAdminEvents(config: ServiceConfig, cookieHeader: string, fetchImpl: typeof fetch): Promise<AdminEventView[]> {
  const response = await adminApiRequest(config, cookieHeader, fetchImpl, { method: "GET", path: "/api/admin/events" });
  return Array.isArray(response.body.events) ? response.body.events as AdminEventView[] : [];
}

async function fetchAdminPublicQueue(config: ServiceConfig, cookieHeader: string, fetchImpl: typeof fetch): Promise<PublicApprovalQueueView[]> {
  try {
    const response = await adminApiRequest(config, cookieHeader, fetchImpl, { method: "GET", path: "/api/admin/public-profiles/queue" });
    return Array.isArray(response.body.records) ? response.body.records as PublicApprovalQueueView[] : [];
  } catch {
    return [];
  }
}

async function fetchMemberEvents(config: ServiceConfig, cookieHeader: string, fetchImpl: typeof fetch): Promise<AdminEventView[]> {
  const response = await adminApiRequest(config, cookieHeader, fetchImpl, { method: "GET", path: "/api/events" });
  return Array.isArray(response.body.events) ? response.body.events as AdminEventView[] : [];
}

function renderBrandCss(): string {
  return `:root {
  --iwfsa-primary: ${brand.colors.primary};
  --iwfsa-secondary: ${brand.colors.secondary};
  --iwfsa-background: ${brand.colors.background};
  --iwfsa-surface: ${brand.colors.surface};
  --iwfsa-text: ${brand.colors.text};
  --iwfsa-muted-text: ${brand.colors.mutedText};
  --iwfsa-focus: ${brand.colors.focus};
  --iwfsa-home-ink: ${brand.colors.legacyHome.ink};
  --iwfsa-home-ink-soft: ${brand.colors.legacyHome.inkSoft};
  --iwfsa-home-panel: ${brand.colors.legacyHome.panel};
  --iwfsa-home-panel-warm: ${brand.colors.legacyHome.panelWarm};
  --iwfsa-home-bg-top: ${brand.colors.legacyHome.backgroundTop};
  --iwfsa-home-bg-mid: ${brand.colors.legacyHome.backgroundMid};
  --iwfsa-home-bg-bottom: ${brand.colors.legacyHome.backgroundBottom};
  --iwfsa-home-accent: ${brand.colors.legacyHome.accent};
  --iwfsa-home-accent-warm: ${brand.colors.legacyHome.accentWarm};
  --iwfsa-home-accent-dark: ${brand.colors.legacyHome.accentDark};
  --iwfsa-home-hero-ink: ${brand.colors.legacyHome.heroInk};
  --iwfsa-home-hero-mid: ${brand.colors.legacyHome.heroMid};
  --iwfsa-home-hero-deep: ${brand.colors.legacyHome.heroDeep};
  --iwfsa-home-photo-warm: ${brand.colors.legacyHome.photoWarm};
  --iwfsa-home-photo-deep: ${brand.colors.legacyHome.photoDeep};
  --iwfsa-private: ${brand.colors.semantic.private};
  --iwfsa-members: ${brand.colors.semantic.members};
  --iwfsa-public: ${brand.colors.semantic.public};
  --iwfsa-audit: ${brand.colors.semantic.audit};
  --iwfsa-motion: ${brand.motion.duration.base};
  --iwfsa-ease: ${brand.motion.easing.standard};
  font-family: ${brand.typography.fontFamily};
}
* { box-sizing: border-box; }
html { background: var(--iwfsa-background); }
body { margin: 0; max-width: 100%; overflow-x: hidden; background: linear-gradient(180deg, color-mix(in srgb, var(--iwfsa-surface) 82%, var(--iwfsa-background)), var(--iwfsa-background)); color: var(--iwfsa-text); font-family: ${brand.typography.fontFamily}; }
body.page-public-home, body.page-sign-in { background: linear-gradient(180deg, var(--iwfsa-home-bg-top) 0%, var(--iwfsa-home-bg-mid) 50%, var(--iwfsa-home-bg-bottom) 100%); color: var(--iwfsa-home-ink); min-height: 100vh; }
main { max-width: 72rem; margin: 0 auto; padding: 1.25rem 1rem 4rem; }
.landing-main { max-width: none; padding: 0; }
.shell { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.65fr); gap: 2rem; align-items: stretch; background: linear-gradient(180deg, var(--iwfsa-background), color-mix(in srgb, var(--iwfsa-surface) 72%, var(--iwfsa-background))); border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 14%, transparent); border-radius: 0.5rem; padding: clamp(1rem, 2vw, 1.65rem); box-shadow: 0 1.25rem 3rem color-mix(in srgb, var(--iwfsa-primary) 12%, transparent); }
.shell-single { grid-template-columns: minmax(0, 1fr); }
.shell-content { padding: 1rem; }
.eyebrow { color: var(--iwfsa-primary); font-size: ${brand.typography.scale.sm}; font-weight: 800; letter-spacing: 0; text-transform: uppercase; }
h1 { color: var(--iwfsa-primary); font-size: ${brand.typography.scale.xxl}; margin: 0.5rem 0 1rem; line-height: 1.12; overflow-wrap: anywhere; }
h2 { color: var(--iwfsa-primary); font-size: ${brand.typography.scale.lg}; margin: 0 0 0.6rem; line-height: 1.2; }
p, li { color: var(--iwfsa-muted-text); line-height: 1.6; }
ul { padding-left: 1.2rem; }
img { max-width: 100%; height: auto; }
.surface-nav { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.5rem; align-items: center; }
.surface-nav a, .primary-action, button { display: inline-flex; min-height: 2.75rem; align-items: center; justify-content: center; color: var(--iwfsa-primary); background: var(--iwfsa-background); border: 1px solid color-mix(in srgb, var(--iwfsa-secondary) 78%, var(--iwfsa-primary)); border-radius: 999px; padding: 0.72rem 1.15rem; text-decoration: none; font-weight: 800; cursor: pointer; transition: transform var(--iwfsa-motion) var(--iwfsa-ease), box-shadow var(--iwfsa-motion) var(--iwfsa-ease), background-color var(--iwfsa-motion) var(--iwfsa-ease); }
.surface-nav a:hover, .primary-action:hover, button:hover { transform: translateY(-1px); box-shadow: 0 0.5rem 1.4rem color-mix(in srgb, var(--iwfsa-primary) 14%, transparent); }
.primary-action, button[type="submit"] { background: var(--iwfsa-primary); color: var(--iwfsa-background); border-color: var(--iwfsa-primary); }
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid var(--iwfsa-focus); outline-offset: 2px; }
label { display: block; margin: 0.8rem 0; color: var(--iwfsa-text); font-weight: 700; }
input, select { width: min(100%, 24rem); min-height: 2.75rem; border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 48%, var(--iwfsa-muted-text)); border-radius: 0.45rem; padding: 0.55rem 0.75rem; background: var(--iwfsa-background); }
form { margin-top: 1.2rem; }
.signin-form { display: grid; gap: 0.85rem; max-width: 26rem; }
.signin-form label { margin: 0; }
.signin-form input { display: block; width: 100%; margin-top: 0.35rem; }
.signin-form button { justify-self: start; min-width: 8rem; }
.form-note { margin-top: 0.8rem; font-size: ${brand.typography.scale.sm}; color: var(--iwfsa-muted-text); }
.delight { color: var(--iwfsa-primary); font-weight: 700; }
.visibility-public { border-left: 0.25rem solid var(--iwfsa-public); padding: 0.8rem 0 0.8rem 0.95rem; }
.visibility-members { border-left: 0.25rem solid var(--iwfsa-members); padding: 0.8rem 0 0.8rem 0.95rem; }
.visibility-private { border-left: 0.25rem solid var(--iwfsa-private); padding: 0.8rem 0 0.8rem 0.95rem; }
.info-callout { border-left: 0.25rem solid var(--iwfsa-focus); background: color-mix(in srgb, var(--iwfsa-focus) 10%, var(--iwfsa-surface)); padding: 0.95rem 1rem; margin: 1rem 0; border-radius: 0.45rem; }
.info-callout strong { display: block; color: var(--iwfsa-primary); margin-bottom: 0.25rem; }
.info-callout p { margin: 0; color: var(--iwfsa-text); }
.audit-preview { color: var(--iwfsa-audit); font-weight: 700; }
.landing-hero { position: relative; min-height: 78svh; overflow: hidden; display: grid; align-items: center; padding: 5rem max(1rem, calc((100vw - 72rem) / 2)) 4rem; background: var(--iwfsa-primary); }
.landing-hero::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, color-mix(in srgb, var(--iwfsa-primary) 94%, var(--iwfsa-text)), color-mix(in srgb, var(--iwfsa-primary) 72%, transparent) 48%, color-mix(in srgb, var(--iwfsa-primary) 22%, transparent)); z-index: 1; }
.hero-collage { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(4, 1fr); opacity: 0.72; }
.hero-collage img { width: 100%; height: 100%; object-fit: cover; filter: saturate(0.9); }
.hero-copy { position: relative; z-index: 2; max-width: 42rem; color: var(--iwfsa-background); }
.hero-copy .eyebrow, .hero-copy h1, .hero-copy p { color: var(--iwfsa-background); }
.hero-copy h1 { font-size: clamp(2rem, 6vw, 4.3rem); }
.hero-copy p { max-width: 36rem; font-size: ${brand.typography.scale.lg}; }
.hero-actions { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-top: 1.5rem; }
.hero-actions .primary-action { background: var(--iwfsa-secondary); border-color: var(--iwfsa-secondary); color: var(--iwfsa-primary); }
.hero-actions .secondary-action { display: inline-flex; min-height: 2.75rem; align-items: center; border: 1px solid color-mix(in srgb, var(--iwfsa-background) 75%, transparent); border-radius: 999px; padding: 0.72rem 1.15rem; color: var(--iwfsa-background); text-decoration: none; font-weight: 800; }
.landing-band { padding: 2.5rem max(1rem, calc((100vw - 72rem) / 2)); display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start; }
.landing-band h2 { font-size: ${brand.typography.scale.xl}; }
.landing-pillars { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; padding: 0; list-style: none; }
.landing-pillars li { background: var(--iwfsa-surface); border-left: 0.25rem solid var(--iwfsa-secondary); border-radius: 0.45rem; padding: 0.85rem; color: var(--iwfsa-text); font-weight: 700; }
.story-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin: 1.5rem 0; }
.story-card { min-width: 0; border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 14%, transparent); border-radius: 0.5rem; overflow: hidden; background: var(--iwfsa-background); }
.story-card img, .story-portrait { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: var(--iwfsa-surface); }
.story-card-content { padding: 1rem; }
.story-card a { color: var(--iwfsa-primary); font-weight: 800; }
.skip-link { position: absolute; top: -3rem; left: 1rem; padding: 0.6rem 0.85rem; border-radius: 999px; background: var(--iwfsa-home-ink); color: var(--iwfsa-background); text-decoration: none; z-index: 100; }
.skip-link:focus-visible { top: 1rem; }
.site-header { position: sticky; top: 0; z-index: 30; padding: 0.75rem 0 0.65rem; backdrop-filter: blur(20px); background: color-mix(in srgb, var(--iwfsa-home-panel-warm) 90%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--iwfsa-home-ink) 8%, transparent); box-shadow: 0 0.75rem 1.5rem color-mix(in srgb, var(--iwfsa-home-ink) 5%, transparent); }
.site-header-shell { width: min(1100px, 92%); margin: 0 auto; display: grid; grid-template-columns: minmax(25rem, 1fr) minmax(20rem, 0.78fr) auto; grid-template-areas: "brand mission nav"; align-items: start; gap: 0.65rem 1.55rem; }
.site-header-shell.is-dense-nav { position: relative; display: flex; flex-direction: column; align-items: stretch; gap: 0.85rem; padding-top: 3.4rem; }
.brand-lockup { grid-area: brand; min-width: 0; }
.brand-link { display: inline-flex; align-items: center; gap: 0.85rem; text-decoration: none; color: inherit; }
.brand-logo { flex: 0 0 auto; width: 9.25rem; height: auto; display: block; }
.brand-copy { display: grid; gap: 0.08rem; min-width: 0; }
.site-header-shell.is-dense-nav .brand-lockup { width: 100%; }
.site-header-shell.is-dense-nav .brand-link { display: grid; grid-template-columns: auto minmax(0, 1fr); width: 100%; }
.brand-title { color: var(--iwfsa-home-ink); font-size: clamp(1.05rem, 2vw, 1.42rem); font-weight: 800; line-height: 1.05; overflow-wrap: anywhere; }
.brand-subtitle { color: var(--iwfsa-home-ink-soft); line-height: 1.5; }
.header-mission { grid-area: mission; max-width: 31rem; margin: 0.1rem 0 0; color: var(--iwfsa-home-ink-soft); font-size: clamp(0.9rem, 1.1vw, 1.02rem); font-weight: 700; line-height: 1.38; overflow-wrap: anywhere; }
.site-header-actions { grid-area: nav; justify-self: end; display: inline-flex; align-items: center; gap: 0.45rem; width: fit-content; }
.site-nav { grid-area: nav; justify-self: end; display: inline-flex; flex-wrap: wrap; align-items: center; gap: 0.45rem; }
.site-header-shell.is-dense-nav .header-mission, .site-header-shell.is-dense-nav .site-nav { max-width: none; }
.site-header-shell.is-dense-nav .site-nav { justify-self: auto; }
.site-header-shell.is-dense-nav .site-header-actions { position: absolute; top: 0; right: 0; align-self: auto; justify-self: auto; margin-left: 0; order: 0; width: auto; }
.site-nav a, .site-nav button { display: inline-flex; align-items: center; justify-content: center; min-width: 6.8rem; min-height: 3rem; color: var(--iwfsa-background); text-decoration: none; white-space: nowrap; background: linear-gradient(135deg, var(--iwfsa-home-accent), color-mix(in srgb, var(--iwfsa-home-accent-dark) 70%, var(--iwfsa-home-accent-warm))); border: 1px solid color-mix(in srgb, var(--iwfsa-home-accent-dark) 36%, transparent); border-radius: 999px; padding: 0.62rem 1.18rem; font-size: 1rem; line-height: 1; font-weight: 800; box-shadow: 0 8px 18px color-mix(in srgb, var(--iwfsa-home-accent-dark) 16%, transparent); transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease; }
.site-nav a:hover, .site-nav a:focus-visible, .site-nav button:hover, .site-nav button:focus-visible { transform: translateY(-1px); background: linear-gradient(135deg, color-mix(in srgb, var(--iwfsa-home-accent-dark) 72%, var(--iwfsa-home-accent)), var(--iwfsa-home-accent-dark)); box-shadow: 0 11px 22px color-mix(in srgb, var(--iwfsa-home-accent-dark) 22%, transparent); }
.site-nav form, .site-header-actions form { margin: 0; }
.site-nav button { cursor: pointer; font: inherit; }
.v1-page-shell { width: min(1100px, 92%); max-width: none; margin: 0 auto; padding: 0 0 2rem; }
.v1-panel { border: 1px solid color-mix(in srgb, var(--iwfsa-home-ink) 16%, transparent); border-radius: 14px; background: color-mix(in srgb, var(--iwfsa-home-panel) 92%, transparent); box-shadow: 0 22px 56px color-mix(in srgb, var(--iwfsa-home-ink) 13%, transparent); backdrop-filter: blur(18px); }
.v1-public-hero { position: relative; width: 100vw; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw); border-left: 0; border-right: 0; border-radius: 0; background: radial-gradient(circle at 18% 22%, color-mix(in srgb, var(--iwfsa-home-accent-warm) 18%, transparent), transparent 18%), radial-gradient(circle at 84% 18%, color-mix(in srgb, var(--iwfsa-primary) 24%, transparent), transparent 22%), linear-gradient(135deg, var(--iwfsa-home-hero-ink) 0%, var(--iwfsa-home-hero-mid) 52%, var(--iwfsa-home-hero-deep) 100%); box-shadow: none; overflow: hidden; display: grid; grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.18fr); grid-template-rows: auto 1fr; gap: clamp(1.25rem, 2.4vw, 2rem); align-items: stretch; padding: clamp(1.2rem, 2.2vw, 1.7rem); }
.v1-public-hero::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, color-mix(in srgb, var(--iwfsa-background) 3.5%, transparent), transparent 18%, transparent 82%, color-mix(in srgb, var(--iwfsa-background) 3%, transparent)), radial-gradient(circle at 18% 25%, color-mix(in srgb, var(--iwfsa-home-accent-warm) 8%, transparent), transparent 24%); pointer-events: none; }
.v1-hero-copy, .v1-featured-figure { position: relative; z-index: 1; }
.v1-hero-copy { display: grid; align-content: start; gap: 0.8rem; width: 100%; max-width: 39rem; margin-left: 0; animation: v1-hero-rise 0.8s ease-out both; }
.v1-eyebrow { margin: 0; text-transform: uppercase; font-weight: 700; letter-spacing: 0.08em; color: var(--iwfsa-home-accent); }
.v1-eyebrow-contrast { color: color-mix(in srgb, var(--iwfsa-background) 72%, transparent); }
.v1-page-title { margin: 0.3rem 0 0; max-width: 100%; color: color-mix(in srgb, var(--iwfsa-background) 96%, var(--iwfsa-home-panel-warm)); font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif; font-weight: 600; line-height: 0.98; letter-spacing: 0; white-space: normal; font-size: clamp(2.35rem, 3.4vw, 3.05rem); overflow-wrap: normal; word-break: normal; }
.v1-lead { margin: 0.85rem 0 0; max-width: 36rem; color: color-mix(in srgb, var(--iwfsa-background) 78%, transparent); font-size: 1.02rem; line-height: 1.7; }
.v1-featured-figure { grid-column: 2; grid-row: 1 / span 2; margin: 0; animation: v1-hero-rise 1s ease-out both; animation-delay: 0.08s; width: 100%; align-self: stretch; display: flex; }
.v1-photo-frame { position: relative; width: 100%; min-height: clamp(23rem, 37vw, 30rem); border-radius: 30px; background: linear-gradient(180deg, var(--iwfsa-home-photo-warm) 0%, var(--iwfsa-home-photo-deep) 100%); border: 1px solid color-mix(in srgb, var(--iwfsa-home-accent-warm) 22%, transparent); box-shadow: 0 30px 80px color-mix(in srgb, var(--iwfsa-home-hero-ink) 54%, transparent); overflow: hidden; }
.v1-photo-frame::before { content: ""; position: absolute; inset: auto 0 0; height: 42%; background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--iwfsa-text) 22%, transparent)); pointer-events: none; z-index: 1; }
.v1-photo-frame::after { content: ""; position: absolute; inset: 0; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--iwfsa-background) 8%, transparent), inset 0 20px 40px color-mix(in srgb, var(--iwfsa-background) 8%, transparent); pointer-events: none; }
.v1-hero-image { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center top; }
.v1-public-highlights { width: min(1100px, 92%); margin: 1rem auto 2rem; }
.v1-highlight-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.v1-highlight-card { min-height: 100%; padding: 1.1rem 1.15rem; background: linear-gradient(180deg, color-mix(in srgb, var(--iwfsa-home-panel) 99%, transparent), color-mix(in srgb, var(--iwfsa-surface) 99%, transparent)); border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 18%, transparent); border-radius: 14px; color: var(--iwfsa-home-ink); box-shadow: 0 18px 38px color-mix(in srgb, var(--iwfsa-primary) 12%, transparent); }
.v1-highlight-card strong { display: block; font-size: 0.98rem; line-height: 1.3; }
.v1-highlight-card span { display: block; margin-top: 0.35rem; color: var(--iwfsa-home-ink-soft); line-height: 1.45; }
.v1-home-actions { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-top: 1.4rem; }
.v1-promo-copy { grid-column: 1; align-self: end; max-width: 34rem; margin: 0; padding: 0.95rem 1rem; border-left: 0.22rem solid var(--iwfsa-home-accent); background: color-mix(in srgb, var(--iwfsa-background) 5%, transparent); color: color-mix(in srgb, var(--iwfsa-background) 84%, transparent); line-height: 1.55; font-size: 1.02rem; }
.v1-button { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0.75rem 1.15rem; border-radius: 999px; border: 1px solid transparent; background: linear-gradient(135deg, var(--iwfsa-home-accent), var(--iwfsa-home-accent-warm)); color: var(--iwfsa-background); text-decoration: none; font-weight: 800; letter-spacing: 0.01em; box-shadow: 0 16px 34px color-mix(in srgb, var(--iwfsa-primary) 18%, transparent); transition: transform 0.18s ease, box-shadow 0.18s ease; }
.v1-button:hover, .v1-button:focus-visible { transform: translateY(-1px); box-shadow: 0 20px 42px color-mix(in srgb, var(--iwfsa-primary) 24%, transparent); }
.v1-button-ghost { background: color-mix(in srgb, var(--iwfsa-background) 72%, transparent); border-color: color-mix(in srgb, var(--iwfsa-home-hero-deep) 14%, transparent); color: var(--iwfsa-home-ink); box-shadow: none; }
.v1-sign-in-stage { position: relative; min-height: min(78vh, 48rem); margin-top: clamp(1rem, 2vw, 1.6rem); border-radius: 28px; overflow: hidden; background: linear-gradient(135deg, color-mix(in srgb, var(--iwfsa-home-hero-ink) 94%, transparent), color-mix(in srgb, var(--iwfsa-primary) 90%, transparent)), url("/legacy-assets/iwfsa-home.jpg") center / cover no-repeat; box-shadow: 0 32px 80px color-mix(in srgb, var(--iwfsa-home-hero-ink) 30%, transparent); }
.v1-sign-in-stage-backdrop { position: absolute; inset: 0; background: linear-gradient(90deg, color-mix(in srgb, var(--iwfsa-home-hero-ink) 66%, transparent) 0%, color-mix(in srgb, var(--iwfsa-home-hero-ink) 50%, transparent) 38%, color-mix(in srgb, var(--iwfsa-home-hero-ink) 22%, transparent) 100%); }
.v1-sign-in-stage-copy { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, auto) minmax(14rem, 24rem); align-items: end; column-gap: 1.35rem; row-gap: 0.45rem; width: min(46rem, calc(100% - 3rem)); padding: clamp(1.5rem, 3vw, 2.4rem) clamp(1.5rem, 3vw, 2.4rem) 0; color: var(--iwfsa-background); }
.v1-sign-in-stage-copy .v1-eyebrow { grid-column: 1 / -1; }
.v1-sign-in-stage-copy .v1-page-title { margin: 0; color: var(--iwfsa-background); }
.v1-sign-in-stage-copy .v1-lead { margin: 0 0 0.35rem; max-width: 24rem; color: color-mix(in srgb, var(--iwfsa-background) 84%, transparent); }
.v1-sign-in-card { position: absolute; top: 56%; left: 50%; z-index: 2; width: min(19.5rem, calc(100% - 2rem)); border: 1px solid color-mix(in srgb, var(--iwfsa-background) 24%, transparent); border-radius: 22px; background: color-mix(in srgb, var(--iwfsa-background) 92%, var(--iwfsa-surface)); box-shadow: 0 28px 52px color-mix(in srgb, var(--iwfsa-home-hero-ink) 28%, transparent); backdrop-filter: blur(18px); transform: translate(-50%, -50%); transition: box-shadow 180ms ease; }
.v1-sign-in-card:hover, .v1-sign-in-card:focus-within { box-shadow: 0 34px 60px color-mix(in srgb, var(--iwfsa-home-hero-ink) 34%, transparent); }
.v1-sign-in-card-handle { display: flex; align-items: center; justify-content: flex-start; padding: 0.8rem 0.9rem 0.45rem; }
.v1-sign-in-card-brand { display: flex; align-items: center; gap: 0.7rem; padding: 0 0.9rem 0.55rem; color: var(--iwfsa-home-ink-soft); font-size: 0.82rem; font-weight: 700; }
.v1-sign-in-form { display: grid; gap: 0.45rem; padding: 0 0.9rem 0.9rem; max-width: none; margin: 0; }
.v1-sign-in-form label { margin: 0; font-size: 0.88rem; font-weight: 700; color: color-mix(in srgb, var(--iwfsa-home-ink) 84%, transparent); }
.v1-sign-in-form input { width: 100%; min-height: 2.45rem; border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 16%, transparent); border-radius: 12px; padding: 0.62rem 0.78rem; font: inherit; background: color-mix(in srgb, var(--iwfsa-background) 96%, transparent); color: var(--iwfsa-home-ink); }
.v1-sign-in-form button { margin-top: 0.3rem; min-height: 2.55rem; width: auto; background: linear-gradient(135deg, var(--iwfsa-home-accent), var(--iwfsa-home-accent-dark)); color: var(--iwfsa-background); border: 0; border-radius: 999px; padding: 0.55rem 0.9rem; font-weight: 800; }
.v1-sign-in-status { margin: 0.25rem 0 0; color: var(--iwfsa-home-ink-soft); font-size: ${brand.typography.scale.sm}; }
.preview-credential-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.55rem; padding: 0 0.9rem 0.9rem; }
.preview-credential { border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 14%, transparent); border-radius: 12px; padding: 0.65rem; background: color-mix(in srgb, var(--iwfsa-surface) 84%, var(--iwfsa-background)); }
.preview-credential strong, .preview-credential span { display: block; }
.preview-credential span { color: var(--iwfsa-home-ink-soft); font-size: ${brand.typography.scale.xs}; line-height: 1.45; }
.admin-seed-tools { display: grid; gap: 1rem; margin-top: 1rem; }
.admin-seed-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 0.75rem; }
.admin-seed-card { border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 16%, transparent); border-radius: 8px; padding: 0.8rem; background: var(--iwfsa-background); box-shadow: 0 0.7rem 1.4rem color-mix(in srgb, var(--iwfsa-primary) 7%, transparent); }
.admin-seed-card strong, .admin-seed-card span { display: block; }
.admin-clean-form { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
.event-workspace { display: grid; gap: 1rem; margin-top: 1.2rem; }
.event-toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; padding: 0.85rem; border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 14%, transparent); border-radius: 8px; background: color-mix(in srgb, var(--iwfsa-home-panel) 82%, var(--iwfsa-background)); }
.event-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); gap: 0.9rem; }
.event-card { display: grid; gap: 0.65rem; border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 16%, transparent); border-radius: 8px; padding: 0.95rem; background: linear-gradient(180deg, color-mix(in srgb, var(--iwfsa-background) 96%, transparent), color-mix(in srgb, var(--iwfsa-home-panel) 70%, var(--iwfsa-background))); box-shadow: 0 14px 30px color-mix(in srgb, var(--iwfsa-primary) 9%, transparent); }
.event-card h2, .event-card h3 { margin: 0; color: var(--iwfsa-primary); }
.event-meta { display: flex; flex-wrap: wrap; gap: 0.45rem; margin: 0; }
.event-meta span { display: inline-flex; align-items: center; min-height: 2rem; border-radius: 999px; padding: 0.32rem 0.65rem; background: color-mix(in srgb, var(--iwfsa-home-accent) 12%, var(--iwfsa-background)); color: var(--iwfsa-home-ink); font-weight: 700; font-size: ${brand.typography.scale.sm}; }
.event-actions { display: flex; flex-wrap: wrap; gap: 0.55rem; align-items: end; margin: 0; }
.event-actions label { margin: 0; }
.event-actions input, .event-actions select { width: min(100%, 13rem); }
.event-status { margin: 0; color: var(--iwfsa-home-ink-soft); font-weight: 700; }
.design-workspace { display: grid; gap: 1rem; margin-top: 1.2rem; }
.design-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 0.85rem; }
.design-panel { display: grid; gap: 0.45rem; border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 14%, transparent); border-radius: 8px; padding: 0.95rem; background: color-mix(in srgb, var(--iwfsa-background) 94%, var(--iwfsa-home-panel)); box-shadow: 0 0.75rem 1.6rem color-mix(in srgb, var(--iwfsa-primary) 7%, transparent); }
.design-panel h2, .design-panel h3 { margin: 0; color: var(--iwfsa-primary); }
.design-panel p { margin: 0; }
.design-panel ul { margin: 0.3rem 0 0; }
.reviewer-hero { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(16rem, 0.85fr); gap: 1rem; align-items: stretch; margin: 1rem 0 1.2rem; }
.reviewer-card { border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 14%, transparent); border-radius: 8px; padding: 1rem; background: linear-gradient(180deg, color-mix(in srgb, var(--iwfsa-background) 96%, transparent), color-mix(in srgb, var(--iwfsa-surface) 78%, var(--iwfsa-background))); }
.reviewer-card strong { display: block; color: var(--iwfsa-primary); margin-bottom: 0.35rem; }
.metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr)); gap: 0.75rem; margin: 1rem 0; }
.metric-card { border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 13%, transparent); border-radius: 8px; padding: 0.85rem; background: var(--iwfsa-background); }
.metric-card strong { display: block; color: var(--iwfsa-primary); font-size: ${brand.typography.scale.xl}; line-height: 1.1; }
.metric-card span { display: block; color: var(--iwfsa-muted-text); font-size: ${brand.typography.scale.sm}; line-height: 1.35; margin-top: 0.2rem; }
.review-record { display: grid; gap: 0.55rem; border-left: 0.25rem solid var(--iwfsa-public); }
.record-meta { display: flex; flex-wrap: wrap; gap: 0.45rem; margin: 0; }
.record-meta span { display: inline-flex; min-height: 2rem; align-items: center; border-radius: 999px; padding: 0.3rem 0.62rem; background: color-mix(in srgb, var(--iwfsa-primary) 7%, var(--iwfsa-background)); color: var(--iwfsa-home-ink); font-size: ${brand.typography.scale.sm}; font-weight: 800; }
.review-route-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: 0.75rem; margin-top: 1rem; }
.review-route { min-height: 100%; color: inherit; text-decoration: none; }
.review-route:hover, .review-route:focus-visible { transform: translateY(-1px); box-shadow: 0 1rem 2rem color-mix(in srgb, var(--iwfsa-primary) 12%, transparent); }
.status-row { display: flex; flex-wrap: wrap; gap: 0.45rem; margin: 0; }
.status-badge { display: inline-flex; align-items: center; min-height: 2rem; border-radius: 999px; padding: 0.32rem 0.65rem; background: color-mix(in srgb, var(--iwfsa-primary) 8%, var(--iwfsa-background)); color: var(--iwfsa-home-ink); font-size: ${brand.typography.scale.sm}; font-weight: 800; }
.status-badge.members { border-left: 0.25rem solid var(--iwfsa-members); }
.status-badge.public { border-left: 0.25rem solid var(--iwfsa-public); }
.status-badge.private { border-left: 0.25rem solid var(--iwfsa-private); }
.status-badge.audit { border-left: 0.25rem solid var(--iwfsa-audit); }
.status-badge.warning { border-left: 0.25rem solid var(--iwfsa-home-accent); }
.route-note { border-left: 0.25rem solid var(--iwfsa-audit); background: color-mix(in srgb, var(--iwfsa-audit) 8%, var(--iwfsa-background)); padding: 0.85rem; border-radius: 8px; }
.compact-list { display: grid; gap: 0.65rem; padding: 0; list-style: none; }
.compact-list li { border-left: 0.25rem solid var(--iwfsa-secondary); padding-left: 0.75rem; color: var(--iwfsa-text); }
@keyframes v1-hero-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 1100px) {
  .v1-public-hero { grid-template-columns: 1fr; grid-template-rows: auto; gap: 1rem; }
  .v1-featured-figure { grid-column: 1; grid-row: auto; }
  .v1-photo-frame { min-height: clamp(18rem, 52vw, 26rem); }
}
@media (max-width: 760px) {
  main { padding-inline: 0.8rem; }
  .shell, .landing-band, .story-grid { grid-template-columns: 1fr; }
  .shell { padding: 0.75rem; }
  .shell-content { padding: 0.45rem; }
  .shell-content > p { max-width: 20rem; }
  h1 { font-size: ${brand.typography.scale.xl}; }
  .landing-hero { min-height: 82svh; padding-top: 4rem; }
  .hero-collage { grid-template-columns: repeat(2, 1fr); }
  .landing-pillars { grid-template-columns: 1fr; }
  .site-header-shell { width: calc(100% - 2rem); grid-template-columns: minmax(0, 1fr); grid-template-areas: "brand" "mission" "nav"; align-items: start; gap: 0.75rem; }
  .v1-page-shell { width: calc(100% - 1rem); }
  .brand-link { display: grid; grid-template-columns: 4.8rem minmax(0, 1fr); gap: 0.5rem; width: 100%; }
  .brand-logo { width: 4.8rem; }
  .brand-title { max-width: 13rem; font-size: 0.95rem; line-height: 1.1; }
  .brand-subtitle { display: none; }
  .header-mission { max-width: 22rem; font-size: 0.95rem; line-height: 1.35; }
  .site-nav { justify-self: stretch; width: 100%; }
  .site-nav a, .site-nav button { flex: 1 1 7.5rem; min-width: 0; min-height: 2.45rem; padding: 0.5rem 0.7rem; }
  .v1-public-hero { grid-template-columns: 1fr; gap: 1rem; min-height: 0; }
  .v1-hero-copy { width: 100%; margin-left: 0; margin-bottom: 0.4rem; text-align: left; }
  .v1-featured-figure { grid-column: 1; grid-row: auto; }
  .v1-photo-frame { min-height: clamp(17rem, 58vw, 24rem); }
  .v1-page-title { white-space: normal; font-size: clamp(2rem, 10vw, 3rem); }
  .v1-lead { max-width: none; }
  .v1-promo-copy { margin-top: 0; }
  .v1-highlight-grid { grid-template-columns: 1fr; }
  .v1-sign-in-stage { min-height: min(82vh, 44rem); display: flex; flex-direction: column; justify-content: flex-start; gap: 0.9rem; padding-bottom: 1rem; }
  .v1-sign-in-stage-copy { grid-template-columns: 1fr; align-items: start; width: calc(100% - 1.5rem); max-width: none; padding: 1.35rem 0.75rem 0; }
  .v1-sign-in-stage-copy .v1-lead { margin-bottom: 0; }
  .v1-sign-in-card { position: relative; top: auto; left: auto; transform: none; width: calc(100% - 1.5rem); max-width: 22rem; margin: 0 0.75rem; }
  .preview-credential-grid, .reviewer-hero { grid-template-columns: 1fr; }
  .event-actions, .surface-nav { align-items: stretch; }
  .surface-nav a, .primary-action, button, input, select { min-height: 44px; }
  .event-actions button, .event-actions input, .event-actions select { width: 100%; }
}`;
}

function renderPage(title: string, body: string): string {
  return renderSiteChrome({ title, body, surface: "public" });
}

function navigationSurfaceForSession(session: Pick<WebAuthSession, "isAuthenticated" | "role">): NavSurface {
  if (!session.isAuthenticated) {
    return "public";
  }

  return session.role === "member" ? "member" : "admin";
}

function renderSiteHeader(input: { surface: NavSurface; currentPath?: string; includeSignOut?: boolean }): string {
  const links: Record<NavSurface, Array<[string, string]>> = {
    public: [["/", "Home"], ["/signin", "Sign in"]],
    member: [["/", "Home"], ["/member/dashboard", "Dashboard"], ["/member/profile", "Profile"], ["/member/events", "Events"], ["/member/directory", "Directory"], ["/member/notifications", "Notifications"]],
    admin: [["/", "Home"], ["/admin", "Console"], ["/admin/events", "Events"], ["/admin/members", "Members"], ["/admin/imports", "Imports"], ["/admin/standing", "Standing"]]
  };

  const navLinks = links[input.surface].map(([href, label]) => {
    const current = input.currentPath === href ? ' aria-current="page"' : "";
    const primary = input.surface === "public" && href === "/signin" && input.currentPath === "/" ? ' data-primary-action="true"' : "";
    return `<a href="${href}"${current}${primary}>${escapeHtml(label)}</a>`;
  }).join("");
  const signOut = input.includeSignOut ? `<div class="site-header-actions"><form method="post" action="/signout"><button type="submit">Sign out</button></form></div>` : "";
  const shellClass = input.surface === "public" ? "site-header-shell" : "site-header-shell is-dense-nav";

  return `<header class="site-header">
      <div class="${shellClass}">
        <div class="brand-lockup">
          <a class="brand-link" href="/">
            <img class="brand-logo" src="/legacy-assets/iwfsa-logo.svg" alt="International Women's Forum South Africa" />
            <span class="brand-copy">
              <span class="v1-eyebrow">IWFSA Web Platform</span>
              <span class="brand-title">International Women's Forum South Africa</span>
              <span class="brand-subtitle">Public website, member workspace, and governance console</span>
            </span>
          </a>
        </div>
        ${signOut}
        <p class="header-mission">Advancing women leaders through connection, mentoring, leadership development, and a trusted national forum that strengthens ethical leadership and meaningful impact across South Africa.</p>
        <nav class="site-nav" aria-label="Primary" data-surface-nav="${input.surface}">${navLinks}</nav>
      </div>
    </header>`;
}

function renderSiteChrome(input: { title: string; body: string; surface: NavSurface; robots?: string; pageClass?: string; currentPath?: string; includeSignOut?: boolean }): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${input.robots ? `<meta name="robots" content="${escapeHtml(input.robots)}" />` : ""}
    <title>${escapeHtml(input.title)}</title>
    <link rel="stylesheet" href="/brand.css?v=${BRAND_CSS_VERSION}" />
  </head>
  <body${input.pageClass ? ` class="${escapeHtml(input.pageClass)}"` : ""}>
    <a class="skip-link" href="#main-content">Skip to content</a>
    ${renderSiteHeader({ surface: input.surface, currentPath: input.currentPath, includeSignOut: input.includeSignOut })}
    <main id="main-content" class="v1-page-shell">${input.body}</main>
  </body>
</html>`;
}

function renderPublicPage(title: string, body: string, robots = "index, follow"): string {
  return renderSiteChrome({ title, body, robots, surface: "public" });
}

function renderV1PublicChrome(input: { title: string; body: string; pageClass: string; currentPath: "/" | "/signin"; headerSurface?: NavSurface; includeSignOut?: boolean }): string {
  return renderSiteChrome({
    title: input.title,
    body: input.body,
    robots: "index, follow",
    surface: input.headerSurface || "public",
    pageClass: input.pageClass,
    currentPath: input.currentPath,
    includeSignOut: input.includeSignOut
  });
}

function renderLandingPage(input: { currentSession?: Pick<WebAuthSession, "isAuthenticated" | "role"> } = {}): string {
  const headerSurface = navigationSurfaceForSession(input.currentSession || { isAuthenticated: false, role: null });
  return renderV1PublicChrome({
    title: "IWFSA | Public",
    currentPath: "/",
    pageClass: "page-public-home",
    headerSurface,
    includeSignOut: headerSurface !== "public",
    body: `
      <section class="v1-panel v1-public-hero" data-route-surface="public">
        <div class="v1-hero-copy">
          <p class="v1-eyebrow v1-eyebrow-contrast">Public Service | International Women's Forum South Africa</p>
          <h1 class="v1-page-title">Leading with Purpose.</h1>
          <p class="v1-lead">
            IWFSA brings women leaders together through purposeful programmes, mentoring, and events, creating a forum for connection, leadership growth, and meaningful impact across South Africa.
          </p>
        </div>
        <figure class="v1-featured-figure">
          <div class="v1-photo-frame">
            <img
              id="public-hero-image"
              class="v1-hero-image"
              src="/legacy-assets/iwfsa-home.jpg"
              alt="IWFSA leaders meeting around a conference table in Sandton while a presentation screen reads Ignite. Inspire. Impact."
              loading="eager"
              decoding="async"
            />
          </div>
        </figure>
        <p class="v1-promo-copy">A professional home for accomplished women to exchange knowledge, mentor future leaders, strengthen networks, and contribute to ethical leadership across sectors.</p>
      </section>
`
  });
}

function renderShell(input: {
  title: string;
  eyebrow: string;
  heading: string;
  summary: string;
  items: string[];
  surface: NavSurface;
  currentPath?: string;
  includeSignOut?: boolean;
  primaryAction?: { href: string; label: string };
  extra?: string;
}): string {
  const list = input.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const primaryAction = input.primaryAction
    ? `<a class="primary-action" data-primary-action="true" href="${input.primaryAction.href}">${escapeHtml(input.primaryAction.label)}</a>`
    : "";
  return renderSiteChrome({
    title: input.title,
    surface: input.surface,
    currentPath: input.currentPath,
    includeSignOut: input.includeSignOut ?? input.surface !== "public",
    body: `<section class="shell shell-single" data-route-surface="${input.surface}">
      <div class="shell-content">
        <div class="eyebrow">${escapeHtml(input.eyebrow)}</div>
        <h1>${escapeHtml(input.heading)}</h1>
        <p>${escapeHtml(input.summary)}</p>
        <ul>${list}</ul>
        ${primaryAction}
        ${input.extra || ""}
      </div>
    </section>`
  });
}

function renderPrototypeNote(kind: "profile" | "import" | "approval"): string {
  const copy = {
    profile: `<div class="visibility-members" aria-label="Biography, visible to members only">Biography visibility: members only. Consent is required before public preview.</div><p class="audit-preview">Audit label: profile.visibility.changed</p>`,
    import: `<div class="visibility-private" aria-label="Import row, private admin preview">Duplicate resolution preview. No live member table is mutated.</div><p class="audit-preview">Audit label: import.preview.resolved_duplicate</p>`,
    approval: `<div class="visibility-public" aria-label="Public profile preview, approved content only">Approved public render preview. Hidden fields are not present.</div><p class="audit-preview">Audit label: public_profile.approved</p>`
  };

  return copy[kind];
}

function renderPreviewCredentials(): string {
  return `<section class="preview-credential-grid" aria-label="Temporary preview credentials">
    <article class="preview-credential">
      <strong>Admin preview</strong>
      <span>Username: akeida</span>
      <span>Password: 1possibility</span>
    </article>
    <article class="preview-credential">
      <strong>Member preview</strong>
      <span>Username: naledi.k</span>
      <span>Password: 1possibility</span>
    </article>
  </section>`;
}

function renderAdminSeedTools(input: { cleaned?: boolean } = {}): string {
  const members = input.cleaned ? [] : activeLegacySeedMembers();
  const cards = members.map((member) => `<article class="admin-seed-card">
    <strong>${escapeHtml(member.displayName)}</strong>
    <span>${escapeHtml(member.roleTitle || "Member")}</span>
    <span>${escapeHtml(member.organisation || "Seed organisation")}</span>
    <span>Status: ${escapeHtml(member.status)}</span>
  </article>`).join("");
  const notice = input.cleaned || seedMembersCleared
    ? `<p class="visibility-private">Temporary seed members are cleared in this running preview. Restarting the service restores the seed file until permanent persistence is added.</p>`
    : `<p class="audit-preview">Temporary V1 fixture members loaded: ${members.length}. Admin can clear them before the production member import.</p>`;

  return `<section class="admin-seed-tools" aria-labelledby="admin-seed-tools-title">
    <h2 id="admin-seed-tools-title">Temporary member seed controls</h2>
    ${notice}
    <form class="admin-clean-form" method="post" action="/admin/members/clean-slate">
      <input type="hidden" name="confirmation" value="clear-temporary-seed-members" />
      <button type="submit">Clear temporary seed members</button>
    </form>
    <div class="admin-seed-grid">${cards || "<p>No temporary seed members are currently loaded.</p>"}</div>
  </section>`;
}

function renderMemberProfilePublicationHint(): string {
  return renderInfoCallout({
    id: "member-profile-publication-hint",
    title: "Public visibility review",
    body: "Your profile will only appear publicly when your standing is Good and a curator approves it. You retain full control and can withdraw visibility at any time.",
    surface: "member"
  });
}

function renderMemberDashboardPage(): string {
  const priorityItems: PriorityItem[] = [
    {
      title: "Profile",
      badges: [{ label: "Members-only by default", tone: "members" }, { label: "Public-safe needs review", tone: "public" }],
      body: "Confirm which identity fields stay private, members-only, or public-safe."
    },
    {
      title: "Events",
      badges: [{ label: "RSVP open", tone: "members" }],
      body: "Upcoming member events remain separate from admin event stewardship."
    },
    {
      title: "Directory",
      badges: [{ label: "Consent scoped", tone: "private" }],
      body: "Only visible member-approved fields may appear in directory search."
    },
    {
      title: "Notifications",
      badges: [{ label: "In-app active", tone: "members" }, { label: "SMS future", tone: "warning" }],
      body: "Notice channels distinguish active settings from future delivery work."
    }
  ];

  return renderShell({
    title: "Member Dashboard",
    eyebrow: "Member Workspace",
    heading: "Member workspace",
    summary: "Review your member status, next event, profile visibility, and notices from one calm workspace.",
    items: ["Member navigation stays surface-scoped.", "The page has one strongest next action.", "Consent and standing prompts stay respectful and practical."],
    surface: "member",
    primaryAction: { href: "/member/profile", label: "Complete profile" },
    extra: `<section class="design-workspace" aria-labelledby="member-dashboard-status">
      <h2 id="member-dashboard-status">Today's member priorities</h2>
      <div class="design-grid">${priorityItems.map(renderPriorityPanel).join("")}</div>
    </section>`
  });
}

function renderMemberProfilePage(): string {
  return renderShell({
    title: "Member Profile",
    eyebrow: "Member Task",
    heading: "Profile visibility control",
    summary: "Review your profile identity and choose which fields remain private, members-only, or public-safe.",
    items: ["Private fields include contact details and unapproved drafts.", "Members-only fields may include role, organisation, biography, and approved portrait.", "Public-safe fields require consent, good standing, and curator approval."],
    surface: "member",
    primaryAction: { href: "/member/profile/visibility", label: "Manage visibility" },
    extra: `${renderPrototypeNote("profile")}${renderMemberProfilePublicationHint()}<section class="design-workspace" aria-labelledby="profile-field-policy">
      <h2 id="profile-field-policy">Field visibility guide</h2>
      <div class="design-grid">
        <article class="design-panel visibility-private"><h3>Private</h3><p>Contact details, support notes, internal identifiers, and unapproved drafts stay hidden from member and public views.</p></article>
        <article class="design-panel visibility-members"><h3>Members only</h3><p>Display name, role, organisation, interests, and biography may appear only inside the protected member surface.</p></article>
        <article class="design-panel visibility-public"><h3>Public-safe</h3><p>Approved display name, role, organisation, short biography, and approved image assets may be projected publicly after governance checks.</p></article>
      </div>
    </section>`
  });
}

function renderMemberDirectoryPage(): string {
  return renderShell({
    title: "Member Directory",
    eyebrow: "Member Directory",
    heading: "Consent-scoped directory",
    summary: "Search visible member profiles according to each member's consent and visibility choices.",
    items: ["Searchable launch fields are visible name, organisation, role, and approved keywords.", "Private email, phone, physical address, internal IDs, standing reasons, and audit details must never appear.", "Public-safe here does not mean public web publication."],
    surface: "member",
    extra: `<section class="design-workspace" aria-labelledby="directory-controls">
      <h2 id="directory-controls">Directory controls</h2>
      <form class="event-actions" action="/member/directory" method="get" role="search">
        <label for="directory-search">Search visible profiles <input id="directory-search" name="q" placeholder="Name, organisation, role, or keyword" /></label>
        <label for="directory-visibility">Visibility <select id="directory-visibility" name="visibility"><option>All visible</option><option>Members only</option><option>Public-safe</option></select></label>
      </form>
      <div class="design-grid">
        <article class="design-panel">${renderStatusBadges([{ label: "Members only", tone: "members" }])}<h3>Member-safe result</h3><p>Role and organisation are visible because the member has granted member-surface visibility.</p></article>
        <article class="design-panel">${renderStatusBadges([{ label: "Public-safe", tone: "public" }])}<h3>Approved public-safe projection</h3><p>No contact methods, hidden fields, import state, or audit metadata are exposed.</p></article>
      </div>
    </section>`
  });
}

function renderMemberNotificationsPage(): string {
  return renderShell({
    title: "Member Notifications",
    eyebrow: "Member Notifications",
    heading: "Member notifications",
    summary: "Review notices and understand how IWFSA can reach you.",
    items: ["In-app notices are active in the current member surface.", "Email and SMS preferences must be shown only when backend support is active.", "Standing notices must not expose private review reasons."],
    surface: "member",
    primaryAction: { href: "/member/notifications", label: "Review preferences" },
    extra: `<section class="design-workspace" aria-labelledby="notification-channel-status">
      <h2 id="notification-channel-status">Channel status</h2>
      <div class="design-grid">
        <article class="design-panel">${renderStatusBadges([{ label: "In-app active", tone: "members" }])}<h3>Events</h3><p>RSVP confirmations and event notices appear as member-surface notices.</p></article>
        <article class="design-panel">${renderStatusBadges([{ label: "Email future", tone: "warning" }, { label: "SMS future", tone: "warning" }])}<h3>Preference channels</h3><p>Future channels stay labelled as unavailable until delivery is implemented and verified.</p></article>
        <article class="design-panel">${renderStatusBadges([{ label: "Action needed", tone: "warning" }])}<h3>Standing or consent notices</h3><p>Copy stays practical and does not reveal private admin reasoning.</p></article>
      </div>
    </section>`
  });
}

function renderConsentRequiredPage(): string {
  return renderShell({
    title: "Consent Required",
    eyebrow: "Member Consent",
    heading: "Consent required",
    summary: "Before this feature can continue, please review how your information may be visible within IWFSA.",
    items: ["Profile fields and directory entries do not render behind this gate.", "Visibility choices remain member-controlled.", "The page explains consent without implying publication by default."],
    surface: "member",
    primaryAction: { href: "/member/profile/visibility", label: "Review consent" },
    extra: `<section class="design-workspace" aria-labelledby="consent-model">
      <h2 id="consent-model">Visibility model</h2>
      ${renderStatusBadges([{ label: "Private", tone: "private" }, { label: "Members only", tone: "members" }, { label: "Public-safe", tone: "public" }])}
      <p class="route-note">Protected feature content remains hidden until consent is granted. This fallback is a control page, not a preview of private information.</p>
    </section>`
  });
}

function renderStandingRestrictedPage(): string {
  return renderShell({
    title: "Standing Review Required",
    eyebrow: "Member Access",
    heading: "Standing review required",
    summary: "Some member actions are temporarily unavailable. We will guide you to the right next step.",
    items: ["The page does not show private standing reasons.", "The primary action remains a safe return to the dashboard.", "Warnings stay respectful and non-shaming."],
    surface: "member",
    primaryAction: { href: "/member/dashboard", label: "Return to dashboard" },
    extra: `<section class="design-workspace" aria-labelledby="standing-support">
      <h2 id="standing-support">Access guidance</h2>
      <p class="route-note">Contact administrator remains a secondary support path until a mapped support workflow is configured.</p>
      ${renderStatusBadges([{ label: "No private standing detail shown", tone: "private" }, { label: "Safe fallback", tone: "members" }])}
    </section>`
  });
}

function renderAdminDashboardPage(): string {
  return renderShell({
    title: "Admin Console",
    eyebrow: "Admin Console",
    heading: "Admin stewardship console",
    summary: "A focused pilot workspace for IWFSA administrators to review member records, events, public storytelling, standing, imports, and audit readiness.",
    items: ["Events, members, imports, standing, review queue, audit, and support notes stay admin-scoped.", "State-changing work requires policy, CSRF, and audit checks.", "Operational panels use stewardship language rather than member profile language."],
    surface: "admin",
    primaryAction: { href: "/admin/import/preview", label: "Review imports" },
    extra: `<section class="reviewer-hero" aria-labelledby="admin-review-readiness">
      <div class="reviewer-card">
        <strong id="admin-review-readiness">Reviewer-ready pilot</strong>
        <p>Use this console to walk the IWFSA admin through temporary member records, event controls, public review checks, and governance fallbacks. All data on this surface is dummy test data.</p>
      </div>
      <div class="reviewer-card">
        <strong>Suggested test path</strong>
        <p>Start with Members, create one temporary record, review Events, then check Public review and Audit readiness.</p>
      </div>
    </section>
    <section class="design-workspace" aria-labelledby="admin-priorities">
      <h2 id="admin-priorities">Stewardship priorities</h2>
      <div class="design-grid">
        <article class="design-panel"><h3>Imports</h3>${renderStatusBadges([{ label: "Preview before commit", tone: "audit" }])}<p>Review staged rows before any live mutation.</p></article>
        <article class="design-panel"><h3>Members</h3>${renderStatusBadges([{ label: "Temporary records", tone: "private" }])}<p>Create and correct records with confirmation and audit notes.</p></article>
        <article class="design-panel"><h3>Public review</h3>${renderStatusBadges([{ label: "Approval gated", tone: "public" }])}<p>Approve only public-safe projections that pass consent, standing, and allowlist checks.</p></article>
      </div>
      <div class="review-route-grid" aria-label="Admin review routes">
        <a class="design-panel review-route" href="/admin/members"><h3>Member records</h3><p>Inspect seeded dummy members and create a temporary record.</p></a>
        <a class="design-panel review-route" href="/admin/events"><h3>Event controls</h3><p>Create, edit, and delete temporary event records.</p></a>
        <a class="design-panel review-route" href="/admin/public-review"><h3>Public review</h3><p>Review public-safe storytelling gates.</p></a>
        <a class="design-panel review-route" href="/admin/audit"><h3>Audit readiness</h3><p>Confirm redacted audit language and future lookup framing.</p></a>
      </div>
    </section>`
  });
}

function renderAdminMembersPage(input: { members: AdminMemberView[]; message?: string; confirmation?: string }): string {
  const activeCount = input.members.filter((member) => member.status === "Active").length;
  const suspendedCount = input.members.filter((member) => member.status !== "Active").length;
  const rows = input.members.map((member) => `<article class="design-panel" data-member-id="${escapeHtml(member.id)}">
    <h3>${escapeHtml(member.displayName)}</h3>
    ${renderStatusBadges([{ label: `Standing: ${member.status}`, tone: member.status === "Active" ? "members" : "warning" }, { label: "Audit metadata recorded", tone: "audit" }])}
    <p>${escapeHtml(member.roleTitle)} at ${escapeHtml(member.organisation)}</p>
    <p class="audit-preview">Last updated ${escapeHtml(member.updatedAt)}</p>
    <form class="event-actions" method="post" action="/admin/members/${escapeHtml(member.id)}/edit">
      <label>Display name <input name="displayName" value="${escapeHtml(member.displayName)}" required /></label>
      <label>Role <input name="roleTitle" value="${escapeHtml(member.roleTitle)}" /></label>
      <label>Organisation <input name="organisation" value="${escapeHtml(member.organisation)}" /></label>
      <label>Status <select name="status"><option${member.status === "Active" ? " selected" : ""}>Active</option><option${member.status === "Suspended" ? " selected" : ""}>Suspended</option></select></label>
      <label><input name="confirmEdit" type="checkbox" value="confirmed" required /> I confirm this temporary record update should be audit-labelled.</label>
      <button type="submit">Save temporary record</button>
    </form>
    <form class="event-actions" method="post" action="/admin/members/${escapeHtml(member.id)}/delete">
      <label><input name="confirmDelete" type="checkbox" value="confirmed" required /> I understand this removes this temporary member record.</label>
      <button type="submit">Delete temporary record</button>
    </form>
  </article>`).join("");

  return renderShell({
    title: "Admin Members",
    eyebrow: "Admin Members",
    heading: "Member stewardship",
    summary: "Create and review seeded dummy member records under admin policy and audit controls.",
    items: ["Create, edit, delete, standing, visibility, approval, and clean-slate actions require confirmation and audit-aware outcomes.", "No real contact details or private member identity details appear in the list view.", "Clean Slate remains separated from ordinary record stewardship."],
    surface: "admin",
    extra: `<section class="design-workspace" aria-labelledby="admin-members-controls">
      <h2 id="admin-members-controls">Temporary member records</h2>
      ${input.message ? `<p class="event-status">${escapeHtml(input.message)}</p>` : ""}
      ${input.confirmation ? renderInfoCallout({ id: "admin-members-confirmation", title: "Audit-aware confirmation", body: input.confirmation, surface: "admin" }) : ""}
      <div class="metric-grid" aria-label="Member record summary">
        <div class="metric-card"><strong>${escapeHtml(input.members.length)}</strong><span>Dummy member records loaded</span></div>
        <div class="metric-card"><strong>${escapeHtml(activeCount)}</strong><span>Active test members</span></div>
        <div class="metric-card"><strong>${escapeHtml(suspendedCount)}</strong><span>Restricted test members</span></div>
      </div>
      <form class="event-actions" method="post" action="/admin/members" data-primary-action="true">
        <label>Display name <input name="displayName" placeholder="Temporary member" required /></label>
        <label>Role <input name="roleTitle" placeholder="Member" /></label>
        <label>Organisation <input name="organisation" placeholder="IWFSA" /></label>
        <label><input name="confirmCreate" type="checkbox" value="confirmed" required /> I confirm this temporary record should be created for admin stewardship.</label>
        <button type="submit">Create temporary member</button>
      </form>
      <div class="design-grid">${rows || "<p>No temporary member records have been created yet.</p>"}</div>
      <p class="route-note">Destructive cleanup remains available only through the separated Clean Slate route.</p>
    </section>`
  });
}

function renderAdminImportPreviewPage(): string {
  return renderShell({
    title: "Admin Import Preview",
    eyebrow: "Admin Import",
    heading: "Import preview stewardship",
    summary: "Review staged member rows before any live record mutation occurs.",
    items: ["Preview and duplicate resolution do not mutate live records.", "Commit is disabled until review, duplicate decisions, validation, policy, CSRF, and audit readiness pass.", "Messaging distinguishes review saved from records changed."],
    surface: "admin",
    primaryAction: { href: "/admin/import/resolve-duplicate", label: "Review flagged rows" },
    extra: `${renderPrototypeNote("import")}<section class="design-workspace" aria-labelledby="import-preview-state">
      <h2 id="import-preview-state">Commit readiness</h2>
      <div class="design-grid">
        <article class="design-panel">${renderStatusBadges([{ label: "New rows", tone: "members" }, { label: "Duplicate", tone: "warning" }])}<h3>Staged import rows</h3><p>Rows are grouped for review and remain staged.</p></article>
        <article class="design-panel">${renderStatusBadges([{ label: "Audit preview", tone: "audit" }])}<h3>No live mutation</h3><p>Commit is the first point where live records may change.</p></article>
      </div>
    </section>`
  });
}

function renderAdminStandingPage(): string {
  return renderShell({
    title: "Admin Standing",
    eyebrow: "Admin Standing",
    heading: "Member standing stewardship",
    summary: "Review standing carefully before changing member access.",
    items: ["Restrictive changes show access implications before save.", "Standing reasons are not exposed in list view.", "Confirmation and audit preview are required before restrictive updates."],
    surface: "admin",
    extra: `<section class="design-workspace" aria-labelledby="standing-review-state">
      <h2 id="standing-review-state">Standing review state</h2>
      <div class="design-panel">${renderStatusBadges([{ label: "Review required", tone: "warning" }, { label: "Audit trail on", tone: "audit" }])}<p>Select a member before standing update controls appear.</p></div>
    </section>`
  });
}

function renderAdminPublicReviewPage(input: { records: PublicApprovalQueueView[] } = { records: [] }): string {
  const records = input.records.map((record) => `<article class="design-panel review-record" data-approval-id="${escapeHtml(record.id)}">
    <h3>${escapeHtml(record.profileId)}</h3>
    ${renderStatusBadges([{ label: record.status, tone: "public" }, { label: record.requiresDualApproval ? "Dual approval" : "Single approval", tone: record.requiresDualApproval ? "audit" : "members" }])}
    <p class="record-meta">
      <span>${escapeHtml(record.contentType)}</span>
      <span>${escapeHtml(record.profileVersion)}</span>
      <span>Requested ${escapeHtml(record.requestedAt.slice(0, 10))}</span>
    </p>
    <p>Review only the public-safe projection. Hidden, private, and members-only fields are excluded before approval.</p>
  </article>`).join("");

  return renderShell({
    title: "Admin Public Review",
    eyebrow: "Admin Review Queue",
    heading: "Public profile review",
    summary: "Approve public-safe profile projections only after consent, standing, visibility, allowlist, and audit checks pass.",
    items: ["Hidden, private, and members-only fields are absent from the preview and DOM.", "Approval creates an audit-labelled event.", "Blocked profiles show safe reasons without exposing private content."],
    surface: "admin",
    primaryAction: { href: "/admin/public-review", label: "Review approval checklist" },
    extra: `${renderPrototypeNote("approval")}<section class="reviewer-hero" aria-labelledby="public-review-summary">
      <div class="reviewer-card">
        <strong id="public-review-summary">Seeded review queue</strong>
        <p>${escapeHtml(input.records.length)} dummy public profile review request${input.records.length === 1 ? "" : "s"} are ready for the administrator to inspect.</p>
      </div>
      <div class="reviewer-card">
        <strong>Governance guardrail</strong>
        <p>Approval is framed as stewardship, not member self-service. Public storytelling remains consent-led and approval-gated.</p>
      </div>
    </section>
    <section class="design-workspace" aria-labelledby="public-review-records">
      <h2 id="public-review-records">Review queue</h2>
      <div class="design-grid">${records || "<p>No public profile review requests are waiting.</p>"}</div>
    </section>
    <section class="design-workspace" aria-labelledby="public-review-checklist">
      <h2 id="public-review-checklist">Approval checklist</h2>
      <ul class="compact-list">
        <li>Consent granted.</li>
        <li>Standing eligible for publication.</li>
        <li>Visibility is Public-safe.</li>
        <li>Projection contains allowlisted public fields only.</li>
        <li>Audit label is ready.</li>
      </ul>
    </section>`
  });
}

function renderAdminAuditPage(): string {
  return renderShell({
    title: "Admin Audit",
    eyebrow: "Admin Audit",
    heading: "Audit trail",
    summary: "Review traceable governance activity without exposing raw tokens, cookies, or private member data.",
    items: ["Audit entries show timestamp, task, route, safe record summary, and outcome.", "Exports remain an open governance decision.", "Sensitive internal reasoning stays out of compact list views."],
    surface: "admin",
    extra: `<section class="design-workspace" aria-labelledby="audit-readiness"><h2 id="audit-readiness">Audit readiness</h2><p class="route-note">This route is prepared as an admin-only review surface for future audit search and filtering.</p></section>`
  });
}

type PublicProfileView = {
  displayName: string;
  biography: string;
  updatedAt: string;
  publicImage: string;
};

function projectPublicProfile(input: Record<string, unknown>, index = 0): PublicProfileView {
  return {
    displayName: String(input.displayName || ""),
    biography: String(input.biography || ""),
    updatedAt: String(input.updatedAt || ""),
    publicImage: publicLegacyImage(input.publicImage, index)
  };
}

async function fetchPublicProfiles(config: ServiceConfig, fetchImpl: typeof fetch, limit = 25): Promise<PublicProfileView[]> {
  const response = await fetchImpl(`${getApiBaseUrl(config)}/api/public/profiles?limit=${limit}`, {
    headers: {
      accept: "application/json"
    }
  });
  if (!response.ok) {
    return [];
  }
  const body = (await response.json()) as { profiles?: Array<Record<string, unknown>> };
  return (body.profiles || []).map((profile, index) => projectPublicProfile(profile, index));
}

function renderPublicGallery(profiles: PublicProfileView[]): string {
  const cards = profiles.map((profile, index) => `<article class="story-card visibility-public" data-public-story="${index + 1}">
    <img src="${escapeHtml(profile.publicImage)}" alt="" loading="lazy" />
    <div class="story-card-content">
      <h2>${escapeHtml(profile.displayName)}</h2>
      <p>${escapeHtml(profile.biography)}</p>
      <p class="audit-preview">Updated ${escapeHtml(profile.updatedAt)}</p>
      <a href="/public/story/${index + 1}">Read story</a>
    </div>
  </article>`).join("");

  return renderPublicPage(
    "Public Gallery",
    `<section class="shell shell-single" data-route-surface="public">
      <div class="shell-content">
        <div class="eyebrow">Public Gallery</div>
        <h1>Approved public stories</h1>
        <p>Only approved public-safe profile fields are rendered here.</p>
        <div class="story-grid">${cards || "<p>No approved public stories are available.</p>"}</div>
      </div>
    </section>`
  );
}

function renderPublicStory(profile: PublicProfileView | null): string {
  if (!profile) {
    return renderPublicPage(
      "Story unavailable",
      `<section class="shell" data-route-surface="public">
        <div class="eyebrow">Public Story</div>
        <h1>Story unavailable</h1>
        <p>This story is unavailable or no longer published.</p>
      </section>`,
      "noindex, follow"
    );
  }

  return renderPublicPage(
    profile.displayName,
    `<article class="shell visibility-public" data-route-surface="public">
      <div class="shell-content">
        <div class="eyebrow">Approved Story</div>
        <h1>${escapeHtml(profile.displayName)}</h1>
        <p>${escapeHtml(profile.biography)}</p>
        <p class="audit-preview">Updated ${escapeHtml(profile.updatedAt)}</p>
      </div>
      <aside class="visual-panel" aria-hidden="true">
        <img class="story-portrait" src="${escapeHtml(profile.publicImage)}" alt="" loading="lazy" />
      </aside>
    </article>`
  );
}

function routeAllowed(authContext: WebAuthSession, surface: Surface, task: TaskId, auditTrail = false): { allowed: boolean; fallback: string } {
  const decision = evaluate({
    role: authContext.role,
    surface,
    task,
    standing: authContext.standing,
    consent: authContext.consent,
    auditTrail
  });

  return {
    allowed: decision.decision === "ALLOW",
    fallback: decision.fallback
  };
}

function anonymousContext(config: ServiceConfig, authServiceAvailable = true): WebAuthSession {
  return {
    isAuthenticated: false,
    role: null,
    subject: null,
    standing: "anonymous",
    consent: "not_required",
    nextRoute: null,
    authServiceAvailable,
    allowRoleSelfSelection: Boolean(config.allowRoleSelfSelection)
  };
}

function renderAuthServiceFailurePage(): string {
  return renderShell({
    title: "Auth Service Unavailable",
    eyebrow: "Auth Dependency",
    heading: "Authentication service unavailable",
    summary: "The web surface could not confirm session state from the auth service.",
    items: ["This is different from an anonymous user.", "Retry once the API auth surface is reachable."]
    ,
    surface: "public"
  });
}

function renderSignInPage(input: { currentSession: WebAuthSession; errorMessage?: string }): string {
  const currentSession = input.currentSession;
  const headerSurface = navigationSurfaceForSession(currentSession);
  const errorBlock = input.errorMessage ? `<p><strong>${escapeHtml(input.errorMessage)}</strong></p>` : "";
  const sessionNote = currentSession.isAuthenticated
    ? `<p class="v1-sign-in-status">You are already signed in. Use the form below to switch access or sign out of the current session.</p>`
    : "";
  const signInForm = `<form class="v1-sign-in-form" method="post" action="/signin">
        <label for="sign-in-identity">Username</label>
        <input id="sign-in-identity" type="text" name="subject" value="akeida" autocomplete="username" required />
        <label for="sign-in-access-code">Password</label>
        <input id="sign-in-access-code" type="password" name="accessCode" autocomplete="current-password" />
        <button class="v1-button" type="submit" data-primary-action="true">Sign in</button>
        ${currentSession.allowRoleSelfSelection ? `<p class="v1-sign-in-status">Local preview routes member identities to the member portal and admin identities to the admin console.</p>` : ""}
      </form>`;

  return renderV1PublicChrome({
    title: "IWFSA | Sign In",
    currentPath: "/signin",
    pageClass: "page-sign-in",
    headerSurface,
    includeSignOut: headerSurface !== "public",
    body: `
      <section class="v1-sign-in-stage" aria-labelledby="sign-in-title">
        <div class="v1-sign-in-stage-backdrop"></div>
        <div class="v1-sign-in-stage-copy">
          <p class="v1-eyebrow v1-eyebrow-contrast">Secure Access</p>
          <h1 id="sign-in-title" class="v1-page-title">Member Access</h1>
          <p class="v1-lead">Use your IWFSA credentials to continue to the member or admin workspace.</p>
        </div>
        <div class="v1-sign-in-card">
          <div class="v1-sign-in-card-handle">
            <span class="v1-eyebrow">Portal Access</span>
          </div>
          <div class="v1-sign-in-card-brand" aria-hidden="true"><span>Member and admin credentials</span></div>
          ${errorBlock}
          ${sessionNote}
          ${signInForm}
          ${renderPreviewCredentials()}
        </div>
      </section>`
  });
}

function renderMemberEventsPage(input: { events: AdminEventView[]; message?: string }): string {
  const visibleEvents = input.events.filter((event) => event.status === "published");
  const cards = visibleEvents.map((event) => `<article class="event-card" data-event-id="${escapeHtml(event.id)}">
    <h2>${escapeHtml(event.title)}</h2>
    <p class="event-status">${escapeHtml(event.status)} event</p>
    <p class="event-meta">
      <span>${escapeHtml(event.registeredCount)} registered</span>
      <span>${escapeHtml(event.waitlistCount)} waitlisted</span>
      <span>${escapeHtml(event.maxCapacity)} places</span>
    </p>
    <form class="event-actions" method="post" action="/member/events">
      <input type="hidden" name="eventId" value="${escapeHtml(event.id)}" />
      <button type="submit">RSVP</button>
    </form>
  </article>`).join("");

  return renderShell({
    title: "Member Events",
    eyebrow: "Member Events",
    heading: "Choose and manage event participation",
    summary: "See available member events, confirm your place, and understand waitlist status without leaving the member surface.",
    items: ["Published events only are shown here.", "RSVPs are checked against standing, consent, and audience policy.", "Confirmation messages avoid exposing private member data."],
    surface: "member",
    extra: `<section class="event-workspace" aria-labelledby="member-events-title">
      <div class="event-toolbar">
        <strong id="member-events-title">Available events</strong>
        ${input.message ? `<span class="event-status">${escapeHtml(input.message)}</span>` : `<span class="event-status">Select RSVP when you are ready to attend.</span>`}
      </div>
      <div class="event-grid">${cards || "<p>No published member events are currently available.</p>"}</div>
    </section>`
  });
}

function renderAdminEventsPage(input: { events: AdminEventView[]; message?: string }): string {
  const cards = input.events.map((event) => `<article class="event-card" data-event-id="${escapeHtml(event.id)}">
    <h3>${escapeHtml(event.title)}</h3>
    <p class="event-meta">
      <span>Status: ${escapeHtml(event.status)}</span>
      <span>Capacity: ${escapeHtml(event.maxCapacity)}</span>
      <span>Version: ${escapeHtml(event.version)}</span>
    </p>
    <form class="event-actions" method="post" action="/admin/events/${escapeHtml(event.id)}/edit">
      <label>Title <input name="title" value="${escapeHtml(event.title)}" required /></label>
      <label>Capacity <input name="maxCapacity" type="number" min="1" max="500" value="${escapeHtml(event.maxCapacity)}" required /></label>
      <button type="submit">Save</button>
    </form>
    <form class="event-actions" method="post" action="/admin/events/${escapeHtml(event.id)}/delete">
      <button type="submit">Delete</button>
    </form>
  </article>`).join("");

  return renderShell({
    title: "Admin Events",
    eyebrow: "Admin Events",
    heading: "Set up and steward events",
    summary: "Create, update, and remove temporary event records through the admin surface with policy and audit checks in the API.",
    items: ["Create starts events as drafts for controlled publication.", "Editing preserves event lifecycle status and increments versions.", "Deletion is explicit and remains admin-only."],
    surface: "admin",
    extra: `<section class="event-workspace" aria-labelledby="admin-events-title">
      <div class="event-toolbar">
        <strong id="admin-events-title">Event controls</strong>
        ${input.message ? `<span class="event-status">${escapeHtml(input.message)}</span>` : `<span class="event-status">Use the form to create a temporary test event.</span>`}
      </div>
      <form class="event-actions" method="post" action="/admin/events" data-primary-action="true">
        <label>Title <input name="title" placeholder="Leadership Roundtable" required /></label>
        <label>Capacity <input name="maxCapacity" type="number" min="1" max="500" value="25" required /></label>
        <button type="submit">Create event</button>
      </form>
      <div class="event-grid">${cards || "<p>No temporary events have been created yet.</p>"}</div>
    </section>`
  });
}

async function loadAuthContext(url: URL, request: http.IncomingMessage, config: ServiceConfig, authGateway: AuthGateway): Promise<WebAuthSession> {
  const guardedPrefixes = ["/", "/signin", "/member", "/admin"];

  if (!guardedPrefixes.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
    return anonymousContext(config);
  }

  try {
    const inspected = await authGateway.inspectSession(request.headers.cookie || "");
    return {
      ...inspected,
      authServiceAvailable: true,
      allowRoleSelfSelection: Boolean(config.allowRoleSelfSelection)
    };
  } catch {
    return anonymousContext(config, false);
  }
}

export function createWebServer(config: ServiceConfig, dependencies: WebDependencies = {}): http.Server {
  const authGateway = dependencies.authGateway || createApiAuthGateway(config, dependencies);
  const fetchImpl = dependencies.fetchImpl || fetch;

  return http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const authContext = await loadAuthContext(url, request, config, authGateway);

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, buildHealthPayload(config, { surface: "web" }));
      return;
    }

    if (request.method === "GET" && url.pathname === "/brand.css") {
      response.writeHead(200, {
        "content-type": "text/css; charset=utf-8",
        "cache-control": "public, max-age=300"
      });
      response.end(renderBrandCss());
      return;
    }

    if (request.method === "GET" && url.pathname === "/robots.txt") {
      response.writeHead(200, {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=300"
      });
      response.end("User-agent: *\nDisallow: /admin/\nDisallow: /member/\nDisallow: /public/story/revoked\n");
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/legacy-assets/")) {
      const requested = normalize(url.pathname.replace("/legacy-assets/", ""));

      if (requested.includes("..")) {
        sendHtml(response, 404, renderShell({
          title: "Not Found",
          eyebrow: "Missing Asset",
          heading: "Asset not found",
          summary: "The requested asset is unavailable.",
          items: ["Only mapped legacy assets are served."],
          surface: "public"
        }));
        return;
      }

      try {
        const asset = readFileSync(join(LEGACY_ASSET_ROOT, requested));
        const extension = extname(requested);
        const contentType = extension === ".svg" ? "image/svg+xml" : extension === ".jpg" ? "image/jpeg" : "application/octet-stream";
        response.writeHead(200, {
          "content-type": contentType,
          "cache-control": "public, max-age=3600"
        });
        response.end(asset);
      } catch {
        sendHtml(response, 404, renderShell({
          title: "Not Found",
          eyebrow: "Missing Asset",
          heading: "Asset not found",
          summary: "The requested asset is unavailable.",
          items: ["Only mapped legacy assets are served."],
          surface: "public"
        }));
      }
      return;
    }

    if (url.pathname === "/") {
      sendHtml(
        response,
        200,
        renderLandingPage({ currentSession: authContext })
      );
      return;
    }

    if (request.method === "GET" && url.pathname === "/public/gallery") {
      sendHtml(response, 200, renderPublicGallery(await fetchPublicProfiles(config, fetchImpl)));
      return;
    }

    const storyMatch = url.pathname.match(/^\/public\/story\/([^/]+)$/);
    if (request.method === "GET" && storyMatch) {
      const profiles = await fetchPublicProfiles(config, fetchImpl);
      const index = Number.parseInt(storyMatch[1], 10) - 1;
      sendHtml(response, profiles[index] ? 200 : 404, renderPublicStory(profiles[index] || null));
      return;
    }

    if (url.pathname === "/signin") {
      if (request.method === "GET") {
        if (!authContext.authServiceAvailable) {
          sendHtml(response, 503, renderAuthServiceFailurePage());
          return;
        }

        sendHtml(response, 200, renderSignInPage({ currentSession: authContext }));
        return;
      }

      if (request.method === "POST") {
        const form = await readFormBody(request);
        const explicitRole = form.get("role");
        const credential = explicitRole ? null : verifyLegacyTestCredentials({
          subject: form.get("subject"),
          accessCode: form.get("accessCode")
        });
        const role = explicitRole
          ? inferLocalRole({
              explicitRole,
              subject: form.get("subject"),
              allowRoleSelfSelection: Boolean(config.allowRoleSelfSelection)
            })
          : credential?.role || null;
        const subject = credential?.subject || form.get("subject");
        const result = await authGateway.createSession({ role, subject });

        if (!result.ok) {
          const errorMessage = explicitRole ? "The request could not be completed." : "The username or password could not be verified.";
          sendHtml(response, 400, renderSignInPage({
            currentSession: authContext,
            errorMessage
          }));
          return;
        }

        response.writeHead(303, {
          location: String(result.body.nextRoute || routeForRole(role)),
          ...(result.setCookie ? { "set-cookie": result.setCookie } : {})
        });
        response.end();
        return;
      }
    }

    if (request.method === "POST" && url.pathname === "/signout") {
      const result = await authGateway.clearSession(request.headers.cookie || "");
      response.writeHead(303, {
        location: "/signin",
        ...(result.setCookie ? { "set-cookie": result.setCookie } : {})
      });
      response.end();
      return;
    }

    if (url.pathname === "/member" || url.pathname === "/member/dashboard") {
      const allowed = routeAllowed(authContext, "member", "member.dashboard");
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      sendHtml(response, 200, renderMemberDashboardPage());
      return;
    }

    if (url.pathname === "/member/consent-required") {
      const allowed = routeAllowed(authContext, "member", "member.dashboard");
      if (!allowed.allowed && allowed.fallback !== "/member/standing") {
        sendRedirect(response, allowed.fallback);
        return;
      }

      sendHtml(response, 200, renderConsentRequiredPage());
      return;
    }

    if (url.pathname === "/member/standing") {
      if (!authContext.role) {
        sendRedirect(response, "/signin");
        return;
      }

      sendHtml(response, 200, renderStandingRestrictedPage());
      return;
    }

    if (request.method === "GET" && url.pathname === "/member/events") {
      const allowed = routeAllowed(authContext, "member", "member.events.view");
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      sendHtml(response, 200, renderMemberEventsPage({
        events: await fetchMemberEvents(config, request.headers.cookie || "", fetchImpl)
      }));
      return;
    }

    if (request.method === "POST" && url.pathname === "/member/events") {
      const allowed = routeAllowed(authContext, "member", "member.events.rsvp");
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      const form = await readFormBody(request);
      const eventId = form.get("eventId") || "";
      const apiResult = eventId
        ? await adminApiRequest(config, request.headers.cookie || "", fetchImpl, { method: "POST", path: `/api/events/${encodeURIComponent(eventId)}/rsvp` })
        : { ok: false, status: 400, body: {} };
      const message = apiResult.ok
        ? String(apiResult.body.message || "Your RSVP has been recorded.")
        : "The RSVP could not be completed for this event.";

      sendHtml(response, apiResult.ok ? 200 : 400, renderMemberEventsPage({
        events: await fetchMemberEvents(config, request.headers.cookie || "", fetchImpl),
        message
      }));
      return;
    }

    if (url.pathname === "/member/profile" || url.pathname === "/member/profile/edit" || url.pathname === "/member/profile/visibility" || url.pathname === "/member/profile/confirmation") {
      const task = url.pathname === "/member/profile/visibility" ? "member.profile.visibility" : "member.profile.edit";
      const allowed = routeAllowed(authContext, "member", task);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      sendHtml(response, 200, renderMemberProfilePage());
      return;
    }

    if (url.pathname === "/member/directory") {
      const allowed = routeAllowed(authContext, "member", "member.directory.view");
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      sendHtml(response, 200, renderMemberDirectoryPage());
      return;
    }

    if (url.pathname === "/member/notifications") {
      const task = url.pathname === "/member/directory" ? "member.directory.view" : "member.notifications.view";
      const allowed = routeAllowed(authContext, "member", task);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      sendHtml(response, 200, renderMemberNotificationsPage());
      return;
    }

    if (url.pathname === "/admin") {
      const allowed = routeAllowed(authContext, "admin", "admin.dashboard", true);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      sendHtml(response, 200, renderAdminDashboardPage());
      return;
    }

    if (request.method === "GET" && url.pathname === "/admin/events") {
      const allowed = routeAllowed(authContext, "admin", "admin.events.manage", true);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      sendHtml(response, 200, renderAdminEventsPage({
        events: await fetchAdminEvents(config, request.headers.cookie || "", fetchImpl)
      }));
      return;
    }

    if (request.method === "POST" && url.pathname === "/admin/events") {
      const allowed = routeAllowed(authContext, "admin", "admin.events.manage", true);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      const form = await readFormBody(request);
      const apiResult = await adminApiRequest(config, request.headers.cookie || "", fetchImpl, {
        method: "POST",
        path: "/api/admin/events",
        body: {
          title: form.get("title"),
          maxCapacity: Number(form.get("maxCapacity") || 25)
        }
      });

      sendHtml(response, apiResult.ok ? 200 : 400, renderAdminEventsPage({
        events: await fetchAdminEvents(config, request.headers.cookie || "", fetchImpl),
        message: apiResult.ok ? "Event created." : "The event could not be created."
      }));
      return;
    }

    if (request.method === "GET" && url.pathname === "/admin/members") {
      const allowed = routeAllowed(authContext, "admin", "admin.members.manage", true);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      sendHtml(response, 200, renderAdminMembersPage({
        members: await fetchAdminMembers(config, request.headers.cookie || "", fetchImpl)
      }));
      return;
    }

    if (request.method === "POST" && url.pathname === "/admin/members") {
      const allowed = routeAllowed(authContext, "admin", "admin.members.manage", true);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      const form = await readFormBody(request);
      const confirmed = form.get("confirmCreate") === "confirmed";
      const apiResult = confirmed
        ? await adminApiRequest(config, request.headers.cookie || "", fetchImpl, {
            method: "POST",
            path: "/api/admin/members",
            body: {
              displayName: form.get("displayName"),
              roleTitle: form.get("roleTitle"),
              organisation: form.get("organisation")
            }
          })
        : { ok: false, status: 400, body: {} };

      const ok = apiResult.ok;
      sendHtml(response, ok ? 200 : 400, renderAdminMembersPage({
        members: await fetchAdminMembers(config, request.headers.cookie || "", fetchImpl),
        message: ok ? "Temporary member record created. Audit metadata has been recorded." : "The member record could not be created.",
        confirmation: ok ? "Create confirmation accepted. This temporary admin record remains separate from member self-service surfaces." : undefined
      }));
      return;
    }

    const adminMemberEditMatch = url.pathname.match(/^\/admin\/members\/([^/]+)\/edit$/);
    if (request.method === "POST" && adminMemberEditMatch) {
      const allowed = routeAllowed(authContext, "admin", "admin.members.manage", true);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      const form = await readFormBody(request);
      const confirmed = form.get("confirmEdit") === "confirmed";
      const apiResult = confirmed
        ? await adminApiRequest(config, request.headers.cookie || "", fetchImpl, {
            method: "PATCH",
            path: `/api/admin/members/${encodeURIComponent(adminMemberEditMatch[1])}`,
            body: {
              displayName: form.get("displayName"),
              roleTitle: form.get("roleTitle"),
              organisation: form.get("organisation"),
              status: form.get("status")
            }
          })
        : { ok: false, status: 400, body: {} };

      sendHtml(response, apiResult.ok ? 200 : 400, renderAdminMembersPage({
        members: await fetchAdminMembers(config, request.headers.cookie || "", fetchImpl),
        message: apiResult.ok ? "Temporary member record updated. Audit metadata has been recorded." : "The member record could not be updated.",
        confirmation: apiResult.ok ? "Edit confirmation accepted. The update is limited to the temporary admin record." : undefined
      }));
      return;
    }

    const adminMemberDeleteMatch = url.pathname.match(/^\/admin\/members\/([^/]+)\/delete$/);
    if (request.method === "POST" && adminMemberDeleteMatch) {
      const allowed = routeAllowed(authContext, "admin", "admin.members.manage", true);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      const form = await readFormBody(request);
      const confirmed = form.get("confirmDelete") === "confirmed";
      const apiResult = confirmed
        ? await adminApiRequest(config, request.headers.cookie || "", fetchImpl, {
            method: "DELETE",
            path: `/api/admin/members/${encodeURIComponent(adminMemberDeleteMatch[1])}`
          })
        : { ok: false, status: 400, body: {} };

      sendHtml(response, apiResult.ok ? 200 : 400, renderAdminMembersPage({
        members: await fetchAdminMembers(config, request.headers.cookie || "", fetchImpl),
        message: apiResult.ok ? "Temporary member record deleted. Audit metadata has been recorded." : "The member record could not be deleted.",
        confirmation: apiResult.ok ? "Delete confirmation accepted. This did not imply any production member removal." : undefined
      }));
      return;
    }

    const adminEventEditMatch = url.pathname.match(/^\/admin\/events\/([^/]+)\/edit$/);
    if (request.method === "POST" && adminEventEditMatch) {
      const allowed = routeAllowed(authContext, "admin", "admin.events.manage", true);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      const form = await readFormBody(request);
      const apiResult = await adminApiRequest(config, request.headers.cookie || "", fetchImpl, {
        method: "PATCH",
        path: `/api/admin/events/${encodeURIComponent(adminEventEditMatch[1])}`,
        body: {
          title: form.get("title"),
          maxCapacity: Number(form.get("maxCapacity") || 25)
        }
      });

      sendHtml(response, apiResult.ok ? 200 : 400, renderAdminEventsPage({
        events: await fetchAdminEvents(config, request.headers.cookie || "", fetchImpl),
        message: apiResult.ok ? "Event updated." : "The event could not be updated."
      }));
      return;
    }

    const adminEventDeleteMatch = url.pathname.match(/^\/admin\/events\/([^/]+)\/delete$/);
    if (request.method === "POST" && adminEventDeleteMatch) {
      const allowed = routeAllowed(authContext, "admin", "admin.events.manage", true);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      const apiResult = await adminApiRequest(config, request.headers.cookie || "", fetchImpl, {
        method: "DELETE",
        path: `/api/admin/events/${encodeURIComponent(adminEventDeleteMatch[1])}`
      });

      sendHtml(response, apiResult.ok ? 200 : 400, renderAdminEventsPage({
        events: await fetchAdminEvents(config, request.headers.cookie || "", fetchImpl),
        message: apiResult.ok ? "Event deleted." : "The event could not be deleted."
      }));
      return;
    }

    const adminTasks: Record<string, TaskId> = {
      "/admin/imports": "admin.import.preview",
      "/admin/import/preview": "admin.import.preview",
      "/admin/import/resolve-duplicate": "admin.import.preview",
      "/admin/import/commit": "admin.import.commit",
      "/admin/standing": "admin.standing.manage",
      "/admin/members/clean-slate": "admin.members.clean_slate",
      "/admin/public-review": "admin.public-review.queue",
      "/admin/audit": "admin.audit.read",
      "/admin/support-notes": "admin.support-notes.add"
    };

    if (request.method === "POST" && url.pathname === "/admin/members/clean-slate") {
      const allowed = routeAllowed(authContext, "admin", "admin.members.clean_slate", true);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      const cleaned = await requestAdminSeedCleanSlate(config, request.headers.cookie || "", fetchImpl);
      seedMembersCleared = cleaned || seedMembersCleared;
      sendHtml(response, cleaned ? 200 : 400, renderShell({
        title: "Seed Members",
        eyebrow: "Admin Task",
        heading: cleaned ? "Temporary seed members cleared" : "Temporary seed members could not be cleared",
        summary: cleaned ? "The running preview has removed temporary seed members from admin testing." : "The API did not accept the clean-slate request.",
        items: ["This remains a temporary preview action.", "Production import rules still apply."],
        surface: "admin",
        extra: renderAdminSeedTools({ cleaned })
      }));
      return;
    }

    if (request.method === "GET" && Object.hasOwn(adminTasks, url.pathname)) {
      const task = adminTasks[url.pathname];
      const allowed = routeAllowed(authContext, "admin", task, true);
      if (!allowed.allowed) {
        sendRedirect(response, allowed.fallback);
        return;
      }

      const page = url.pathname.includes("import")
        ? renderAdminImportPreviewPage()
        : url.pathname.includes("standing")
          ? renderAdminStandingPage()
          : url.pathname.includes("public-review")
            ? renderAdminPublicReviewPage({
                records: await fetchAdminPublicQueue(config, request.headers.cookie || "", fetchImpl)
              })
            : url.pathname.includes("audit")
              ? renderAdminAuditPage()
              : url.pathname.includes("clean-slate")
                ? renderShell({
                    title: "Seed Members",
                    eyebrow: "Admin Task",
                    heading: "Seed member controls",
                    summary: "Clear temporary seed members before production import testing.",
                    items: ["Privileged behavior remains guarded by policy and audit rules.", "This cleanup applies to temporary seed records only.", "Production records are not implied by this preview action."],
                    surface: "admin",
                    extra: renderAdminSeedTools()
                  })
                : renderShell({
                    title: "Admin Support Notes",
                    eyebrow: "Admin Support",
                    heading: "Support notes",
                    summary: "Prepare a future admin-only support note surface without exposing member self-service controls.",
                    items: ["Support notes remain admin-only.", "Raw private member details are not shown in compact views.", "Mapped support actions require audit labels."],
                    surface: "admin"
                  });
      sendHtml(response, 200, page);
      return;
    }

    if (url.pathname === "/public/profile-submission" || url.pathname === "/public/profile/seed-ayanda") {
      sendHtml(response, 200, renderShell({
        title: "Public Profile Preview",
        eyebrow: "Public Prototype",
        heading: "Approved public profile",
        summary: "This prototype renders only approved public fields and legacy visual seed assets.",
        items: ["Private member fields are absent.", "The image resolves through the controlled legacy asset path.", "Approval remains an admin-governed act."],
        surface: "public",
        primaryAction: { href: "/public/profile/seed-ayanda", label: "View approved profile" },
        extra: `${renderPrototypeNote("approval")}<img src="/legacy-assets/member-portrait-ayanda.svg" alt="Approved seed profile portrait" loading="lazy" />`
      }));
      return;
    }

    if (url.pathname.startsWith("/member/") || url.pathname.startsWith("/admin/")) {
      sendRedirect(response, url.pathname.startsWith("/member/") ? "/member/dashboard" : "/admin");
      return;
    }

    sendHtml(response, 404, renderShell({
      title: "Not Found",
      eyebrow: "Missing Route",
      heading: "Route not found",
      summary: "The requested public route is unavailable.",
      items: ["Protected route existence is not disclosed."],
      surface: "public"
    }));
  });
}
