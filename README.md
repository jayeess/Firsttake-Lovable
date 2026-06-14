# Nata Connect

Nata Connect (`నట కనెక్ట్`) is a casting marketplace for talent and verified
recruiters. Talent can build profiles, discover auditions, apply, and track
application status. Recruiters can create casting calls and review applicants.

The project is currently a stabilized MVP intended for local development and
controlled private testing. It is not ready for a public production launch.

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Firebase Authentication
- Cloud Firestore
- Firebase Storage for scoped Talent profile and portfolio images
- Firebase Admin SDK for trusted moderation

## Current Capabilities

- Email/password signup, login, logout, and password reset
- Separate Talent and Recruiter account roles
- Tab-scoped Firebase sessions for testing different accounts concurrently
- Talent and recruiter profile forms
- Talent profile completeness scoring and optional verification
- Talent profile photo, portfolio images, and external showreel links
- Opt-in shareable Talent profiles at `/t/[slug]` using sanitized public
  snapshots, safe slugs, selected public media, and verified badges
- Recruiter-facing featured media and portfolio previews
- Recruiter audition creation and applicant review
- Talent audition discovery, application submission, and status tracking
- Transactional duplicate-safe application submission
- Text-based recruiter verification and admin review
- Trusted custom-claim admin dashboard and moderation APIs
- Admin Talent verification queue with approve, reject, suspend, and restore
- Admin visibility and disable controls for published Talent pages
- User suspension, audition removal, and immutable audit history
- In-app notification bell, unread counts, and role-aware activity center
- Application-linked Talent and Recruiter messaging with unread state,
  contact-detail blocking, and message notifications
- Server-created alerts for applications, verification, moderation, and
  account status changes
- Admin conversation metadata review and audited conversation blocking
- Development-only account personas and form presets
- Firebase security rules, indexes, and Emulator Suite configuration

See [PRODUCT_STATUS_AND_ROADMAP.md](PRODUCT_STATUS_AND_ROADMAP.md) for the full
product inventory and roadmap.

## Local Setup

Requirements:

- Node.js 22 or newer
- npm
- A Firebase web project with Authentication, Firestore, and Storage enabled

Install dependencies:

```powershell
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_SHOW_TEST_CASES=true

# Server only. Never expose these with NEXT_PUBLIC.
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-...@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

In Firebase Authentication, enable Email/Password and add `localhost` to the
authorized domains. Create a Firestore database and Storage bucket for the same
Firebase project used by the environment variables.

Start development:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Quality Commands

```powershell
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:e2e:ui
npm run emulators:test
npm run verify
```

`npm run verify` runs lint, policy tests, and a production build.
`npm run test:e2e` runs public and route-gating Playwright smoke tests. Copy
`.env.e2e.example` to the ignored `.env.e2e.local` file to enable real Talent,
Recruiter, and Admin route tests.

Create three dedicated Email/Password accounts in Firebase Authentication. Give
their Firestore user documents the matching `TALENT` or `RECRUITER` role, and
grant only the dedicated Admin account the `{ admin: true }` custom claim. Do
not use personal accounts or production passwords.

## Firebase Deployment

Copy `.firebaserc.example` to `.firebaserc` and replace the placeholder with
the correct Firebase project ID. Install or run the Firebase CLI, authenticate,
and deploy the backend configuration:

```powershell
npx firebase-tools login
npx firebase-tools use your_project_id
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Talent image uploads use `talent-media/{uid}/profile/...` and
`talent-media/{uid}/portfolio/{mediaId}/...`. Verification document uploads
remain out of scope.

## First Administrator

Create a dedicated Firebase Email/Password account for administration. Generate
a Firebase service-account key, copy its project ID, client email, and private
key into server-only environment variables, then run:

```powershell
npm run admin:set -- admin@example.com
```

Sign out and sign in again so Firebase refreshes the ID token. The account will
then open `/admin`. Never commit a service-account JSON file; matching filenames
are ignored by `.gitignore`.

Admin routes verify the caller's Firebase ID token and `admin` custom claim in
Next.js route handlers. Client UI state alone cannot grant admin access.

Deploying `firestore.rules` is required for role enforcement. Deploying
`firestore.indexes.json` is required for the talent application tracker's
collection-group query. Index creation can take several minutes.

The app itself can be deployed to Vercel or another Next.js-compatible host.
Configure the same `NEXT_PUBLIC_FIREBASE_*` environment variables there and
add the deployed hostname to Firebase Authentication's authorized domains.

## Firebase Emulators

