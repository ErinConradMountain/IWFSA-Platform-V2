import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export const CORRELATION_ID_HEADER = "x-correlation-id";
export const TRACE_ID_HEADER = "x-trace-id";

const SENSITIVE_KEY_PATTERN = /(authorization|cookie|password|token|secret|session|email|phone|mobile|id_number|name)/i;

export type TelemetrySpan = {
  traceId: string;
  spanId: string;
  correlationId: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
};

export type LogSink = (entry: Record<string, unknown>) => void;

export function createCorrelationId(): string {
  return crypto.randomUUID();
}

export function getCorrelationId(request: IncomingMessage): string {
  const inbound = request.headers[CORRELATION_ID_HEADER];
  return typeof inbound === "string" && inbound.trim() ? inbound.trim() : createCorrelationId();
}

export function createTraceSpan(name: string, correlationId: string, now: () => number = () => Date.now()): TelemetrySpan {
  const startedAtMs = now();

  return {
    traceId: crypto.randomBytes(16).toString("hex"),
    spanId: crypto.randomBytes(8).toString("hex"),
    correlationId,
    name,
    startedAt: new Date(startedAtMs).toISOString()
  };
}

export function closeTraceSpan(span: TelemetrySpan, now: () => number = () => Date.now()): TelemetrySpan {
  const endedAtMs = now();
  const startedAtMs = Date.parse(span.startedAt);

  return {
    ...span,
    endedAt: new Date(endedAtMs).toISOString(),
    durationMs: Number.isFinite(startedAtMs) ? Math.max(0, endedAtMs - startedAtMs) : 0
  };
}

export function redactTelemetryValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return "[REDACTED]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactTelemetryValue(key, item));
  }

  if (value && typeof value === "object") {
    return redactTelemetryObject(value as Record<string, unknown>);
  }

  return value;
}

export function redactTelemetryObject(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, redactTelemetryValue(key, value)]));
}

export function emitStructuredLog(sink: LogSink | undefined, entry: Record<string, unknown>): void {
  if (!sink) {
    return;
  }

  sink(redactTelemetryObject(entry));
}

export function attachTelemetryHeaders(response: ServerResponse, span: TelemetrySpan): void {
  response.setHeader(CORRELATION_ID_HEADER, span.correlationId);
  response.setHeader(TRACE_ID_HEADER, span.traceId);
}
