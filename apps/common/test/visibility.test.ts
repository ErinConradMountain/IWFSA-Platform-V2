import test from "node:test";
import assert from "node:assert/strict";

import { resolvePublicProfileVisibility } from "@iwfsa/common/visibility";

test("public visibility requires good standing, consent, public visibility, and approval", () => {
  assert.deepEqual(resolvePublicProfileVisibility({
    standing: "good",
    requestedVisibility: "public",
    consent: "granted",
    approved: true
  }), {
    effectiveVisibility: "public",
    eligibleForPublicRender: true,
    reason: "PUBLIC_ELIGIBLE"
  });

  for (const standing of ["review", "blocked"] as const) {
    const result = resolvePublicProfileVisibility({
      standing,
      requestedVisibility: "public",
      consent: "granted",
      approved: true
    });

    assert.equal(result.effectiveVisibility, "hidden");
    assert.equal(result.eligibleForPublicRender, false);
    assert.equal(result.reason, "PUBLIC_STANDING_REQUIRED");
  }
});
