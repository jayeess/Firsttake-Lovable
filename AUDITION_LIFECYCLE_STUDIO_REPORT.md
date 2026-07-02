# Audition Lifecycle Studio Report

**Date:** July 2, 2026  
**Project:** FirstTake by MVA Studios / Nata Connect  
**Scope:** Recruiter audition edit, duplicate, publish, close, reopen, and
Talent-facing lifecycle clarity.

## Summary

This pass turns auditions from one-time posts into managed casting briefs.
Recruiters can now edit safe brief fields, duplicate an existing brief into a
new draft, publish drafts, close auditions when roles are filled, and reopen
closed auditions when the deadline is still valid. Applicant history remains in
the Decision Room and is never copied into duplicate drafts.

## Product Changes

- Added `/recruiter/auditions/[id]/edit` for owner-only brief editing.
- Added lifecycle actions to `/recruiter/auditions`: Edit, Decision Room,
  Duplicate, Publish Draft, Close, and Reopen.
- Added lifecycle badges and guidance for Draft, Open, Closing soon, Closed,
  Expired, Cancelled, and Removed states.
- Added availability guidance to `/auditions/[id]` so Talent can clearly see
  when a role is open, closed, or expired.
- Updated public audition loading to exclude expired roles from normal
  discovery data.

## Schema And Service Changes

- Reused existing `AuditionStatus` values: `DRAFT`, `ACTIVE`, `CLOSED`,
  `CANCELLED`.
- Added `app/lib/audition-lifecycle-policy.ts` for shared lifecycle decisions.
- Added Firestore service helpers:
  - `updateAuditionBrief`
  - `publishAuditionDraft`
  - `closeAudition`
  - `reopenAudition`
  - `duplicateAuditionAsDraft`
- Duplicate drafts copy public-safe brief fields, self-tape settings, and
  screening questions only. They do not copy applicant counts, applications,
  moderation reason, Talent Pool entries, private notes, or review data.

## Rules And Index Changes

- Updated `firestore.rules` to validate audition statuses on create/update.
- Recruiter updates now reject removed auditions.
- Applicant counts and moderation fields remain immutable from recruiter
  lifecycle edits.
- No Firestore index changes were required.

## Tests Added

- Added `tests/audition-lifecycle-policy.test.mts`.
- Updated `tests/firestore.rules.mts` with lifecycle status, applicant-count,
  and moderation-field protections.

## Manual QA Checklist

- [ ] Recruiter opens `/recruiter/auditions`.
- [ ] Draft brief shows Edit and Publish actions.
- [ ] Active brief can be closed without deleting applicants.
- [ ] Closed future-deadline brief can be reopened.
- [ ] Duplicate action creates a new draft and opens the edit page.
- [ ] Talent discovery does not show draft, removed, closed, cancelled, or
  expired auditions.
- [ ] Audition detail shows clear availability guidance.
- [ ] Existing applicants remain visible in the Decision Room after closing.

## Known Limitations

- The edit page focuses on safe core brief fields and screening questions.
- Duplicate drafts receive a default deadline 14 days from duplication so the
  recruiter can review and adjust before publishing.
- Lifecycle actions are client-initiated Firestore writes protected by rules;
  audit logging for recruiter lifecycle actions can be added later if needed.

## Deployment Notes

- Firebase deploy needed: yes, for updated Firestore rules.
- Vercel redeploy needed: yes, for new route, UI, services, and docs.
