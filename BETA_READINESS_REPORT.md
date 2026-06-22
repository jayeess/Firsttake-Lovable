# Nata Connect Beta Readiness Report

## Phase 3C Readiness Note

Production beta hardening is now in place. The app validates required Firebase
web and Admin SDK environment variable names without printing values, exposes an
admin-only `/admin/beta-readiness` checklist, and documents launch operations
for verification, moderation, reports, conversations, suspensions, rollback,
and emergency disable actions.

Current launch blockers:

- No code-level blocker found in the latest local verification pass.
- Production launch still requires Vercel environment variables to be reviewed
  in the dashboard.
- Firebase rules/indexes must be deployed whenever `firestore.rules` or
  `firestore.indexes.json` changes.

Recommended beta scope:

- Invite a small controlled group of Talents, Recruiters, and one launch admin.
- Use production for real accounts and the emulator-only demo seed for local
  walkthroughs.
- Keep reports and admin audit logs under daily review during the first beta
  week.

Production smoke checklist:

- Auth signup/login/logout
- Talent profile, trust, media, public profile
- Recruiter verification and audition posting
- Application submit and applicant pipeline decisions
- Messaging, notifications, reports, and admin resolution
- Mobile browser scan and desktop Chrome/Edge scan

## Phase 4A Deployment Readiness Note

The app is prepared for Vercel production deployment. `NEXT_PUBLIC_APP_URL` is
optional and should point to the Vercel production URL before a custom domain is
available, then to the final custom domain later. The app also falls back to
Vercel's `VERCEL_URL` for metadata base generation.

Firebase Auth authorized domains must include the Vercel production domain if
Firebase blocks login/signup after deployment. This remains a manual Firebase
Console step.

Legal readiness remains a beta limitation: Terms of Service, Privacy Policy,
Community Guidelines, data deletion process, and minor safety policy are still
placeholders and should be completed before a wider public launch.

**Assessment date:** June 22, 2026
**Smoke test date:** June 22, 2026
**Recommended stage:** Controlled private beta — ready with limitations
**Readiness score:** 8.5/10
**Production URL smoke test:** https://firsttake-lovable.vercel.app — PASS (no P0 blockers found)
**Custom 404 page:** Added (`app/not-found.tsx`) — branded page with Back to home + Help center links

## Completed Features

- Talent and Recruiter email/password authentication
- Concurrent tab-scoped test sessions
- Role-aware dashboards and navigation
- Talent and company profiles
- Audition publishing and discovery
- Transactional application submission
- Recruiter applicant review and status updates
- Talent application tracking
- Development-only mock personas and form presets
- Baseline Firestore and Storage rules and required Firestore indexes

## Phase 0 Engineering Improvements

- Application creation and applicant count now commit atomically
- Duplicate, inactive, expired, and deleted audition applications are blocked
- My Applications uses an indexed collection-group query
- Firestore rules restrict counter and review-status field updates
- A dependency-free policy test suite and aggregate verification command exist
- Emulator configuration and deployment documentation are present

## Phase 1 Trust Improvements

- Admin access is backed by Firebase custom claims
- Privileged writes run through Firebase Admin SDK route handlers
- Recruiter verification is a persisted text-based private-beta workflow
- Recruiters cannot approve themselves or edit admin review fields
- Suspended accounts are blocked from sensitive actions
- Auditions can be removed/restored without deleting casting data
- Every privileged action writes an audit log
- Verified recruiter badges reflect approved verification state

## Phase 1.5 Quality Improvements

- Playwright covers public pages and unauthenticated route gating
- Optional environment-backed tests cover Talent, Recruiter, and Admin routes
- GitHub Actions runs install, lint, unit tests, and production build
- Major workflows now provide distinct loading, empty, retry, and permission states
- Unexpected Admin API failures are sanitized
- A private-beta release checklist and exact emulator test plan are documented

## Phase 1.6 Security Automation

- Dedicated `.env.e2e.local` loading keeps browser credentials out of Git
- Credential-backed tests assert real Talent, Recruiter, and Admin navigation
- Talent and Recruiter accounts are both checked against the Admin boundary
- Firestore Emulator tests cover ten role and ownership scenarios
- Removed auditions are now denied by rules to normal users, not only hidden in UI
- CI provisions Java 21 and runs local emulator and browser smoke suites

## Talent Trust Layer

- Talent profiles receive a weighted completeness score and missing-field list
- Verification is optional and does not gate auditions or applications
- Eligible Talent can submit or resubmit through a trusted server route
- Admins can verify, reject, suspend, and restore Talent
- Private review notes remain separate from recruiter-visible profile data
- Recruiters see a badge only when status is exactly `verified`
- Submission and Admin decisions are recorded in audit logs

## Phase 2A Notifications

- Talent, Recruiter, and Admin users have a shared in-app activity center
- Unread counts are visible from role shells
- Application changes, verification workflow, moderation, and account status
  create server-owned notifications
- Application mutations pass through authenticated route handlers before
  workflow alerts are generated
- Clients cannot create notification content and can update only their own
  read state
- Notification policy tests, Firestore rule tests, and protected-route E2E
  coverage are included

## Phase 2B Talent Media

- Talent can upload/change/remove a profile photo up to 5 MB
- Talent can manage portfolio images up to 10 MB and external showreel links
- Uploads use generated user-scoped Storage paths and progress feedback
- Media visibility, featured state, count, and moderation status are persisted
- Recruiter applicant review shows active recruiter-visible media
- Admins can hide, remove, and restore media metadata with audit logging
- Profile completeness reacts to real photo and portfolio media

## Files Changed

- Authentication: `app/lib/auth-service.ts`, `app/lib/error-utils.ts`,
  `context/auth-context.tsx`, `app/auth/login/page.tsx`
