# Changelog

### Phase 3C: Production Beta Readiness and Deployment Hardening

- Added safe Firebase environment validation helpers for public and Admin SDK
  configuration without printing secret values
- Added lightweight server logging and JSON payload guard helpers
- Added `/admin/beta-readiness` with launch checklist, environment status,
  production commands, and admin operations guidance
- Added an emulator-only `npm run demo:seed -- --confirm-demo-data` script for
  safe local beta demos
- Added oversized-payload guards to report creation and admin action APIs
- Updated beta QA, readiness, deployment, and testing documentation
- Added unit and Playwright coverage for environment validation, safe logging,
  API helpers, and beta-readiness route protection

### Phase 3B: Reports, Abuse Handling, and Trust Moderation

- Added private reports for auditions, public Talent profiles, public media,
  messages, conversations, Recruiters, and Talents
- Added token-verified report creation with validation, safe evidence
  snapshots, duplicate suppression, audit logs, and generic notifications
- Added report controls to audition details, public Talent profiles/media, and
  application-linked conversations/messages
- Added `/admin/reports` with status, target, reason, and priority filters,
  evidence review, event history, and moderation actions
- Added report review, dismissal, resolution, content removal, conversation
  blocking, and account suspension support to the secure admin action API
- Added admin-private Firestore report/event rules, a duplicate lookup index,
  policy tests, emulator tests, and route-protection/E2E coverage

### Phase 3A: Application-linked Messaging

- Added deterministic conversations tied to audition applications
- Added secure list, thread, send, and mark-read messaging APIs
- Added responsive conversation lists, message bubbles, unread indicators, and
  application context
- Replaced recruiter email contact with in-platform messaging
- Blocked obvious email addresses and phone numbers in message bodies
- Added conversation and message notifications
- Added Admin conversation metadata review and audited blocking
- Added Firestore participant, sender, moderation, and read-state protections
- Added policy, emulator, and route-protection tests

### Phase 2E: Public and Shareable Talent Profiles

- Added opt-in public Talent pages at `/t/[slug]`
- Added normalized, reserved-name-aware, collision-safe public slugs
- Added server-generated `publicTalentProfiles` snapshots containing only
  approved display fields and active media explicitly marked public
- Added Talent publish, preview, copy, refresh, slug-change, and disable tools
- Added dynamic profile metadata and no-index handling for unavailable pages
- Added Admin public-profile visibility and moderated disable actions
- Added notifications, audit logs, policy tests, Firestore rule tests, and E2E
  public-route coverage

### Phase 2D: Search, Filters, and Discovery

- Added responsive audition search, advanced filters, active chips, result
  counts, saved-only discovery, and five sort modes
- Added rule-based Talent recommendations using category, experience,
  location, skills, and languages
- Added secure owner-only saved auditions through an authenticated API route
- Added structured language, project type, work mode, compensation, and
  normalized search fields for new casting calls with legacy fallbacks
- Extended recruiter applicant discovery with tag, category, location,
  language, verified-first, and media-first controls
- Added discovery policy tests, bookmark security tests, and Playwright checks

### Phase 2C: Recruiter Applicant Pipeline

- Expanded application workflow with Under review, Maybe, Selected, and
  Withdrawn while retaining legacy status compatibility
- Added recruiter-only notes, 1-5 ratings, internal tags, decision timestamps,
  status history, and last-action metadata
- Upgraded the applicant page with counted stages, search, filters, sorting,
  profile completeness, trust badges, featured media, and expandable review
- Kept all recruiter review mutations behind Firebase ID-token and audition
  ownership checks
- Added Talent notifications for Shortlisted, Rejected, and Selected decisions
  without notifying on private notes, tags, or ratings
- Added recruiter audit logs, pipeline policy tests, Firestore rule tests, and
  Playwright coverage

All notable changes to Nata Connect are recorded here.

## Unreleased

### Phase 2B: Talent Media Portfolio

- Added profile photo and portfolio image uploads with progress and validation
- Added external showreel links without large video uploads
- Added user-scoped `talent-media` Storage paths and hardened Storage rules
- Added Talent media metadata, featured media, visibility, and moderation state
- Added recruiter profile-photo, featured-media, gallery, and showreel previews
- Added light Admin media moderation with audit logs and Talent notifications
- Added media completeness, path, URL, Firestore-rule, and Storage-rule tests

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
