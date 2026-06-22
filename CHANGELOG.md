# Changelog

### Real End-to-End Product Flow QA Pass

- Audited all Talent, Recruiter, and Admin flows for raw error copy,
  broken links, dead buttons, unsupported CTAs, and mobile issues
- Replaced nine raw Firebase / technical error outputs with
  user-friendly static recovery messages across audition detail,
  messages conversation, notifications, recruiter applicant pipeline,
  create-audition, admin action button, and application message button
- Removed the disabled "Direct upload coming soon" checkbox and
  future-feature copy from the create-audition self-tape section
- Removed the disabled "Document upload coming soon" button from
  recruiter verification; replaced with guidance to keep sensitive
  documents out of public fields
- Added FLOW_QA_REPORT.md with full issue inventory, priority list,
  test results, and recommended fixes
- No Firestore rules, Firebase configuration, APIs, schemas,
  authentication logic, payment, storage, or backend features changed

### Final Mobile Micro-Polish Pass

- Tightened mobile workspace hero spacing so Admin command-center metrics appear
  sooner without losing the premium product feel
- Increased mobile shell bottom safe-area padding across Talent, Recruiter, and
  Admin workspaces so cards and actions clear app navigation and browser bars
- Softened shared metric-card accent bars for calmer visual consistency
- Shortened Admin mobile bottom labels to Verify, Moderate, and Logs
- Made the compact email verification prompt lighter on mobile dashboards while
  keeping the trust message and actions clear
- No backend logic, Firestore rules, APIs, schemas, permissions, auth logic, or
  Firebase configuration changed

### Admin Experience Continuity Pass

- Brought the Admin command center, recruiter verification, Talent review,
  audition moderation, and audit logs onto the shared workspace hero, metric
  card, section header, and safety notice patterns
- Reworked the Admin mobile shell so phones use the unified product header,
  compact menu, and bottom trust-operations navigation instead of a full
  desktop sidebar
- Added clearer Admin trust metrics for pending reviews, active auditions,
  flagged accounts, removed briefs, enforcement events, and recent audit
  activity
- Improved Admin empty, loading, and error copy so normal admin users see
  product-safe recovery language instead of implementation details
- Made audit-log action labels easier to read while preserving the underlying
  action values and permissions
- No Firestore rules, database schema, API contract, server action, or
  permission logic was changed

### Full Mobile Product QA Pass

- Added a role-aware `/profile` bridge so mobile profile links resolve to the
  right Talent, Recruiter, or Admin workspace
- Normalized audited mobile route error states to safe refresh guidance instead
  of raw service messages
- Corrected the Telugu Nata Connect brand text in the shared logo and landing
  hero
- Tuned Admin mobile bottom navigation labels for narrow phone widths
- No backend features, Firestore rules, APIs, schemas, permissions, auth logic,
  or Firebase configuration changed

### Product Experience and Platform Consistency

- Added shared product UI primitives for workspace heroes, metric cards,
  section headers, and safety notices
- Upgraded `/auditions` into a stronger marketplace feed with opportunity
  metrics, verified recruiter count, saved role count, and application context
- Upgraded `/applications` with tracker metrics, clearer status orientation,
  self-tape task visibility, and less technical error copy
- Upgraded `/recruiter/auditions` into a casting command-center view with
  recruiter metrics and a visible professional safety standard
- Improved landing-page credibility with a clearer how-it-works section
- Removed normal-user technical wording from support, recovery, verification,
  and service error messages
- No payment, subscription, document upload, Firebase rules, or billing work was
  added

### Profile Completeness Consistency

- Centralized Talent profile completeness calculation in a shared helper used by
  Talent, Admin, dashboard, and recruiter-facing profile reads
- Fixed Admin Talent review showing stale verification snapshot scores instead
  of the current live profile completeness
- Separated profile completeness from Talent verification, public profile state,
  and portfolio moderation in the Admin Talent view
- Clarified that optional trust signals such as verification status, email
  verification, profile photo, and moderation state do not reduce the profile
  completeness percentage

### Messaging and Notifications Workflow Polish

- Reworked `/notifications` into category-based activity views for
  Applications, Messages, Auditions, and Trust / Account updates
