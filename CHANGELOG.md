# Changelog

### Talent Portfolio and Recruiter Profile Experience Upgrade

- **`app/talent/profile/page.tsx`**: `font-semibold` → `font-bold` on all field labels; checkbox label updated from "Public profile enabled" to "Enable public portfolio page"; verification pending copy removes "private-beta" qualifier.
- **`app/recruiter/profile/page.tsx`**: All form label `font-semibold` → `font-bold`; amber "onboarding phase" notice inside casting-identity section replaced with `PrivacyNote` ("Platform safety expectation") enforcing the no-pay-to-audition rule.
- **`app/recruiter/verification/page.tsx`**: Page title "Private-beta verification" → "Company verification"; success message updated to "The trust team will review your details and get back to you."; docs section copy removes "beta" framing in all three locations.
- **`app/t/[slug]/page.tsx`**: Profile card, photo, selected-work section, showreel items, and professional-links section all gain `rounded-md`; skills and languages separated into two distinct labeled chip groups (Skills: neutral grey, Languages: teal-tinted); casting inquiry footer note added.
- **`app/recruiter/auditions/[id]/applicants/page.tsx`**: Experience level chip added to compact card TalentChip row; "Portfolio" button added to card action row when talent has `publicSlug`; expanded Talent profile section separates skills and languages into labeled rows with distinct chip styles; "View public portfolio →" link added in expanded section; `ApplicantDetail` value `font-semibold` → `font-bold`.
- Created `PROFILE_EXPERIENCE_UPGRADE_REPORT.md` with full audit, before/after table, and manual test checklist
- No Firestore rules, APIs, authentication, payment, AI, or storage features changed

### Core Application Experience Upgrade

- **`app/auditions/[id]/page.tsx`**: Comprehensive brand alignment — article and aside now use `surface` class; recruiter byline uses teal `font-black uppercase tracking-wide`; title uses `font-black`; apply button uses `primary-button` class; save button gains `rounded-md`; `Detail` and `Section` helper components expanded to multi-line with `font-black` typography; detail grid expanded from 6 to up to 10 fields (Project type, Work mode, Compensation, Languages added as conditional entries); `SafetyNotice` "Never pay to audition" added at bottom of article; back link fixed to `text-[#008ca6]`; apply error upgraded from bare `<p className="text-red-700">` to styled amber block; local label maps `AUDITION_TYPE_LABELS`, `WORK_MODE_LABELS`, `PAYMENT_LABELS` added.
- **`app/applications/page.tsx`**: Inline amber error `<div>` replaced with `<ErrorState>` component; inline dashed empty-state `<div>` replaced with `<EmptyState actionHref actionLabel>`; recruiter byline separator changed from ` - ` to ` · `; status filter description changed from internal developer copy to user-facing "Narrow results to a specific pipeline stage."
- **`app/dashboard/page.tsx`**: `TalentOnboardingChecklist` and `RecruiterOnboardingChecklist` eyebrow changed from "Private beta — getting started" to "Getting started" — permanent product guidance, not a beta qualifier.
- **`app/recruiter/auditions/new/page.tsx`**: Self-tape submission type note changed from "For beta safety, self-tapes use unlisted/private links from trusted video platforms." to "Self-tapes use unlisted or private links from YouTube, Vimeo, or a similar platform." — frames a platform decision as policy, not a temporary restriction.
- **`app/messages/page.tsx`**: Page eyebrow changed from "Private casting communication" to "Casting inbox" — the user mental model, not a technical description.
- Created `CORE_APPLICATION_EXPERIENCE_UPGRADE_REPORT.md`
- No Firestore rules, APIs, authentication, payment, AI, storage, or document upload features changed

### Production Reliability and Safe Error-State Hardening

- **`app/error.tsx`** (CREATED): Branded route-level error boundary (`'use client'`,
  `reset` callback). Shows calm "Something went wrong." page with brand header,
  "Try again" (calls `reset`) and "Go to workspace" (Link to `/dashboard`). Raw
  `error.message` and `error.digest` never exposed to users.
- **`app/global-error.tsx`** (CREATED): Root-level error boundary required when
  the root layout throws. Uses inline styles (Tailwind unavailable at this level),
  includes `<html><body>` tags, midnight navy background, teal "Reload page" button.
- **`app/loading.tsx`** (CREATED): Page-transition loading state for Next.js App
  Router Suspense boundaries. Branded teal pulse dot matching `LoadingState` style.
