# Nata Connect

Nata Connect (`నట కనెక్ట్`) is a casting marketplace for talent and verified
recruiters. Talent can build profiles, discover auditions, apply, and track
application status. Recruiters can create casting calls and review applicants.

The project is ready for a controlled private beta. Core casting workflows,
role-based access, trust and moderation systems, and end-to-end product flows
have been QA-tested. It is not yet ready for a wide public launch — see
[BETA_LAUNCH_READINESS_CHECKLIST.md](BETA_LAUNCH_READINESS_CHECKLIST.md) for
the operator checklist and known limitations.

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Firebase Authentication
- Cloud Firestore
- Firebase Storage for scoped Talent profile media and Recruiter verification evidence
- Firebase Admin SDK for trusted moderation

## Current Capabilities

- Email/password signup, login, logout, password reset, and real Firebase
  email verification send/refresh controls
- Separate Talent and Recruiter account roles
- Tab-scoped Firebase sessions for testing different accounts concurrently
- Talent and recruiter profile forms
- Talent profile completeness scoring and optional verification
- Talent Passport and explainable Role Readiness signals for auditions
- Talent Opportunity Radar and Career Command Center for profile growth,
  safer opportunity review, application focus, and next actions
- Talent Share Kit and Public Casting Passport for privacy-safe external
  sharing
- Talent profile photo, portfolio images, and external showreel links
- Opt-in shareable Talent profiles at `/t/[slug]` using sanitized public
  snapshots, safe slugs, selected public media, and verified badges
- Recruiter-facing featured media and portfolio previews
- Recruiter audition creation and applicant review
- Recruiter Casting Slate and Decision Room for stage grouping, self-tape
  review cues, private-note readiness, and human-led next actions
- Casting brief quality and safety cues for Recruiter, Talent, and Admin views
- Recruiter Trust Passport and source transparency cues for audition cards,
  audition detail, recruiter readiness, and Admin review
- Recruiter-facing applicant role fit signals for guidance only
- Talent audition discovery, application submission, and status tracking
- Self-tape requests on auditions with Talent link submission and Recruiter
  review status
- Transactional duplicate-safe application submission
- Recruiter verification with private evidence uploads and admin review
- Trusted custom-claim admin dashboard and moderation APIs
- Admin Talent verification queue with approve, reject, suspend, and restore
- Admin visibility and disable controls for published Talent pages
- User suspension, audition removal, and immutable audit history
- In-app notification bell, unread counts, and role-aware activity center
- Server-side email notification foundation with safe no-op mode until a
  provider is configured
- Application-linked Talent and Recruiter messaging with unread state,
  contact-detail blocking, and message notifications
- Server-created alerts for applications, verification, moderation, and
  account status changes
- Admin conversation metadata review and audited conversation blocking
- Development-only account personas and form presets
- Firebase security rules, indexes, and Emulator Suite configuration
- PWA manifest and installability metadata for mobile testing

See [SELF_TAPE_SUBMISSIONS.md](SELF_TAPE_SUBMISSIONS.md) for the current
self-tape workflow and upload roadmap. See
[EMAIL_NOTIFICATIONS.md](EMAIL_NOTIFICATIONS.md) for email provider/no-op
behavior and [PWA_READINESS.md](PWA_READINESS.md) for installability notes. See
[PRODUCT_STATUS_AND_ROADMAP.md](PRODUCT_STATUS_AND_ROADMAP.md) for the full
product inventory and roadmap. See
[RECRUITER_TRUST_PASSPORT_SOURCE_TRANSPARENCY_REPORT.md](RECRUITER_TRUST_PASSPORT_SOURCE_TRANSPARENCY_REPORT.md)
for the recruiter source transparency pass and
[TALENT_SHARE_KIT_PUBLIC_CASTING_PASSPORT_REPORT.md](TALENT_SHARE_KIT_PUBLIC_CASTING_PASSPORT_REPORT.md)
for the public Talent sharing pass. See
[RECRUITER_CASTING_SLATE_DECISION_ROOM_REPORT.md](RECRUITER_CASTING_SLATE_DECISION_ROOM_REPORT.md)
for the recruiter decision-room pass and
[TALENT_OPPORTUNITY_RADAR_CAREER_COMMAND_CENTER_REPORT.md](TALENT_OPPORTUNITY_RADAR_CAREER_COMMAND_CENTER_REPORT.md)
for the Talent command-center pass.

