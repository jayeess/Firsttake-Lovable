# Nata Connect Product Status and Roadmap

**Telugu name:** నట కనెక్ట్  
**Document date:** June 29, 2026
**Repository:** `jayeess/Firsttake-Lovable`  
**Current stage:** Callback and Selection Decision Workflow completed; 83 unit tests pass; ready for verification and deploy

## 1. Product Summary

Nata Connect is a two-sided talent discovery and casting platform for:

- Talent: actors, models, dancers, voice artists, and anchors
- Recruiters: casting directors, producers, agencies, studios, and production teams

The product already supports the central marketplace loop:

1. A user creates a Talent or Recruiter account.
2. Talent builds a professional profile.
3. Recruiters build a company profile and pass through a verification state.
4. Recruiters publish auditions.
5. Talent discovers and applies to auditions.
6. Recruiters review applicants and update their status.
7. Talent tracks each application and sees recruiter decisions.

The product has a distinct bilingual identity, **Nata Connect | నట కనెక్ట్**, with a cinema-gold, digital-cyan, and midnight visual system.

## 2. Current Product Position

Nata Connect is no longer a static demonstration. It is a working Firebase-backed MVP with role-based workflows and real persisted data.

### Product maturity assessment

| Area | Status | Assessment |
| --- | --- | --- |
| Brand and visual identity | Strong | Distinctive and market-relevant |
| Talent onboarding | Working | Suitable for MVP testing |
| Recruiter onboarding | Working with demo approval | Needs real administration |
| Audition creation | Working | Core fields and draft/publish states exist |
| Audition discovery | Working | Search and filtering exist |
| Applications | Working | Duplicate applications are prevented |
| Recruiter applicant review | Working | Viewed, shortlisted, and rejected states exist |
| Role separation | Working | Talent and recruiter routes are guarded |
| Authentication | Working, recently improved | Tab-scoped sessions support different accounts |
| Security rules | MVP-level | Good role foundations, requires production review |
| Automated testing | Partial | Policy tests and browser smoke tests exist; emulator tests remain |
| Admin operations | Hardened | Reporter UID masked in reports, evidence display structured, emailVerified visible in user list, urgency callout on dashboard, card-row replaces HTML table |
| Error resilience | Hardened | Route error boundary (`app/error.tsx`), root error boundary (`app/global-error.tsx`), page loading state (`app/loading.tsx`), raw error.message passthrough fixed, consistent loading components |
| Core product experience | Upgraded | Audition detail page brand-aligned (surface, font-black, SafetyNotice, expanded detail grid); error/empty state components consistent; beta language removed; premium casting copy throughout |
| Profile and portfolio experience | Upgraded | Talent and recruiter profile forms use font-bold labels; public portfolio has rounded-md cards; skills and languages separated into labeled chip groups; recruiter verification removes all beta language; applicant review shows experience chip and portfolio link |
| Applicant pipeline experience | Upgraded | Applicant review header shows audition meta; pipeline summary simplified to 8 counts; UNDER_REVIEW and MAYBE tabs added; timeline copy status-specific; "Next action" guidance panel in aside; Talent application messages stage-specific and actionable; notification copy casting-specific |
| Audition discovery experience | Upgraded | Safety reminder on discovery page; view descriptions font-bold and directive; MetricCard detail casting-specific; empty states action-oriented; casting brief apply aside gains sub-text, closed notice, unauthenticated CTA, and post-apply guidance; dashboard next-step messages use casting language |
| Final production QA and live validation | Validated | Full three-journey audit (Talent, Recruiter, Admin) completed; 6 issues found and fixed: auth error block `rounded-md`, login "Current tab session" box `rounded-md`, Recruiter hero CTA "Post an audition" → "Post a casting brief", admin reports reporter note / evidence snapshot / audit trail all gain `rounded-md`; 70/70 tests pass, build clean |
| Mobile responsiveness and app-like polish | Upgraded | `LoadingState` and `ErrorState` gain `rounded-md` for visual consistency with `EmptyState` and surface cards; audition detail page aside (`order-first lg:order-none`) puts apply CTA above article on mobile; new audition form h1 scales responsively (`text-2xl sm:text-3xl lg:text-4xl`); recruiter verification success message and admin note gain `rounded-md` |
| Role onboarding and first-session experience | Upgraded | Beta banner removed from signup; error blocks use amber styling on signup and login; four "FirstTake" → "Nata Connect" branding fixes on email-verified page; one fix in email verification prompt; Recruiter onboarding checklist "Complete company profile" step now reflects actual profile data instead of hardcoded done |
| Trust, safety and reporting experience | Upgraded | Safety page has red-flags section, how-to-report, and post-report guidance; community-guidelines removes "where available" and names consequences; messages description consistent "never" policy; "FirstTake" branding bug fixed in conversation reminder; admin reports queue has priority guidance and filter-aware empty state; scam/unsafe-contact reports escalated to urgent priority |
| Recruiter audition publishing experience | Upgraded | New casting brief form has field-level helper text on 10 fields; error block uses amber styling; Input component supports helper prop; self-tape instructions include safety note; max duration label clarified; header copy casting-specific; recruiter access widget reflects approved status; verification page explains publishing trust |
| Messaging and notifications experience | Upgraded | Messages inbox type chip role-aware and archived-aware; empty state active for talent; conversation header eyebrow role-aware; compose placeholder casting-specific; aside description and safety title improved; return links role-aware; notifications per-category unread counts on tabs; context-aware empty states by filter; amber error styling consistent; font-bold on timestamps; MetricCard detail font-bold globally |
| Notifications | Implemented in-app | Email foundation exists; real provider delivery and SMS remain future work |
| Email foundation | Phase 5B implemented | No-op provider mode by default; Resend adapter ready |
| PWA readiness | Phase 5B implemented | Manifest/installability added; push notifications pending |
| Media portfolio | Hardened | Talent profile photos and portfolio images use shared upload validation, 5 MB image limits, and a 6-image portfolio cap; external showreels remain supported |
| Recruiter verification evidence | Implemented | Recruiters can upload private image/PDF proof files for Admin review; evidence is owner/admin-only in Storage |
| Applicant pipeline | Phase 2C implemented | Secure statuses, filters, ratings, tags, notes, and decision alerts |
| Audition discovery | Phase 2D implemented | Search, advanced filters, recommendations, and saved auditions |
| Self-tape submissions | Phase 5A implemented | External link workflow live; direct private video upload remains future work |
| Deployment operations | Partial | Build passes, production process is undocumented |
| Launch demo readiness | Improved | Empty states, first-time guidance, and honest roadmap messaging make the app understandable even before dense live marketplace activity |

