# Recruiter Casting Slate and Decision Room Report

**Date:** June 30, 2026  
**Product:** FirstTake / Nata Connect  
**Scope:** Recruiter applicant review, recruiter audition management, and Talent
application status clarity

## Summary

This pass adds a professional Recruiter Casting Slate and Decision Room layer on
top of the existing application pipeline. It organizes existing applicant
status, self-tape, profile, portfolio, note, and stage data into clearer review
signals for recruiters while keeping every casting decision human-led.

No backend schema, Firestore rules, API routes, authentication logic, Firebase
configuration, payments, AI, direct video upload, or automatic selection logic
changed.

## What Changed

- Added `app/lib/casting-slate-policy.ts`, a pure rule-based helper for:
  - slate stage grouping
  - slate counts
  - room-level summary copy
  - applicant decision readiness
  - review checklist items
  - stage-safe next actions
  - safety notes
- Added a Casting Slate overview to
  `/recruiter/auditions/[id]/applicants`.
- Added a Casting Decision Room panel to each expanded applicant card with:
  - current stage
  - profile completeness
  - portfolio/public profile context
  - self-tape status
  - private review note signal
  - checklist
  - stage-safe next actions
- Updated `/recruiter/auditions` copy and actions so recruiter-owned auditions
  clearly lead to the decision room.
- Added a Talent-facing status clarity notice on `/applications` explaining
  that casting stages are progress signals, not guaranteed work.
- Added `tests/casting-slate-policy.test.mts`.

## Existing Data Used

The slate uses existing fields only:

- `Application.status`
- `Application.recruiterStatus`
- `Application.recruiterNote`
- `Application.recruiterNotes`
- `Application.recruiterRating`
- `Application.internalTags`
- `Application.selfTapeSubmission`
- `Application.selfTapeReviewedAt`
- `TalentProfile.profileCompletenessScore`
- `TalentProfile.publicSlug`
- recruiter-visible or public active `TalentMedia`
- audition self-tape settings

## Privacy and Safety Boundaries

The decision room does not expose:

- private Talent verification documents
- private Talent verification evidence
- hidden media
- removed media
- private admin notes
- private moderation reports
- Talent email/phone beyond existing permitted workflow context
- service account or Firebase configuration values

## Product Language Guardrails

The feature does not claim:

- AI review
- automatic shortlisting
- automatic casting decisions
- applicant ranking
- guaranteed jobs
- guaranteed casting
- legal certification
- payment or subscription functionality
- direct self-tape video upload

## Manual QA Checklist

- [ ] Recruiter opens `/recruiter/auditions` and sees decision-room entry points.
- [ ] Recruiter opens `/recruiter/auditions/[id]/applicants` and sees slate
  metrics plus room-level next action copy.
- [ ] New, viewed, shortlisted, callback, final round, selected, rejected, and
  withdrawn applications remain visible in the existing pipeline.
- [ ] Expanded applicant review shows the Casting Decision Room panel.
- [ ] Required missing self-tapes show a clear external-link reminder.
- [ ] Selected/rejected/withdrawn applicants show closed status guidance.
- [ ] Private recruiter notes, ratings, and tags still save through the existing
  review action.
- [ ] Talent `/applications` shows stage clarity copy without promising work.

## Deployment Notes

No Firebase deploy is needed because Firestore rules, indexes, schemas, APIs,
and security configuration were not changed.

Vercel redeploy is needed after merging so the new UI and policy helper ship to
production.