- **`app/lib/error-utils.ts`**: Fixed raw `error.message` passthrough at line 30
  and line 36. Non-auth errors now return `fallback` instead of the raw SDK message.
  Recognised auth codes (7 entries) still resolve to their friendly messages first.
- **`components/async-state.tsx`**: Added `secondaryHref` and `secondaryLabel`
  optional props to `ErrorState`. When provided, a secondary Link button appears
  alongside "Try again" in a flex-wrap row. All existing callers are unaffected
  (props are optional).
- **`components/app-shell.tsx`**: Added "Contact support" Link to `/help` in the
  suspended account section. Previously the only action was "Log out"; suspended
  users now have a path to reach support without logging out first.
- **`app/notifications/page.tsx`**: Replaced bare `<p className="text-sm...">Loading
  activity...</p>` with `<LoadingState label="Loading activity..." />` for visual
  consistency with all other loading states.
- **`app/applications/page.tsx`**: Replaced bare `<p className="text-sm...">Loading
  your applications...</p>` with `<LoadingState label="Loading your applications..." />`.
- Created `PRODUCTION_RELIABILITY_HARDENING_REPORT.md` with full audit and
  before/after summary
- No Firestore rules, APIs, authentication, payment, AI, or storage features
  changed

### Admin Operations Hardening for Private Beta

- **`app/admin/reports/page.tsx`**: Reporter field now shows role only (no UID);
  target owner shows last 8 chars only; evidence snapshot replaced JSON.stringify
  dump with structured `SafeEvidenceDisplay` component that redacts fields ending
  in `id`/`uid` and truncates long values; audit trail actor shows "Admin" instead
  of raw UID
- **`app/admin/users/page.tsx`**: Replaced desktop HTML table with card-row
  `<article>` layout; added `emailVerified?: boolean` to `UserRow` type; updated
  `statusTone` to return `attention` when `emailVerified === false`; "Email
  unverified" badge shown in both desktop and mobile views when explicitly false
- **`app/admin/page.tsx`**: Added amber urgency callout banner that appears only
  when recruiter or Talent verification queues have pending items; replaced
  implicit `Object.entries(data.stats)` loop with a curated ordered key list
  prioritizing users → talent → recruiter → approved → auditions → applications →
  self-tape
- Created `ADMIN_OPERATIONS_HARDENING_REPORT.md` with full audit and before/after
  summary
- No Firestore rules, APIs, authentication, payment, AI, or storage features
  changed

### Cinematic Trust Marketplace Design System Evolution

- Redesigned `components/status-badge.tsx`: replaced generic Tailwind color
  classes with brand-aligned palette — teal for active/applied, gold arc for
  shortlisted/callback/final-round, emerald for selected, muted for
  closed/withdrawn; all badges now `rounded-md border tracking-wide`
- Redesigned `components/audition-card.tsx`: new `Chip` component with 6 brand
  variants, cinematic left-border hover accent (teal on hover, gold when
  applied), `hover:-translate-y-0.5 hover:shadow-md`, CTA renamed "View casting
  brief", `MapPin` icon in location chip, `Video` icon in self-tape chip
- Updated `components/product-ui.tsx` `WorkspaceHero`: added subtle teal radial
  glow gradient at top-right for cinematic depth; gold stripe and layout unchanged
- Replaced HTML table in `app/recruiter/auditions/page.tsx` desktop view with
  card-row layout: `<article>` elements with group hover, teal title transition,
  status + self-tape badges, deadline + applicant count row, primary/secondary
  actions — matches mobile card language
- Improved `app/applications/page.tsx`: `ApplicationMeta` chips use brand label
  sizing (`text-[10px] font-black uppercase tracking-wide`); "Next step" panel
  gained teal dot indicator and teal border accent
- Added `TalentChip` component to applicant review page with three brand-palette
  tones (neutral, score=teal, media=gold) replacing plain unstyled spans
- Created `DESIGN_SYSTEM_EVOLUTION_REPORT.md`
- No Firestore rules, APIs, schemas, authentication, or backend features changed

### Private Beta Launch System

- Added role-aware onboarding checklists to the Talent and Recruiter dashboards;
  checklists show when the user has not yet completed core activation steps and
  disappear once the condition is met
- Upgraded beta feedback policy: added `performance` type (slow or unresponsive
  flows) and `severity` field with values `low`, `medium`, `high`, `blocking`
- Updated `validateBetaFeedback()` to validate severity; unknown values silently
  default to `medium`
- Updated `/api/beta-feedback` route handler to accept and write `severity` to
  Firestore
