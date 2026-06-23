# Beta Launch Readiness Checklist

**Project:** FirstTake by MVA Studios — Nata Connect | నట కనెక్ట్
**Date:** 2026-06-22
**Stage:** Controlled private beta

This checklist is for a controlled Nata Connect private beta with a small
invited group. It is not a legal compliance certificate. Final legal, privacy,
and safety review is required before a wider public launch.

---

## 1. Production Readiness

### 1.1 Vercel Deployment

- [ ] Push latest `main` branch to GitHub.
- [ ] Import the GitHub repository into a Vercel project (framework: Next.js).
- [ ] Confirm the build command is `npm run build`.
- [ ] Add all required environment variables in Vercel Project Settings.
- [ ] Deploy and open the production URL.
- [ ] Confirm no missing Firebase env errors appear in the browser console.
- [ ] Confirm no secrets or service-account values appear in the HTML source
      or browser DevTools network responses.

### 1.2 Firebase Environment

Required Vercel environment variables (by name only — never commit values):

**Public Firebase web variables:**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

**Server/Admin SDK variables (never expose with NEXT_PUBLIC_):**
```
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

**Optional production URL:**
```
NEXT_PUBLIC_APP_URL
```

- [ ] All public Firebase vars are set in Vercel.
- [ ] All server Admin SDK vars are set in Vercel (server-only, never NEXT_PUBLIC_).
- [ ] `NEXT_PUBLIC_SHOW_TEST_CASES` is NOT set in Vercel (defaults to hidden in production).
- [ ] Firebase Auth has Email/Password enabled.
- [ ] Firebase Auth authorized domains include the Vercel production hostname.
- [ ] Firestore rules have been deployed: `npx firebase-tools deploy --only firestore:rules,firestore:indexes`
- [ ] Firestore index creation has finished (can take several minutes).
- [ ] Storage rules have been deployed if Storage is in use.

### 1.3 First Administrator

- [ ] A dedicated admin Firebase account is created (not a personal account).
- [ ] The admin custom claim has been set: `npm run admin:set -- admin@yourdomain.com`
- [ ] The admin account has signed out and signed back in to refresh the Firebase token.
- [ ] `/admin` opens correctly for the admin account.
- [ ] `/admin/beta-readiness` loads and shows green system checks.

### 1.4 Pre-Launch Verification Commands

Run these immediately before launch and confirm all pass:

```powershell
npm run lint
npm test
npm run build
git diff --check
```

And if Firestore rules or indexes changed:

```powershell
npm run emulators:test
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
```

---

## 2. Legal and Safety Checklist

- [ ] Review `/terms` — beta draft is present; confirm it is marked as a draft.
- [ ] Review `/privacy` — beta draft is present; confirm it is marked as a draft.
- [ ] Review `/community-guidelines` — guidelines are appropriate for beta.
- [ ] Review `/safety` — safety guidance is present with "Never Pay to Audition" warning.
- [ ] Accept that legal pages are beta placeholders; do NOT represent them as
      final legal documents to beta users.
- [ ] Plan qualified legal review before expanding to public launch.
- [ ] Confirm "never pay to audition" warning is visible on `/safety` and in
      the messaging thread safety reminder.
- [ ] Confirm report handling process is documented for the admin operator.
- [ ] Confirm the admin operator knows the escalation flow for harassment,
      scams, unsafe contact, payment pressure, and minors.

---

## 3. Support and Contact Checklist

- [ ] Define and monitor a real support email for beta users (replace the
      placeholder reference in `/contact`).
- [ ] Define response time expectations for beta users.
- [ ] Confirm `/contact` and `/help` are discoverable from the public footer.
- [ ] Confirm `/beta-feedback` is reachable and submissions succeed end-to-end.
- [ ] Confirm admin can review `/admin/beta-feedback` and mark items reviewed.
- [ ] Confirm `/safety` is linked from the contact page and navigation.

---

## 4. Talent Test Account Checklist

Work through this with a real or test Talent account from a clean browser
session before inviting first users.

### 4.1 Signup and Onboarding

- [ ] Open `/auth/signup` and create a Talent account with a real email.
- [ ] Confirm account creation redirects to `/talent/profile`.
- [ ] Confirm dashboard redirects to `/dashboard` for a Talent role.
- [ ] Email verification prompt is visible on the dashboard if email is unverified.
- [ ] Click "Send verification email" and confirm the email arrives.
- [ ] Open the verification link, return to the app; prompt clears.

### 4.2 Profile

- [ ] Complete the Talent profile (name, age, gender, category, experience,
      location, bio, skills, languages).
- [ ] Add at least one external link (Instagram, YouTube, or portfolio).
- [ ] Upload a profile photo if available.
- [ ] Add portfolio media or an external showreel link.
- [ ] Confirm profile completeness score increases correctly.
- [ ] Enable the public profile toggle.
- [ ] Set a public slug and confirm `/t/[slug]` loads with only approved public content.
- [ ] Disable and re-enable the public profile to confirm toggle works.

### 4.3 Talent Verification

- [ ] Submit a Talent verification request (at ≥70% profile completeness).
- [ ] Confirm status changes to "Pending" after submission.
- [ ] Ask the admin to approve, reject, or suspend from `/admin/talents`.
- [ ] Confirm the verified badge appears after approval.

### 4.4 Audition Discovery

- [ ] Open `/auditions` and confirm casting calls load.
- [ ] Try searching by role title or recruiter name.
- [ ] Use at least one filter (category, experience, location).
- [ ] Sort by "Deadline soon" and confirm order changes.
- [ ] Save an audition using the bookmark icon.
- [ ] Switch to "Saved" tab and confirm the saved audition appears.
- [ ] Unsave and confirm it disappears from the saved tab.

### 4.5 Apply and Track

- [ ] Open an audition detail page.
- [ ] Write a cover message and submit the application.
- [ ] Confirm redirect to `/applications` after submission.
- [ ] Confirm the application appears in the "Active" tab.
- [ ] Confirm "Already applied" badge appears on the audition card.
- [ ] Attempt to apply again and confirm the duplicate is prevented.

### 4.6 Self-Tape (if applicable)

- [ ] Open an application with a self-tape request.
- [ ] Submit a valid video link (e.g., an unlisted YouTube or Vimeo link).
- [ ] Confirm status changes to "Submitted".
- [ ] Replace the link and confirm the update saves.
- [ ] Remove the link and confirm the status reverts.

### 4.7 Messages and Notifications

- [ ] Wait for a recruiter to initiate messaging or trigger it from the
      recruiter account.
- [ ] Open `/messages` and confirm the conversation appears.
- [ ] Open the conversation and send a reply.
- [ ] Confirm the unread count clears after opening.
- [ ] Open `/notifications` and confirm application and message notifications appear.
- [ ] Click a notification action and confirm it navigates correctly.
- [ ] Click "Mark all as read" and confirm unread count clears.

### 4.8 Safety and Support

- [ ] Submit a report on a test audition using the report button.
- [ ] Open `/beta-feedback` and submit a test feedback item.
- [ ] Confirm the footer links (Terms, Privacy, Safety, Help, Contact) all load.

---

## 5. Recruiter Test Account Checklist

Work through this with a real or test Recruiter account.

### 5.1 Signup and Onboarding

- [ ] Open `/auth/signup` and create a Recruiter account.
- [ ] Confirm redirect to `/recruiter/profile` after signup.
- [ ] Complete the company profile (name, phone, website, bio).
- [ ] Confirm profile saves correctly.

### 5.2 Verification

- [ ] Open `/recruiter/verification`.
- [ ] Fill in legal name, contact person, website, social proof, business type,
      and work description.
- [ ] Submit verification.
- [ ] Confirm status changes to "Pending review".
- [ ] Ask the admin to approve from `/admin/verifications`.
- [ ] Confirm status changes to "Approved".
- [ ] Confirm the verified recruiter badge appears on auditions created after approval.

### 5.3 Audition Creation

- [ ] Open `/recruiter/auditions/new`.
- [ ] Fill in all required fields (title, description, category, experience,
      location, type, duration, requirements, deadline).
- [ ] Add pay information (optional but recommended).
- [ ] Enable the self-tape option and add instructions.
- [ ] Save as draft and confirm status is DRAFT.
- [ ] Publish and confirm status changes to ACTIVE.
- [ ] Open `/auditions` as a Talent account and confirm the audition appears.

### 5.4 Applicant Review

- [ ] As a Talent account, apply to the recruiter's audition.
- [ ] Open `/recruiter/auditions/[id]/applicants` as the Recruiter.
- [ ] Confirm the applicant appears in the "New" tab.
- [ ] Move the applicant to "Viewed", "Shortlisted", and "Rejected" states.
- [ ] Add a private note and confirm it saves.
- [ ] Add a rating and internal tags.
- [ ] If the applicant submitted a self-tape, mark it as reviewed.
- [ ] Select an applicant for the final stage.

### 5.5 Messaging

- [ ] Open an applicant and click "Message Talent".
- [ ] Confirm a conversation is created in `/messages`.
- [ ] Send a message to the Talent.
- [ ] Confirm the Talent sees the message in their `/messages`.
- [ ] Confirm the Talent can reply.

### 5.6 Recruiter Notifications

- [ ] Confirm application-received notifications appear for new applicants.
- [ ] Open `/notifications` and confirm the notification action links work.

---

## 6. Admin Test Checklist

### 6.1 Dashboard and Queues

- [ ] Log in with the admin account.
- [ ] Confirm `/admin` loads with correct pending counts.
- [ ] Confirm `/admin/beta-readiness` shows system check results.
- [ ] Confirm `/admin/audit-logs` loads and shows recent privileged actions.

### 6.2 Recruiter Verification Queue

- [ ] Open `/admin/verifications`.
- [ ] Review a pending recruiter submission.
- [ ] Approve a legitimate submission with a note.
- [ ] Reject a test submission with a reason.
- [ ] Confirm audit log records the action.
- [ ] Confirm the recruiter's status updates correctly.

### 6.3 Talent Trust Queue

- [ ] Open `/admin/talents`.
- [ ] Review a pending Talent verification.
- [ ] Verify a Talent and confirm the verified badge is visible to recruiters.
- [ ] Reject a Talent with a reason.
- [ ] Suspend a test Talent and confirm their access is restricted.
- [ ] Restore the Talent and confirm access returns.

### 6.4 Audition Moderation

- [ ] Open `/admin/auditions`.
- [ ] Remove a test audition.
- [ ] Confirm the audition is no longer visible to Talent at `/auditions`.
- [ ] Restore the audition.

### 6.5 Reports

- [ ] Submit a test report from a Talent account.
- [ ] Open `/admin/reports`.
- [ ] Confirm "Reporter" field shows role only (`talent` or `recruiter`) — no UID.
- [ ] Confirm "Target owner" shows last 8 characters only (`…abc12345`).
- [ ] Expand "Safe evidence snapshot" — key/value list displays, not raw JSON;
      fields ending in `id` or `uid` show `[internal reference]`.
- [ ] Expand audit trail — actor shows "Admin", not a raw Firebase UID.
- [ ] Start review, confirm action buttons require a reason for destructive actions.
- [ ] Dismiss the test report with an internal note.
- [ ] Confirm audit log records the resolution.

### 6.6 User Accounts

- [ ] Open `/admin/users` on a desktop viewport (≥ 1024px).
- [ ] Confirm card-row layout — no HTML table visible.
- [ ] Search for a test account by email.
- [ ] If a test account has `emailVerified: false`, confirm amber "Email unverified"
      badge is visible.
- [ ] Suspend the account — confirm red "SUSPENDED" danger badge appears.
- [ ] Confirm the suspended account sees the restricted-account workspace screen.
- [ ] Restore the account — confirm badge returns to green.

### 6.7 Conversations

- [ ] Open `/admin/messages` if a conversation exists.
- [ ] Confirm conversation metadata is visible to admin.
- [ ] Block a test conversation with an audit reason.

### 6.8 Beta Feedback

- [ ] Open `/admin/beta-feedback`.
- [ ] Confirm a submitted feedback item appears.
- [ ] Mark it as reviewed.

---

## 7. Cross-Device and Mobile Checklist

### 7.1 Mobile (phone viewport, ≤ 390px width)

- [ ] Landing page loads without horizontal scroll.
- [ ] `/auth/login` and `/auth/signup` are readable and usable.
- [ ] `/dashboard` shows the mobile hero, metrics, and navigation.
- [ ] Bottom navigation shows 5 tabs for Talent (Home, Auditions, Applications,
      Messages, Profile) without clipping.
- [ ] Bottom navigation clears the browser address bar.
- [ ] Auditions list loads and is filterable.
- [ ] Audition detail page is readable.
- [ ] Application submission works on mobile.
- [ ] Messages list and conversation are usable.
- [ ] Notifications are readable.
- [ ] Recruiter auditions list shows the mobile card layout.
- [ ] Recruiter applicant pipeline is usable (key actions reachable).
- [ ] Admin pages use the compact mobile admin header and bottom trust nav.
- [ ] Public footer links are readable and not overflowing.
- [ ] No content is hidden behind the browser bottom bar.

### 7.2 Tablet (768px viewport)

- [ ] Two-column layouts appear as expected.
- [ ] Admin pages are readable without a full desktop sidebar.

### 7.3 Desktop (1200px+ viewport)

- [ ] Desktop sidebar navigation is visible and functional.
- [ ] Tables (recruiter auditions, admin queues) display correctly.

### 7.4 Cross-Browser

- [ ] Chrome: core flows pass.
- [ ] Edge: core flows pass.
- [ ] Safari (if available): auth, dashboard, and messaging pass.

---

## 8. Error-State Checklist

- [ ] With a bad network, retry buttons appear on error states.
- [ ] Error messages use product-safe language (no "Firebase", "Firestore",
      "permission denied", or raw stack traces visible to users).
- [ ] Empty states have clear messages and next-action CTAs.
- [ ] SUSPENDED accounts see the restricted-account screen, not an error.
- [ ] Unverified recruiter sees verification status, not an error.
- [ ] Non-existent audition shows "no longer available" empty state.
- [ ] An invalid route (e.g. `/xyzzy`) shows the branded 404 page, not the
      Next.js default 404.

---

## 8A. Production Smoke Test Checklist

This section tracks the results of the live site smoke test against
https://firsttake-lovable.vercel.app (see `LIVE_PRODUCTION_BETA_SMOKE_TEST.md`).

### Remote/code-verified (pass = confirmed clean)
- [x] Homepage loads: brand, headline, CTAs, footer — no errors
- [x] No secrets or Firebase keys in public HTML
- [x] Test panel absent in production (gated on `NODE_ENV !== 'development'`)
- [x] Admin routes gated: "Administrator access required" for non-admin
- [x] No billing/payment/storage promises in any page
- [x] Email verification URL fallback safe (`window.location.origin` takes precedence)
- [x] Custom branded 404 page deployed (`app/not-found.tsx`)
- [x] All auth routes clean: login, signup, forgot-password, email-verified
- [x] Help, safety, community guidelines, terms, privacy, contact, beta-feedback load
- [x] Anti-payment safety warnings in messages and community guidelines
- [x] Laptop UX polish verified at code level (hero density, metrics grid, nav states)

### Requires live session to confirm
- [ ] Email verification send/receive end-to-end with production Firebase
- [ ] Firestore rules and indexes deployed to `nata-connect-prod`
- [ ] Admin custom claim set for launch admin account
- [ ] Full Talent journey: signup → profile → apply → notifications
- [ ] Full Recruiter journey: verification → audition → review
- [ ] Admin moderation: approve verification, view audit logs, resolve report
- [ ] Mobile device check at 375px

---

## 9. Notification and Message Checklist

- [ ] Talent receives in-app notification when an application status changes.
- [ ] Talent receives in-app notification when a recruiter starts a message.
- [ ] Recruiter receives in-app notification when a Talent applies.
- [ ] Notification bell shows an unread count badge.
- [ ] Marking all read clears the badge.
- [ ] Notification action URLs navigate to the correct page.
- [ ] Opening a conversation from notifications marks it as read.
- [ ] Messages sent in a conversation appear in order with timestamps.
- [ ] Sending an empty message is blocked.
- [ ] Message safety reminders appear in the conversation thread.

---

## 10. First 5 Beta Users Plan

- [ ] Invite one trusted Talent with media (actor or model).
- [ ] Invite one trusted Talent without existing media.
- [ ] Invite one trusted Recruiter or casting team.
- [ ] Invite one admin/operator who will monitor the first week.
- [ ] Invite one outside observer who has not seen the product before.
- [ ] Ask each person to submit at least one feedback item through `/beta-feedback`.
- [ ] Review feedback daily during the first beta week.
- [ ] Triage safety feedback before feature requests.

---

## 11. Known Limitations (Beta)

These are accepted limitations for the private beta. They are documented
honestly for operators and beta users.

| Limitation | Detail |
|---|---|
| No document upload | Verification uses a text-form-based review. Recruiters and Talent submit details manually; the trust team may request documents through a separate channel. |
| No self-tape direct upload | Self-tape submission uses external video links (YouTube unlisted, Vimeo) only. Direct private video upload remains future work. |
| No payment or subscriptions | The platform does not process any payments. Compensation shown in auditions is the recruiter's offer context, not a platform transaction. |
| No guaranteed email delivery | Email notifications require a configured provider (Resend or similar). Without configuration, the email system operates in no-op mode — notifications are in-app only. |
| No SMS notifications | SMS is not implemented. |
| No analytics or monitoring | No production error monitoring, performance analytics, or uptime alerts are configured. Operators should check logs manually during beta. |
| Manual admin review | Recruiter verification and Talent trust are reviewed manually by the admin. There is no automated approval system. |
| Legal pages are beta drafts | Terms, privacy, and community guidelines are beta-appropriate drafts and should be reviewed by a qualified legal professional before wider launch. |
| No formal data deletion workflow | Users can contact support to request data deletion, but there is no automated self-serve deletion flow. |
| Rate limits are in-code only | Edge rate limits and abuse prevention are not yet configured. For beta scale, in-code limits are sufficient. |
| No push notifications | PWA manifest is present; push notifications are a future phase. |
| Private beta only | This is not an open public registration. Invitations should be controlled and monitored. |

---

## 12. Launch Readiness Score

**Date:** 2026-06-23
**Evaluator:** End-to-End Flow QA + Beta Launch Readiness Pass + Admin Operations Hardening Pass

| Area | Score | Notes |
|---|---|---|
| Core marketplace loop | ✅ Ready | Signup → Profile → Audition → Apply → Review → Message all work |
| Authentication and sessions | ✅ Ready | Tab-scoped Firebase auth, email verification, password reset |
| Role access and security | ✅ Ready | AppShell, AdminShell, Firestore rules enforce roles |
| Admin operations | ✅ Hardened | Verification, moderation, audit logs, reports functional; reporter UID masked, evidence display structured, emailVerified visible, urgency callout added |
| Error copy and UX polish | ✅ Ready | All raw Firebase errors sanitized, no unsupported CTAs |
| Mobile experience | ✅ Ready | Safe-area padding, bottom nav, responsive layouts confirmed |
| Public and legal pages | ✅ Ready (beta) | Beta-appropriate drafts present; legal review needed pre-public |
| Known limitations documented | ✅ Ready | Documented honestly for operators and users |
| First-user onboarding | ✅ Ready | All journeys confirmed in FLOW_QA_REPORT.md |
| Email delivery | ⚠️ Conditional | Requires provider setup; in-app notifications work without it |
| Analytics / monitoring | ⚠️ Pending | Not configured; manual review needed during beta |
| E2E browser tests | ⚠️ Conditional | Credential-backed tests require local `.env.e2e.local` accounts |
| Formal legal review | ⚠️ Pending | Required before wider public launch |
| Data deletion workflow | ⚠️ Pending | Contact-support path only for beta |
| Direct uploads (media / docs) | ⚠️ Future | Self-tapes and doc uploads use links/manual process |

**Overall verdict: Ready for controlled private beta with limitations**

The core product is stable, flows are verified, error copy is clean, and
access controls are enforced. The accepted limitations above are appropriate
for a small controlled first beta and should be communicated to invited users
before they join.

---

## 13. Feedback Collection Process

- New feedback lands in the `betaFeedback` Firestore collection.
- Admins review it at `/admin/beta-feedback`.
- Safety feedback should be triaged before general feature requests.
- Mark feedback as reviewed after triage.
- Mark feedback as resolved only after a product, support, or policy response
  is complete.
- Keep sensitive user information out of admin notes where possible.

---

## 14. Rollback Notes

- If production launch shows severe auth, permission, or data issues, pause
  invitations immediately.
- Revert the latest Vercel deployment to the last known good deployment from
  the Vercel dashboard.
- Preserve audit logs and report records — do not delete them.
- Do not delete evidence related to safety reports.
- Communicate clearly to beta users if access is temporarily paused.
- Use emergency admin actions (disable profile, suspend user, remove audition,
  block conversation, hide media) to reduce immediate risk while investigating.
