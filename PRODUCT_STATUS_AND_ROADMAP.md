# Nata Connect Product Status and Roadmap

**Telugu name:** నట కనెక్ట్  
**Document date:** June 10, 2026  
**Repository:** `jayeess/Firsttake-Lovable`  
**Current stage:** Stabilized functional MVP / controlled private testing

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
| Automated testing | Missing | Primary launch risk |
| Admin operations | Missing | Required before public recruiter onboarding |
| Notifications | Missing | Important for retention and workflow completion |
| Media portfolio | Not implemented | Required for a serious casting product |
| Deployment operations | Partial | Build passes, production process is undocumented |

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
- Recruiter rejection feedback display

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
- Firebase Storage SDK is configured, but portfolio upload workflows are not yet connected

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

Contains the talent's professional information and portfolio links.

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

### 8.5 Automated coverage is still limited

The repository now includes five dependency-free unit tests for application eligibility and a `npm run verify` command that runs lint, tests, and a production build.

There are still no Firebase Emulator security-rule tests, browser end-to-end tests, or automated accessibility tests. This remains a major engineering quality gap.

### 8.6 Media is not implemented

The Firebase Storage service exists, but talent cannot upload:

- Profile photographs
- Headshots
- Showreels
- Audio reels
- Resume/CV
- Self-tapes

These are essential for a competitive casting platform.

### 8.7 Notifications and communication are missing

The data structure has a notifications path, but there is no complete notification UI or delivery system.

Users currently need to manually revisit the application to see changes.

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

1. Create an Admin role backed by Firebase custom claims.
2. Build an admin dashboard.
3. Add recruiter document upload.
4. Add approve, reject, suspend, and review-note actions.
5. Move approval writes to a secure server environment.
6. Add moderation and audit logs.
7. Add verified recruiter badges.
8. Add report audition and report user workflows.

**Definition of done:** no recruiter can self-approve, and all privileged actions are auditable.

## Phase 2: Make Talent Profiles Market-Ready

**Priority: high product value**

1. Profile image and headshot uploads.
2. Multiple portfolio images.
3. Showreel and audio reel support.
4. Resume/CV upload.
5. Languages, skills, availability, and work authorization.
6. Physical attributes appropriate to the selected category.
7. Public talent profile page with shareable URL.
8. Profile completeness score.
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

1. In-app notification center.
2. Email notifications for status changes.
3. Recruiter alerts for new applications.
4. Talent alerts for callbacks and deadlines.
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
- [ ] Prioritize portfolio media uploads

---

Nata Connect currently has a strong identity and a credible working marketplace loop. The best next move is not adding many unrelated features. It is strengthening trust, administration, testing, and portfolio depth so the existing workflow becomes safe and dependable for real casting activity.
