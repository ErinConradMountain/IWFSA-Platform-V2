import { createInMemoryAuditRepository } from "@iwfsa/common/audit";
import { createInMemorySessionRepository } from "@iwfsa/common/session-repository";
import { createApiServer } from "../apps/api/src/server.ts";
import { createWebServer } from "../apps/web/src/server.ts";

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address !== "object") {
        throw new Error("server did not expose an address");
      }
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

function latestSessionCookie(setCookie) {
  const matches = [...String(setCookie || "").matchAll(/iwfsa_session=([^;\s]+)/g)];
  if (matches.length === 0) {
    throw new Error("sign-in did not return an iwfsa_session cookie");
  }
  return `iwfsa_session=${matches.at(-1)[1]}`;
}

async function signIn(baseUrl, role, subject) {
  const response = await fetch(`${baseUrl}/signin`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ role, subject }),
    redirect: "manual"
  });

  if (response.status !== 303) {
    throw new Error(`expected sign-in redirect for ${role}, got ${response.status}`);
  }

  return latestSessionCookie(response.headers.get("set-cookie"));
}

async function checkRoute(baseUrl, cookie, route, input) {
  const response = await fetch(`${baseUrl}${route}`, {
    headers: { cookie }
  });
  const html = await response.text();

  if (response.status !== 200) {
    throw new Error(`${route} returned ${response.status}`);
  }

  for (const marker of input.mustContain) {
    if (!html.includes(marker)) {
      throw new Error(`${route} missing marker: ${marker}`);
    }
  }

  for (const marker of input.mustNotContain) {
    if (html.includes(marker)) {
      throw new Error(`${route} contains forbidden marker: ${marker}`);
    }
  }

  const primaryActions = (html.match(/data-primary-action="true"/g) || []).length;
  if (primaryActions > 1) {
    throw new Error(`${route} has ${primaryActions} primary actions`);
  }

  const navSurface = html.match(/data-surface-nav="([^"]+)"/)?.[1];
  if (input.navSurface && navSurface !== input.navSurface) {
    throw new Error(`${route} rendered ${navSurface || "no"} navigation instead of ${input.navSurface}`);
  }

  const primaryActionHref = html.match(/data-primary-action="true" href="([^"]+)"/)?.[1];
  if (primaryActionHref) {
    if (!primaryActionHref.startsWith(input.allowedPrimaryActionPrefix)) {
      throw new Error(`${route} primary action points outside ${input.allowedPrimaryActionPrefix}: ${primaryActionHref}`);
    }

    const target = await fetch(`${baseUrl}${primaryActionHref}`, {
      headers: { cookie },
      redirect: "manual"
    });
    if (target.status !== 200) {
      throw new Error(`${route} primary action target ${primaryActionHref} returned ${target.status}`);
    }
  }

  return { route, primaryActions };
}

const apiServer = createApiServer({
  serviceName: "api",
  environment: "test",
  startedAt: "now",
  host: "127.0.0.1",
  port: 0,
  allowRoleSelfSelection: true,
  localDevelopment: true,
  secureCookies: false,
  sessionTtlMs: 30 * 60 * 1000,
  persistenceTarget: "memory"
}, {
  sessionRepository: createInMemorySessionRepository(),
  auditRepository: createInMemoryAuditRepository()
});

const apiBaseUrl = await listen(apiServer);
const webServer = createWebServer({
  serviceName: "web",
  environment: "test",
  startedAt: "now",
  host: "127.0.0.1",
  port: 0,
  apiBaseUrl,
  allowRoleSelfSelection: true,
  localDevelopment: true,
  secureCookies: false,
  sessionTtlMs: 30 * 60 * 1000,
  persistenceTarget: "memory"
});

const webBaseUrl = await listen(webServer);

try {
  const memberCookie = await signIn(webBaseUrl, "member", "design-smoke.member");
  const adminCookie = await signIn(webBaseUrl, "admin", "design-smoke.admin");

  const results = [];
  for (const [route, mustContain] of [
    ["/member/dashboard", ["Member workspace", "Today's member priorities", "Complete profile"]],
    ["/member/profile", ["Profile visibility control", "Field visibility guide"]],
    ["/member/directory", ["Consent-scoped directory", "Search visible profiles"]],
    ["/member/notifications", ["Member notifications", "In-app active", "SMS future"]],
    ["/member/consent-required", ["Consent required", "Protected feature content remains hidden"]],
    ["/member/standing", ["Standing review required", "No private standing detail shown"]]
  ]) {
    results.push(await checkRoute(webBaseUrl, memberCookie, route, {
      mustContain,
      mustNotContain: ['href="/admin', "bad standing", "failed member"],
      navSurface: "member",
      allowedPrimaryActionPrefix: "/member"
    }));
  }

  for (const [route, mustContain] of [
    ["/admin", ["Admin stewardship console", "Review imports"]],
    ["/admin/members", ["Member stewardship", "Create temporary member", "Clean Slate remains separated"]],
    ["/admin/import/preview", ["Import preview stewardship", "No live mutation", "Review flagged rows"]],
    ["/admin/public-review", ["Public profile review", "Approval checklist", "Review approval checklist"]]
  ]) {
    results.push(await checkRoute(webBaseUrl, adminCookie, route, {
      mustContain,
      mustNotContain: ['href="/member'],
      navSurface: "admin",
      allowedPrimaryActionPrefix: "/admin"
    }));
  }

  process.stdout.write(`design route smoke passed for ${results.length} authenticated routes\n`);
} finally {
  await close(webServer);
  await close(apiServer);
}
