import test from "node:test";
import assert from "node:assert/strict";
import type http from "node:http";

import { createWebServer } from "../src/server.ts";

async function withServer(server: http.Server, callback: (baseUrl: string) => Promise<void>): Promise<void> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  assert.ok(address && typeof address === "object");

  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

async function withApiAndWeb(callback: (baseUrl: string) => Promise<void>): Promise<void> {
  const sessions = new Map<string, { role: "member" | "admin" | "chief_admin"; subject: string; consent: "granted" }>();
  const authGateway = {
    async inspectSession(cookieHeader: string) {
      const token = /iwfsa_session=([^;]+)/.exec(cookieHeader)?.[1];
      const session = token ? sessions.get(token) : null;

      return {
        isAuthenticated: Boolean(session),
        role: session?.role || null,
        subject: session?.subject || null,
        standing: session ? "active" : "anonymous",
        consent: session?.consent || "not_required",
        nextRoute: session?.role === "member" ? "/member/dashboard" : session ? "/admin" : null
      };
    },
    async createSession(input: { role: string | null; subject: string | null }) {
      if (!input.role || !["member", "admin", "chief_admin"].includes(input.role)) {
        return {
          ok: false,
          status: 400,
          body: { error: "invalid_role" },
          setCookie: null
        };
      }

      const token = `test-${sessions.size + 1}`;
      const role = input.role as "member" | "admin" | "chief_admin";
      sessions.set(token, { role, subject: input.subject || `web.${role}`, consent: "granted" });

      return {
        ok: true,
        status: 201,
        body: { nextRoute: role === "member" ? "/member/dashboard" : "/admin" },
        setCookie: `iwfsa_session=${token}; Path=/; HttpOnly; SameSite=Lax`
      };
    },
    async clearSession(cookieHeader: string) {
      const token = /iwfsa_session=([^;]+)/.exec(cookieHeader)?.[1];
      if (token) {
        sessions.delete(token);
      }

      return {
        ok: true,
        status: 200,
        body: {},
        setCookie: "iwfsa_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
      };
    }
  };

  const webServer = createWebServer({
    serviceName: "web",
    environment: "test",
    startedAt: "now",
    host: "127.0.0.1",
    port: 0,
    apiBaseUrl: "http://127.0.0.1:4000",
    allowRoleSelfSelection: true,
    localDevelopment: true,
    secureCookies: false,
    sessionTtlMs: 30 * 60 * 1000,
    persistenceTarget: "memory"
  }, { authGateway });

  await new Promise<void>((resolve) => webServer.listen(0, "127.0.0.1", resolve));
  const webAddress = webServer.address();
  assert.ok(webAddress && typeof webAddress === "object");

  try {
    await callback(`http://127.0.0.1:${webAddress.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => webServer.close((error) => (error ? reject(error) : resolve())));
  }
}

test("web public shell renders rebuild heading", async () => {
  const server = createWebServer({
    serviceName: "web",
    environment: "test",
    startedAt: "now",
    host: "127.0.0.1",
    port: 0,
    localDevelopment: true,
    allowRoleSelfSelection: true,
    secureCookies: false,
    sessionTtlMs: 1000,
    persistenceTarget: "memory"
  });

  await withServer(server, async (baseUrl) => {
    const response = await fetch(baseUrl);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /IWFSA Platform V2 rebuild scaffold/);
  });
});

test("chief_admin sign-in redirects to admin route", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "chief_admin",
        subject: "web.chief"
      }),
      redirect: "manual"
    });

    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), "/admin");
  });
});

test("successful sign-in creates session and member redirects to member route", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "member",
        subject: "web.member"
      }),
      redirect: "manual"
    });

    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), "/member/dashboard");
    assert.match(response.headers.get("set-cookie") || "", /iwfsa_session=/);
  });
});

test("invalid role submission is rejected", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "bogus_role",
        subject: "invalid.user"
      })
    });
    const body = await response.text();

    assert.equal(response.status, 400);
    assert.match(body, /The request could not be completed/);
  });
});

test("web member placeholder renders for authenticated session cookie", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const signInResponse = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "member",
        subject: "cookie.member"
      }),
      redirect: "manual"
    });
    const sessionCookie = signInResponse.headers.get("set-cookie");

    const response = await fetch(`${baseUrl}/member`, {
      headers: {
        cookie: sessionCookie || ""
      }
    });
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /Member portal placeholder/);
    assert.match(body, /data-primary-action="true"/);
    assert.match(body, /Complete profile/);
    assert.doesNotMatch(body, /\/admin/);
  });
});

test("member profile prototype follows single-task visibility flow", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const signInResponse = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "member",
        subject: "profile.member"
      }),
      redirect: "manual"
    });
    const sessionCookie = signInResponse.headers.get("set-cookie");

    const response = await fetch(`${baseUrl}/member/profile/edit`, {
      headers: {
        cookie: sessionCookie || ""
      }
    });
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /Profile visibility control/);
    assert.match(body, /Biography, visible to members only/);
    assert.match(body, /Your profile will only appear publicly when your standing is Good and a curator approves it\. You retain full control and can withdraw visibility at any time\./);
    assert.match(body, /data-component="InfoCallout"/);
    assert.match(body, /aria-describedby="member-profile-publication-hint-copy"/);
    assert.match(body, /data-primary-action="true"/);
    assert.equal((body.match(/data-primary-action="true"/g) || []).length, 1);
    assert.doesNotMatch(body, /\/admin/);
  });
});

test("member publication hint is isolated from public and admin surfaces", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const memberCopy = "Your profile will only appear publicly when your standing is Good and a curator approves it.";
    const adminSignIn = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "admin",
        subject: "hint.admin"
      }),
      redirect: "manual"
    });
    const adminCookie = adminSignIn.headers.get("set-cookie");

    const publicPage = await fetch(`${baseUrl}/public/profile/seed-ayanda`);
    const adminPage = await fetch(`${baseUrl}/admin/public-review`, {
      headers: {
        cookie: adminCookie || ""
      }
    });

    assert.doesNotMatch(await publicPage.text(), new RegExp(memberCopy));
    assert.doesNotMatch(await adminPage.text(), new RegExp(memberCopy));
  });
});

test("admin import prototype shows audit preview and single primary action", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const signInResponse = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "admin",
        subject: "import.admin"
      }),
      redirect: "manual"
    });
    const sessionCookie = signInResponse.headers.get("set-cookie");

    const response = await fetch(`${baseUrl}/admin/import/preview`, {
      headers: {
        cookie: sessionCookie || ""
      }
    });
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /Import preview stewardship/);
    assert.match(body, /Audit label: import.preview.resolved_duplicate/);
    assert.match(body, /Resolve duplicate/);
    assert.equal((body.match(/data-primary-action="true"/g) || []).length, 1);
    assert.doesNotMatch(body, /\/member/);
  });
});

test("public profile prototype resolves legacy asset without protected navigation", async () => {
  const server = createWebServer({
    serviceName: "web",
    environment: "test",
    startedAt: "now",
    host: "127.0.0.1",
    port: 0,
    localDevelopment: true,
    allowRoleSelfSelection: true,
    secureCookies: false,
    sessionTtlMs: 1000,
    persistenceTarget: "memory"
  });

  await withServer(server, async (baseUrl) => {
    const page = await fetch(`${baseUrl}/public/profile/seed-ayanda`);
    const body = await page.text();
    const asset = await fetch(`${baseUrl}/legacy-assets/member-portrait-ayanda.svg`);

    assert.equal(page.status, 200);
    assert.match(body, /Approved public profile/);
    assert.match(body, /\/legacy-assets\/member-portrait-ayanda.svg/);
    assert.doesNotMatch(body, /href="\/admin/);
    assert.doesNotMatch(body, /href="\/member/);
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get("content-type"), "image/svg+xml");
  });
});

test("member session cannot access admin surface", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const signInResponse = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "member",
        subject: "member.admin.denied"
      }),
      redirect: "manual"
    });
    const sessionCookie = signInResponse.headers.get("set-cookie");

    const response = await fetch(`${baseUrl}/admin`, {
      headers: {
        cookie: sessionCookie || ""
      },
      redirect: "manual"
    });

    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), "/");
  });
});

test("sign-out invalidates the session", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const signInResponse = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "member",
        subject: "signout.member"
      }),
      redirect: "manual"
    });
    const sessionCookie = signInResponse.headers.get("set-cookie");

    const signOutResponse = await fetch(`${baseUrl}/signout`, {
      method: "POST",
      headers: {
        cookie: sessionCookie || ""
      },
      redirect: "manual"
    });

    assert.equal(signOutResponse.status, 303);
    assert.equal(signOutResponse.headers.get("location"), "/signin");
    assert.match(signOutResponse.headers.get("set-cookie") || "", /Max-Age=0/);

    const response = await fetch(`${baseUrl}/member`, {
      headers: {
        cookie: sessionCookie || ""
      },
      redirect: "manual"
    });

    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), "/signin");
  });
});

test("web shows auth-service failure separately from anonymous denial", async () => {
  const failingGateway = {
    async inspectSession() {
      throw new Error("auth service down");
    },
    async createSession() {
      throw new Error("not used");
    },
    async clearSession() {
      throw new Error("not used");
    }
  };

  const server = createWebServer({
    serviceName: "web",
    environment: "test",
    startedAt: "now",
    host: "127.0.0.1",
    port: 0,
    apiBaseUrl: "http://127.0.0.1:4000",
    allowRoleSelfSelection: true,
    localDevelopment: true,
    secureCookies: false,
    sessionTtlMs: 1000,
    persistenceTarget: "memory"
  }, { authGateway: failingGateway });

  await withServer(server, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/member`);
    const body = await response.text();

    assert.equal(response.status, 503);
    assert.match(body, /Authentication service unavailable/);
  });
});
