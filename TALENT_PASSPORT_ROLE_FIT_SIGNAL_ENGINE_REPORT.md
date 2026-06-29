# Talent Passport + Role Fit Signal Engine Report

## Summary

This pass adds an explainable Talent Passport and role readiness signal system
for FirstTake / Nata Connect. It helps Talent members understand how complete
and recruiter-readable their profile is, and helps recruiters review applicants
with transparent cues.

The feature is advisory only. It does not rank Talent, automate decisions,
block applications, guarantee casting outcomes, or use AI language.

## What Changed

- Added `app/lib/role-fit-policy.ts` with pure helpers for:
  - role readiness signals
  - readiness bands
  - missing fit items
  - role fit checklist output
  - Talent Passport summary
- Added a Role Readiness panel on audition detail pages for Talent users.
- Added a Talent Passport section to the Talent profile page.
- Added recruiter-facing role fit signal cards inside applicant review.
- Added a lightweight Future Role Readiness cue on the applications tracker.
- Added unit tests in `tests/role-fit-policy.test.mts`.

## Signals Used

The role fit policy uses only explainable profile and audition criteria:

- profile completeness
- category alignment
- experience readiness
- language overlap
- location or work mode alignment
- skills overlap
- portfolio readiness
- self-tape readiness through external links only
- Talent verification status

## Readiness Bands

- Strong fit signals
- Good fit signals
- Needs profile detail
- Missing key information

These are guidance labels, not rankings or casting outcomes.

## Talent Passport

The Talent Passport summarizes:

- profile foundation
- skills and languages
- portfolio and showreel readiness
- public profile readiness
- trust status
- self-tape link readiness

It gives next actions without blocking basic usage.

## Recruiter Review Experience

Applicant review now shows clear role fit signals with:

- human-readable labels
- status tone
- short detail text
- a reminder that final casting decisions remain with the recruiter

Private admin fields and verification review notes are not exposed.

## Schema Changes

None.

## Firestore Rules / Index Changes

None.

## Security Notes

- No Firestore rules changed.
- No permissions changed.
- No client-side admin writes added.
- No private verification notes exposed.
- No new upload path added.
- Self-tapes remain external links only.

## Tests Added

`tests/role-fit-policy.test.mts` covers:

- strong fit signal behavior
- missing profile details lowering readiness
- missing media and required self-tape next actions
- no fake AI or automated ranking language
- readiness band logic
- checklist output
- Talent Passport summary behavior

## Manual QA Checklist

- [ ] Sign in as Talent and open `/talent/profile`.
- [ ] Confirm the Talent Passport appears below profile readiness.
- [ ] Remove skills/languages and confirm next actions update.
- [ ] Open `/auditions/[id]` as Talent.
- [ ] Confirm Role Readiness appears and does not block applying.
- [ ] Apply to a role and open `/applications`.
- [ ] Confirm Future Role Readiness appears on the application card.
- [ ] Sign in as Recruiter and open `/recruiter/auditions/[id]/applicants`.
- [ ] Expand an applicant and confirm Role Fit Signals appear.
- [ ] Confirm recruiter decision buttons and messaging still work.

## Deployment Notes

Firebase deploy is not needed because no Firestore rules, indexes, Storage
rules, or backend configuration changed.

Vercel redeploy is needed after the code/docs are pushed so the UI and helper
changes are available in production.
