# Nata Connect development test cases

The login and signup screens display a small test-case panel only while running
`npm run dev`.

Talent profile, recruiter profile, and audition creation forms also include
mock-data presets. The presets fill fields only; they do not save or publish
anything automatically.

## Account personas

All valid personas use the password `FirstTake1!`.

- Actor: `talent.demo@example.com`
- Dancer: `dancer.demo@example.com`
- Voice artist: `voice.demo@example.com`
- Production studio: `recruiter.demo@example.com`
- Casting agency: `agency.demo@example.com`
- Theatre company: `theatre.demo@example.com`

Validation cases include a wrong password, unknown account, weak password, and
password mismatch.

Form presets include:

- Talent: screen actor, commercial dancer, voice artist, fashion model, news
  anchor, and new performer
- Recruiter: production studio, casting agency, theatre company, advertising
  agency, and audio studio
- Auditions: streaming drama, fashion campaign, voice campaign, dance film,
  live presenter, and student short film

Create the Talent and Recruiter users once from the Sign Up page. After that,
use the matching preset on the Login page.

## Testing two accounts at once

Authentication is tab-scoped. Open two separate browser windows or tabs, visit
the Login page in each, and sign in with different personas.

Older builds used browser-wide persistence. After updating, log out once in
each open Nata Connect window, then log in again. From that point, each tab
keeps its own Firebase session.

## Email verification

Dashboard and profile pages show an email verification trust prompt when the
current Firebase user is unverified. Use **Send verification email** to trigger
Firebase Auth, open the email link, then return to the app. The prompt checks
status quietly on mount, tab focus, and visibility changes, and briefly polls
after sending an email. Users can also choose **Check verification status**.

Firebase email links continue to `/auth/email-verified`. In production, set:

```env
NEXT_PUBLIC_APP_URL=https://firsttake-lovable.vercel.app
```

The refresh reloads the Firebase user, forces a fresh ID token, and syncs
`emailVerified: true` to the signed-in user document through a secure server
route. During beta, remind testers to check Spam or Promotions before resending
because Firebase can throttle repeated verification emails.

## Disable or remove

To hide the panel locally without changing code, add this to `.env.local`:

```env
NEXT_PUBLIC_SHOW_TEST_CASES=false
```

The panel is always excluded from production because it also checks
`NODE_ENV === 'development'`.

To remove it permanently, delete `components/dev-test-cases.tsx` and
`components/dev-form-presets.tsx`, then remove their imports from the forms.
They do not alter Firebase rules or production authentication.

## Automated checks

Run the full local verification suite:

```powershell
npm run verify
```

Individual commands:

```powershell
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:e2e:ui
npm run emulators:test
```

The dependency-free Node test suite currently covers application eligibility:

- Active audition before its deadline can accept an application
- Duplicate applications are rejected
- Draft, closed, and cancelled auditions are rejected
- Expired auditions are rejected
- Missing auditions are rejected
- Rejected recruiter verification can be resubmitted
- Suspended or unapproved recruiters cannot post
- Removed auditions are hidden from discovery
- Non-admin users fail the privileged-action policy
- Talent completeness and minimum verification eligibility
- Rejected Talent verification resubmission
- Admin-only Talent verification transitions
- Verified Talent badge policy
- Public Talent slug normalization, reserved names, and safe snapshot fields
- Public portfolio filtering by visibility and moderation state
- Notification action URL validation and deterministic deduplication
- Talent/Recruiter application notification formatting
- Messaging eligibility, deterministic conversation IDs, contact-detail
  detection, message validation, unread state, and message notifications
- Self-tape status defaults, link validation, instruction sanitization, and
  badge-tone policy
- Email template generation, safe no-op provider behavior, and notification
  preference policy

These tests validate the shared policy used by the transactional Firestore
submission path. Playwright additionally covers public pages and signed-out
route gating.

## Public Talent profile checks

1. Save a Talent profile with a name, location, and bio.
2. Mark selected portfolio items as `Public profile`.
3. Enable the shareable page in Talent profile settings and choose a slug.
4. Open `/t/<slug>` in a signed-out browser and verify only selected public
   fields and active public media appear.
5. Change the slug and confirm the old URL stops resolving.
6. Disable the page and confirm the URL returns not found.
7. As an Admin, disable an enabled page from `/admin/talents` and verify the
   audit event and Talent notification.

## Messaging checks

