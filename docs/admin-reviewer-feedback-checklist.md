# IWFSA Admin Reviewer Feedback Checklist

## Purpose

Use this checklist for the first administrator review of the IWFSA Platform V2 pilot. The current data is seeded dummy data only. Do not enter real member contact details, private records, or production decisions during this review.

## Preview Credentials

Preview URL: `https://iwfsa-platform-v2-reviewer-pilot-lsm79cvgd.vercel.app`

| Role | Username | Password | Starting route |
| --- | --- | --- | --- |
| Admin | `akeida` | `1possibility` | `/admin` |
| Member | `naledi.k` | `1possibility` | `/member/dashboard` |

## Access Verification

- Vercel SSO protection is disabled for the reviewer-pilot preview so the URL can be opened by a reviewer without a Vercel login.
- The preview uses in-memory pilot data and session state. It is suitable for workflow, governance, and visual review, but not for production records.
- Verified live paths: `/`, `/health`, `/brand.css`, `/api/csrf-token`, `/public/gallery`, member sign-in to `/member/dashboard`, admin sign-in to `/admin`, and member denial from `/admin` back to `/`.

## Suggested Admin Walkthrough

| Step | Route | What to Check | Feedback Notes |
| --- | --- | --- | --- |
| 1 | `/signin` | Preview credentials are easy to find, sign-in feels clear, and the page looks professional. | |
| 2 | `/admin` | The console explains the reviewer path and keeps admin work separate from member self-service. | |
| 3 | `/admin/members` | Dummy members are believable enough for testing, create/edit/delete controls are understandable, and confirmation language is clear. | |
| 4 | `/admin/events` | Event create, edit, delete, capacity, and RSVP framing match the admin's expected work. | |
| 5 | `/admin/public-review` | Public storytelling review feels privacy-first, consent-led, and approval-gated. | |
| 6 | `/admin/audit` | Audit language is clear enough for governance review without exposing private details. | |

## Suggested Member Walkthrough

| Step | Route | What to Check | Feedback Notes |
| --- | --- | --- | --- |
| 1 | `/member/dashboard` | The member surface feels distinct from admin and gives the member a clear next action. | |
| 2 | `/member/profile` | Consent and visibility copy feels dignified and understandable. | |
| 3 | `/member/events` | RSVP controls are easy to find and the event language feels member-appropriate. | |
| 4 | `/member/directory` | Directory search and public/member visibility expectations are clear. | |
| 5 | `/member/notifications` | Notification preference framing respects consent and standing. | |

## Public Surface Check

| Route | What to Check | Feedback Notes |
| --- | --- | --- |
| `/` | Public mission and brand feel credible for IWFSA. | |
| `/public/gallery` | Only approved public-safe dummy profile fields are visible. | |
| `/public/story/1` | Story pages do not expose member-only or admin workflow details. | |

## Decision Questions

- What must change before the administrator can share feedback with confidence?
- Which admin workflow should become fully functional next?
- Which public or member copy needs governance review before real data is connected?
- Are there any visual, mobile, or accessibility issues that would weaken trust?

## Review Boundary

This pilot is suitable for workflow, visual, governance, and feedback review. It is not yet a production deployment, not connected to real member data, and not ready for permanent public release.
