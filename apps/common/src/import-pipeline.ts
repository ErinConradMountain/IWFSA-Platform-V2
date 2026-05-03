import crypto from "node:crypto";

import type { AuditEventEmitter } from "@iwfsa/common/audit";
import type { ImportBatch, ImportBatchRow, PlatformRepositories } from "@iwfsa/common/repositories";

export type ImportFileInput = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  content: string;
};

export type ImportPreviewResult = {
  batch: ImportBatch;
  rows: ImportBatchRow[];
};

const ALLOWED_IMPORT_MIME = new Set(["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

function hash(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("base64url");
}

export function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headers = (lines.shift() || "").split(",").map((header) => header.trim());

  return lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

export function classifyImportRow(row: Record<string, string>, existingEmailHashes: Set<string>): ImportBatchRow["action"] {
  if (!row.source_key && !row.verified_email) {
    return "fail";
  }

  if (row.admin_override_flag === "skip") {
    return "skip";
  }

  if (row.verified_email && existingEmailHashes.has(hash(row.verified_email))) {
    return "update";
  }

  return "create";
}

export function previewImport(input: ImportFileInput, repositories: PlatformRepositories, audit: AuditEventEmitter, correlationId: string): ImportPreviewResult {
  if (!ALLOWED_IMPORT_MIME.has(input.mimeType) || input.sizeBytes > MAX_IMPORT_BYTES) {
    audit.emit({ action: "IMPORT_FAILED", actor: "admin", targetType: "import_batch", targetId: "rejected", correlationId, metadata: { filename: input.filename, mimeType: input.mimeType, sizeBytes: input.sizeBytes } });
    throw new Error("import_file_rejected");
  }

  const checksum = hash(input.content);
  const batchId = `batch_${checksum.slice(0, 16)}`;
  const existingEmailHashes = new Set<string>();
  const canonicalRows = parseCsv(input.content);
  const rows = canonicalRows.map<ImportBatchRow>((row, index) => {
    const action = classifyImportRow(row, existingEmailHashes);
    const verifiedEmailHash = row.verified_email ? hash(row.verified_email) : null;
    if (verifiedEmailHash) {
      existingEmailHashes.add(verifiedEmailHash);
    }

    return {
      batchId,
      rowNumber: index + 1,
      sourceKey: row.source_key || "",
      verifiedEmailHash,
      displayName: row.display_name || "",
      action,
      issues: action === "fail" ? ["source_key_or_verified_email_required"] : [],
      rawSnapshotHash: hash(JSON.stringify(row))
    };
  });
  const batch = repositories.importBatches.upsertPreview({ id: batchId, sourceChecksum: checksum, state: "preview", rowCount: rows.length, createdAt: new Date().toISOString(), committedAt: null });

  repositories.importBatchRows.replacePreviewRows(batchId, rows);
  audit.emit({ action: "IMPORT_PREVIEWED", actor: "admin", targetType: "import_batch", targetId: batchId, correlationId, metadata: { rowCount: rows.length, filename: input.filename } });
  return { batch, rows };
}

export function commitImport(batchId: string, idempotencyKey: string, repositories: PlatformRepositories, audit: AuditEventEmitter, correlationId: string): ImportBatch {
  const batch = repositories.importBatches.findById(batchId);
  if (!batch) {
    audit.emit({ action: "IMPORT_FAILED", actor: "admin", targetType: "import_batch", targetId: batchId, correlationId, metadata: { reason: "batch_not_found" } });
    throw new Error("import_batch_not_found");
  }

  const expectedKey = `${batch.id}:${batch.sourceChecksum}`;
  if (idempotencyKey !== expectedKey) {
    audit.emit({ action: "IMPORT_FAILED", actor: "admin", targetType: "import_batch", targetId: batchId, correlationId, metadata: { reason: "idempotency_mismatch" } });
    throw new Error("idempotency_mismatch");
  }

  if (batch.state === "committed") {
    return batch;
  }

  const rows = repositories.importBatchRows.listByBatch(batchId);
  for (const row of rows.filter((candidate) => candidate.action === "create" || candidate.action === "update")) {
    repositories.memberAccounts.upsert({
      id: `member_${row.sourceKey || row.verifiedEmailHash}`,
      emailHash: row.verifiedEmailHash || hash(row.sourceKey),
      authState: "pending_activation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    repositories.outbox.enqueue({ id: `activation_${batchId}_${row.rowNumber}`, eventType: "activation_invite", payloadRef: row.sourceKey || row.verifiedEmailHash || String(row.rowNumber), state: "pending", createdAt: new Date().toISOString() });
  }

  const committed = repositories.importBatches.commit(batchId, new Date().toISOString()) || batch;
  audit.emit({ action: "IMPORT_COMMITTED", actor: "admin", targetType: "import_batch", targetId: batchId, correlationId, metadata: { rowCount: rows.length } });
  return committed;
}