1. Apply to an audition as Talent.
2. Open its applicant pipeline as the approved audition owner.
3. Select `Message Talent` and send a casting-related message.
4. Confirm Talent sees an unread label, notification, and the same thread.
5. Reply as Talent and verify Recruiter unread state.
6. Confirm email addresses and phone numbers are blocked.
7. Confirm unrelated accounts cannot access the conversation.
8. Withdraw the application and confirm messaging becomes unavailable.
9. As Admin, block the conversation from `/admin/messages` with a reason.

## Playwright E2E

Install the Chromium browser once:

```powershell
npx playwright install chromium
```

Run the smoke suite:

```powershell
npm run test:e2e
```

Public and signed-out gating tests require no private credentials.

1. Copy `.env.e2e.example` to `.env.e2e.local`.
2. Create three dedicated Firebase Authentication Email/Password users.
3. Create `users/{uid}` documents for Talent and Recruiter with the matching
   role and `accountStatus: ACTIVE`.
4. Run `npm run admin:set -- e2e.admin@example.com` for the dedicated Admin.
5. Put only those private test credentials in `.env.e2e.local`.

Process environment variables override `.env.e2e.local`. Missing credential
pairs skip only their related tests with a clear reason. The file is ignored by
Git and must never contain personal or shared production credentials.

The credential-backed suite is read-only: it logs in and opens role routes.
Verification approval/rejection remains manual because it changes persisted
trust state. Use only data prefixed `E2E_TEST_`, then delete its audition,
application, verification, and audit-log records from the Firebase Console
after the run.

## Critical manual workflow

1. Create one Talent account and one Recruiter account using different tabs.
2. Complete both profiles.
3. As Recruiter, publish an active audition with a future deadline.
4. As Talent, open the audition and apply once.
5. Confirm a second application attempt is rejected.
6. Confirm the audition applicant count increases once.
7. As Recruiter, open the audition's applicant list.
8. Move the application through Viewed, Shortlisted, and Rejected.
9. As Talent, confirm each current status appears in My Applications.
10. Confirm Talent cannot access recruiter creation/review actions.
11. Confirm Recruiter cannot submit a Talent application.

## Self-tape submission checks

1. As Recruiter, publish a future-dated audition with self-tape enabled.
2. Add clear instructions, mark it required, and keep submission type as link.
3. As Talent, open the audition and confirm the self-tape prompt appears before
   applying.
4. Apply, then open `/applications` and submit an unlisted/private video link.
5. Confirm the application card changes from Required missing to Submitted.
6. Replace the link, then remove it, and confirm the status returns to Required
   missing.
7. Submit again and confirm Talent receives a notification.
8. As the owning Recruiter, open the applicant pipeline, open the self-tape link,
   and mark it reviewed.
9. Confirm Talent sees the Reviewed state and a review notification.
10. Confirm another Talent or another Recruiter cannot access or update the
    self-tape through the UI.

## Email and PWA readiness checks

1. Leave email provider env variables unset and trigger a supported in-app
   notification.
2. Confirm the original action succeeds and the in-app notification appears.
3. Confirm server logs show safe email no-op delivery without recipient or
   secret values.
4. Open Talent and Recruiter profile pages and save email preferences.
5. Confirm safety/account-risk preference copy remains visible.
6. Open `/manifest.webmanifest` and confirm Nata Connect app metadata appears.
7. On mobile Chrome or Safari, confirm the app can be added to the home screen.
12. Log out in one tab and confirm the other tab remains signed in.

Also test an expired audition and a closed audition. Neither should accept a
new application.

## Firebase deployment checks

After changing rules or indexes:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Wait for Firestore indexes to finish building, then repeat the critical
workflow. The collection-group index on `applications.talentId + createdAt` is
required by My Applications. Notification indexes on
`recipientId + createdAt` and `recipientId + read` support the activity center
and bulk read-state updates.

## Firestore Emulator Rules Tests

Install a Java 21 JDK and confirm `java -version` works. Dependencies are
already in `package.json`. Then run:

```powershell
npm run emulators:test
```

This starts a local Firestore emulator for project `demo-nata-connect`, runs
`tests/firestore.rules.mts`, and shuts the emulator down. It tests signed-out
writes, visible/removed audition reads, Talent applications, recruiter
ownership, recruiter self-approval, suspended recruiters, audit logs, admin
queue reads, and application-owner permissions.

The suite seeds data only with `withSecurityRulesDisabled` inside the emulator.
It does not use `.env.local`, Admin credentials, or production Firebase data.

Notification rule coverage verifies that:

- A user can read only notifications addressed to their own UID
- A user can update only `read` and `readAt`
- A user cannot forge notification content or create a notification
- An Admin can read notifications addressed to that Admin UID, but not another
  user's notification

