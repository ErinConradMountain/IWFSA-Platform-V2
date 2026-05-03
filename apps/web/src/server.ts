import http from "node:http";
import { readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";

import { brand } from "@iwfsa/common/design-tokens";
import { evaluate, type Surface, type TaskId } from "@iwfsa/common/policy";
import { buildHealthPayload, readRequestBody, sendHtml, sendJson, sendRedirect, type ServiceConfig } from "@iwfsa/common/runtime";
import type { ConsentState, Standing } from "@iwfsa/common/session-repository";

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

const LEGACY_ASSET_ROOT = join(process.cwd(), "apps", "web", "public", "legacy-assets");

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function readFormBody(request: http.IncomingMessage): Promise<URLSearchParams> {
  return new URLSearchParams((await readRequestBody(request)).toString("utf8"));
}

function routeForRole(role: string | null): string {
  return role === "member" ? "/member/dashboard" : role === "admin" || role === "chief_admin" ? "/admin" : "/signin";
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
        setCookie: mergeCookies(csrfCookie, response.headers.get("set-cookie"))
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

function renderBrandCss(): string {
  return `:root {
  --iwfsa-primary: ${brand.colors.primary};
  --iwfsa-secondary: ${brand.colors.secondary};
  --iwfsa-background: ${brand.colors.background};
  --iwfsa-surface: ${brand.colors.surface};
  --iwfsa-text: ${brand.colors.text};
  --iwfsa-muted-text: ${brand.colors.mutedText};
  --iwfsa-focus: ${brand.colors.focus};
  --iwfsa-private: ${brand.colors.semantic.private};
  --iwfsa-members: ${brand.colors.semantic.members};
  --iwfsa-public: ${brand.colors.semantic.public};
  --iwfsa-audit: ${brand.colors.semantic.audit};
  --iwfsa-motion: ${brand.motion.duration.base};
  --iwfsa-ease: ${brand.motion.easing.standard};
  font-family: ${brand.typography.fontFamily};
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--iwfsa-background); color: var(--iwfsa-text); font-family: ${brand.typography.fontFamily}; }
main { max-width: 64rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
.shell { background: var(--iwfsa-surface); border: 1px solid color-mix(in srgb, var(--iwfsa-primary) 14%, transparent); border-radius: 0.5rem; padding: 2rem; }
.eyebrow { color: var(--iwfsa-primary); font-size: ${brand.typography.scale.sm}; font-weight: 700; }
h1 { color: var(--iwfsa-primary); font-size: ${brand.typography.scale.xxl}; margin: 0.5rem 0 1rem; }
p, li { color: var(--iwfsa-muted-text); line-height: 1.55; }
.surface-nav { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.5rem; }
.surface-nav a, .primary-action, button { color: var(--iwfsa-primary); background: var(--iwfsa-background); border: 1px solid var(--iwfsa-secondary); border-radius: 0.375rem; padding: 0.7rem 0.9rem; text-decoration: none; transition: transform var(--iwfsa-motion) var(--iwfsa-ease); }
.surface-nav a:hover, .primary-action:hover, button:hover { transform: translateY(-1px); }
.primary-action, button[type="submit"] { background: var(--iwfsa-primary); color: var(--iwfsa-background); border-color: var(--iwfsa-primary); }
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid var(--iwfsa-focus); outline-offset: 2px; }
label { display: block; margin: 0.8rem 0; color: var(--iwfsa-text); }
input, select { min-height: 2.5rem; border: 1px solid var(--iwfsa-primary); border-radius: 0.375rem; padding: 0.5rem; }
.delight { color: var(--iwfsa-primary); font-weight: 700; }
.visibility-public { border-left: 0.25rem solid var(--iwfsa-public); padding-left: 0.75rem; }
.visibility-members { border-left: 0.25rem solid var(--iwfsa-members); padding-left: 0.75rem; }
.visibility-private { border-left: 0.25rem solid var(--iwfsa-private); padding-left: 0.75rem; }
.info-callout { border-left: 0.25rem solid var(--iwfsa-focus); background: color-mix(in srgb, var(--iwfsa-focus) 10%, var(--iwfsa-surface)); padding: 0.85rem 1rem; margin: 1rem 0; }
.info-callout strong { display: block; color: var(--iwfsa-primary); margin-bottom: 0.25rem; }
.info-callout p { margin: 0; color: var(--iwfsa-text); }
.audit-preview { color: var(--iwfsa-audit); font-weight: 700; }`;
}

function renderPage(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="/brand.css" />
  </head>
  <body>
    <main>${body}</main>
  </body>
</html>`;
}

function renderPublicPage(title: string, body: string, robots = "index, follow"): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="/brand.css" />
  </head>
  <body>
    <main>${body}</main>
  </body>
</html>`;
}

function renderSurfaceNav(surface: NavSurface): string {
  const links: Record<NavSurface, Array<[string, string]>> = {
    public: [["/", "Home"], ["/signin", "Sign in"]],
    member: [["/member/dashboard", "Dashboard"], ["/member/profile", "Profile"], ["/member/events", "Events"], ["/member/directory", "Directory"], ["/member/notifications", "Notifications"]],
    admin: [["/admin", "Console"], ["/admin/imports", "Imports"], ["/admin/standing", "Standing"], ["/admin/public-review", "Review Queue"], ["/admin/audit", "Audit"], ["/admin/support-notes", "Support Notes"]]
  };

  return `<nav class="surface-nav" data-surface-nav="${surface}">${links[surface].map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`).join("")}</nav>`;
}

function renderShell(input: {
  title: string;
  eyebrow: string;
  heading: string;
  summary: string;
  items: string[];
  surface: NavSurface;
  primaryAction?: { href: string; label: string };
  extra?: string;
}): string {
  const list = input.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const primaryAction = input.primaryAction
    ? `<a class="primary-action" data-primary-action="true" href="${input.primaryAction.href}">${escapeHtml(input.primaryAction.label)}</a>`
    : "";
  return renderPage(
    input.title,
    `<section class="shell" data-route-surface="${input.surface}">
      <div class="eyebrow">${escapeHtml(input.eyebrow)}</div>
      <h1>${escapeHtml(input.heading)}</h1>
      <p>${escapeHtml(input.summary)}</p>
      <ul>${list}</ul>
      ${primaryAction}
      ${input.extra || ""}
      ${renderSurfaceNav(input.surface)}
    </section>`
  );
}

function renderPrototypeNote(kind: "profile" | "import" | "approval"): string {
  const copy = {
    profile: `<div class="visibility-members" aria-label="Biography, visible to members only">Biography visibility: members only. Consent is required before public preview.</div><p class="audit-preview">Audit label: profile.visibility.changed</p>`,
    import: `<div class="visibility-private" aria-label="Import row, private admin preview">Duplicate resolution preview. No live member table is mutated.</div><p class="audit-preview">Audit label: import.preview.resolved_duplicate</p>`,
    approval: `<div class="visibility-public" aria-label="Public profile preview, approved content only">Approved public render preview. Hidden fields are not present.</div><p class="audit-preview">Audit label: public_profile.approved</p>`
  };

  return copy[kind];
}

function renderMemberProfilePublicationHint(): string {
  return `<div class="info-callout" data-component="InfoCallout" data-surface="member" role="note" aria-labelledby="member-profile-publication-hint-title" aria-describedby="member-profile-publication-hint-copy">
    <strong id="member-profile-publication-hint-title">Public visibility review</strong>
    <p id="member-profile-publication-hint-copy">Your profile will only appear publicly when your standing is Good and a curator approves it. You retain full control and can withdraw visibility at any time.</p>
  </div>`;
}

type PublicProfileView = {
  displayName: string;
  biography: string;
  updatedAt: string;
};

function projectPublicProfile(input: Record<string, unknown>): PublicProfileView {
  return {
    displayName: String(input.displayName || ""),
    biography: String(input.biography || ""),
    updatedAt: String(input.updatedAt || "")
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
  return (body.profiles || []).map(projectPublicProfile);
}

function renderPublicGallery(profiles: PublicProfileView[]): string {
  const cards = profiles.map((profile, index) => `<article class="visibility-public" data-public-story="${index + 1}">
    <h2>${escapeHtml(profile.displayName)}</h2>
    <p>${escapeHtml(profile.biography)}</p>
    <p class="audit-preview">Updated ${escapeHtml(profile.updatedAt)}</p>
    <a href="/public/story/${index + 1}">Read story</a>
  </article>`).join("");

  return renderPublicPage(
    "Public Gallery",
    `<section class="shell" data-route-surface="public">
      <div class="eyebrow">Public Gallery</div>
      <h1>Approved public stories</h1>
      <p>Only approved public-safe profile fields are rendered here.</p>
      ${cards || "<p>No approved public stories are available.</p>"}
      ${renderSurfaceNav("public")}
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
        ${renderSurfaceNav("public")}
      </section>`,
      "noindex, follow"
    );
  }

  return renderPublicPage(
    profile.displayName,
    `<article class="shell visibility-public" data-route-surface="public">
      <div class="eyebrow">Approved Story</div>
      <h1>${escapeHtml(profile.displayName)}</h1>
      <p>${escapeHtml(profile.biography)}</p>
      <p class="audit-preview">Updated ${escapeHtml(profile.updatedAt)}</p>
      ${renderSurfaceNav("public")}
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
  const sessionSummary = currentSession.isAuthenticated
    ? `Current session role: ${currentSession.role}.`
    : "No active session is currently established.";
  const errorBlock = input.errorMessage ? `<p><strong>${escapeHtml(input.errorMessage)}</strong></p>` : "";
  const signOutForm = currentSession.isAuthenticated ? `<form method="post" action="/signout"><button type="submit">Sign out</button></form>` : "";

  return renderShell({
    title: "Sign in",
    eyebrow: "Identity Entry",
    heading: "Unified sign-in",
    summary: "This Phase 2 surface uses API-backed CSRF and server-side session governance.",
    items: [
      sessionSummary,
      currentSession.allowRoleSelfSelection
        ? "Select a role to simulate the local identity flow before real credentials are introduced."
        : "Role self-selection is disabled outside local development."
    ],
    surface: "public",
    extra: `${errorBlock}
      ${currentSession.allowRoleSelfSelection ? `<form method="post" action="/signin">
        <label>Role
          <select name="role">
            <option value="member">member</option>
            <option value="admin">admin</option>
            <option value="chief_admin">chief_admin</option>
          </select>
        </label>
        <label>Session subject <input type="text" name="subject" value="phase2.user" /></label>
        <button type="submit">Establish session</button>
      </form>` : ""}
      ${signOutForm}`
  });
}