- Upgraded notification cards with category icons, unread badges, clearer action
  labels, and more respectful application-status copy
- Added Talent-facing Viewed application notifications while keeping Viewed out
  of email delivery to avoid noisy inboxes
- Polished `/messages` with archived filtering, application-status badges,
  participant context, and role-aware empty states
- Improved message thread context with application status and stronger casting
  safety reminders
- Added dashboard continuity links so Talent and Recruiter users can reach
  messages and notifications from their workspace
- No payment, subscription, document upload, Firebase Storage, or billing work
  was added

### Applicant Review and Self-Tape Workflow Polish

- Added `CALLBACK` and `FINAL_ROUND` application statuses through the existing
  recruiter-owned application review flow
- Upgraded `/recruiter/auditions/[id]/applicants` into a clearer casting review
  workspace with audition summary metrics, stage tabs, self-tape state, cover
  note previews, status timeline, and faster review actions
- Improved Talent application progress copy for Callback and Final Round stages
  across `/applications` and dashboard summaries
- Added application-update notifications and email preference mapping for the
  new advanced casting stages
- Updated Firestore rules/tests to keep status updates restricted to the
  owning approved Recruiter
- No payment, subscription, document upload, or Firebase Storage upload work was
  added

### Audition Discovery and Application Tracking Polish

- Made saved auditions more visible on `/auditions` and added applied-state
  badges to audition cards
- Added clearer marketplace badges for verified recruiters, new roles,
  deadline-soon roles, work mode, compensation, and self-tape requirements
- Reworked application tracker groups into Active, Shortlisted, Completed, and
  All with clearer next-step messaging and audition links
- Added recruiter audition summary metrics and stronger review-applicants
  actions on mobile and desktop
- Removed beta verification copy that referenced infrastructure constraints and
  clarified that document uploads are a future secure workflow

### UX Alignment and Email Verification Flow

- Realigned Talent dashboard CTAs around auditions, applications, self-tapes,
  saved auditions, recruiter replies, and profile readiness
- Updated Recruiter dashboard copy toward casting-pipeline operations
- Updated the landing page around "Where Talent Meets Opportunity"
- Added real Firebase email verification send/resend and refresh controls
- Added secure Admin-SDK token verified email-verification sync route for the
  current user document
- Polished email verification wording, added automatic checks on mount/focus,
  short post-send polling, Spam/Promotions guidance, and `/auth/email-verified`
  continue page
- Updated UX polish, README, and testing documentation

### Phase 5B: Email Notifications Foundation and PWA Readiness

- Added server-only email provider architecture with safe no-op mode and Resend
  readiness
- Added transactional email templates for critical notification categories
- Added account-level notification preference policy and Talent/Recruiter
  preference UI
- Wired safe email attempts after successful in-app notification creation
- Added PWA manifest, mobile metadata, and installability documentation
- Added admin beta-readiness checks for email foundation, preferences, PWA, and
  push-notification pending status
- Added email/preference tests and documentation

### Phase 5A: Self-Tape Audition Submissions

- Added self-tape request fields to auditions and self-tape status/submission
  fields to applications
- Added a beta-safe external-link self-tape workflow for Talent after applying
- Added recruiter applicant-pipeline self-tape badges, view action, and reviewed
  state
- Added server-side self-tape submit/remove/review API with notifications and
  recruiter review audit logging
- Added admin self-tape request/submission visibility in overview metrics and
  audition moderation badges
- Added self-tape validation/status tests and `SELF_TAPE_SUBMISSIONS.md`

### Phase 4A: Vercel Production Deployment and Beta Launch Setup

- Added `VERCEL_DEPLOYMENT.md` with Vercel import, environment variable,
  Firebase authorized-domain, smoke test, beta launch, rollback, and legal
  placeholder guidance
- Added optional `NEXT_PUBLIC_APP_URL` support for production metadata base URL
  handling, with Vercel URL fallback and request-origin helpers
- Added tests for production URL normalization and safe fallback behavior
- Updated beta readiness, QA, testing, and roadmap documentation for Vercel
  launch preparation

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