### Latest product-design position

The June 29, 2026 Real Launch Demo and Marketplace Content pass made the app feel more complete when live data is sparse. Landing, Talent, Recruiter, messages, notifications, applications, and applicant-review empty states now explain what happens next without fake data or inflated marketplace claims.

The June 25, 2026 Cinematic Product Design and Flow Transformation pass upgraded the product from polished marketplace screens into a clearer casting operating system. Shared UI primitives now support stronger section rhythm, next-action panels, journey step cards, and trust cue cards. Landing, audition discovery, audition detail, application tracking, messaging, notifications, recruiter auditions, and applicant review now present one obvious next action without changing backend logic or security.

## 3. Implemented Features

### Public experience

- Branded Nata Connect landing page
- English and Telugu wordmark
- Generated cinema/network emblem and branded artwork
- Responsive public layout
- Login, signup, and password reset entry points

### Authentication and accounts

- Firebase Email/Password authentication
- Email verification messages
- Talent and Recruiter account roles
- Firestore user account records
- Role recovery from existing account metadata
- Friendly Firebase error messages
- Tab-scoped Firebase sessions
- Different users can be tested in different tabs/windows
- Logout and protected-route redirects

### Talent features

- Talent profile creation and editing
- Fields for:
  - Name
  - Age
  - Gender
  - Height
  - Category
  - Experience
  - Location
  - Professional biography
  - Instagram
  - YouTube
  - Portfolio website
  - Public profile setting
- Active audition discovery
- Search by title, description, or recruiter
- Category, experience, and location filters
- Audition detail pages
- Cover-message application submission
- Duplicate-application prevention
- Application tracker with:
  - Applied
  - Viewed
  - Shortlisted
  - Rejected
- Self-tape link submission, replacement, and removal for eligible
  applications
- Recruiter rejection feedback display
- Weighted profile completeness score and recommended next actions
- Optional Talent verification submission and review status
- Verified Talent trust badge in recruiter applicant review

### Recruiter features

- Company profile creation and editing
- Company name, phone, address, website, and biography
- Recruiter verification status screen
- Development-only simulated approval
- Audition creation
- Save as draft or publish
- Audition fields for:
  - Title
  - Description
  - Talent category
  - Experience level
  - Location
  - Optional self-tape requirement and instructions
  - Duration
  - Requirements
  - Number of positions
  - Compensation
  - Deadline
