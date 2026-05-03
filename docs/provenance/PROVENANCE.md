# Provenance Protocol

## Purpose

This runbook defines how IWFSA Platform V2 ties phase tags, commits, CI evidence, SBOM output, and release artifacts together.

## Tag Naming

- Phase checkpoints: `phaseX-<slug>`, for example `phase8-kickoff-repository-enforcement`.
- Release candidates: `v2.0-rc.N`.
- Production releases: `v2.0.N`.

## Signing Policy

Phase 8 and Phase 9 may use lightweight tags for delivery velocity. Phase 10 release candidates and production releases must use annotated, signed tags once release authority, artifact signing, and rollback ownership are active.

## CI Provenance Check

`scripts/provenance-check.mjs` runs after SBOM and supply-chain checks. It verifies:

- the tracked working tree is clean,
- `git describe --tags --always` resolves,
- any tag pointing at HEAD resolves to the exact HEAD commit,
- the generated SBOM identifies `iwfsa-platform-v2`.

Release jobs can set `REQUIRE_TAGGED_HEAD=1` to require the CI-passing commit to carry a tag.

## Artifact Mapping

Every release note should record:

- commit SHA,
- tag name,
- CI command and result,
- SBOM path,
- migration set,
- rollback owner.
