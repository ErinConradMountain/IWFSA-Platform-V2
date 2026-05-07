import assert from "node:assert/strict";
import http from "node:http";

process.env.VERCEL = process.env.VERCEL || "1";
process.env.NODE_ENV = process.env.NODE_ENV || "test";

const { default: handler } = await import("../api/index.mjs");

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

function assertRouteContract(path, html, input) {
  for (const marker of input.mustContain || []) {
    assert.match(html, new RegExp(marker), `${path} should contain ${marker}`);
  }

  for (const marker of input.mustNotContain || []) {
    assert.doesNotMatch(html, new RegExp(marker), `${path} should not contain ${marker}`);
  }

  const primaryActions = (html.match(/data-primary-action="true"/g) || []).length;
  assert.ok(primaryActions <= (input.maxPrimaryActions ?? 1), `${path} should have no more than one primary action`);

  if (input.surface) {
    assert.match(html, new RegExp(`data-route-surface="${input.surface}"|data-surface-nav="${input.surface}"`), `${path} should identify the ${input.surface} surface`);
  }
}

async function expectHtml(baseUrl, path, input = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: input.cookie ? { cookie: input.cookie } : {},
    redirect: input.redirect || "follow"
  });
  const html = await response.text();

  assert.equal(response.status, input.status || 200, `${path} should return ${input.status || 200}`);
  assertRouteContract(path, html, input);
  return { response, html };
}

async function signInWithPreviewCredential(baseUrl, input) {
  const response = await fetch(`${baseUrl}/signin`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ subject: input.subject, accessCode: "1possibility" }),
    redirect: "manual"
  });

  assert.equal(response.status, 303, `${input.subject} should sign in`);
  assert.equal(response.headers.get("location"), input.expectedLocation, `${input.subject} should route to the expected surface`);
  assert.equal((response.headers.get("set-cookie") || "").match(/iwfsa_session=/g)?.length, 1, `${input.subject} should receive one session cookie`);
  return latestSessionCookie(response.headers.get("set-cookie"));
}

async function postForm(baseUrl, path, cookie, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie
    },
    body: new URLSearchParams(body),
    redirect: "manual"
  });
  const html = await response.text();
  return { response, html };
}

const server = http.createServer((request, response) => handler(request, response));
const baseUrl = await listen(server);

try {
  await expectHtml(baseUrl, "/", {
    surface: "public",
    mustContain: ["Leading with Purpose", "Public review paths", "Honorary members", "Memorials"],
    mustNotContain: ['href="/admin', 'href="/member']
  });
  await expectHtml(baseUrl, "/public/gallery", {
    surface: "public",
    mustContain: ["Approved public stories"],
    mustNotContain: ["private-id", "consent_timestamp", "review_notes", 'href="/admin', 'href="/member']
  });
  await expectHtml(baseUrl, "/public-profiles", {
    surface: "public",
    mustContain: ["Approved public stories"],
    mustNotContain: ['href="/admin', 'href="/member']
  });
  await expectHtml(baseUrl, "/public/story/1", {
    surface: "public",
    mustContain: ["Approved Story"],
    mustNotContain: ["private-id", "consent_timestamp", "review_notes", 'href="/admin', 'href="/member']
  });
  await expectHtml(baseUrl, "/honoraries", {
    surface: "public",
    mustContain: ["Approved honorary members", "Approval gated", "No private fields"],
    mustNotContain: ['href="/admin', 'href="/member']
  });
  await expectHtml(baseUrl, "/memorials", {
    surface: "public",
    mustContain: ["Approved memorial tributes", "Approval gated", "No private fields"],
    mustNotContain: ['href="/admin', 'href="/member']
  });
  await expectHtml(baseUrl, "/contact", {
    surface: "public",
    mustContain: ["Contact IWFSA", "No private records"],
    mustNotContain: ['href="/admin', 'href="/member']
  });

  const memberCookie = await signInWithPreviewCredential(baseUrl, {
    subject: "naledi.k",
    expectedLocation: "/member/dashboard"
  });

  for (const [path, markers] of [
    ["/member/dashboard", ["Member workspace", "Complete profile"]],
    ["/member/profile", ["Profile visibility control", "Field visibility guide"]],
    ["/member/events", ["Choose and manage event participation", "Leadership Circle", "RSVP"]],
    ["/member/directory", ["Consent-scoped directory", "Search visible profiles"]],
    ["/member/notifications", ["Member notifications", "In-app active"]],
    ["/member/consent-required", ["Consent required", "Protected feature content remains hidden"]],
    ["/member/standing", ["Standing review required", "No private standing detail shown"]]
  ]) {
    await expectHtml(baseUrl, path, {
      cookie: memberCookie,
      surface: "member",
      mustContain: markers,
      mustNotContain: ['href="/admin']
    });
  }

  const rsvp = await postForm(baseUrl, "/member/events", memberCookie, { eventId: "event-1" });
  assert.equal(rsvp.response.status, 200, "member RSVP should return the updated events page");
  assert.match(rsvp.html, /You're in|waitlist/, "member RSVP should show a clear participation result");
  assert.doesNotMatch(rsvp.html, /href="\/admin/, "member RSVP result should not expose admin navigation");

  const deniedAdmin = await fetch(`${baseUrl}/admin`, {
    headers: { cookie: memberCookie },
    redirect: "manual"
  });
  assert.equal(deniedAdmin.status, 303, "member should not render admin surface");
  assert.equal(deniedAdmin.headers.get("location"), "/", "member admin denial should use public-safe fallback");

  const adminCookie = await signInWithPreviewCredential(baseUrl, {
    subject: "akeida",
    expectedLocation: "/admin"
  });

  for (const [path, markers] of [
    ["/admin", ["Admin stewardship console", "Reviewer-ready pilot", "Audit readiness"]],
    ["/admin/members", ["Member stewardship", "Create temporary member", "Clean Slate remains separated"]],
    ["/admin/events", ["Set up and steward events", "Create event"]],
    ["/admin/import/preview", ["Import preview stewardship", "No live mutation"]],
    ["/admin/public-review", ["Public profile review", "Approval checklist"]],
    ["/admin/audit", ["Audit trail", "Correlation ID", "Privacy boundary"]]
  ]) {
    await expectHtml(baseUrl, path, {
      cookie: adminCookie,
      surface: "admin",
      mustContain: markers,
      mustNotContain: ['href="/member']
    });
  }

  const createMember = await postForm(baseUrl, "/admin/members", adminCookie, {
    displayName: "Walkthrough Reviewer Member",
    roleTitle: "Reviewer",
    organisation: "IWFSA",
    confirmCreate: "confirmed"
  });
  assert.equal(createMember.response.status, 200, "admin member create should return the members page");
  assert.match(createMember.html, /Temporary member record created/);
  assert.match(createMember.html, /Audit-aware confirmation/);

  const createEvent = await postForm(baseUrl, "/admin/events", adminCookie, {
    title: "Walkthrough Reviewer Event",
    maxCapacity: "30"
  });
  assert.equal(createEvent.response.status, 200, "admin event create should return the events page");
  assert.match(createEvent.html, /Event created/);
  assert.match(createEvent.html, /Walkthrough Reviewer Event/);

  process.stdout.write("reviewer walkthrough smoke passed for public, member, admin, RSVP, and admin CRUD review paths\n");
} finally {
  await close(server);
}
