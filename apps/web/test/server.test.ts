import test from "node:test";
import assert from "node:assert/strict";
import type http from "node:http";

import { createInMemoryAuditRepository } from "@iwfsa/common/audit";
import { createInMemorySessionRepository } from "@iwfsa/common/session-repository";
import { createApiServer } from "../../api/src/server.ts";
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

async function withRealApiAndWeb(callback: (baseUrl: string) => Promise<void>): Promise<void> {
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
  await new Promise<void>((resolve) => apiServer.listen(0, "127.0.0.1", resolve));
  const apiAddress = apiServer.address();
  assert.ok(apiAddress && typeof apiAddress === "object");

  const webServer = createWebServer({
    serviceName: "web",
    environment: "test",
    startedAt: "now",
    host: "127.0.0.1",
    port: 0,
    apiBaseUrl: `http://127.0.0.1:${apiAddress.port}`,
    allowRoleSelfSelection: true,
    localDevelopment: true,
    secureCookies: false,
    sessionTtlMs: 30 * 60 * 1000,
    persistenceTarget: "memory"
  });
  await new Promise<void>((resolve) => webServer.listen(0, "127.0.0.1", resolve));
  const webAddress = webServer.address();
  assert.ok(webAddress && typeof webAddress === "object");

  try {
    await callback(`http://127.0.0.1:${webAddress.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => webServer.close((error) => (error ? reject(error) : resolve())));
    await new Promise<void>((resolve, reject) => apiServer.close((error) => (error ? reject(error) : resolve())));
  }
}

test("web public landing renders V1 home visual entrance", async () => {
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
    assert.match(body, /Leading with Purpose\./);
    assert.match(body, /\/legacy-assets\/iwfsa-home.jpg/);
    assert.match(body, /\/legacy-assets\/iwfsa-logo.svg/);
    assert.match(body, /data-primary-action="true"/);
    assert.equal((body.match(/data-primary-action="true"/g) || []).length, 1);
    assert.match(body, /A professional home for accomplished women/);
    assert.match(body, /strengthens ethical leadership and meaningful impact/);
    assert.doesNotMatch(body, /View approved stories/);
    assert.doesNotMatch(body, />Home<\/a>/);
    assert.doesNotMatch(body, /Purposeful programmes|Mentoring and connection/);
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

test("sign-in page presents identity-based access with visual assets", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/signin`);
    const body = await response.text();
    const css = await (await fetch(`${baseUrl}/brand.css`)).text();

    assert.equal(response.status, 200);
    assert.match(body, /Member Access/);
    assert.match(body, /Portal Access/);
    assert.match(body, /Username/);
    assert.match(body, /Password/);
    assert.match(body, /type="text"/);
    assert.match(body, /data-primary-action="true">Sign in/);
    assert.match(css, /\/legacy-assets\/iwfsa-home.jpg/);
    assert.match(body, /\/legacy-assets\/iwfsa-logo.svg/);
    assert.doesNotMatch(body, /<select name="role">/);
    assert.doesNotMatch(body, /Establish session/);
    assert.equal((body.match(/data-primary-action="true"/g) || []).length, 1);
  });
});

test("local sign-in accepts V1 test credentials for member and admin access", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const memberResponse = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        subject: "naledi.k",
        accessCode: "1possibility"
      }),
      redirect: "manual"
    });
    const adminResponse = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        subject: "akeida",
        accessCode: "1possibility"
      }),
      redirect: "manual"
    });

    assert.equal(memberResponse.status, 303);
    assert.equal(memberResponse.headers.get("location"), "/member/dashboard");
    assert.equal(adminResponse.status, 303);
    assert.equal(adminResponse.headers.get("location"), "/admin");
  });
});

test("local sign-in rejects unknown V1 test credentials", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        subject: "naledi.k",
        accessCode: "wrong-password"
      })
    });
    const body = await response.text();

    assert.equal(response.status, 400);
    assert.match(body, /username or password could not be verified/i);
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
    assert.equal((response.headers.get("set-cookie") || "").match(/iwfsa_session=/g)?.length, 1);
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

