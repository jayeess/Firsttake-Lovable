# Talent Opportunity Radar and Career Command Center Report

**Date:** June 30, 2026  
**Product:** FirstTake / Nata Connect  
**Scope:** Talent dashboard, audition discovery, applications, profile growth,
and rule-based Talent opportunity guidance

## Summary

This pass adds a Talent Opportunity Radar and Career Command Center layer that
helps Talent decide what to do next without turning the product into automatic
matching or automated selection. The feature uses existing profile,
application, audition, saved audition, message, self-tape, and public profile
signals to explain readiness, safety, and next actions.

No backend schema, Firestore rules, API routes, authentication logic, Firebase
configuration, payments, AI, calendar scheduling, video calls, direct video
upload, or self-tape video upload changed.

## Talent Opportunity Radar Logic

`app/lib/talent-opportunity-radar-policy.ts` provides rule-based helpers for:

- Talent profile growth planning
- command-center summaries
- next actions
- opportunity buckets
- application focus
- safety focus
- empty states

The radar uses transparent signals:

- profile completeness
- public profile readiness
- public media or external portfolio links
- role category and language context
- brief clarity
- recruiter source transparency
- self-tape requirement
- saved audition state
- active application state
- unread message count when available
- safety cues for payment requests, private contact pressure, unrelated
  document requests, and guaranteed-outcome language

## Career Command Center Behavior

`/dashboard` now gives Talent a higher-level command center with:

- career metrics
- today's next actions
- opportunity radar preview
- profile/passport readiness
- application attention
- saved audition continuity
- message attention
- safety links

The dashboard fetches active auditions for Talent so the command center can show
real opportunity context instead of static guidance.

## Talent Dashboard Improvements

- Added a Career Command Center section above the existing workspace cards.
- Added rule-based next actions from application, message, profile, and
  opportunity signals.
- Added a compact Opportunity Radar preview for fresh roles that are worth
  reviewing.
- Kept existing application, self-tape, saved audition, message, and safety
  panels intact.

## Audition Discovery Improvements

- `/auditions` now computes opportunity radar context from visible auditions,
  saved auditions, and the Talent profile.
- `components/audition-card.tsx` shows lightweight Talent-facing cues such as:
  - Profile-ready
  - Worth reviewing
  - Prepare first
  - Needs safety review
- Applied auditions keep their existing applied state and are not surfaced as
  fresh opportunities.

## Applications and Profile Improvements

- `/applications` now includes a compact Application Focus panel showing active
  applications, callback/final activity, self-tape needs, and unread message
  attention.
- `/talent/profile` now includes a Growth Plan card with missing profile
  signals and practical next actions for Talent Passport and Public Casting
  Passport readiness.

## Files Changed

- `app/lib/talent-opportunity-radar-policy.ts`
- `app/dashboard/page.tsx`
- `app/auditions/page.tsx`
- `app/applications/page.tsx`
- `app/talent/profile/page.tsx`
- `components/audition-card.tsx`
- `tests/talent-opportunity-radar-policy.test.mts`
- `README.md`
- `CHANGELOG.md`
- `TESTING.md`
- `PRODUCT_STATUS_AND_ROADMAP.md`
- `FULL_APP_UX_POLISH_REPORT.md`
- `TALENT_OPPORTUNITY_RADAR_CAREER_COMMAND_CENTER_REPORT.md`

## Tests Added

`tests/talent-opportunity-radar-policy.test.mts` covers:

- complete profiles and strong auditions
- incomplete profile growth actions
- applied audition grouping
- weak brief guidance
- unclear recruiter source guidance
- self-tape preparation action
- active application focus
- safety focus
- command-center metrics
- empty states
- safe copy with no AI, ranking, best, or guarantee language

## Security and Privacy Notes

- No private Talent verification documents are exposed.
- No recruiter evidence, admin notes, reports, private moderation data, email,
  phone, hidden media, service account values, or secrets are exposed.
- No client-side admin writes were added.
- No Firebase/Auth/Admin permissions were changed.
- Self-tapes remain external links only.

## What Was Intentionally Not Added

- AI recommendations
- AI matching
- automatic applicant or audition ranking
- automatic selection
- guaranteed casting or guaranteed jobs
- payments or subscriptions
- calendar scheduling
- video calls
- direct video upload
- self-tape video upload
- fake users or fake seeded marketplace data

## Known Limitations

- The radar is guidance-only and depends on available profile, audition,
  application, saved, and message data.
- It does not inspect private admin evidence or recruiter verification files.
- It does not schedule callbacks or automate recruiter decisions.
- It does not replace a Talent member's own judgment before applying.

## Firebase Deploy Notes

No Firebase deploy is needed because Firestore rules, Storage rules, indexes,
schemas, API routes, and permissions were not changed.

## Vercel Deploy Notes

Vercel redeploy is needed after pushing because client UI and policy helper code
changed.

## Manual QA Checklist

- [ ] Talent `/dashboard` shows Career Command Center after login.
- [ ] Dashboard next actions link to profile, auditions, applications, messages,
  or notifications as appropriate.
- [ ] `/auditions` cards show lightweight opportunity cues without crowding.
- [ ] Applied auditions do not appear as fresh opportunities.
- [ ] Saved auditions still toggle and remain private.
- [ ] `/applications` shows Application Focus and existing application cards.
- [ ] Missing required self-tapes still use external links only.
- [ ] `/talent/profile` shows Growth Plan and existing profile forms still save.
- [ ] No UI copy claims AI, automatic ranking, best roles, guaranteed casting,
  guaranteed jobs, payments, or upload-based self-tapes.
