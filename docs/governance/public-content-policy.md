# Public Content Policy

## Purpose

Phase 8 public storytelling must preserve privacy before visibility. Public routes may render only public-safe profile or story records that have explicit member consent, admin approval, and good standing where the story represents a living member profile.

## Visibility Contract

Public profile and public-safe storytelling query builders must enforce:

```sql
where visibility = 'public'
  and standing = 'good'
  and approved = true
```

Consent is a required domain input for the same decision. If consent is missing or revoked, the record must resolve to private visibility even when an older row still says `visibility='public'`.

## Query Guardrails

| Guardrail | Requirement |
| --- | --- |
| Predicate pushdown | Repository methods must include standing, visibility, consent, and approval predicates before rows leave the data layer. |
| Public projection | Public reads may project display name, biography, and public freshness metadata only. |
| No broad selection | `SELECT *` is prohibited for public profile/story queries. |
| No internal provenance fields | Member account IDs, raw contact fields, audit metadata, standing history details, and workflow state stay off public payloads. |

## Standing Rules

- `good`: eligible for public rendering only after explicit public visibility, consent, and admin approval.
- `review`: private by default and omitted from public feeds.
- `blocked`: private and not approval-eligible.

Honorary and memorial workflows may have distinct standing inputs where no living member account exists, but they still require approval, publication state, and admin stewardship before any public render.

## Audit Rules

- Member consent or visibility changes emit `CONSENT_VISIBILITY_CHANGED`.
- Admin approval emits `PUBLIC_PROFILE_APPROVED`.
- Standing changes that alter public eligibility emit `STANDING_VISIBILITY_CHANGED` when Phase 8 persistence is wired.
- Public content request and approval workflows should add `PUBLIC_CONTENT_REQUESTED` and `PUBLIC_CONTENT_APPROVED` before broad public routing.