- Updated `app/beta-feedback/page.tsx`: severity dropdown, humanized type labels,
  private beta trust copy above the form, improved textarea placeholder
- Updated `app/admin/beta-feedback/page.tsx`: type filter, severity badge per
  item (color-coded: blocking=danger, high=attention, medium=neutral, low=muted),
  sort by severity, blocking metric card
- Added private beta trust notice to signup page (informational only — no invite
  code gating)
- Added "Beta control center" card to admin dashboard linking to feedback,
  readiness, audit logs, and reports
- Added severity validation tests to `tests/beta-feedback-policy.test.mts`
- Created `PRIVATE_BETA_LAUNCH_SYSTEM.md` with full feature documentation
- No Firestore rules, authentication, payment, AI, or storage features changed

### Live Production Beta Smoke Test Pass

- Ran remote static HTML inspection against https://firsttake-lovable.vercel.app
  for all public routes: homepage, auth, help, safety, community guidelines,
  terms, privacy, contact, beta feedback, email-verified
- Confirmed no secrets, raw Firebase errors, or test panels in public HTML
- Confirmed test case panel is gated on `NODE_ENV !== 'development'` (absent
  in production)
- Confirmed admin routes display "Administrator access required" for non-admin
  users via `!user || !isAdmin` guard
- Confirmed no billing, storage, or payment promises visible in any page
- Confirmed `localhost:3000` fallback in email verification URL is correctly
  unreachable in browser (overridden by `window.location.origin`)
- Confirmed all anti-payment safety warnings present in messages and community
  guidelines
- Added `app/not-found.tsx`: custom branded 404 page with Back to home and Help
  center links — replaces Next.js default 404
- Created `LIVE_PRODUCTION_BETA_SMOKE_TEST.md` with full audit inventory,
  P0/P1/P2 findings, manual check list, and launch recommendation
- No Firestore rules, APIs, schemas, authentication, or backend features changed

### Laptop Screen Recording UX Polish Pass

- Compacted `WorkspaceHero` and `MetricCard` in `product-ui.tsx` for tighter
  desktop density: smaller padding, title sizes, and icon sizes
- Unified `EmailVerificationPrompt` to one compact design; removed `compact`
  prop; both dashboard usages updated
- Fixed recruiter nav active-state bug: "Casting calls" and "Applicants" were
  both highlighted when visiting `/recruiter/auditions/[id]/applicants`; fixed
  with `exact: true` flag and updated `isActiveLink` logic in `app-shell.tsx`
- Compacted Talent and Recruiter dashboard hero sections, stat cards, next-
  best-action card, profile readiness card, and sidebar articles in
  `dashboard/page.tsx`
- Reduced chat area height in `messages/[conversationId]/page.tsx` from 56vh to
  48vh; added amber read-only banner when conversation status is not active
- Compacted recruiter applicant metrics from 3 rows to 2 rows: changed grid
  from `sm:grid-cols-2 xl:grid-cols-4` to `grid-cols-2 sm:grid-cols-3
  xl:grid-cols-6`; reduced `ReviewMetric` padding and font size
- Replaced "Before you publish" plain-text sidebar with a structured checklist
  in `recruiter/auditions/new/page.tsx`
- Compacted recruiter verification page header, status badge, and form spacing
- Compacted notifications page header, filter tab spacing, and notification
  cards; removed redundant "Unread" text badge
- Compacted admin dashboard metric grid spacing
- Created `LAPTOP_SCREEN_RECORDING_UX_AUDIT.md` with full audit inventory
- No Firestore rules, APIs, schemas, authentication, or backend features changed

### Beta Launch Readiness Pass

- Updated README.md to reflect controlled private beta readiness status
- Rewrote BETA_LAUNCH_READINESS_CHECKLIST.md with comprehensive step-by-step
  manual QA checklists for Talent, Recruiter, Admin, cross-device, mobile,
  error-state, and notification/message flows
- Updated BETA_READINESS_REPORT.md: assessment date June 22, 2026; readiness
  score raised to 8.5/10 reflecting completed QA pass
- Updated PRODUCT_STATUS_AND_ROADMAP.md: document date June 22, 2026; stage
  updated to beta launch readiness pass
- Documented known beta limitations: no document upload, no direct self-tape
  upload, no payments, manual verification review, email delivery conditional
  on provider config
- Launch decision: Ready with limitations for controlled private beta
- No Firestore rules, APIs, schemas, authentication, or backend features changed

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
