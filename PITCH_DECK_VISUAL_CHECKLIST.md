# Pitch Deck Visual Checklist

Use this checklist to capture visuals for the FirstTake / Nata Connect pitch
deck. Do not generate images, use celebrity names, show secrets, or capture
private personal data. Prefer clean test accounts, safe demo records, or
polished empty states.

| Priority | Screenshot needed | Route / source | Crop or highlight | Caption | Why it matters |
| --- | --- | --- | --- | --- | --- |
| Must-have | Public brand hero | `/` | Crop the top hero with brand, tagline, and primary CTA | "FirstTake by MVA Studios: Where Talent Meets Opportunity." | Opens the deck with product identity and positioning. |
| Must-have | Product loop section | `/` | Highlight Talent, Recruiter, and trust workflow cards | "A connected casting workflow from profile to recruiter decision." | Shows this is a workflow product, not just a landing page. |
| Must-have | Talent dashboard | `/dashboard` | Capture next-best-action area and key cards | "Talent workspace guides users toward profile, auditions, and applications." | Demonstrates first-session clarity. |
| Must-have | Talent profile completeness | `/talent/profile` | Crop profile hero, completeness card, and trust status | "Profiles help Talent become recruiter-ready." | Shows activation and profile quality system. |
| Must-have | Talent media / portfolio area | `/talent/profile` | Highlight profile photo, portfolio images, or media guidance | "Portfolio signals support better casting review." | Shows Talent value beyond basic forms. |
| Must-have | Audition discovery | `/auditions` | Capture search, filters, saved/all switch, and cards | "Talent can search, save, and compare casting briefs." | Represents the marketplace discovery surface. |
| Must-have | Audition detail and apply pack | `/auditions/[id]` | Crop role details plus application pack/apply area | "Casting briefs explain what Talent submit before applying." | Shows the conversion moment from discovery to application. |
| Must-have | Applications pipeline | `/applications` | Capture stage tabs and one application card | "Application status stays visible after submission." | Shows status transparency for Talent. |
| Must-have | Recruiter verification | `/recruiter/verification` | Highlight status badge and evidence/review guidance | "Recruiters pass through trust review before publishing." | Shows verified supply-side model. |
| Must-have | New casting brief form | `/recruiter/auditions/new` | Crop role fields and before-you-publish checklist | "Recruiters create structured briefs with safer expectations." | Shows supply creation and brief quality. |
| Must-have | Applicant review room | `/recruiter/auditions/[id]/applicants` | Capture metrics, stage tabs, and applicant card | "Recruiters review applicants in one connected pipeline." | Shows recruiter core value. |
| Must-have | Applicant detail panel | `/recruiter/auditions/[id]/applicants` | Highlight profile, cover message, self-tape link, notes, and status controls | "Profile, notes, messages, and decisions stay attached to the audition." | Shows workflow depth beyond a list of applicants. |
| Must-have | Admin launch readiness | `/admin/beta-readiness` | Crop readiness band, marketplace health, and safety queue | "Launch readiness combines infrastructure, marketplace, and safety signals." | Shows founder/operator discipline. |
| Must-have | Admin dashboard | `/admin` | Capture trust command center metrics and recent changes | "Admin operations protect the marketplace during beta." | Shows trust layer and operating model. |
| Nice-to-have | Messages inbox | `/messages` | Crop conversation list or empty state plus safety cue | "Messages stay connected to applications." | Supports safety and communication story. |
| Nice-to-have | Notifications timeline | `/notifications` | Capture category tabs and notification cards | "Activity is grouped by applications, messages, auditions, and trust." | Shows continuity after application submission. |
| Nice-to-have | Safety page | `/safety` | Highlight "Never pay to audition" and report guidance | "Safety guidance is visible before problems happen." | Reinforces trust story for parents and reviewers. |
| Nice-to-have | Community guidelines | `/community-guidelines` | Highlight reporting and consequence sections | "Community standards give users clear expectations." | Supports responsible beta posture. |
| Nice-to-have | Founder demo docs | `FOUNDER_DEMO_SCRIPT.md` or `LIVE_DEMO_ROUTE_ORDER.md` | Capture table of route order or opening pitch snippet | "Founder demo flow is prepared for live review." | Shows readiness beyond code. |
| Nice-to-have | Beta onboarding plan | `BETA_ONBOARDING_PLAYBOOK.md` | Crop first 7 days monitoring list | "Controlled beta starts with measured operations." | Shows realistic launch plan. |

## Slide-by-Slide Visual Mapping

Slide 1: Title

- Use `/` brand hero.
- Keep browser chrome minimal.
- Avoid showing logged-in personal details.

Slide 2: Problem

- Use a simple custom diagram in the deck editor, not app screenshots.
- Suggested nodes: social posts, informal chats, forms, spreadsheets, referrals.

Slide 3: Target users

- Use clean icons or cards in the deck editor.
- Avoid stock photos that imply partnerships or real users.

Slide 4: Solution

- Use a simple product loop graphic.
- Optional app crop: landing page product flow section.

Slide 5: Product walkthrough

- Use four-screen collage:
  - `/talent/profile`
  - `/auditions`
  - `/applications`
  - `/recruiter/auditions/[id]/applicants`

Slide 6: Trust and safety

- Use `/admin`, `/admin/beta-readiness`, or `/recruiter/verification`.
- Add small text labels: Verification, Reports, Audit logs, No payment.

Slide 7: Why Telugu/Tollywood first

- Use a text-based regional wedge visual.
- Do not use copyrighted movie posters or celebrity images.

Slide 8: MVP progress and current status

- Use checklist visual plus optional `/admin/beta-readiness` screenshot.
- Include "Controlled beta ready" rather than "fully launched."

Slide 9: Beta launch plan

- Use timeline from `BETA_ONBOARDING_PLAYBOOK.md`.
- Show small cohort numbers only as plan, not traction.

Slide 10: Ask / next step

- Use three cards:
  - Introduce Talent
  - Introduce trusted recruiters
  - Support beta review

## Capture Rules

- Hide bookmarks and unrelated tabs.
- Use demo accounts, not personal accounts.
- Do not show private emails, phone numbers, service accounts, API keys, or
  local `.env` files.
- Do not capture Firebase Console or Vercel environment settings.
- Do not show real message content unless the participant consented and it is
  safe for public presentation.
- Do not use copyrighted film names, celebrity names, or fake traction labels.
- If a page is empty, use the empty state as a strength: it shows the product
  handles low-data launch honestly.

## Recommended Export Set

- `01-title-landing.png`
- `02-problem-workflow-diagram.png`
- `03-target-users.png`
- `04-solution-loop.png`
- `05-product-walkthrough-collage.png`
- `06-trust-admin-readiness.png`
- `07-regional-first.png`
- `08-mvp-progress.png`
- `09-beta-plan.png`
- `10-ask-next-step.png`
