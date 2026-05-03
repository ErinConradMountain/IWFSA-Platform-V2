# CI Pipeline

## Stages

### pre-merge

- syntax/config check
- unit and contract tests
- type validation
- workspace graph check
- documentation control check
- UX/brand/seed check
- Phase 3 design check
- Phase 4 spine check

### main

- full suite
- dependency scan
- CycloneDX SBOM generation
- supply-chain check
- provenance check
- build artifact packaging

### RC

- E2E dry-run
- migration rehearsal
- backup/restore rehearsal
- rollback rehearsal

### prod

- approved tag
- signed artifact
- release authority confirmation
- rollback owner confirmed

## Tagging And Provenance Protocol

Phase tags must point to a clean commit that has passed `npm run ci` locally or in CI. Do not tag from an untracked-heavy working tree.

Before tagging:

1. Confirm `.gitignore` excludes local dependencies, generated builds, environment files, logs, temp folders, IDE settings, and local reflection files.
2. Run `git status --porcelain` and review every tracked change.
3. Commit source, tests, docs, workflow files, and seed assets needed to reproduce the passing state.
4. Run `npm run ci` from the committed tree.
5. Create lightweight phase tags only after the clean CI pass.

Phase tags for the current governance line:

- `phase7-complete`: membership standing and fee governance baseline.
- `phase8-kickoff-repository-enforcement`: public visibility, repository query enforcement, and member publication clarity baseline.

CI now runs `scripts/provenance-check.mjs` after SBOM and supply-chain validation. Normal branch CI allows untagged HEADs but checks a clean tracked tree when Git execution is available, `git describe`, tag resolution when tags are present, and SBOM component alignment. In restricted local runtimes where Node cannot spawn Git, the script falls back to `.git` reference files for HEAD and tag resolution. Release jobs can set `REQUIRE_TAGGED_HEAD=1` to require the passing commit to be tagged.

## Public Cache Regression Tests

Public delivery changes must verify `Cache-Control`, `Vary`, `X-Surface`, absence of `Set-Cookie`, and public-safe response schema. Authenticated requests to public endpoints must not change cache behavior or leak session data.

## Current Local Constraint

`npm` is not available on PATH in the local Codex desktop runtime. Node-based equivalent gates are maintained and documented.
