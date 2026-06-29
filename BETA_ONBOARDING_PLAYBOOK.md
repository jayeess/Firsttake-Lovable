# Beta Onboarding Playbook

This playbook is for a small founder-led beta. Keep the first cohort narrow,
manual, and closely observed. Do not promise guaranteed auditions, guaranteed
jobs, instant recruiter approval, paid work, or automated matching.

## Who to Invite First

### Talent

Invite:

- 10 to 20 emerging actors, models, dancers, anchors, or voice artists
- People comfortable giving feedback
- Students or early-career performers with basic portfolio material
- Users who understand this is a controlled MVP

Avoid initially:

- Minors unless guardian consent and age policy are fully ready
- Users expecting guaranteed paid roles
- Users who need heavy support with every login step
- Public influencer launches before trust operations are stable

### Recruiters

Invite:

- 2 to 5 trusted casting teams, college film teams, independent producers, or
  agencies
- People willing to write clear casting briefs
- Teams who agree not to request payment from Talent
- Teams who can respond to applicants within a reasonable timeframe

Avoid initially:

- Unknown recruiters without verification context
- Anyone asking Talent for fees, deposits, or off-platform contact first
- High-volume teams that would overwhelm manual admin operations

### Admin / Operators

Start with:

- One primary founder-admin
- One backup reviewer if possible
- A shared daily routine for verification, reports, and launch readiness

## Talent Beta Onboarding Steps

1. Send a clear invite message:
   - "This is an early beta."
   - "No roles are guaranteed."
   - "Use real profile information."
   - "Never pay to audition."
2. Ask Talent to sign up as `Talent`.
3. Confirm email verification prompt appears.
4. Ask them to complete:
   - Name
   - Category
   - Experience
   - Location
   - Bio
   - Skills
   - Languages
   - Portfolio link or media signal
5. Ask them to upload only media they own or have permission to use.
6. Ask them to browse `/auditions`.
7. Ask them to save at least one role.
8. Ask them to apply to one suitable role if available.
9. Ask them to check `/applications`, `/messages`, and `/notifications`.
10. Ask for feedback on:
    - Was the profile clear?
    - Was audition discovery understandable?
    - Did the application tracker make sense?
    - Did any safety copy feel confusing?

## Recruiter Beta Onboarding Steps

1. Send a clear invite message:
   - "This is an early recruiter beta."
   - "Verification is manual."
   - "Do not request payment from Talent."
   - "Keep applicant communication on-platform."
2. Ask recruiter to sign up as `Recruiter`.
3. Ask them to complete company profile.
4. Ask them to submit verification with appropriate non-sensitive evidence.
5. Admin reviews and approves only trusted recruiters.
6. Ask recruiter to create one casting brief:
   - Clear title
   - Category and experience
   - Location / work mode
   - Requirements
   - Compensation context
   - Deadline
   - External self-tape instructions only if needed
7. Ask recruiter to review applicants from `/recruiter/auditions/[id]/applicants`.
8. Ask recruiter to move one test application through safe stages if using a
   consenting beta Talent record.
9. Ask for feedback on:
   - Was verification understandable?
   - Was posting a role easy?
   - Did applicant review show enough information?
   - What decision fields were missing?

## Admin Daily Operating Routine

Morning:

- Open `/admin`.
- Check pending recruiter verifications.
- Check pending Talent reviews.
- Check reports.
- Check urgent or suspended account signals.
- Open `/admin/beta-readiness` and note blockers.

Midday:

- Review new applications and recruiter activity volume.
- Confirm no suspicious audition wording.
- Confirm no users are reporting payment requests.
- Respond to urgent reports first.

Evening:

- Review audit logs.
- Record issues, feature requests, and safety concerns.
- Decide whether any recruiter or Talent should be suspended or restored.
- Update the beta issue list before inviting more users.

## Safety Review Routine

Review daily:

- New recruiter verification submissions
- New audition briefs
- Reports related to payment, unsafe contact, harassment, impersonation, fake
  auditions, or misleading information
- Messages flagged through reports
- Public Talent profiles if reports are filed

Escalate immediately:

- Any request for payment to audition
- Any request for bank details or identity documents in chat
- Harassment or unsafe contact request
- Suspicious recruiter identity
- Public profile abuse

## Feedback Collection Routine

Use a simple weekly rhythm:

1. Day 1: Ask about signup and profile setup.
2. Day 2: Ask about discovery and save/apply flow.
3. Day 3: Ask recruiters about posting and applicant review.
4. Day 4: Ask both sides about messages and notifications.
5. Day 5: Ask about trust, safety, and confusing copy.
6. Day 6: Review admin logs and reports.
7. Day 7: Decide what must be fixed before inviting more users.

Questions to ask:

- What was confusing?
- What felt trustworthy?
- What felt missing before applying or reviewing?
- Did any button or page feel unfinished?
- Did the product make the casting process clearer?

## What to Monitor in the First 7 Days

Marketplace health:

- Talent signups
- Completed Talent profiles
- Recruiter signups
- Approved recruiters
- Active auditions
- Applications per audition
- Time to first application
- Time to recruiter review

Trust and safety:

- Verification approval/rejection count
- Reports submitted
- Suspensions
- Payment-request complaints
- Off-platform contact attempts
- Failed or confusing states users report

Product usability:

- Drop-off after signup
- Drop-off before profile save
- Drop-off before application submit
- Recruiter form abandonment
- Applicant review confusion
- Message/notification usage

## What to Avoid During Early Beta

- Wide public launch before trust operations are stable
- High-volume recruiter onboarding without manual review
- Promising guaranteed jobs or guaranteed auditions
- Allowing payment requests
- Moving sensitive review into public fields
- Adding AI, payments, calendar scheduling, video calls, or direct video upload
  before the core workflow is proven
- Ignoring empty states just because the product is early
- Letting reports sit unresolved

## Launch Readiness Checklist Before Wider Rollout

- [ ] At least one full Talent journey works in production.
- [ ] At least one full Recruiter journey works in production.
- [ ] Admin can review verifications and reports.
- [ ] No critical launch blockers in `/admin/beta-readiness`.
- [ ] Firebase rules and indexes are deployed.
- [ ] Vercel environment variables are verified.
- [ ] Email verification works on production URL.
- [ ] Safety and community pages are reviewed.
- [ ] Support contact is monitored.
- [ ] First-week admin operating schedule is assigned.
- [ ] Known limitations are explained to beta users.
- [ ] No unresolved payment/fraud/safety reports.

## Suggested First Beta Message

"Hi, we are testing FirstTake / Nata Connect, an early casting workflow for
Talent and verified recruiters. This is a controlled beta, so we are looking
for honest feedback rather than high-volume usage. Please create a real profile,
use only media you own, never pay anyone to audition, and report anything that
feels unsafe or confusing."
