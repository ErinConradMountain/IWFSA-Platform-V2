import type { IncomingMessage, ServerResponse } from "node:http";

const DEFAULT_HOST = "127.0.0.1";

export type ServiceConfig = {
  serviceName: string;
  host: string;
  port: number;
  environment: string;
  localDevelopment: boolean;
  allowRoleSelfSelection: boolean;
  sessionTtlMs: number;
  secureCookies: boolean;
  persistenceTarget: "postgresql" | "memory";
  startedAt: string;
  apiBaseUrl?: string;
};

export type JsonObject = Record<string, unknown>;

function parseBooleanFlag(value: string | undefined, fallback = false): boolean {
  if (value == null) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function getServiceConfig(serviceName: string, defaultPort: number): ServiceConfig {
  const environment = process.env.NODE_ENV || "development";
  const localDevelopment = environment !== "production";
  const requestedSecureCookies = parseBooleanFlag(process.env.SECURE_COOKIES, !localDevelopment);
  const requestedPersistence = process.env.PERSISTENCE_TARGET === "postgresql" ? "postgresql" : "memory";

  return {
    serviceName,
    host: process.env.HOST || DEFAULT_HOST,
    port: Number.parseInt(process.env.PORT || `${defaultPort}`, 10),
    environment,
    localDevelopment,
    allowRoleSelfSelection: parseBooleanFlag(process.env.ALLOW_ROLE_SELF_SELECTION, localDevelopment),
    sessionTtlMs: Number.parseInt(process.env.SESSION_TTL_MS || `${30 * 60 * 1000}`, 10),
    secureCookies: localDevelopment ? requestedSecureCookies : true,
    persistenceTarget: localDevelopment ? requestedPersistence : "postgresql",
    startedAt: new Date().toISOString(),
    apiBaseUrl: process.env.API_BASE_URL
  };
}

export function buildHealthPayload(config: ServiceConfig, extra: JsonObject = {}): JsonObject {
  return {
    service: config.serviceName,
    status: "ok",
    environment: config.environment,
    persistenceTarget: config.persistenceTarget,
    startedAt: config.startedAt,
    ...extra
  };
}

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: JsonObject,
  headers: Record<string, string | number> = {}
): void {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    ...headers,
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  response.end(body);
}

export function sendHtml(
  response: ServerResponse,
  statusCode: number,
  html: string,
  headers: Record<string, string | number | null> = {}
): void {
  const cleanHeaders = Object.fromEntries(Object.entries(headers).filter((entry): entry is [string, string | number] => entry[1] != null));
  response.writeHead(statusCode, {
    ...cleanHeaders,
    "content-type": "text/html; charset=utf-8",
    "content-length": Buffer.byteLength(html)
  });
  response.end(html);
}

export function sendRedirect(
  response: ServerResponse,
  location: string,
  headers: Record<string, string | number | null> = {}
): void {
  const cleanHeaders = Object.fromEntries(Object.entries(headers).filter((entry): entry is [string, string | number] => entry[1] != null));
  response.writeHead(303, {
    ...cleanHeaders,
    location,
    "content-length": 0
  });
  response.end();
}

export async function readRequestBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
