# Changelog

All notable changes to Nata Connect are recorded here.

## Unreleased

### Phase 2A: Notifications and Activity Center

- Added server-owned top-level notifications with role, priority, related
  entity, safe internal action URL, read state, and metadata
- Added authenticated notification list/read/all-read APIs
- Added a role-aware notification bell, unread badge, and `/notifications`
- Added alerts for application, audition publishing, verification, moderation,
  and account-status events
- Moved application mutations through authenticated server handlers so
  notifications originate from trusted workflow events
- Added notification rules, indexes, policy tests, emulator tests, and
  credentialed route smoke coverage

### Talent Trust Layer

- Added optional Talent verification states: not submitted, pending, verified,
  rejected, and suspended
- Added weighted profile completeness scoring, missing fields, and next actions
- Added secure Talent verification submission with server-written audit logs
- Added `/admin/talents` for verify, reject, suspend, and restore actions
- Added verified Talent badges to recruiter applicant review
- Added Talent verification rules and five policy tests

### Phase 1.6: Security and Credential-backed QA

- Added ignored `.env.e2e.local` credential loading and a safe example file
- Strengthened Playwright role assertions for Talent, Recruiter, and Admin
- Added local Firestore Emulator security-rule tests
- Enforced removed-audition visibility and active-deadline application rules
- Added Java 21, emulator rules testing, and secret-free Playwright smoke to CI

### Phase 1.5: Beta Quality and Safety

- Added Playwright public, protected-route, and optional credential-backed role
  smoke tests
- Added GitHub Actions CI for install, lint, unit tests, and production build
- Added a reusable loading/error/empty state system and retry actions across
  Talent, Recruiter, and Admin workflows
- Sanitized unexpected Admin API errors and tightened server-only Admin setup
- Added the private-beta QA checklist and exact emulator test plan
- Documented E2E credentials, CI behavior, Storage limitations, and manual QA

### Phase 1: Trust and Administration

- Added Firebase custom-claim admin foundation and first-admin bootstrap script
- Added secure Next.js admin route handlers backed by Firebase Admin SDK
- Added admin overview, verification, users, auditions, and audit-log routes
- Added text-based recruiter verification with pending, approved, rejected,
  suspended, and resubmission states
- Added trusted recruiter approval, rejection, suspension, and restoration
- Added user suspension/restoration and audition removal/restoration
- Added server-written audit logs for all privileged actions
- Added verified recruiter badges and approved-only audition publishing
- Added optional disabled document-upload section while Storage is unavailable
- Added four trust-policy tests, bringing the suite to nine tests
- Hardened Firestore rules and added Phase 1 indexes

### Added

- Tab-scoped Firebase authentication for concurrent Talent and Recruiter tests
- Development account personas and profile/audition form presets
- Recruiter applicant review and application status workflow
- Application eligibility policy tests using Node's built-in test runner
- `npm run verify` for lint, tests, and production build
- Firebase Emulator Suite configuration and `.firebaserc.example`
- Product roadmap, testing guide, setup guide, and beta-readiness report

### Changed

- Rebranded the product to Nata Connect (`నట కనెక్ట్`)
- Improved navigation, responsive layouts, visual hierarchy, and casting theme
- Application submission now uses a Firestore transaction
- Applicant counts now update atomically with application creation
- Talent application loading now uses a collection-group query instead of
  scanning every audition
- Firebase rules now constrain Talent counter updates and Recruiter status
  updates to their intended fields
- Authentication errors now use clearer user-facing messages

### Fixed

- Login redirect state update during React rendering
- Missing dashboard route after login
- Stale authentication role updates during rapid session changes
- Duplicate and invalid audition application attempts

### Security

- Application creation requires the authenticated Talent user's ID and an
  initial `APPLIED` status
- Recruiters can update only review-related application fields
- Talent users can increment only an audition's applicant counter by one

## Before Public Release

- Add trusted server-side recruiter approval using Admin SDK/custom claims
- Add Firebase Emulator security-rule tests and browser E2E coverage
- Complete media upload, moderation, notification, legal, and monitoring flows
