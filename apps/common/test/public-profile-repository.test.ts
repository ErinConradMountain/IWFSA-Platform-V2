import test from "node:test";
import assert from "node:assert/strict";

import {
  APPROVED_PUBLIC_PROFILE_QUERY,
  createPublicProfileRepository
} from "@iwfsa/common/public-profile-repository";

test("approved public profile query pushes down all visibility predicates", () => {
  const normalized = APPROVED_PUBLIC_PROFILE_QUERY.replace(/\s+/g, " ").trim().toLowerCase();

  assert.match(normalized, /where latest_standing\.standing = 'good'/);
  assert.match(normalized, /and member_profile\.visibility = 'public'/);
  assert.match(normalized, /and member_profile\.consent = 'granted'/);
  assert.match(normalized, /and member_profile\.approved_for_public = true/);
});

test("approved public profile query projects only public-safe fields", () => {
  const normalized = APPROVED_PUBLIC_PROFILE_QUERY.replace(/\s+/g, " ").trim().toLowerCase();
  const selectClause = normalized.slice(normalized.indexOf("select member_profile.display_name"), normalized.indexOf("from member_profile"));

  assert.doesNotMatch(normalized, /select \*/);
  assert.match(selectClause, /member_profile\.display_name as "displayname"/);
  assert.match(selectClause, /member_profile\.biography/);
  assert.match(selectClause, /member_profile\.updated_at as "updatedat"/);
  assert.doesNotMatch(selectClause, /member_profile\.member_id/);
  assert.doesNotMatch(selectClause, /email/);
  assert.doesNotMatch(selectClause, /audit/);
});

test("public profile repository executes guarded query with a limit", () => {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const repository = createPublicProfileRepository({
    query(sql, params) {
      calls.push({ sql, params });
      return {
        rows: [
          {
            displayName: "Approved Member",
            biography: "Public-safe biography.",
            updatedAt: "2026-05-03T00:00:00.000Z"
          }
        ]
      };
    }
  });

  const rows = repository.findApprovedPublicProfiles(10);

  assert.equal(rows.length, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].sql, APPROVED_PUBLIC_PROFILE_QUERY);
  assert.deepEqual(calls[0].params, [10]);
});