The repository includes Emulator Suite ports in `firebase.json`.

```powershell
npx firebase-tools emulators:start
npm run emulators:test
```

Rules tests use only the local Firestore emulator and the demo project ID. They
require Java 21 on `PATH`; they never connect to the production Firebase
project. Exact setup is documented in `TESTING.md`.

## Main Routes

- `/auth/signup`, `/auth/login`, `/auth/forgot-password`
- `/dashboard`
- `/auditions`
- `/applications`
- `/notifications`
- `/talent/profile`
- `/recruiter/profile`
- `/recruiter/auditions`
- `/recruiter/auditions/new`
- `/recruiter/auditions/[id]/applicants`
- `/recruiter/verification`
- `/admin`
- `/admin/verifications`
- `/admin/talents`
- `/admin/users`
- `/admin/auditions`
- `/admin/audit-logs`

## Development Test Data

Development builds include removable account personas and form presets. They
only fill forms; they do not bypass Firebase Authentication or security rules.
See [TESTING.md](TESTING.md) for accounts, workflows, and removal instructions.

## Known Launch Gaps

- Verification document upload remains disabled
- Large video uploads are intentionally replaced by external showreel links
- Email/SMS delivery, analytics, monitoring, and legal workflows are not
  production-ready
- Credential-backed browser tests require dedicated accounts in
  `.env.e2e.local`
- Firestore rule tests require Java 21 locally

## Production Safety

- Keep `.env.local` and service-account files uncommitted.
- Use `FIREBASE_ADMIN_*` only on the server; never rename them with
  `NEXT_PUBLIC_`.
- Admin routes verify Firebase ID tokens and the `admin` custom claim.
- Unexpected admin API errors are sanitized before reaching the browser.
- Run [BETA_QA_CHECKLIST.md](BETA_QA_CHECKLIST.md) before each beta release.

## Talent Trust Layer

Talent verification is optional and never blocks profile editing, audition
discovery, or applications. Saved profiles receive a completeness score based
on core identity details, professional context, links, and any media/skills
fields already present. At 70%, Talent can submit a review request.

Private review details live in `talentVerifications/{uid}`. Only the public
verification status is mirrored to `users/{uid}/talentProfiles/{uid}` so
recruiters can see a verified Talent badge without seeing identity notes or
rejection reasons.

See [BETA_READINESS_REPORT.md](BETA_READINESS_REPORT.md) before planning a beta
release.

## Notifications and Activity

Notifications live in the top-level `notifications/{notificationId}`
collection and are created only by authenticated server routes using Firebase
Admin. Clients can read only notifications addressed to their UID and can
change only read-state fields.

Application submit/withdraw/review actions, audition publishing, verification
submissions and decisions, audition moderation, and account suspension/restoration create
role-appropriate activity. The notification bell opens `/notifications`, where
users can filter unread items, open an item to mark it read, or mark all items
as read.

## Recruiter Applicant Pipeline

Audition owners review applicants at
`/recruiter/auditions/{auditionId}/applicants`. The pipeline supports Submitted,
Viewed, Under review, Shortlisted, Maybe, Rejected, Selected, and Withdrawn
states while continuing to display legacy application records.

Recruiters can search, filter, sort, rate, tag, and add private notes. Status,
notes, ratings, and tags are written through the authenticated application API,
which verifies the Firebase ID token and audition ownership. Shortlisted,
Rejected, and Selected decisions notify Talent; private notes, tags, and ratings
never create Talent notifications.

Application review fields include `recruiterStatus`, `recruiterNote`,
`recruiterRating`, `internalTags`, status timestamps, `statusUpdatedBy`, and
`lastRecruiterActionAt`. Deploy Phase 2C Firestore changes with:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project nata-connect-prod
```

## Search, Recommendations, and Saved Auditions

Talent discovery at `/auditions` supports role/company search, category,
experience, location, language, project type, compensation, work mode,
verified-recruiter, recency, deadline, and saved-only filters. Sorting includes
newest, deadline, text relevance, recently updated, and Recommended for you.

Recommendations use a local rule-based score from Talent category, experience,
location, skills, and languages. The active/visible audition set is queried
from Firestore first, then flexible filters and scoring run locally for beta
scale. No external search provider or new composite index is required.

Bookmarks use:

```text
users/{uid}/savedAuditions/{auditionId}
```

Records contain `auditionId`, `savedAt`, `titleSnapshot`, `recruiterId`, and
`deadlineSnapshot`. Save and remove actions use `/api/auditions/save`, which
verifies the Firebase ID token and derives the owner UID from that token.
