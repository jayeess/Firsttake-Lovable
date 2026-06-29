# Live Demo Route Order

Use this guide for a live founder walkthrough. Prefer a prepared browser with
known safe test accounts and a small amount of real approved data. Do not seed
fake users or promise traction. If a route has no data, use the fallback notes
and explain the empty state as part of the product readiness story.

## Demo Setup

- Open one clean browser profile for public pages.
- Open separate tabs or windows for Talent, Recruiter, and Admin accounts if
  available.
- Confirm the Admin account already has the Firebase custom claim.
- Confirm at least one approved Recruiter and one active audition exist if you
  want to show live application flow.
- Keep credentials, Firebase console, Vercel settings, and `.env` files off
  screen.

## Recommended Route Order

### 1. Public Landing

Route: `/`

Say:

"This is FirstTake by MVA Studios. The product is Nata Connect, a casting
workflow for Talent and verified recruiters."

Show:

- Brand and tagline
- Talent / Recruiter value
- Trust positioning
- Honest roadmap language

Click:

- `Join the network` only if you are moving into signup
- `Log in` if using prepared accounts

Do not click:

- Browser extensions
- Firebase/Vercel admin consoles
- Any account menu that exposes personal email if the audience should not see it

Fallback if data is empty:

"The public story is intentionally useful before marketplace density. The app
explains the workflow even when a new region has only a few early roles."

### 2. Signup Entry

Route: `/auth/signup`

Say:

"The platform starts with role selection. Talent and Recruiters enter different
workflows from the first session."

Show:

- Talent role card
- Recruiter role card
- Email/password entry

Click:

- Avoid creating new accounts during a timed demo unless the demo is
  specifically about onboarding.

Do not click:

- Submit with random public email
- Password fields if screen recording should avoid typed secrets

Fallback:

"For a short demo I will use prepared accounts so we can show the complete
workflow."

### 3. Talent Dashboard

Route: `/dashboard`

Say:

"Talent land in a workspace that points to the next best action: profile,
auditions, applications, messages, or notifications."

Show:

- Next action card
- Metrics
- Recent applications or empty state
- Saved auditions / messages / notifications links

Click:

- `Complete profile` or `Browse auditions`

Do not click:

- Logout unless testing route protection

Fallback:

"When no applications exist yet, the dashboard still guides the Talent toward
profile completion and audition discovery."

### 4. Talent Profile

Route: `/talent/profile`

Say:

"This is the Talent's professional casting profile. Completeness is visible,
missing items are actionable, and trust status is separate from profile
completion."

Show:

- Completeness card
- Verification status
- Profile photo / media area
- Skills and languages
- Public profile controls if present

Click:

- Save only if you are using a safe test account
- Public preview only if a public slug exists

Do not click:

- Upload a file unless the demo is specifically about media trust
- Delete media during a live pitch

Fallback:

"If the profile is incomplete, that is useful: it shows how the product coaches
Talent toward recruiter-ready information."

### 5. Audition Discovery

Route: `/auditions`

Say:

"Discovery helps Talent search, filter, save, and compare casting briefs before
applying."

Show:

- Search/filter controls
- All Auditions / Saved Auditions switch
- Audition cards
- Verified recruiter, deadline, self-tape, and applied badges

Click:

- Search or filter lightly
- Save/bookmark one audition if already logged in as Talent
- Open one audition detail

Do not click:

- Too many filters at once
- Report buttons unless demonstrating safety

Fallback:

"If there are no roles yet, the empty state explains the next action without
inventing fake marketplace activity."

### 6. Audition Detail and Application Pack

Route: `/auditions/[id]`

Say:

"The detail page tells Talent what the recruiter is asking for and what gets
sent in the application pack."

Show:

- Role description
- Requirements
- Compensation context
- Self-tape requirement if present
- Apply form
- Safety notice

Click:

- Submit only if this is a safe active role and duplicate applications are not a
  concern
- Otherwise scroll and explain the apply flow

Do not click:

- Submit repeatedly
- Open external self-tape URLs from unknown data

Fallback:

"If the role is closed or already applied, the page still shows the right
product state instead of letting the user submit again."

### 7. Applications Tracker

Route: `/applications`

Say:

"After applying, Talent can track every role from submission through recruiter
review and final decision."

Show:

- Stage tabs
- Application cards
- Application pack chips
- Self-tape prompts
- Message links

Click:

- Filter between Active, Shortlisted, Completed, and All
- Open linked audition or messages

Do not click:

- Withdraw application during a pitch unless the audience asks about it

Fallback:

"With no applications, the page gives a clear path back to auditions and
explains what happens after the first submission."

### 8. Messages

Route: `/messages`

Say:

"Messages are application-linked. That keeps communication tied to a real role
and makes moderation easier."

Show:

- Search
- Unread/active/archived filters
- Safety reminder

Click:

- Open a thread only if it has safe demo text

Do not click:

- Send spontaneous messages in production data

Fallback:

"No conversations yet is normal before recruiters respond. The empty state
routes users back to applications or auditions."

