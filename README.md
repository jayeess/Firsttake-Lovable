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
- Firebase Storage SDK present, with uploads intentionally disabled
- Firebase Admin SDK for trusted moderation

## Current Capabilities

- Email/password signup, login, logout, and password reset
- Separate Talent and Recruiter account roles
- Tab-scoped Firebase sessions for testing different accounts concurrently
- Talent and recruiter profile forms
- Recruiter audition creation and applicant review
- Talent audition discovery, application submission, and status tracking
- Transactional duplicate-safe application submission
- Text-based recruiter verification and admin review
- Trusted custom-claim admin dashboard and moderation APIs
- User suspension, audition removal, and immutable audit history
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
npm run verify
```

`npm run verify` runs lint, policy tests, and a production build.
`npm run test:e2e` runs public and route-gating Playwright smoke tests. Optional
credential-backed role tests use the `E2E_*` variables documented in
`.env.example`.

## Firebase Deployment

Copy `.firebaserc.example` to `.firebaserc` and replace the placeholder with
the correct Firebase project ID. Install or run the Firebase CLI, authenticate,
and deploy the backend configuration:

```powershell
npx firebase-tools login
npx firebase-tools use your_project_id
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Storage deployment and upload features remain out of scope until billing is
available.

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
```

The application does not automatically connect to emulators yet. Exact setup
and the required security scenarios are documented in `TESTING.md`.

## Main Routes

- `/auth/signup`, `/auth/login`, `/auth/forgot-password`
- `/dashboard`
- `/auditions`
- `/applications`
- `/talent/profile`
- `/recruiter/profile`
- `/recruiter/auditions`
- `/recruiter/auditions/new`
- `/recruiter/auditions/[id]/applicants`
- `/recruiter/verification`
- `/admin`
- `/admin/verifications`
- `/admin/users`
- `/admin/auditions`
- `/admin/audit-logs`

## Development Test Data

Development builds include removable account personas and form presets. They
only fill forms; they do not bypass Firebase Authentication or security rules.
See [TESTING.md](TESTING.md) for accounts, workflows, and removal instructions.

## Known Launch Gaps

- Verification document upload remains disabled until Storage is enabled
- Profile and portfolio media upload UI is incomplete
- Notifications, analytics, monitoring, and legal workflows are not production-ready
- Browser smoke coverage exists; credential-backed role journeys need local
  E2E account variables
- Firebase Emulator security-rule tests are still needed

## Production Safety

- Keep `.env.local` and service-account files uncommitted.
- Use `FIREBASE_ADMIN_*` only on the server; never rename them with
  `NEXT_PUBLIC_`.
- Admin routes verify Firebase ID tokens and the `admin` custom claim.
- Unexpected admin API errors are sanitized before reaching the browser.
- Run [BETA_QA_CHECKLIST.md](BETA_QA_CHECKLIST.md) before each beta release.

See [BETA_READINESS_REPORT.md](BETA_READINESS_REPORT.md) before planning a beta
release.