- Recruiter audition list
- Applicant count
- Applicant pipeline for each audition
- Talent profile and cover-message review
- Contact and portfolio links where available
- Mark application as viewed
- Shortlist talent
- Reject with an optional reason
- Verified Talent indicators in the applicant pipeline

### Dashboards and navigation

- Separate Talent and Recruiter workspaces
- Role-specific statistics
- Recent activity
- Desktop sidebar navigation
- Mobile menu
- Mobile bottom navigation
- Active-route states
- Bilingual branding throughout shared navigation

### Development and QA support

- Development-only account presets
- Six reusable account personas
- Talent profile mock presets
- Recruiter profile mock presets
- Audition mock presets
- Validation/error test cases
- Test panels can be disabled with:

```env
NEXT_PUBLIC_SHOW_TEST_CASES=false
```

See `TESTING.md` for the complete testing guide.

### Talent trust and administration

- Private Talent verification records in `talentVerifications/{uid}`
- Public verification status mirrored to the Talent profile
- Admin Talent review queue
- Talent verify, reject, suspend, and restore operations
- Audit events for submission and every privileged decision
- Verification remains optional and does not gate basic Talent usage

### Notifications and activity

- Notification bell and unread count in Talent, Recruiter, and Admin shells
- `/notifications` activity center with All/Unread filters
- Individual and bulk read-state actions
- Trusted server creation for application, verification, moderation, and
  account-status events
- Role-specific action links back into the relevant workflow
- Top-level notification security rules and supporting Firestore indexes

## 4. Technology and Architecture

### Frontend

- Next.js 16.2.7 App Router
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- Responsive client-side application screens

### Backend services

- Firebase Authentication
- Cloud Firestore
- Firebase Storage provides scoped Talent profile and portfolio image uploads

### Main application layers

| Layer | Location |
| --- | --- |
| Routes and pages | `app/` |
| Authentication service | `app/lib/auth-service.ts` |
| Firestore operations | `app/lib/firestore-service.ts` |
| Firebase initialization | `app/lib/firebase.ts` |
| Shared data types | `app/lib/types.ts` |
| Authentication context | `context/auth-context.tsx` |
| Navigation shell | `components/app-shell.tsx` |
| Firestore security | `firestore.rules` |
| Test data guide | `TESTING.md` |

### Route inventory

| Route | Purpose | Role |
| --- | --- | --- |
| `/` | Public landing page | Public |
| `/auth/signup` | Account creation | Public |
| `/auth/login` | Login and account switching | Public |
| `/auth/forgot-password` | Password reset | Public |
| `/dashboard` | Role-specific overview | Authenticated |
| `/talent/profile` | Talent portfolio form | Talent |
| `/auditions` | Browse auditions | Talent |
| `/auditions/[id]` | Audition details/application | Authenticated |
| `/applications` | Talent application tracking | Talent |
| `/notifications` | Role-aware activity center | Authenticated |
| `/recruiter/profile` | Company profile | Recruiter |
| `/recruiter/verification` | Approval status | Recruiter |
| `/recruiter/auditions` | Recruiter casting calls | Recruiter |
| `/recruiter/auditions/new` | Create an audition | Recruiter |
| `/recruiter/auditions/[id]/applicants` | Applicant pipeline | Audition owner |

## 5. Firestore Data Model

### User account

```text
users/{uid}
```

Contains identity metadata such as email, user type, account status, verification state, and login timestamps.

### Talent profile

```text
users/{uid}/talentProfiles/{uid}
```

Contains professional information, profile-photo metadata, media count, and
featured-media state. Portfolio entries live in
`users/{uid}/talentProfiles/{uid}/media/{mediaId}`.

### Recruiter profile

```text
users/{uid}/recruiterProfiles/{uid}
```

Contains company information and `isVerified`.

### Audition

```text
auditions/{auditionId}
```

Contains the recruiter owner, casting brief, deadline, status, and applicant count.

### Application

```text
auditions/{auditionId}/applications/{talentId}
```

The talent ID is used as the application document ID. This naturally prevents the same talent from applying twice to one audition.

### Notification

```text
notifications/{notificationId}
```

Contains one recipient UID and role, event type, title/message, optional related
entity and internal action URL, read state, creator, priority, metadata, and a
server timestamp. Notification content is server-created; clients may update
only read-state fields.

## 6. Current Security Model

