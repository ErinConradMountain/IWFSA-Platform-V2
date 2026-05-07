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

async function readText(response) {
  const text = await response.text();
  return { response, text };
}

async function signIn(baseUrl, role, subject) {
  const response = await fetch(`${baseUrl}/signin`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ role, subject }),
    redirect: "manual"
  });

  const expectedLocation = role === "member" ? "/member/dashboard" : "/admin";
  assert.equal(response.status, 303, `${role} sign-in should redirect`);
  assert.equal(response.headers.get("location"), expectedLocation, `${role} sign-in should choose the correct surface`);
  assert.equal((response.headers.get("set-cookie") || "").match(/iwfsa_session=/g)?.length, 1, `${role} sign-in should forward one session cookie`);
  return latestSessionCookie(response.headers.get("set-cookie"));
}

async function expectHtml(baseUrl, path, input = {}) {
  const { response, text } = await readText(await fetch(`${baseUrl}${path}`, {
    headers: input.cookie ? { cookie: input.cookie } : {}
  }));

  assert.equal(response.status, input.status || 200, `${path} should return ${input.status || 200}`);
  for (const marker of input.mustContain || []) {
    assert.match(text, new RegExp(marker), `${path} should contain ${marker}`);
  }
  for (const marker of input.mustNotContain || []) {
    assert.doesNotMatch(text, new RegExp(marker), `${path} should not contain ${marker}`);
  }

  return text;
}

const server = http.createServer((request, response) => handler(request, response));
const baseUrl = await listen(server);

try {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200, "web health should respond");
  assert.match(await health.text(), /"surface":\s*"web"/, "web health should identify the web surface");

  const brandCss = await fetch(`${baseUrl}/brand.css`);
  assert.equal(brandCss.status, 200, "brand CSS should respond");
  assert.match(await brandCss.text(), /--iwfsa-primary:/, "brand CSS should expose token-backed variables");

  const csrf = await fetch(`${baseUrl}/api/csrf-token`);
  assert.equal(csrf.status, 200, "API CSRF endpoint should route through the serverless handler");
  assert.match(await csrf.text(), /csrfToken/, "API CSRF endpoint should return a token");

  await expectHtml(baseUrl, "/public/gallery", {
    mustContain: ["Approved public stories"],
    mustNotContain: ['href="/member', 'href="/admin']
  });

  const memberCookie = await signIn(baseUrl, "member", "preview.member");
  await expectHtml(baseUrl, "/member/dashboard", {
    cookie: memberCookie,
    mustContain: ["Member workspace", "Complete profile"],
    mustNotContain: ['href="/admin']
  });

  const adminCookie = await signIn(baseUrl, "admin", "preview.admin");
  await expectHtml(baseUrl, "/admin", {
    cookie: adminCookie,
    mustContain: ["Admin stewardship console", "Review imports"],
    mustNotContain: ['href="/member']
  });

  const deniedAdmin = await fetch(`${baseUrl}/admin`, {
    headers: { cookie: memberCookie },
    redirect: "manual"
  });
  assert.equal(deniedAdmin.status, 303, "member session should not render the admin surface");
  assert.equal(deniedAdmin.headers.get("location"), "/", "member session should fall back safely from admin surface");

  process.stdout.write("serverless preview smoke passed for public, member, admin, API, and fallback routes\n");
} finally {
  await close(server);
}
