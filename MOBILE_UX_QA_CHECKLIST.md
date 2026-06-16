# Nata Connect Mobile UX QA Checklist

Use this checklist before shipping mobile-facing changes to production. Test with real accounts where possible, including one Talent account, one approved Recruiter account, one unapproved Recruiter account, and one Admin account.

## Devices and Viewports

| Target | What to Check |
| --- | --- |
| 360 x 800 Chrome viewport | Small Android phone baseline; no horizontal overflow. |
| 390 x 844 Chrome viewport | Common iPhone size; bottom nav safe-area behavior. |
| 430 x 932 Chrome viewport | Large phone; card spacing and header rhythm. |
| 768 x 1024 tablet viewport | Tablet layout should not feel stretched or broken. |
| iPhone Safari | Safe-area, keyboard, sticky bottom nav, file inputs, scrolling. |
| Android Chrome | Tap targets, keyboard resize, upload controls, back navigation. |

## Global Mobile Checks

- No horizontal scrolling on app pages.
- Bottom navigation does not cover buttons, forms, or message composer.
- Header menu opens and closes cleanly.
- Tap targets are easy to hit with one thumb.
- Primary action is visually clear on each route.
- Page titles are readable without wrapping awkwardly.
- Cards show only the most important information first.
- Error, loading, and empty states explain what to do next.
- Form inputs are full width and use mobile-friendly keyboard types.

## Talent Journey

- Talent can log in on mobile and land on the dashboard.
- Dashboard explains the next step: complete profile, find roles, or track applications.
- Audition discovery loads as a clean card feed.
- Search, sort, filters, and saved-only toggles work without cramped layouts.
- Audition detail page can be read without horizontal scroll.
- Apply form is readable and submit button is reachable.
- Application tracker tabs scroll horizontally and remain usable.
- Application cards show status, recruiter, timeline, and message action.
- Talent profile form stacks cleanly on phone.
- Profile completeness card is visible and understandable.
- Media upload controls stack cleanly.
- Public profile settings are readable and actions are separated.
- Messages inbox opens conversations clearly.
- Conversation composer remains usable with the keyboard open.
- Notifications page shows readable cards and mark-all-read action.

## Recruiter Journey

- Recruiter can log in and land on dashboard or verification route as appropriate.
- Dashboard shows live auditions, applicants needing review, and next actions.
- Recruiter auditions page uses mobile cards, not a desktop table.
- Post audition form fields stack cleanly and submit actions are clear.
- Applicant pipeline tabs scroll horizontally without page overflow.
- Applicant filters are usable and reset cleanly.
- Applicant cards show talent name, status, profile quality, media count, and actions.
- Status actions are grouped and touch-friendly.
- Expanded applicant review is readable.
- Recruiter notes, tags, rating, and message action work on phone.
- Applicant media previews do not overflow.

## Admin Sanity

- Admin dashboard loads on mobile without broken layout.
- Verification queues are readable enough for emergency mobile checks.
- Talent trust page does not overflow horizontally.
- Reports queue can be opened and basic actions are visible.
- Audit logs remain accessible, even if desktop is preferred for heavy review.

## Auth Flow

- Login renders correctly at 360px width.
- Signup renders correctly at 360px width.
- Demo/test case panels do not crowd the form.
- Current tab session card is readable.
- Error messages are readable and do not expose secrets.
- Forgot-password flow is reachable.

## Messaging Flow

- Inbox card list is readable.
- Unread labels are visible.
- Conversation header fits on small screens.
- Message bubbles do not overflow.
- Composer can send a message.
- Contact-detail blocking error is readable.
- Report message/thread actions remain available.

## Application Flow

- Talent can apply to an active audition.
- Duplicate application protection still works.
- Talent can withdraw eligible applications.
- Recruiter applicant count updates after application.
- Recruiter can view applicant in pipeline.
- Recruiter can shortlist, reject, select, and message from mobile.

## Media Upload Flow

- Profile photo upload works on mobile browser.
- Portfolio image upload works on mobile browser.
- External showreel links can be added.
- Visibility selector is readable.
- Featured media action is reachable.
- Delete/archive controls are not too close to primary actions.
- Upload errors are readable and safe.

## Notification Flow

- Notification bell shows unread count.
- `/notifications` loads for signed-in users.
- Signed-out users are redirected to login.
- Mark one notification read works.
- Mark all read works.
- Action links open internal routes only.

## Common Mobile Bugs to Watch

- Bottom navigation covering final form buttons.
- Fixed header plus bottom nav leaving too little scroll area.
- Inputs zooming unexpectedly on iOS.
- Horizontal overflow from tables, long emails, slugs, or badges.
- Buttons wrapping into unreadable two-line labels.
- File inputs not responding on Safari.
- Sticky elements overlapping browser address bar changes.
- Report/moderation dialogs exceeding viewport height.

## Production Smoke Test Steps

1. Open `https://firsttake-lovable.vercel.app` on a phone or mobile emulator.
2. Confirm the landing page hero and CTA are readable.
3. Log in as Talent and open dashboard, auditions, applications, messages, notifications, and profile.
4. Log out, then log in as approved Recruiter and open dashboard, auditions, applicant pipeline, messages, and profile.
5. Log in as Admin and open dashboard, verifications, talents, reports, and audit logs.
6. Submit one safe test application and confirm it appears in Talent and Recruiter views.
7. Send one safe test message and confirm unread indicators update.
8. Check that no route exposes secrets or environment values in errors.
