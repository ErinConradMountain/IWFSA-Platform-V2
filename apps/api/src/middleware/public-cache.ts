import type { IncomingMessage, ServerResponse } from "node:http";

export const PUBLIC_CACHE_HEADERS = {
  "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=60",
  vary: "Accept-Encoding",
  "x-surface": "public"
};

export function publicCacheHeaders(): Record<string, string> {
  return { ...PUBLIC_CACHE_HEADERS };
}

export function markPublicCacheResponse(response: ServerResponse): void {
  for (const [name, value] of Object.entries(PUBLIC_CACHE_HEADERS)) {
    response.setHeader(name, value);
  }
  response.removeHeader("set-cookie");
}

export function publicRequestCacheKey(request: IncomingMessage): string {
  const host = request.headers.host || "localhost";
  const url = new URL(request.url || "/", `http://${host}`);
  return `${url.pathname}${url.search}`;
}