Firestore rules currently enforce:

- Users can create and read their own account record.
- A user cannot change their role after account creation.
- Talent can write only their own talent profile.
- Recruiters can write only their own recruiter profile.
- Recruiters cannot change their own verification flag.
- Only recruiters can create auditions.
- Recruiters can update/delete only auditions they own.
- Only talent can submit applications.
- Talent can read their own application.
- The audition owner can read and update its applications.

### Important production note

The updated `firestore.rules` file must be published to the Firebase project. Keeping the file in Git does not automatically update Firebase.

## 7. Environment Configuration

The application expects these variables in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

`.env.local` is ignored by Git and should remain uncommitted.

Firebase setup must include:

- Email/Password authentication enabled
- Firestore Database created
- `localhost` and production domains authorized
- Correct Firestore rules published
- Storage configured before adding file uploads

## 8. Known Limitations and Technical Risks

### 8.1 No real admin application

Recruiter approval is represented in the data model, but there is no admin dashboard or secure server-side approval operation.

The current development approval uses browser storage and is intentionally available only in development. This is suitable for testing, not production.

### 8.2 No secure backend for privileged operations

The app currently uses Firebase directly from the client. Public launch will need Firebase Admin SDK, server actions, route handlers, or Cloud Functions for:

- Recruiter approval
- Account suspension
- Moderation
- Notification creation
- Audit logs
- Fraud controls

### 8.3 Applicant count transaction completed

Application creation and the `applicantCount` increment now run in one Firestore transaction. The transaction also rejects duplicate applications, missing auditions, inactive auditions, and expired deadlines.

Remaining work is to add concurrent emulator integration tests and consider a trusted server-side aggregate if application volume grows substantially.

### 8.4 Application loading query improved

`getTalentApplications` now uses a Firestore collection-group query filtered by `talentId` and ordered by `createdAt`. It then loads only the parent auditions needed for the result set.

The matching index already exists in `firestore.indexes.json` and must be deployed. Pagination remains a future scaling improvement.

### 8.5 Automated coverage is improving

The repository includes nine dependency-free policy tests, Playwright browser
smoke tests, and a `npm run verify` command that runs lint, tests, and a
production build.

Credential-backed role journeys require local E2E account variables. Firebase
Emulator security-rule tests and automated accessibility tests remain.

### 8.6 Media is not implemented

Talent can upload profile photographs and portfolio images, and can add
external showreel links. Large video, audio reel, resume/CV, and self-tape file
uploads remain future work.

These are essential for a competitive casting platform.

### 8.7 Notification delivery is in-app only

The activity center now covers core workflow events. Email/SMS delivery,
notification preferences, scheduled reminders, and retention policies remain
future work.

### 8.8 Verification and trust are incomplete

Missing trust features include:

- Company document upload
- Recruiter identity verification
- Admin review queue
- Verified badge
- Report/block controls
- Audition moderation
- Scam detection

### 8.9 Product operations are incomplete

There is no:

- Analytics implementation
- Error monitoring
- Product-event tracking
- Customer-support workflow
- Data export/deletion workflow
- Backup/recovery procedure

### 8.10 Legal readiness is missing

Before public launch, prepare:

- Terms of Service
- Privacy Policy
- Community guidelines
- Casting safety policy
- Age policy and guardian consent
- Data deletion process
- Content ownership and media consent terms

## 9. Recommended Next Steps

## Phase 0: Stabilize the Current MVP

**Priority: immediate**

1. Pending deployment: publish and test the hardened Firestore security rules.
2. Pending commit: commit and push the latest tab-scoped authentication fixes.
3. Completed: replace the default README with project-specific setup instructions.
4. Pending: add Firestore Emulator tests for all role permissions.
5. Pending: add Playwright tests for:
   - Talent signup/profile/application
   - Recruiter signup/verification/audition
   - Recruiter applicant decision
   - Two simultaneous tab sessions
6. Completed: convert application submission to a transaction.
7. Completed: replace the audition-scan application query with a scalable query.
8. In progress: fix any remaining encoding artifacts in older UI strings.

**Definition of done:** all critical user journeys pass automatically and Firebase permissions are verified.

## Phase 1: Build the Trust and Admin Layer

**Priority: required before public recruiter acquisition**

1. Completed: Admin role backed by Firebase custom claims.
2. Completed: Admin dashboard and operational queues.
3. Deferred: recruiter document upload until Firebase Storage is enabled.
4. Completed: approve, reject, suspend, restore, and review-note actions.
5. Completed: privileged writes moved to Firebase Admin route handlers.
6. Completed: audition moderation and audit logs.
7. Completed: verified recruiter badges.
8. Pending: report audition and report user workflows.

