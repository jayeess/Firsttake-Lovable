# Screenshot Checklist

Use this checklist to capture pitch deck, demo, and progress-review material.
Prefer clean test accounts, real non-sensitive beta records, or empty states.
Do not create fake users, use celebrity names, or capture secrets.

## Landing Page

Route: `/`

What should be visible:

- FirstTake / Nata Connect brand
- "Where Talent Meets Opportunity"
- Talent and Recruiter value proposition
- Trust-focused product sections

Why it matters:

- Establishes the product story before showing dashboards.

Suggested caption:

"FirstTake introduces Nata Connect as a trusted casting workflow for Talent and
verified recruiters."

## Talent Dashboard

Route: `/dashboard`

What should be visible:

- Talent workspace hero
- Next best action
- Application, self-tape, messages, notifications, and saved-audition cards

Why it matters:

- Shows that Talent users are guided after login.

Suggested caption:

"Talent dashboard turns the casting journey into clear next steps."

## Talent Profile and Media Upload

Route: `/talent/profile`

What should be visible:

- Profile completeness
- Verification status
- Basic identity / casting details
- Skills and languages
- Profile photo or portfolio image area

Why it matters:

- Shows how Talent become recruiter-ready before applying.

Suggested caption:

"Talent build a professional profile with portfolio and trust signals."

## Audition Discovery

Route: `/auditions`

What should be visible:

- Search and filter controls
- All / Saved auditions view
- Audition cards with recruiter, deadline, category, and trust badges

Why it matters:

- Demonstrates the marketplace discovery surface.

Suggested caption:

"Talent can search, save, and compare active casting briefs."

## Audition Detail and Application Pack

Route: `/auditions/[id]`

What should be visible:

- Role title and company
- About the role
- Requirements
- Application pack
- Apply form
- Never-pay-to-audition notice

Why it matters:

- Shows the exact moment where Talent decide whether to apply.

Suggested caption:

"Each casting brief explains what Talent submit and how to apply safely."

## Applications Pipeline

Route: `/applications`

What should be visible:

- Status tabs
- Application card
- Stage guidance
- Application pack chips
- Self-tape and message prompts if present

Why it matters:

- Shows that Talent can track progress instead of waiting blindly.

Suggested caption:

"Applications stay visible from submission through recruiter decision."

## Recruiter Verification

Route: `/recruiter/verification`

What should be visible:

- Verification status
- Company proof guidance
- Evidence upload area if available
- Review-state explanation

Why it matters:

- Shows trust gating before recruiters publish casting calls.

Suggested caption:

"Recruiters complete manual verification before posting serious casting briefs."

## Recruiter Audition Creation

Route: `/recruiter/auditions/new`

What should be visible:

- New casting brief form
- Role details, requirements, deadline, compensation context
- External-link self-tape guidance
- Before-you-publish checklist

Why it matters:

- Shows how the product improves casting brief quality.

Suggested caption:

"Recruiters create structured casting briefs with clear expectations."

## Applicant Review Room

Route: `/recruiter/auditions/[id]/applicants`

What should be visible:

- Casting board hero
- Pipeline metrics
- Applicant cards
- Expanded applicant review panel
- Profile, portfolio, notes, status actions

Why it matters:

- Demonstrates the recruiter value: organized applicant review.

Suggested caption:

"Recruiters review applicants with profile, status, notes, and decision context
in one room."

## Callback and Selection Workflow

Route: `/recruiter/auditions/[id]/applicants`

What should be visible:

- Callback / Final Round / Selected status controls if supported by current data
- Talent-visible note field
- Status timeline
- Safety guidance

Why it matters:

- Shows the platform supports real casting stages beyond simple accept/reject.

Suggested caption:

"Application stages support callbacks, final rounds, selection, and respectful
closure."

## Messages

Route: `/messages`

What should be visible:

- Casting communication center
- Conversation list or empty state
- Search and filters
- Safety communication cue

Why it matters:

- Shows communication is tied to casting context.

Suggested caption:

"Messages stay attached to applications so casting communication remains
organized and safer to review."

## Notifications

Route: `/notifications`

What should be visible:

- Activity timeline
- Category tabs
- Unread counts or clear empty states
- Action links

Why it matters:

- Shows users can follow application, message, audition, and trust updates.

Suggested caption:

"Notifications keep casting activity visible across applications, messages, and
trust workflows."

## Admin Launch Readiness Command Center

Route: `/admin/beta-readiness`

What should be visible:

- Readiness score and band
- Blockers or readiness items
- Marketplace health
- Safety queue
- Production checklist

Why it matters:

- Shows founder/operator readiness discipline before wider launch.

Suggested caption:

"Launch readiness combines infrastructure, marketplace health, and safety
signals into one admin view."

## Admin Verification and Report Queues

Routes: `/admin/verifications`, `/admin/reports`

What should be visible:

- Queue cards
- Status badges
- Evidence/reason summaries
- Action buttons with clear labels

Why it matters:

- Shows that trust and moderation are operational, not just marketing copy.

Suggested caption:

"Admins review verification and safety reports with audit-friendly controls."

## Safety and Community Pages

Routes: `/safety`, `/community-guidelines`, `/help`, `/terms`, `/privacy`

What should be visible:

- Never-pay-to-audition guidance
- Reporting guidance
- Community expectations
- Beta legal or support framing where present

Why it matters:

- Shows the product communicates risk and responsible use.

Suggested caption:

"Safety guidance is visible to users before and during marketplace activity."

## Capture Quality Notes

- Desktop: capture at 1440px or 1280px width.
- Mobile: capture around 390 x 844 for iPhone-style deck material.
- Hide browser bookmarks if they distract.
- Avoid showing real emails, phone numbers, secret keys, private files, or
  personal message content.
- Prefer pages with clean empty states over messy private data.
- Name screenshots by route and role, for example:
  `talent-dashboard-mobile.png`, `recruiter-review-room-desktop.png`.