- Data integrity: `app/lib/firestore-service.ts`,
  `app/lib/application-policy.ts`

## Phase 2C Recruiter Applicant Pipeline

- Eight-stage backward-compatible pipeline: Submitted, Viewed, Under review,
  Shortlisted, Maybe, Rejected, Selected, and Withdrawn
- Audition-owner-only review API with immutable Talent submission fields
- Private recruiter notes, tags, and 1-5 ratings
- Applicant search, trust/media/completeness filters, and decision sorting
- Talent notifications limited to meaningful Shortlisted, Rejected, and
  Selected outcomes
- Server-written audit events for status decisions and recruiter note updates
- Firestore rule coverage for owner updates, cross-recruiter denial, Talent
  denial, and immutable application fields

## Phase 2D Search and Discovery

- Active/visible Firestore audition query with local beta-scale search,
  filtering, sorting, and recommendation scoring
- Search by role, project/company, category, experience, location, language,
  project type, compensation, work mode, recruiter trust, recency, and deadline
- Owner-only bookmarks stored in `users/{uid}/savedAuditions/{auditionId}`
- Firebase-token-verified save/remove API with no client-provided owner UID
- New auditions receive normalized search fields; legacy auditions use safe
  inferred values without requiring a migration
- Recruiter applicant discovery now includes tags, category, location,
  language, verified-first, and media-first controls
- No paid search service and no new composite Firestore index required
- Firebase: `firestore.rules`, `firebase.json`, `.firebaserc.example`
- Testing: `tests/application-policy.test.mts`, `TESTING.md`, `package.json`
- Product documentation: `README.md`, `CHANGELOG.md`,
  `PRODUCT_STATUS_AND_ROADMAP.md`, `BETA_READINESS_REPORT.md`

## Firebase Rule and Index Changes

Firestore rules now require Talent application ownership, enforce an initial
`APPLIED` status, limit applicant-counter increments to exactly one, and limit
Recruiter application edits to review fields.

The existing collection-group index on `applications` using `talentId` and
`createdAt` supports the new scalable application tracker. It must be deployed
and finish building before that query works in a Firebase environment.

## Manual Deployment Steps

1. Copy `.firebaserc.example` to `.firebaserc`.
2. Set the actual Firebase project ID.
3. Verify `.env.local` and hosting environment variables use that same project.
4. Run `npm run verify`.
5. Deploy rules, indexes, and Storage configuration:

```powershell
npx firebase-tools login
npx firebase-tools use your_project_id
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

6. Wait for index creation to complete.
7. Add the production hostname to Firebase Authentication authorized domains.
8. Deploy the Next.js application and perform the workflow in `TESTING.md`.

## Test Results

At the Phase 1.5 baseline:

- ESLint: passing
- Production build: passing
- Policy tests: 14 passing
- Browser E2E smoke tests: implemented
- Firebase Emulator rule tests: implemented; local execution requires Java 21

Run `npm run verify` again immediately before every deployment.

## Known Issues

- Credential-backed browser tests require dedicated local test accounts
- Verification document and large video upload flows remain disabled
- No email/SMS delivery or notification preference controls
- Report/abuse handling and account deletion are not implemented
- No production analytics, error monitoring, uptime monitoring, or backups
- Development mock accounts must be created manually in Firebase once

## Launch Blockers

- Configure production Firebase Admin credentials and claim the first admin
- Confirm the emulator suite in CI and on a Java 21 development machine
- End-to-end tests for signup, publishing, applying, and reviewing
- Verification document workflow after Storage billing is available
- Terms, privacy policy, consent, support, and deletion processes
- Production observability and incident ownership

## Next Seven Days

1. Deploy and manually verify the Phase 0 rules and indexes.
2. Add Firebase Emulator connectivity and security-rule integration tests.
3. Add Playwright tests for the two critical Talent/Recruiter journeys.
4. Design the trusted recruiter approval backend using Admin SDK/custom claims.
5. Add profile image and portfolio upload with type/size validation.
6. Add error monitoring and basic product-event analytics.
7. Run a five-to-ten-user closed test and record every failed step.

The application has a coherent MVP journey and is ready for disciplined private
testing. It should not accept public users until the launch blockers above are
closed.
## Phase 2E Readiness Note

Public Talent profiles are opt-in and use separate sanitized Firestore
documents. Anonymous access is limited to enabled `publicTalentProfiles`
records and active media metadata explicitly marked public. Publishing and
slug ownership are controlled by a Firebase-ID-token-verified server route;
clients cannot write public records directly. Admin disable actions create an
audit log and notify the Talent owner.

Before production rollout, deploy the updated Firestore rules and manually
verify URL previews against the production Firebase Admin environment.

## Phase 3A Readiness Note

Messaging is scoped to existing applications and the approved Recruiter who
owns the audition. Server APIs and Firestore rules independently protect
participant identity, message sender identity, read state, and moderation
fields. Obvious contact details are blocked for the MVP.

Before wider beta, define message retention, user reporting, moderation
response times, and legal/privacy language for communication records.
## Phase 3B Readiness Note

Nata Connect now has a private trust-reporting workflow for auditions, public
Talent content, and application-linked communication. Reporter identity is
restricted to administrators. Evidence snapshots are deliberately minimal and
sanitize contact details before storage.

The admin report queue reuses established moderation states and records both a
report event history and global audit log. Automated checks cover policy
helpers, report privacy, admin-only updates, event control, route protection,
lint, TypeScript production build, and existing product regressions.

Before production use, deploy the updated Firestore rules and indexes:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project nata-connect-prod
```

Storage rules are unchanged. Manual beta QA should validate generic
notifications, every target-specific action, and confirm reported users never
receive reporter identity or internal resolution notes.