## Notification workflow

After deploying rules and indexes:

1. Submit an application as Talent.
2. Confirm Talent sees a submission confirmation in `/notifications`.
3. Confirm the audition owner sees a new-application alert and its action opens
   the applicant pipeline.
4. Mark the application Viewed, Shortlisted, and Rejected as Recruiter.
5. Confirm each new Talent activity item opens `/applications`.
6. Withdraw a non-rejected application and confirm both roles receive the
   correct update.
7. Submit Talent and Recruiter verification requests and confirm the submitting
   user and each Admin receive their appropriate notification.
8. Mark one item read, then use **Mark all as read** and verify the bell count
   reaches zero.
9. Confirm a second signed-in account cannot read or modify the first account's
   notifications.

## Phase 1 manual verification

Before testing admin routes, configure the three `FIREBASE_ADMIN_*` environment
variables and run:

```powershell
npm run admin:set -- admin@example.com
```

Then verify:

1. Talent and Recruiter accounts see an unauthorized state at `/admin`.
2. The claimed Admin account can enter all five `/admin` routes.
3. Recruiter submits the text verification form.
4. Admin sees the pending request and approves it with a note.
5. Recruiter refreshes and sees approved status and the verified badge.
6. Approved Recruiter can publish an audition.
7. Admin suspends the Recruiter and posting becomes unavailable.
8. Admin restores the Recruiter.
9. Admin removes an audition and it disappears from Talent discovery.
10. Admin restores the audition.
11. Every privileged action appears in `/admin/audit-logs`.

## Talent trust manual verification

1. Log in as Talent and open `/talent/profile`.
2. Confirm the completeness percentage reacts to profile edits.
3. Confirm missing fields and recommended actions are clear.
4. Confirm verification cannot be submitted below 70%.
5. Save a profile at or above 70% and submit it for review.
6. Confirm the status becomes `pending` without blocking auditions/applications.
7. Log in as Admin and open `/admin/talents`.
8. Reject with a reason, then confirm Talent can fix the profile and resubmit.
9. Verify the Talent and confirm the badge appears in the recruiter applicant
   pipeline.
10. Suspend and restore the Talent, confirming both audit-log events appear.

Talent review test records should use an `E2E_TEST_` name and should be removed
from `talentVerifications`, the Talent profile, and `auditLogs` after destructive
manual testing.

Document upload must remain disabled while Firebase Storage billing is
unavailable.

## Talent media manual verification

1. Save a Talent profile, then upload a JPEG, PNG, or WebP profile photo under
   5 MB.
2. Confirm progress reaches 100%, the photo appears, and completeness rises.
3. Upload a portfolio image under 10 MB and add an external http/https
   showreel.
4. Edit title/description, change visibility, and set a featured item.
5. Confirm unsupported MIME types and oversized files show clear errors.
6. Apply to an audition and confirm the owning approved Recruiter sees only
   active, recruiter/public media.
7. Confirm private media is absent from recruiter review.
8. As Admin, hide/remove a media item and confirm the audit log and Talent
   notification.
9. Restore the media and confirm recruiter visibility returns.
10. Remove media as Talent and confirm its Storage object and metadata are
    removed.

Storage paths:

```text
talent-media/{uid}/profile/{generatedName}
talent-media/{uid}/portfolio/{mediaId}/{generatedName}
```

Deploy Phase 2B rules with:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

## Phase 2C applicant pipeline verification

1. Apply to an active audition from a Talent account.
2. Open the audition applicant pipeline as its owning Recruiter.
3. Confirm status counts, search, filters, and sorting render.
4. Move the application through Viewed, Under review, Maybe, Shortlisted, and
   Selected.
5. Confirm status timestamps and last action information update.
6. Add a private note, one or more tags, and a 1-5 rating.
7. Refresh and confirm private review data persists.
8. Confirm Shortlisted, Rejected, and Selected create Talent notifications.
9. Confirm Viewed, Under review, Maybe, note, tag, and rating changes do not
   create notification spam.
10. Withdraw a separate application as Talent and confirm it becomes
    read-only in the recruiter pipeline.
11. Confirm another Recruiter cannot read or update the application.
12. Confirm Talent cannot write recruiter status, notes, tags, or ratings.

Optional credential-backed Playwright coverage uses
`E2E_RECRUITER_AUDITION_ID` with the existing Recruiter credentials.