## Founder Demo and Pitch Pack

- [FOUNDER_DEMO_SCRIPT.md](FOUNDER_DEMO_SCRIPT.md) - 30-second, 2-minute, and
  5-minute founder demo scripts.
- [LIVE_DEMO_ROUTE_ORDER.md](LIVE_DEMO_ROUTE_ORDER.md) - route-by-route live
  demo sequence for public, Talent, Recruiter, and Admin flows.
- [SCREENSHOT_CHECKLIST.md](SCREENSHOT_CHECKLIST.md) - pitch deck and demo
  screenshot capture plan.
- [BETA_ONBOARDING_PLAYBOOK.md](BETA_ONBOARDING_PLAYBOOK.md) - small
  founder-led beta onboarding and operating routine.
- [PITCH_TALKING_POINTS.md](PITCH_TALKING_POINTS.md) - audience-specific
  talking points for Talent, Recruiters, mentors, incubators, investors, and
  parents.
- [PITCH_DECK_OUTLINE.md](PITCH_DECK_OUTLINE.md) - 10-slide founder pitch deck
  structure.
- [PITCH_DECK_SLIDE_COPY.md](PITCH_DECK_SLIDE_COPY.md) - ready-to-copy slide
  titles, subtitles, bullets, and footer notes.
- [PITCH_DECK_SPEAKER_NOTES.md](PITCH_DECK_SPEAKER_NOTES.md) - 3-minute,
  5-minute, and 8-minute spoken pitch notes.
- [PITCH_DECK_VISUAL_CHECKLIST.md](PITCH_DECK_VISUAL_CHECKLIST.md) - screenshot
  and visual planning checklist for deck creation.

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

# Optional email provider. Missing values keep email in no-op mode.
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_key
EMAIL_FROM="Nata Connect <notifications@example.com>"
EMAIL_REPLY_TO=support@example.com
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
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

Talent image uploads use `talent-media/{uid}/profile/...` and
`talent-media/{uid}/portfolio/{mediaId}/...`. Recruiter verification evidence
uses `recruiter-verification-evidence/{uid}/{evidenceId}/...` and is readable
only by the owning Recruiter and Admin users.

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

- Direct self-tape video upload remains intentionally replaced by external
  links
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
## Reports and Trust Moderation

Phase 3B adds private abuse reporting without exposing reporters to reported
users. Authenticated users can report auditions, public Talent profiles and
media, application-linked messages/conversations, and supported user profiles.

Reports are created through `POST /api/reports/create`. The server verifies the
Firebase ID token, derives the reporter identity and role, validates the target,
stores only a minimal sanitized evidence snapshot, suppresses recent duplicate
reports, writes an audit log, and sends generic notifications.

Admins review reports at `/admin/reports`. Supported outcomes include review,
dismissal, resolution without action, audition removal/restoration, media
hiding, public profile disabling, conversation blocking, message hiding, and
user suspension/restoration. Reporter identity and `adminOnlyNotes` remain
admin-only.

Firestore schema:

```text
reports/{reportId}
reports/{reportId}/events/{eventId}
```

Deploy the Phase 3B Firestore rules and index with:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project nata-connect-prod
```

Storage rules did not change in Phase 3B.

## Production Beta Readiness

Phase 3C adds a launch-readiness surface at `/admin/beta-readiness`. It checks
safe configuration signals, confirms the Admin SDK can reach Firestore, and
keeps admin operations guidance inside the protected workspace.

Required Vercel environment variables:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

Optional production URL:

```text
NEXT_PUBLIC_APP_URL
```

Use Vercel Project Settings -> Environment Variables. Paste the private key as a
single value with escaped `\n` line breaks if needed. Never commit `.env.local`,
`.env.e2e.local`, service account JSON, Firebase private keys, or debug logs.
See `VERCEL_DEPLOYMENT.md` for the full production deployment, smoke test,
rollback, and beta launch checklist.

Production deploy checklist:

```powershell
npm run lint
npm test
npm run build
npm run emulators:test
npm run test:e2e
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project nata-connect-prod
```

Emergency admin actions are available through the admin workspace: disable a
public profile, suspend a user, remove an audition, block a conversation, and
hide media. Keep public communication generic and preserve audit logs.

Optional local demo seed:

```powershell
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
npm run demo:seed -- --confirm-demo-data
```

The seed script refuses to run unless it detects the Firestore emulator.