### 9. Notifications

Route: `/notifications`

Say:

"Notifications collect application, message, audition, and trust updates in one
activity timeline."

Show:

- Category tabs
- Unread counts
- Mark-all-read state

Click:

- Switch categories

Do not click:

- Mark all as read unless this is a disposable test account

Fallback:

"Empty notification categories are still useful because they explain what type
of activity will appear there."

### 10. Recruiter Verification

Route: `/recruiter/verification`

Say:

"Recruiter verification is the trust gate. The product supports manual review
and private evidence upload for admins, but it does not auto-approve."

Show:

- Verification status
- Company details
- Evidence upload guidance if visible

Click:

- Avoid submitting a new verification during a timed pitch unless using a test
  account

Do not click:

- Upload sensitive documents on screen

Fallback:

"If the account is already approved, show the approved status and explain that
approved recruiters can post casting briefs."

### 11. Recruiter Casting Calls

Route: `/recruiter/auditions`

Say:

"Recruiters manage their casting briefs, applicant counts, and review actions
from one workspace."

Show:

- Metrics
- Casting call rows/cards
- Review applicants link
- Post casting brief CTA

Click:

- Open an existing brief's applicants page

Do not click:

- Remove/close audition during a pitch

Fallback:

"When no brief exists, this page explains how to create the first professional
casting call."

### 12. New Casting Brief

Route: `/recruiter/auditions/new`

Say:

"The form guides recruiters to create a complete brief with role context,
requirements, compensation context, deadline, and self-tape instructions."

Show:

- Structured fields
- External-link self-tape model
- Before-you-publish checklist

Click:

- Save draft only with safe test data

Do not click:

- Publish a role with incomplete or accidental content

Fallback:

"Even without publishing, the form demonstrates the product standard for
clearer casting briefs."

### 13. Applicant Review Room

Route: `/recruiter/auditions/[id]/applicants`

Say:

"This is where the recruiter actually makes casting decisions. Profiles,
messages, status, notes, self-tape links, and review actions are all connected
to the audition."

Show:

- Pipeline metrics
- Stage tabs
- Applicant card
- Expanded profile/review panel
- Callback / final round / selected flow if available

Click:

- Expand applicant
- Change filter tabs
- Use status change only on a safe test record

Do not click:

- Reject/select a real person during a public demo
- Open external links from unknown records

Fallback:

"If there are no applicants, the empty state explains how to share the public
brief while keeping applications inside the platform."

### 14. Admin Dashboard

Route: `/admin`

Say:

"The admin side is the trust command center. It keeps verification, moderation,
reports, and audit activity visible for the operator."

Show:

- Pending recruiter verifications
- Pending Talent reviews
- Active auditions
- Reports/flagged accounts
- Recent audit activity

Click:

- Open Launch readiness or Verifications

Do not click:

- Dangerous admin action buttons in a public demo

Fallback:

"If there are no pending queues, that is a healthy empty state. It means there
is nothing requiring admin decision right now."

### 15. Launch Readiness Command Center

Route: `/admin/beta-readiness`

Say:

"This page helps a founder decide whether the platform is ready for a controlled
launch. It checks infrastructure, marketplace health, and safety pressure."

Show:

- Readiness band
- Blockers panel if present
- Marketplace health
- Safety queue
- Production checklist

Click:

- Action links to relevant admin queues

Do not click:

- Anything that exposes environment values or opens console settings

Fallback:

"If a readiness item is amber, that is not a failure. It is a visible operating
checklist."

### 16. Admin Verification and Reports

Routes: `/admin/verifications`, `/admin/reports`

Say:

"Verification and reports are where human trust operations happen. This is
important in early beta because not every risk should be automated."

Show:

- Queue cards
- Status badges
- Evidence/reason summaries
- Safe action wording

Click:

- Filters and non-destructive view controls

Do not click:

- Approve, reject, suspend, restore, remove, or resolve unless using a prepared
  disposable test record

Fallback:

"An empty queue is a good sign. The admin page still explains what will appear
when users submit requests or reports."

## Emergency Recovery During a Live Demo

If a page has no data:

1. Say: "This is a controlled early beta, so empty states are part of the
   product."
2. Point to the empty-state CTA.
3. Move to the next route in the sequence.

If login fails:

1. Do not debug Firebase on screen.
2. Use the public landing, route order, and screenshot deck.
3. Say: "For this audience, I will continue with the prepared walkthrough."

If a protected route redirects:

1. Explain role protection briefly.
2. Log in with the correct role.
3. Continue from the intended route.

If data is sensitive:

1. Do not open the record.
2. Use the corresponding empty state, screenshot, or route explanation.

## What Not to Click During a Live Demo

- Admin destructive actions: suspend, restore, remove, resolve, reject, approve
  unless on disposable test records
- Real user message threads
- External self-tape links from unknown records
- File upload controls with sensitive local files
- Firebase Console, Vercel settings, `.env` files, service-account JSON
- Browser saved-password menus
- Any route that may expose personal emails unnecessarily
