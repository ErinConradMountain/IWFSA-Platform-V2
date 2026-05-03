import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function mustContain(file, markers) {
  const text = readFileSync(resolve(root, file), "utf8");
  for (const marker of markers) {
    if (!text.includes(marker)) {
      throw new Error(`${file} is missing Phase 6 marker: ${marker}`);
    }
  }
}

mustContain("apps/common/src/events.ts", ["transitionEventStatus", "rsvpToEvent", "cancelRsvpAndPromote", "issueDocumentAccess", "EVENT_ACCESS_DENIED"]);
mustContain("apps/common/test/events.test.ts", ["parallel RSVP simulation", "WAITLIST_PROMOTED", "DOCUMENT_ACCESS_DENIED"]);
mustContain("apps/api/src/server.ts", ["rsvpMatch", "documentMatch", "eventStateMatch", "admin.events.manage"]);
mustContain("apps/api/migrations/0001_phase4_foundation.sql", ["create table if not exists event", "rsvp_record", "document_access"]);
mustContain("docs/event-lifecycle-spec.md", ["Capacity Rules", "Audience Targeting", "Secure Document Boundary"]);
mustContain("docs/audit-event-catalog.md", ["EVENT_STATE_CHANGED", "WAITLIST_PROMOTED", "DOCUMENT_ACCESS_GRANTED"]);
mustContain("test-strategy.md", ["P6-RSVP-001", "P6-DOC-001", "P6-POLICY-001"]);

process.stdout.write("Phase 6 events and participation check passed\n");
