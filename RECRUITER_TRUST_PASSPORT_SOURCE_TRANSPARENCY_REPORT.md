# Recruiter Trust Passport and Source Transparency Report

**Date:** June 29, 2026

## Goal

Add a professional recruiter trust layer that helps Talent understand who is
behind a casting brief, helps Recruiters improve public source credibility, and
helps Admin review recruiter and audition trust cues without changing backend
logic, Firestore rules, schemas, permissions, or Firebase configuration.

## What Changed

- Added `app/lib/recruiter-trust-passport-policy.ts`, a pure policy helper for
  recruiter source transparency, trust bands, public-safe signals, recruiter
  improvement tips, Talent guidance, and Admin review cues.
- Added source transparency chips to audition cards.
- Expanded `/auditions/[id]` from brief quality only to a combined source
  transparency panel showing casting source, brief quality, public-safe signals,
  on-platform communication guidance, and never-pay safety context.
- Added Recruiter Trust Passport readiness to `/recruiter/profile`.
- Added Trust Passport readiness to `/recruiter/verification`, while keeping
  uploaded verification evidence private to the recruiter and Admin review.
- Added source transparency badges and review cues to `/recruiter/auditions`.
- Added Admin-facing source transparency summaries to `/admin/verifications`
  and `/admin/auditions` without exposing private evidence, storage paths, or
  admin notes through the policy helper.
- Added `tests/recruiter-trust-passport-policy.test.mts` with coverage for
  verified sources, missing source detail, rejected/suspended review states,
  weak brief caution, payment-request caution, public-safe signal filtering,
  private evidence redaction, and no fake automation/certificate language.

## Trust Bands

- `verified_source`: approved recruiter with clear public source context.
- `clear_source`: source is understandable, but stronger proof or verification
  may still improve confidence.
- `needs_source_detail`: source name, public proof, work context, or contact
  accountability needs improvement.
- `needs_trust_review`: verification, account status, or brief safety cues need
  review before stronger trust should appear.

## Public-Safe Boundary

The helper only returns public-safe source signals for Talent-facing surfaces.
It does not return:

- private recruiter verification evidence
- storage paths
- admin notes
- private review comments
- private moderation data

Admin pages may still show evidence through the existing admin-only UI paths,
but the trust passport summary itself stays safe to reuse publicly.

## What Did Not Change

- No Firestore rules changed.
- No database schema changed.
- No API routes changed.
- No auth, admin, recruiter, or talent permissions changed.
- No Firebase configuration changed.
- No payment, subscription, AI, video upload, or self-tape upload feature was
  added.
- No claims of guaranteed casting, guaranteed jobs, automatic detection, or
  legal certification were added.

## Manual QA Checklist

- `/auditions`: audition cards show a source transparency chip and existing
  save/search/filter behavior remains intact.
- `/auditions/[id]`: source transparency panel shows source name, brief quality,
  safe public signals, and clear never-pay/on-platform guidance.
- `/recruiter/profile`: recruiter sees trust passport readiness and practical
  next improvements.
- `/recruiter/verification`: recruiter sees how verification improves public
  trust while private documents remain private.
- `/recruiter/auditions`: recruiter sees both brief quality and source
  transparency cues per audition.
- `/admin/verifications`: admin sees trust passport cues without policy-level
  private evidence exposure.
- `/admin/auditions`: admin sees source transparency next to brief quality and
  moderation risk.

## Verification

Run:

```powershell
npm run lint
npm test
npm run build
git diff --check
```

No Firebase deploy is needed. Vercel redeploy is needed only after pushing the
code and documentation changes.