**Definition of done:** code complete; operational verification requires Admin
SDK credentials, first-admin setup, deployed rules/indexes, and the manual
checklist in `TESTING.md`.

## Phase 2: Make Talent Profiles Market-Ready

**Priority: high product value**

1. Completed: profile image and headshot uploads.
2. Completed: multiple portfolio images.
3. Partially completed: external showreel links; uploaded video/audio remains.
4. Resume/CV upload.
5. Languages, skills, availability, and work authorization.
6. Physical attributes appropriate to the selected category.
7. Public talent profile page with shareable URL.
8. Completed: profile completeness score and verification-ready checklist.
9. Recruiter-facing profile preview.

**Definition of done:** a recruiter can make a meaningful initial casting decision without leaving Nata Connect.

## Phase 3: Improve Casting Workflow

1. Recruiter notes that remain private.
2. Custom pipeline stages.
3. Callback scheduling.
4. Self-tape requests and submissions.
5. Bulk shortlist/reject actions.
6. Applicant search, sorting, and filters.
7. Downloadable applicant lists.
8. Audition editing, closing, duplication, and archiving.
9. Deadline reminders.
10. Talent withdrawal from an application.

## Phase 4: Notifications and Communication

1. Completed: in-app notification center.
2. Email notifications for status changes.
3. Completed: recruiter alerts for new and withdrawn applications.
4. Partially completed: Talent application-status alerts; callbacks and
   deadlines remain.
5. Message templates.
6. Optional secure recruiter-talent messaging.
7. Notification preferences.

## Phase 5: Launch Readiness

1. Deploy to a production domain.
2. Configure production Firebase authorized domains.
3. Add Sentry or equivalent error monitoring.
4. Add privacy-friendly analytics.
5. Add rate limiting and abuse controls.
6. Add legal pages and consent.
7. Test accessibility and keyboard navigation.
8. Optimize images and page performance.
9. Create a support email and incident process.
10. Run a closed beta with real talent and recruiters.

## 10. Suggested 30-Day Execution Plan

### Week 1: Reliability

- Publish Firebase rules
- Add Firebase Emulator
- Add core authentication and permission tests
- Make application writes transactional
- Replace the expensive application query

### Week 2: Administration

- Add secure admin claims
- Build recruiter review queue
- Implement real approval/rejection
- Add recruiter verification badge

### Week 3: Portfolio

- Add profile/headshot upload
- Add showreel and resume fields
- Build recruiter-facing talent profile view
- Add profile completeness

### Week 4: Beta readiness

- Add status-change email notifications
- Add analytics and error tracking
- Add privacy, terms, and safety pages
- Deploy staging
- Recruit 5-10 talent users and 2-3 recruiters for a controlled test

## 11. Product Metrics to Track

### Marketplace health

- New Talent accounts per week
- New verified Recruiters per week
- Active auditions
- Applications per audition
- Percentage of auditions receiving applications
- Time to first application
- Time to recruiter review
- Shortlist rate

### Activation

- Signup-to-profile-completion rate
- Recruiter profile-to-first-audition rate
- Talent profile-to-first-application rate

### Retention

- Weekly active Talent
- Weekly active Recruiters
- Returning applicants
- Recruiters posting a second audition

### Trust and quality

- Recruiter verification approval rate
- Reported auditions
- Suspended accounts
- Rejected or incomplete profiles
- Application response rate

## 12. Definition of a Public Beta

Nata Connect should be considered ready for a public beta when:

- Authentication and role tests are automated.
- Firestore rules are deployed and emulator-tested.
- Recruiter approval is server-controlled.
- Talent can upload at least a headshot and one showreel.
- Recruiters can inspect a complete talent profile.
- Users receive status-change notifications.
- Error monitoring is active.
- Privacy, terms, and safety policies are published.
- A staging environment has completed real-user testing.
- No critical or high-severity bugs remain in the core application loop.

## 13. Current Build and Repository Notes

At the time of this document:

- The most recent pushed product commit is `4eeb12f`.
- The latest authentication/session fixes are present locally but not yet committed.
- `npm run lint` passes.
- `npm run build` passes.
- The application runs at `http://localhost:3000` during development.
- Firebase configuration remains local in `.env.local`.

## 14. Immediate Owner Checklist