async function loadAuthContext(url: URL, request: http.IncomingMessage, config: ServiceConfig, authGateway: AuthGateway): Promise<WebAuthSession> {
  const guardedPrefixes = ["/signin", "/member", "/admin"];

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
        renderShell({
          title: "IWFSA Platform V2",
          eyebrow: "Public Surface",
          heading: "IWFSA Platform V2 rebuild scaffold",
          summary: "This shell supports the trace-driven rebuild before business workflows are implemented.",
          items: ["Phase 2 establishes identity, CSRF, policy, route guards, and documentation controls."],
          surface: "public",
          primaryAction: { href: "/signin", label: "Sign in" }
        })
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
        const role = form.get("role");
        const subject = form.get("subject");
        const result = await authGateway.createSession({ role, subject });

        if (!result.ok) {
          sendHtml(response, 400, renderSignInPage({ currentSession: authContext, errorMessage: "The request could not be completed." }));
          return;
        }

        sendRedirect(response, String(result.body.nextRoute || routeForRole(role)), {
          "set-cookie": result.setCookie
        });
        return;
      }
    }

    if (url.pathname === "/signout") {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "method_not_allowed" });
        return;
      }

      const result = await authGateway.clearSession(request.headers.cookie || "");
      sendRedirect(response, "/signin", { "set-cookie": result.setCookie });
      return;
    }

    const memberTasks: Record<string, TaskId> = {
      "/member": "member.dashboard",
      "/member/dashboard": "member.dashboard",
      "/member/profile": "member.profile.edit",
      "/member/profile/edit": "member.profile.edit",
      "/member/profile/visibility": "member.profile.visibility",
      "/member/profile/confirmation": "member.profile.edit",
      "/member/events": "member.events.view",
      "/member/directory": "member.directory.view",
      "/member/notifications": "member.notifications.view"
    };

    if (url.pathname === "/member/standing" || url.pathname === "/member/consent-required") {
      sendHtml(response, 200, renderShell({
        title: "Member Notice",
        eyebrow: "Member Fallback",
        heading: "Member dashboard",
        summary: "This is the member-safe fallback route for standing or consent checks.",
        items: ["No restricted route existence is exposed."],
        surface: "member",
        primaryAction: { href: "/member/dashboard", label: "Return to dashboard" }
      }));
      return;
    }

    if (Object.hasOwn(memberTasks, url.pathname)) {
      if (!authContext.authServiceAvailable) {
        sendHtml(response, 503, renderAuthServiceFailurePage());
        return;
      }

      const decision = routeAllowed(authContext, "member", memberTasks[url.pathname]);
      if (!decision.allowed) {
        sendRedirect(response, decision.fallback);
        return;
      }

      sendHtml(response, 200, renderShell({
        title: "Member Surface",
        eyebrow: "Member Task",
        heading: url.pathname.includes("profile") ? "Profile visibility control" : "Member portal placeholder",
        summary: url.pathname.includes("profile")
          ? "Update one profile field, choose visibility, and confirm what will be recorded."
          : "This member route is mapped through the Phase 2 policy matrix.",
        items: url.pathname.includes("profile")
          ? ["Visibility state is announced for assistive technology.", "Consent stays member-controlled.", "The next screen confirms the audit trail."]
          : ["No real member data is exposed by the scaffold."],
        surface: "member",
        primaryAction: memberTasks[url.pathname] === "member.dashboard"
          ? { href: "/member/profile/edit", label: "Complete profile" }
          : url.pathname === "/member/profile/edit"
            ? { href: "/member/profile/visibility", label: "Set visibility" }
            : url.pathname === "/member/profile/visibility"
              ? { href: "/member/profile/confirmation", label: "Save profile field" }
              : undefined,
        extra: url.pathname.includes("profile") ? `${renderMemberProfilePublicationHint()}${renderPrototypeNote("profile")}` : undefined
      }));
      return;
    }

    const adminTasks: Record<string, TaskId> = {
      "/admin": "admin.dashboard",
      "/admin/imports": "admin.import.preview",
      "/admin/import/preview": "admin.import.preview",
      "/admin/import/resolve-duplicate": "admin.import.preview",
      "/admin/import/commit": "admin.import.commit",
      "/admin/standing": "admin.standing.manage",
      "/admin/public-review": "admin.public-review.queue",
      "/admin/public-review/approve": "admin.public-review.queue",
      "/admin/audit": "admin.audit.read",
      "/admin/support-notes": "admin.support-notes.add"
    };

    if (Object.hasOwn(adminTasks, url.pathname)) {
      if (!authContext.authServiceAvailable) {
        sendHtml(response, 503, renderAuthServiceFailurePage());
        return;
      }

      const decision = routeAllowed(authContext, "admin", adminTasks[url.pathname], true);
      if (!decision.allowed) {
        sendRedirect(response, decision.fallback);
        return;
      }

      sendHtml(response, 200, renderShell({
        title: "Admin Surface",
        eyebrow: "Admin Task",
        heading: url.pathname.includes("import") ? "Import preview stewardship" : url.pathname.includes("public-review") ? "Public approval review" : "Admin console placeholder",
        summary: url.pathname.includes("import")
          ? "Review one import batch decision with validation and audit preview before commit."
          : url.pathname.includes("public-review")
            ? "Compare member submission with public render before approval."
            : "This admin route is mapped through the Phase 2 policy matrix.",
        items: url.pathname.includes("import")
          ? ["Preview does not mutate live records.", "Duplicate handling is explicit.", "Commit requires audit confirmation."]
          : url.pathname.includes("public-review")
            ? ["Only approved public fields are rendered.", "Hidden fields remain absent.", "Approval is audit-labelled."]
            : ["Privileged behavior remains guarded by policy and audit rules."],
        surface: "admin",
        primaryAction: adminTasks[url.pathname] === "admin.dashboard"
          ? { href: "/admin/import/preview", label: "Review imports" }
          : url.pathname === "/admin/import/preview"
            ? { href: "/admin/import/resolve-duplicate", label: "Resolve duplicate" }
            : url.pathname === "/admin/import/resolve-duplicate"
              ? { href: "/admin/import/commit", label: "Commit import" }
              : url.pathname === "/admin/import/commit"
                ? { href: "/admin/audit", label: "View audit log" }
                : url.pathname === "/admin/public-review"
                  ? { href: "/admin/public-review/approve", label: "Approve public render" }
                  : undefined,
        extra: url.pathname.includes("import") ? renderPrototypeNote("import") : url.pathname.includes("public-review") ? renderPrototypeNote("approval") : undefined
      }));
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