Deploy Phase 2C Firestore changes with:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project nata-connect-prod
```

## Phase 2D discovery verification

1. Log in as Talent and open `/auditions`.
2. Search by title, company, and location.
3. Exercise category, experience, language, project type, compensation, work
   mode, verified, recent, and deadline filters.
4. Confirm active-filter chips clear individually and **Clear all** resets them.
5. Compare newest, deadline, relevance, updated, and recommendation sorting.
6. Confirm Recommended for you prioritizes category/profile matches.
7. Save from a card and detail page, then confirm **Saved only** returns it.
8. Remove the bookmark and confirm it disappears from Saved only.
9. Confirm draft, closed, expired, and removed auditions are absent for Talent.
10. Confirm a Recruiter cannot read another user's saved audition records.
11. In the applicant pipeline, test tag, category, location, language,
    verified-first, and media-first controls.
12. Confirm notification navigation and all Phase 2C status actions still work.

Optional browser fixtures use `E2E_TALENT_AUDITION_ID` and
`E2E_RECRUITER_AUDITION_ID`.

## Security-test limitation

The rules suite exercises local Firestore rules, not deployed production rules
or Firebase Admin route handlers. After deployment, complete the manual Admin
workflow above in the controlled beta project.
## Phase 3B Reports and Moderation Checks

1. Sign in as a Talent and open an active audition.
2. Open `Report`, select a reason, and confirm `Other` requires details.
3. Submit a report and confirm the private success state and
   `report_received` notification.
4. Submit the same target again within 24 hours and confirm the existing report
   is returned rather than a new report being created.
5. Report a public Talent profile or public media item from `/t/[slug]`.
6. In an application-linked conversation, report the thread and a message from
   the other participant.
7. Sign in as Admin and open `/admin/reports`.
8. Filter by status, target type, reason, and priority.
9. Start review, inspect the sanitized evidence snapshot, then dismiss or
   resolve a report.
10. Exercise the matching moderation action and verify the target state,
    generic owner/reporter notifications, audit log, and report event.
11. Confirm the reported user cannot read the report document or reporter ID.
12. Confirm message evidence redacts email addresses and phone numbers.

Automated Phase 3B coverage:

- `tests/report-policy.test.mts` validates reason/target checks, evidence
  sanitization, priority, duplicate handling, notifications, and resolution.
- `tests/firestore.rules.mts` verifies safe report creation, reporter spoof
  denial, admin-field denial, report privacy, admin updates, and event control.
- Playwright verifies `/admin/reports` route protection and conditionally checks
  report modal validation when Talent E2E credentials are configured.

Run:

```powershell
npm run lint
npm test
npm run build
npm run emulators:test
npm run test:e2e
git diff --check
```

## Phase 3C Production Beta Readiness Checks

1. Admin opens `/admin/beta-readiness`.
2. Confirm Firebase project, Admin SDK, public env, admin user, feature, index,
   QA, and deployment cards render.
3. Temporarily remove one local env variable in a separate shell and confirm the
   readiness response shows only the missing variable name, never a value.
4. Review the embedded operations guide for recruiter, Talent, audition, media,
   report, conversation, suspension, and escalation workflows.
5. Confirm signed-out users are redirected from `/admin/beta-readiness` to
   `/auth/login`.
6. Confirm Talent and Recruiter accounts see the normal administrator access
   denied screen.
7. Run `npm run demo:seed -- --confirm-demo-data` only against the Firestore
   emulator and confirm it refuses to run without `FIRESTORE_EMULATOR_HOST`.
8. Production smoke test after deploy: signup/login, Talent profile save,
   recruiter audition post, application submit, applicant review, media upload,
   public profile load, message send, report submit, admin report resolve.

## Phase 4A Vercel Production Smoke Flow

Run this after the first Vercel production deployment:

1. Open the Vercel production URL.
2. Confirm the home page loads without a console application error.
3. Sign up or log in as Talent.
4. Open Talent profile and confirm save works.
5. Upload or add Talent media.
6. Enable or open a public Talent profile at `/t/[slug]`.
7. Log in as Recruiter.
8. Open recruiter verification.
9. Post a sample audition.
10. Log in as Talent and apply to that audition.
11. Log in as Recruiter and review the applicant pipeline.
12. Start or open messaging from the application.
13. Confirm notifications load and can be marked read.
14. Submit a report from an audition or conversation.
15. Log in as Admin and resolve the report.
16. Confirm moderation actions work: remove audition, hide media, block
    conversation, suspend/restore test user.
17. Log out and confirm protected routes redirect to `/auth/login`.
18. Do a mobile-width pass and a desktop Chrome/Edge pass.
