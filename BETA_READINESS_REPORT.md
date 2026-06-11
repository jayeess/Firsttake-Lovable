# Nata Connect Beta Readiness Report

**Assessment date:** June 11, 2026
**Recommended stage:** Controlled internal/private testing only  
**Readiness score:** 7.5/10

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

## Files Changed

- Authentication: `app/lib/auth-service.ts`, `app/lib/error-utils.ts`,
  `context/auth-context.tsx`, `app/auth/login/page.tsx`
- Data integrity: `app/lib/firestore-service.ts`,
  `app/lib/application-policy.ts`
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
- Policy tests: 9 passing
- Browser E2E smoke tests: implemented
- Firebase Emulator rule tests: not implemented

Run `npm run verify` again immediately before every deployment.

## Known Issues

- Credential-backed browser tests require dedicated local test accounts
- Storage rules exist, but complete portfolio and verification upload flows do
  not
- No email/in-app notifications for status changes
- Report/abuse handling and account deletion are not implemented
- No production analytics, error monitoring, uptime monitoring, or backups
- Development mock accounts must be created manually in Firebase once

## Launch Blockers

- Configure production Firebase Admin credentials and claim the first admin
- Firebase Emulator security-rule tests
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