test("web member dashboard renders integrated design handoff for authenticated session cookie", async () => {
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
    assert.match(body, /Member workspace/);
    assert.match(body, /Today's member priorities/);
    assert.match(body, /Consent scoped/);
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

test("member directory notifications consent and standing pages render governed design states", async () => {
  await withApiAndWeb(async (baseUrl) => {
    const signInResponse = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "member",
        subject: "design.member"
      }),
      redirect: "manual"
    });
    const sessionCookie = signInResponse.headers.get("set-cookie");

    const directory = await fetch(`${baseUrl}/member/directory`, {
      headers: { cookie: sessionCookie || "" }
    });
    const directoryBody = await directory.text();
    assert.equal(directory.status, 200);
    assert.match(directoryBody, /Consent-scoped directory/);
    assert.match(directoryBody, /Search visible profiles/);
    assert.match(directoryBody, /Private email, phone, physical address/);
    assert.doesNotMatch(directoryBody, /href="\/admin/);

    const notifications = await fetch(`${baseUrl}/member/notifications`, {
      headers: { cookie: sessionCookie || "" }
    });
    const notificationsBody = await notifications.text();
    assert.equal(notifications.status, 200);
    assert.match(notificationsBody, /Member notifications/);
    assert.match(notificationsBody, /In-app active/);
    assert.match(notificationsBody, /SMS future/);
    assert.equal((notificationsBody.match(/data-primary-action="true"/g) || []).length, 1);

    const consent = await fetch(`${baseUrl}/member/consent-required`, {
      headers: { cookie: sessionCookie || "" }
    });
    const consentBody = await consent.text();
    assert.equal(consent.status, 200);
    assert.match(consentBody, /Consent required/);
    assert.match(consentBody, /Protected feature content remains hidden/);
    assert.match(consentBody, /Review consent/);

    const standing = await fetch(`${baseUrl}/member/standing`, {
      headers: { cookie: sessionCookie || "" }
    });
    const standingBody = await standing.text();
    assert.equal(standing.status, 200);
    assert.match(standingBody, /Standing review required/);
    assert.match(standingBody, /No private standing detail shown/);
    assert.doesNotMatch(standingBody, /bad standing|failed member/i);
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
    assert.match(body, /Review flagged rows/);
    assert.match(body, /Preview and duplicate resolution do not mutate live records/);
    assert.match(body, /No live mutation/);
    assert.equal((body.match(/data-primary-action="true"/g) || []).length, 1);
    assert.doesNotMatch(body, /href="\/member/);
  });
});

test("admin dashboard and members page integrate design handoff without member navigation", async () => {
  await withRealApiAndWeb(async (baseUrl) => {
    const signInResponse = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "admin",
        subject: "members.admin"
      }),
      redirect: "manual"
    });
    const sessionCookie = signInResponse.headers.get("set-cookie");

    const dashboard = await fetch(`${baseUrl}/admin`, {
      headers: { cookie: sessionCookie || "" }
    });
    const dashboardBody = await dashboard.text();
    assert.equal(dashboard.status, 200);
    assert.match(dashboardBody, /Admin stewardship console/);
    assert.match(dashboardBody, /Review imports/);
    assert.equal((dashboardBody.match(/data-primary-action="true"/g) || []).length, 1);
    assert.doesNotMatch(dashboardBody, /href="\/member/);

    const members = await fetch(`${baseUrl}/admin/members`, {
      headers: { cookie: sessionCookie || "" }
    });
    const membersBody = await members.text();
    assert.equal(members.status, 200);
    assert.match(membersBody, /Member stewardship/);
    assert.match(membersBody, /Create temporary member/);
    assert.match(membersBody, /I confirm this temporary record should be created for admin stewardship/);
    assert.match(membersBody, /Clean Slate remains separated/);
    assert.equal((membersBody.match(/data-primary-action="true"/g) || []).length, 1);
    assert.doesNotMatch(membersBody, /href="\/member/);

    const create = await fetch(`${baseUrl}/admin/members`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: sessionCookie || ""
      },
      body: new URLSearchParams({
        displayName: "Temporary Design Member",
        roleTitle: "Member",
        organisation: "IWFSA",
        confirmCreate: "confirmed"
      })
    });
    const createBody = await create.text();
    assert.equal(create.status, 200);
    assert.match(createBody, /Temporary member record created/);
    assert.match(createBody, /Create confirmation accepted/);
    assert.match(createBody, /Temporary Design Member/);

    const edit = await fetch(`${baseUrl}/admin/members/member-temporary-design-member/edit`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: sessionCookie || ""
      },
      body: new URLSearchParams({
        displayName: "Temporary Design Member Updated",
        roleTitle: "Programme Steward",
        organisation: "IWFSA",
        status: "Suspended",
        confirmEdit: "confirmed"
      })
    });
    const editBody = await edit.text();
    assert.equal(edit.status, 200);
    assert.match(editBody, /Temporary member record updated/);
    assert.match(editBody, /Edit confirmation accepted/);
    assert.match(editBody, /Temporary Design Member Updated/);

    const remove = await fetch(`${baseUrl}/admin/members/member-temporary-design-member/delete`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: sessionCookie || ""
      },
      body: new URLSearchParams({
        confirmDelete: "confirmed"
      })
    });
    const removeBody = await remove.text();
    assert.equal(remove.status, 200);
    assert.match(removeBody, /Temporary member record deleted/);
    assert.match(removeBody, /Delete confirmation accepted/);
    assert.doesNotMatch(removeBody, /Temporary Design Member Updated/);
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

