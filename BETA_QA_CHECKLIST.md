# Nata Connect Private Beta QA Checklist

Use this checklist before each private-beta release. Record the date, tester,
browser, Firebase project, commit, and result for every run.

## Release Record

- Date:
- Tester:
- Commit:
- Environment:
- Firebase project:
- Browser/device:
- Overall result: PASS / FAIL / BLOCKED

## Account Setup

- [ ] Talent test account exists and has a `TALENT` user document.
- [ ] Recruiter test account exists and has a `RECRUITER` user document.
- [ ] Admin account exists and has the Firebase custom claim `{ admin: true }`.
- [ ] Test passwords exist only in local/host environment variables.
- [ ] `.env.e2e.local` contains only dedicated test accounts and is ignored.
- [ ] Test-case panels are disabled outside development.

## Firebase Deployment

- [ ] Web and Admin environment variables target the same Firebase project.
- [ ] Email/Password Authentication is enabled.
- [ ] Localhost and the beta hostname are authorized domains.
- [ ] Firestore rules are deployed.

## Phase 3A Messaging

- [ ] Signed-out users are redirected from `/messages` and thread routes.
- [ ] Talent can open messaging only for their own application.
- [ ] Approved audition owner can open the applicant conversation.
- [ ] Unrelated accounts cannot read or write another conversation.
- [ ] Email addresses and phone numbers are rejected.
- [ ] Recipient receives a new-message notification linked to the thread.
- [ ] Opening a thread clears unread state.
- [ ] Withdrawn applications cannot create or send messages.
- [ ] Admin can block a conversation only with a reason.
- [ ] Existing applications, notifications, public profiles, and route
  protection continue to work.
- [ ] Firestore indexes are deployed and finished building.
- [ ] Talent image Storage rules are deployed; verification documents remain disabled.

## Authentication

- [ ] Signup creates the correct role document.
- [ ] Login opens the correct Talent, Recruiter, or Admin workspace.
- [ ] Password reset sends without exposing whether unrelated accounts exist.
- [ ] Logout clears only the current tab session.
- [ ] Two tabs can hold different accounts.
- [ ] Suspended accounts see a clear restricted state.

## Talent

- [ ] Talent profile can be created and edited.
- [ ] Completeness percentage and missing actions update correctly.
- [ ] Verification submission appears only at 70% or higher.
- [ ] Pending/rejected/verified/suspended states are clear.
- [ ] Rejected Talent can fix the profile and resubmit.
- [ ] Verification does not block discovery or applications.
- [ ] Profile photo upload/change/remove works for JPEG, PNG, and WebP.
- [ ] Portfolio image and external showreel management works.
- [ ] Oversized and unsupported media are rejected clearly.
- [ ] Active visible auditions load and filters work.
- [ ] Closed, expired, draft, or removed auditions cannot accept applications.
- [ ] One application succeeds and a duplicate is rejected.
- [ ] My Applications shows current recruiter decisions.
- [ ] Talent cannot access recruiter or admin actions.

## Recruiter

- [ ] Company profile can be created and edited.
- [ ] Verification can be submitted and a rejected request can be resubmitted.
- [ ] Pending/rejected/suspended states explain the next action.
- [ ] Only approved active recruiters can publish auditions.
- [ ] Applicant pipeline loads profile, cover message, and contact details.
- [ ] Applicant pipeline shows only active recruiter-visible Talent media.
- [ ] Applicant stage tabs show accurate counts for all eight statuses.
- [ ] Search, verification/media/completeness/rating filters, and sorting work.
- [ ] Notes, internal tags, and ratings persist and remain private.
- [ ] Shortlisted, Rejected, and Selected notify Talent without note/tag spam.
- [ ] Withdrawn applications remain visible as read-only history.
- [ ] A different Recruiter cannot read or update the application.
- [ ] Audition search finds roles by title, company, and location.
- [ ] Advanced discovery filters and active-filter chips work on mobile.
- [ ] Recommended sorting responds to the Talent profile.
- [ ] Talent can save and remove an audition from cards and details.
- [ ] Saved-only discovery is owner-specific.
- [ ] Draft, closed, expired, and removed auditions stay hidden from Talent.
- [ ] Recruiters cannot read Talent bookmark records.
- [ ] Applicant tag/category/location/language filters preserve pipeline actions.
- [ ] Viewed, shortlisted, and rejected decisions persist.
- [ ] Recruiter cannot apply as Talent or moderate another recruiter's audition.

## Admin

- [ ] Non-admin users see the restricted workspace.
- [ ] Overview, recruiter verification, Talent trust, users, auditions, and audit logs load.
- [ ] Talent verify/reject/suspend/restore actions work.
- [ ] Verified Talent badge appears only after approval.
- [ ] Recruiter approval/rejection/suspension/restoration works.
- [ ] User suspension/restoration works.
- [ ] Audition removal/restoration works.
- [ ] Every privileged action writes an audit log.
- [ ] Media hide/remove/restore moderation works and is audited.
- [ ] Unexpected API failures return a generic message without credentials.

## Security

- [ ] `.env.local`, service-account JSON, Playwright output, and debug logs are ignored.
- [ ] Server-only Admin SDK modules are imported only by server route code/scripts.
- [ ] Private credentials never use a `NEXT_PUBLIC_` prefix.
- [ ] Admin endpoints verify an ID token and the `admin` custom claim.
- [ ] No credentials, ID tokens, or private keys appear in browser/server logs.
- [ ] Firestore Emulator rule tests are run when the emulator suite is available.
- [ ] Java 21 is installed and `npm run emulators:test` passes.

## Manual Regression

- [ ] Landing, login, signup, and forgot-password pages load.
- [ ] Protected routes redirect signed-out users to login.
- [ ] Loading, empty, permission, removed, and retry states are readable.
- [ ] Desktop navigation and mobile navigation reach every role route.
- [ ] No horizontal overflow, clipped controls, or overlapping text.
- [ ] `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e` pass.

## Browser And Device

- [ ] Chromium desktop.
- [ ] Microsoft Edge desktop.
- [ ] Chrome Android-sized viewport.
- [ ] Safari/iPhone manual check before external beta.
- [ ] Keyboard-only navigation and visible focus.
- [ ] 200% zoom remains usable.

## Known Blockers

- Large video and verification-document uploads remain intentionally disabled.
- Local rules tests exist; this machine still needs Java 21 to execute them.
- Notifications, analytics, monitoring, and legal workflows are outside Phase 1.5.
- Credential-backed E2E tests skip when `.env.e2e.local` credentials are absent.

## Failure Record

| Check | Result | Evidence | Owner | Follow-up |
| --- | --- | --- | --- | --- |
| Example | PASS / FAIL / BLOCKED | Screenshot/log/link | Name | Issue/PR |
