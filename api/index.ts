import { EventEmitter } from "node:events";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { PassThrough } from "node:stream";

import { createInMemoryAuditRepository } from "@iwfsa/common/audit";
import { createInMemoryPersistenceAdapter } from "@iwfsa/common/persistence";
import { createInMemoryRepositories } from "@iwfsa/common/repositories";
import { getServiceConfig, type ServiceConfig } from "@iwfsa/common/runtime";
import { createInMemorySessionRepository } from "@iwfsa/common/session-repository";
import { createApiServer } from "../apps/api/src/server.ts";
import { createWebServer } from "../apps/web/src/server.ts";

type HeaderRecord = Record<string, string | string[] | undefined>;

function previewConfig(serviceName: string, defaultPort: number): ServiceConfig {
  return {
    ...getServiceConfig(serviceName, defaultPort),
    environment: process.env.VERCEL ? "preview" : process.env.NODE_ENV || "development",
    localDevelopment: !process.env.VERCEL,
    allowRoleSelfSelection: true,
    persistenceTarget: "memory",
    secureCookies: Boolean(process.env.VERCEL)
  };
}

function normalizeHeaders(headers: Headers): HeaderRecord {
  const output: HeaderRecord = {};
  headers.forEach((value, key) => {
    output[key.toLowerCase()] = value;
  });
  return output;
}

function responseHeaders(input: Record<string, string | string[] | number>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : String(value)]));
}

function dispatch(server: http.Server, url: URL, init: RequestInit = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    const request = new PassThrough() as IncomingMessage;
    const response = new EventEmitter() as ServerResponse & {
      headers: Record<string, string | string[] | number>;
      chunks: Buffer[];
    };

    const body = typeof init.body === "string" || Buffer.isBuffer(init.body) ? init.body : "";
    const headers = normalizeHeaders(new Headers(init.headers));

    request.method = init.method || "GET";
    request.url = `${url.pathname}${url.search}`;
    request.headers = {
      ...headers,
      host: url.host
    };

    response.statusCode = 200;
    response.headers = {};
    response.chunks = [];
    response.writeHead = ((statusCode: number, headersToWrite?: HeaderRecord) => {
      response.statusCode = statusCode;
      if (headersToWrite) {
        for (const [key, value] of Object.entries(headersToWrite)) {
          if (value != null) {
            response.headers[key.toLowerCase()] = value;
          }
        }
      }
      return response;
    }) as ServerResponse["writeHead"];
    response.setHeader = ((key: string, value: string | string[] | number) => {
      response.headers[key.toLowerCase()] = value;
      return response;
    }) as ServerResponse["setHeader"];
    response.getHeader = ((key: string) => response.headers[key.toLowerCase()]) as ServerResponse["getHeader"];
    response.write = ((chunk: string | Buffer) => {
      response.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return true;
    }) as ServerResponse["write"];
    response.end = ((chunk?: string | Buffer) => {
      if (chunk) {
        response.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      response.emit("finish");
      resolve(new Response(Buffer.concat(response.chunks), {
        status: response.statusCode,
        headers: responseHeaders(response.headers)
      }));
      return response;
    }) as ServerResponse["end"];

    request.on("error", reject);
    server.emit("request", request, response);
    request.end(body);
  });
}

const apiConfig = previewConfig("api", 4000);
const webConfig = {
  ...previewConfig("web", 3000),
  apiBaseUrl: "https://iwfsa-preview.internal"
};
const sessionRepository = createInMemorySessionRepository({ ttlMs: apiConfig.sessionTtlMs });
const auditRepository = createInMemoryAuditRepository();
const repositories = createInMemoryRepositories();
const persistenceAdapter = createInMemoryPersistenceAdapter({ environment: apiConfig.environment });
const apiServer = createApiServer(apiConfig, {
  sessionRepository,
  auditRepository,
  repositories,
  persistenceAdapter
});
const webServer = createWebServer(webConfig, {
  fetchImpl(input, init) {
    const url = new URL(input instanceof URL ? input.toString() : String(input));
    if (url.pathname.startsWith("/api")) {
      return dispatch(apiServer, url, init);
    }
    return fetch(input, init);
  }
});

export default function handler(request: IncomingMessage, response: ServerResponse): void {
  const url = new URL(request.url || "/", `https://${request.headers.host || "localhost"}`);
  const server = url.pathname.startsWith("/api") ? apiServer : webServer;
  server.emit("request", request, response);
}