test("public gallery and story render approved projection without private fields", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    assert.match(String(input), /\/api\/public\/profiles/);
    return new Response(JSON.stringify({
      profiles: [
        {
          displayName: "Approved Member",
          biography: "Public-safe story.",
          updatedAt: "2026-05-03T10:00:00.000Z",
          internal_id: "private-id",
          consent_timestamp: "private",
          review_notes: "private"
        }
      ]
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  const server = createWebServer({
    serviceName: "web",
    environment: "test",
    startedAt: "now",
    host: "127.0.0.1",
    port: 0,
    apiBaseUrl: "http://api.test",
    localDevelopment: true,
    allowRoleSelfSelection: true,
    secureCookies: false,
    sessionTtlMs: 1000,
    persistenceTarget: "memory"
  }, { fetchImpl: fetchImpl as typeof fetch });

  await withServer(server, async (baseUrl) => {
    const gallery = await fetch(`${baseUrl}/public/gallery`);
    const galleryBody = await gallery.text();
    assert.equal(gallery.status, 200);
    assert.match(galleryBody, /Approved public stories/);
    assert.match(galleryBody, /Approved Member/);
    assert.match(galleryBody, /\/legacy-assets\/member-portrait-ayanda.svg/);
    assert.doesNotMatch(galleryBody, /private-id|consent_timestamp|review_notes/);
    assert.doesNotMatch(galleryBody, /href="\/admin|href="\/member/);

    const story = await fetch(`${baseUrl}/public/story/1`);
    const storyBody = await story.text();
    assert.equal(story.status, 200);
    assert.match(storyBody, /Approved Story/);
    assert.doesNotMatch(storyBody, /private-id|consent_timestamp|review_notes/);

    const missing = await fetch(`${baseUrl}/public/story/revoked`);
    const missingBody = await missing.text();
    assert.equal(missing.status, 404);
    assert.match(missingBody, /noindex, follow/);
  });
});

test("robots file blocks protected and revoked public paths", async () => {
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
    const response = await fetch(`${baseUrl}/robots.txt`);
    const body = await response.text();
    assert.equal(response.status, 200);
    assert.match(body, /Disallow: \/admin\//);
    assert.match(body, /Disallow: \/member\//);
    assert.match(body, /Disallow: \/public\/story\/revoked/);
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

test("member events page lists published events and records RSVP", async () => {
  await withRealApiAndWeb(async (baseUrl) => {
    const signInResponse = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "member",
        subject: "events.member"
      }),
      redirect: "manual"
    });
    const sessionCookie = signInResponse.headers.get("set-cookie");
    const eventsPage = await fetch(`${baseUrl}/member/events`, {
      headers: { cookie: sessionCookie || "" }
    });
    const eventsBody = await eventsPage.text();

    assert.equal(eventsPage.status, 200);
    assert.match(eventsBody, /Choose and manage event participation/);
    assert.match(eventsBody, /Leadership Circle/);
    assert.match(eventsBody, /RSVP/);
    assert.doesNotMatch(eventsBody, /href="\/admin/);

    const rsvp = await fetch(`${baseUrl}/member/events`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: sessionCookie || ""
      },
      body: new URLSearchParams({ eventId: "event-1" })
    });
    const rsvpBody = await rsvp.text();

    assert.equal(rsvp.status, 200);
    assert.match(rsvpBody, /You&#39;re in\. See you there\./);
  });
});

test("admin events page creates edits and deletes temporary events", async () => {
  await withRealApiAndWeb(async (baseUrl) => {
    const signInResponse = await fetch(`${baseUrl}/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        role: "admin",
        subject: "events.admin"
      }),
      redirect: "manual"
    });
    const sessionCookie = signInResponse.headers.get("set-cookie");
    const page = await fetch(`${baseUrl}/admin/events`, {
      headers: { cookie: sessionCookie || "" }
    });
    const pageBody = await page.text();

    assert.equal(page.status, 200);
    assert.match(pageBody, /Set up and steward events/);
    assert.match(pageBody, /Create event/);
    assert.match(pageBody, /Leadership Circle/);
    assert.doesNotMatch(pageBody, /href="\/member/);

    const create = await fetch(`${baseUrl}/admin/events`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: sessionCookie || ""
      },
      body: new URLSearchParams({ title: "Leadership Test Workshop", maxCapacity: "12" })
    });
    const createBody = await create.text();
    assert.equal(create.status, 200);
    assert.match(createBody, /Event created\./);
    assert.match(createBody, /Leadership Test Workshop/);

    const edit = await fetch(`${baseUrl}/admin/events/event-leadership-test-workshop/edit`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: sessionCookie || ""
      },
      body: new URLSearchParams({ title: "Updated Leadership Test Workshop", maxCapacity: "18" })
    });
    const editBody = await edit.text();
    assert.equal(edit.status, 200);
    assert.match(editBody, /Event updated\./);
    assert.match(editBody, /Updated Leadership Test Workshop/);

    const remove = await fetch(`${baseUrl}/admin/events/event-leadership-test-workshop/delete`, {
      method: "POST",
      headers: { cookie: sessionCookie || "" }
    });
    const removeBody = await remove.text();
    assert.equal(remove.status, 200);
    assert.match(removeBody, /Event deleted\./);
    assert.doesNotMatch(removeBody, /Updated Leadership Test Workshop/);
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