- [ ] Publish `firestore.rules` to Firebase
- [ ] Test one Talent and one Recruiter account in separate tabs
- [ ] Commit and push the latest authentication fixes
- [ ] Replace the default `README.md`
- [ ] Choose a production domain
- [ ] Decide who can approve Recruiters
- [ ] Decide required recruiter verification documents
- [ ] Define the first closed-beta user group
- [x] Add initial application policy unit tests
- [ ] Add Firebase rule and browser end-to-end tests before expanding features
- [x] Add initial profile photo and portfolio media uploads

---

Nata Connect currently has a strong identity and a credible working marketplace loop. The best next move is not adding many unrelated features. It is strengthening trust, administration, testing, and portfolio depth so the existing workflow becomes safe and dependable for real casting activity.
## Phase 2E: Public and Shareable Talent Profiles

Talent can now explicitly publish a sanitized profile snapshot at
`/t/[slug]`. Publishing is disabled by default and is separate from the
existing signed-in recruiter profile visibility setting.

- Public documents live in `publicTalentProfiles/{slug}` and contain no email,
  phone, UID-facing account controls, storage paths, verification notes, admin
  notes, application history, or private media.
- Slugs are normalized, checked against reserved routes, and claimed in a
  server transaction.
- Only active portfolio items explicitly marked `public` enter the snapshot.
- Talent can preview, copy, refresh, rename, or disable the page.
- Admin can review public status and disable a page with an audit reason.
- Disabled and missing pages are not indexable.

## Phase 3A: Messaging and Recruiter-Talent Communication

Messaging is private and application-linked. Nata Connect does not provide
open direct messages.

- `conversations/{auditionId__talentId}` stores participants, role mapping,
  linked application context, latest-message metadata, and unread state.
- `conversations/{conversationId}/messages/{messageId}` stores sender identity,
  message content, read state, and moderation state.
- Conversation creation and sends revalidate application ownership, active
  accounts, and Recruiter approval.
- Obvious email addresses and phone numbers are blocked.
- Withdrawn applications cannot create or send new messages.
- Admin can review conversation metadata and block a thread with an audit
  reason. A fuller report workflow remains future work.
## Phase 3B: Reports, Abuse Handling, and Trust Moderation

Implemented:

- Private `reports/{reportId}` records with admin-only event subcollections
- Safe evidence snapshots that omit private contact, review, and admin fields
- Token-verified report API with role derivation and 24-hour duplicate handling
- Report controls for auditions, public profiles/media, conversations/messages
- Admin report queue with filters, evidence, event history, and quick actions
- Reuse of existing audition, media, profile, conversation, message, and user
  moderation states
- Generic notifications for report receipt, resolution, content removal,
  conversation blocking, and account suspension
- Firestore rule, policy, build, and Playwright coverage

Next:

- Operational moderation SLAs and escalation ownership
- Reporter-facing report history through a redacted server API, if beta users
  need it
- Moderation analytics and repeat-offender signals after sufficient beta data
- Appeals workflow and formal community standards before public launch

## Phase 3C: Production Beta Readiness and Deployment Hardening

Implemented:

- Safe Firebase public/Admin SDK environment validation
- Admin-only `/admin/beta-readiness` launch checklist
- Admin operations guide for verification, moderation, reports, conversations,
  suspensions, and escalation
- Lightweight safe server logging and JSON payload size helpers
- Emulator-only demo seed script with explicit confirmation
- Vercel/Firebase deployment, rollback, emergency disable, and production smoke
  documentation
- Unit and E2E tests for the new readiness surface and helper behavior

Known limitations:

- No paid monitoring, Redis, Cloud Armor, or third-party moderation service
  added.
- Rate limiting remains simple and in-code. Future production scale should add
  edge or server-side rate limits.
- Manual QA status must be updated by the launch operator after every release.

## Phase 4A: Vercel Production Deployment and Beta Launch Setup

Implemented:

- Dedicated Vercel deployment guide
- Required public and Admin SDK environment variable checklist
- Optional `NEXT_PUBLIC_APP_URL` support for production metadata and future
  share-link consistency
- Firebase Auth authorized-domain guidance
- Production smoke test checklist
- Final beta launch checklist
- Legal/policy placeholder section for wider launch readiness
- Rollback and emergency-action guidance

Next:

- Import the GitHub repo into Vercel.
- Add production environment variables.
- Deploy the latest `main` branch.
- Run the production smoke test checklist.
- Invite a small controlled beta cohort.
