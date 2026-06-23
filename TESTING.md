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

## Design system evolution checks

After deploying the cinematic trust marketplace design system pass, verify manually:

**Status badges** (visible on all pages with audition/application cards):
- [ ] `ACTIVE` badge → teal border/bg (not `green-100`)
- [ ] `DRAFT` badge → gold/amber palette
- [ ] `APPLIED` → steel-blue palette
- [ ] `SHORTLISTED` → gold; `CALLBACK` → deeper gold; `FINAL_ROUND` → deepest gold
- [ ] `SELECTED` → emerald; `REJECTED` → muted red; `WITHDRAWN` → grey
- [ ] All badges have `rounded-md`, no sharp corners

**Audition cards** (`/auditions`):
- [ ] Hovering a card: slight lift (`-translate-y-0.5`), border turns teal, shadow appears
- [ ] Left-border accent: invisible at rest, teal on hover
- [ ] CTA reads "View casting brief" (not "View details")
- [ ] Chips: location has MapPin icon, self-tape has Video icon
- [ ] Applied role: left-border is gold instead of teal

**WorkspaceHero** (all workspace pages):
- [ ] Subtle teal radial gradient visible at top-right of hero header
- [ ] Gold left stripe still visible on left edge

**Recruiter auditions desktop** (`/recruiter/auditions` on desktop):
- [ ] Card rows (not HTML table) visible on lg+ screens
- [ ] Mobile view unchanged (card layout as before)
- [ ] Hover state: border teal, title turns teal, card lifts

**Applications page** (`/applications`):
- [ ] Application meta boxes: dark navy label text, teal-`f7fafb` surface
- [ ] "Next step" panel has teal dot indicator + teal left border

**Applicant review** (`/recruiter/auditions/[id]/applicants`):
- [ ] Talent metadata shows as small branded chips (not plain text)
- [ ] Completeness chip is teal; media count chip is gold

## Production reliability checks

After deploying the production reliability and safe error-state hardening pass, verify
the following manually:

**Error boundaries:**
- [ ] `app/error.tsx` — trigger a route-level error (temporarily throw in a page); the
  branded "Something went wrong." page appears with "Try again" and "Go to workspace" CTAs
- [ ] `app/global-error.tsx` — exists and is code-valid; triggering requires root layout
  to fail; visual check in development via `throw new Error()` in layout
- [ ] Raw `error.message` / `error.digest` content is not visible anywhere in the error UI

**Loading states:**
- [ ] `app/loading.tsx` — navigate between slow routes; branded teal pulse dot appears
  during page transitions (may require network throttle to see)
- [ ] `/notifications` initial load — shows teal pulse `LoadingState`, not plain grey text
- [ ] `/applications` initial load — shows teal pulse `LoadingState`, not plain grey text

**Suspended account state:**
- [ ] Suspend a test account from `/admin/users`
- [ ] Log in as the suspended account — "Contact support" link appears below "Log out"
- [ ] Link navigates to `/help`

**ErrorState secondary CTA:**
- [ ] An `ErrorState` rendered with `secondaryHref="/dashboard"` and
  `secondaryLabel="Go to workspace"` shows both buttons side by side in a flex-wrap row

## Core application experience checks

After deploying the core application experience upgrade pass, verify the following manually:

**Audition detail page** (`/auditions/[id]`):
- [ ] Article and aside use the branded `surface` border/white card style (not raw `border border-[#d9dee5] bg-white`)
- [ ] Back link reads "← Back to auditions" in teal (`text-[#008ca6]`)
- [ ] Recruiter byline is `uppercase tracking-wide` in teal, not `font-semibold text-[#1f5f91]`
- [ ] Role title uses `font-black`, not `font-bold`
- [ ] Detail grid shows Project type, Work mode, Compensation, and Languages when set
- [ ] Apply button matches the `primary-button` global class (rounded, teal bg)
- [ ] Save/bookmark button has `rounded-md` corners
- [ ] "Never pay to audition" `SafetyNotice` appears at the bottom of the article
- [ ] Apply error (if triggered) shows an amber styled block, not a bare red `<p>`
- [ ] Section headings ("About the role", "Requirements") use `font-black`

**Applications page** (`/applications`):
- [ ] Network error or forced-error state shows the `ErrorState` branded card — not a raw amber `<div>`
- [ ] Empty application list shows the `EmptyState` card with "Browse auditions" CTA
- [ ] Recruiter byline reads "Recruiter Name · Applied 3 Jun 2026" (mid-dot `·`, not dash `-`)
- [ ] Status filter description reads "Narrow results to a specific pipeline stage."

**Dashboard** (`/dashboard`):
- [ ] Talent onboarding checklist eyebrow reads "Getting started" (not "Private beta — getting started")
- [ ] Recruiter onboarding checklist eyebrow reads "Getting started" (not "Private beta — getting started")

**Recruiter new audition** (`/recruiter/auditions/new`):
- [ ] Self-tape submission type note reads "Self-tapes use unlisted or private links from YouTube, Vimeo, or a similar platform."
- [ ] No "For beta safety" or "beta" language in the self-tape section

**Messages page** (`/messages`):
- [ ] Page eyebrow reads "Casting inbox" (not "Private casting communication")

## Trust, safety and reporting experience checks

After deploying the trust, safety and reporting experience upgrade pass, verify the following manually:

**Safety page** (`/safety`):
- [ ] Eyebrow reads "Platform safety"
- [ ] h1 reads "Safer casting, every step."
- [ ] Section "Red Flags for Fake Casting Calls" is present
- [ ] Section "How to Report" explains the Report button and confidentiality
- [ ] Section "What Happens After You Report" is present
- [ ] CTA reads "Read community guidelines" — no longer mentions beta feedback

**Community guidelines** (`/community-guidelines`):
- [ ] Description mentions "consequences when those standards are not met"
- [ ] "Reporting Abuse" section does not contain "where available"
- [ ] Last section is titled "Consequences of Violations" and mentions permanent suspension

**Messages inbox** (`/messages`):
- [ ] Page description reads "...never share personal contact details in messages."
- [ ] Page description does not say "until trust is established"

**Conversation detail** (`/messages/[conversationId]`):
- [ ] Compose safety reminder (Talent): reads "Keep all casting communication on Nata Connect. Never share personal contact details or financial information in messages."
- [ ] Compose safety reminder (Recruiter): reads "Keep all communication on Nata Connect and never ask Talent to pay to audition."
- [ ] Neither variant contains "FirstTake"

**Admin reports** (`/admin/reports`):
- [ ] AdminPageHeader description mentions urgent and high priority report types
- [ ] Empty state (open filter, no reports): "New trust and safety reports will appear here as they are submitted."
- [ ] Empty state (other filter, no matches): "Try adjusting the status, target type, reason, or priority filter."
- [ ] Reporter note block shows "Reporter note" label when reasonText is present

**Report priority** (submit test reports to verify):
- [ ] Scam or fraud report → "urgent" priority badge in queue
- [ ] Unsafe contact request → "urgent" priority badge
- [ ] Fake audition → "high" priority (previously medium)
- [ ] Impersonation → "high" priority (previously medium)
- [ ] Spam → "low" priority — unchanged

## Recruiter audition publishing experience checks

After deploying the recruiter audition publishing experience upgrade pass, verify the following manually:

**New casting brief form** (`/recruiter/auditions/new`):
- [ ] Page eyebrow reads "New casting brief"
- [ ] h1 reads "Build a casting call that attracts the right Talent."
- [ ] Body copy mentions "Clear requirements, honest compensation, and a safe process"
- [ ] Recruiter access widget reads "Approved to publish"
- [ ] Error block (trigger by submitting invalid form): amber border/background, no red styling
- [ ] Audition title helper: "Include the role type and project — be specific enough that Talent can tell at a glance if it fits their profile."
- [ ] Location helper: "Talent use location to decide whether they can attend in person."
- [ ] Languages helper: "Comma-separated. Leave blank if the role is open to any language."
- [ ] Role description helper: "Talent uses this to decide if the role fits their skills — include the project context, character brief, and tone."
- [ ] Requirements helper: "Be specific but fair — only list requirements that genuinely affect eligibility."
- [ ] Self-tape enabled: instructions textarea shows safety note "Do not ask Talent to contact you directly outside Nata Connect..."
- [ ] Max duration field label reads "Clip duration limit (seconds)" with helper text about the 90-second example
- [ ] Deadline helper: "Give Talent at least 7 days to prepare and apply."
- [ ] Pay information helper: "Specific compensation helps Talent make an informed decision..."
- [ ] Compensation type helper: "Paid = formal rate; Honorarium = token payment; Unpaid = credit or experience only."
- [ ] "Before you publish" checklist: "Never ask Talent to pay to audition" renders in `font-bold`
- [ ] Publish and Save as draft both work correctly

**Recruiter auditions list** (`/recruiter/auditions`):
- [ ] WorkspaceHero primary CTA reads "Post a casting brief"
- [ ] Empty state title reads "No casting briefs yet"
- [ ] Empty state message mentions "Verified recruiters see stronger applicant response."
- [ ] Empty state action reads "Post a casting brief"

**Recruiter verification** (`/recruiter/verification`):
- [ ] Description reads "...Verified recruiters can publish casting briefs and build Talent trust with a verified badge on every listing."

## Messaging and notifications experience checks

After deploying the messaging and notifications experience upgrade pass, verify the following manually:

**Messages inbox** (`/messages`):
- [ ] Talent empty state reads: "Conversations appear here when a recruiter messages you about an application, or when you message a casting team."
- [ ] Recruiter empty state unchanged: "Applicant conversations will appear here when you message Talent about an audition."
- [ ] Conversation card with no messages shows "No messages yet" (not "Conversation ready")
- [ ] Talent: active conversation type chip reads "Audition conversation"
- [ ] Recruiter: active conversation type chip reads "Applicant conversation"
- [ ] Archived conversation type chip reads "Archived" (regardless of userType)
- [ ] Inbox habits aside (xl screen): third bullet reads "Never share personal contact details in chat."

**Conversation detail page** (`/messages/[conversationId]`):
- [ ] Talent: header eyebrow reads "Audition conversation"
- [ ] Recruiter: header eyebrow reads "Applicant conversation"
- [ ] Compose placeholder reads "Message about the role, next steps, or self-tape."
- [ ] Compose error uses amber styling (not red)
- [ ] Aside section header reads "Platform safety" (not "Trust reminder")
- [ ] Aside description reads "This conversation is linked to the casting call application. Keep next steps and decisions here for a clear, shared record."
- [ ] Talent: return link reads "View in My Applications" → goes to `/applications`
- [ ] Recruiter: return link reads "Open applicant review" → goes to `/recruiter/auditions/{id}/applicants`

**Notifications** (`/notifications`):
- [ ] Applications tab shows `(N)` when there are unread application notifications
- [ ] Messages tab shows `(N)` when there are unread message notifications
- [ ] Tabs show no count badge when there are zero unread items in that category
- [ ] Notification error block: amber styling (not red)
- [ ] Notification timestamp: `font-bold`
- [ ] Empty state on ALL tab: "Application updates, recruiter messages, and casting decisions will appear here."
- [ ] Empty state on APPLICATIONS tab: contains "shortlist, callback, final round"
- [ ] Empty state on MESSAGES tab: mentions "message notifications"
- [ ] Empty state heading for category tabs: "Nothing here yet" (not "No updates here")

**MetricCard detail text** (global, all pages):
- [ ] MetricCard detail text renders `font-bold` on auditions, applications, and dashboard pages

## Applicant pipeline experience checks

After deploying the applicant review and casting pipeline experience upgrade pass, verify the following manually:

**Recruiter applicant review** (`/recruiter/auditions/[id]/applicants`):
- [ ] Header shows audition meta line: Role category · Closes date · Status badge
- [ ] Self-tape count appears in meta line only when self-tape enabled and at least 1 submitted
- [ ] Pipeline summary shows exactly 8 cards in 2 rows of 4 (on sm+): Total, New, Viewed & reviewing, Shortlisted, Callback, Final round, Selected, Rejected
- [ ] Pipeline tabs visible: All, New, Viewed, Reviewing, Maybe, Shortlisted, Callback, Final Round, Selected, Rejected
- [ ] "Reviewing" tab filters to UNDER_REVIEW applicants only
- [ ] "Maybe" tab filters to MAYBE applicants only
- [ ] Expanding a card and opening the timeline: each stage shows status-specific description
- [ ] Current stage in timeline prefixed with "Current —"
- [ ] "Next action" panel visible in expanded aside when status is not WITHDRAWN
- [ ] "Next action" panel NOT shown when application is WITHDRAWN
- [ ] StatusTimeline date uses `font-bold`

**Talent application tracker** (`/applications`):
- [ ] APPLIED "Next step" reads "Waiting for the casting team to open your application."
- [ ] SHORTLISTED "Next step" reads "You made the shortlist. The recruiter may message you about next steps."
- [ ] CALLBACK "Next step" reads "You have a callback. Watch for a message from the casting team."
- [ ] FINAL_ROUND "Next step" reads "You made the final round. The casting team is making their decision."
- [ ] SELECTED "Next step" reads "You were selected. The recruiter will contact you through messages with next steps."
- [ ] REJECTED "Next step" contains "Keep applying — every audition is a separate opportunity."
- [ ] Active view tab description reads "In review or awaiting recruiter action"
- [ ] Shortlisted view tab description reads "Shortlist, callback, and final round"
- [ ] View tab descriptions use `font-bold`
- [ ] SafetyNotice "Never pay to audition" visible at page bottom

**Recruiter auditions list** (`/recruiter/auditions`):
- [ ] Mobile card "Next action:" text uses `font-bold`

## Audition discovery experience checks

After deploying the audition discovery and application conversion upgrade pass, verify the following manually:

**Audition discovery page** (`/auditions`):
- [ ] View description for "All auditions" tab reads: "All active casting calls. Use filters to narrow by category, location, or deadline."
- [ ] View description for "Saved" tab reads: "Roles you bookmarked — review and apply before the deadline closes."
- [ ] View description text uses `font-bold` (not `font-semibold`)
- [ ] MetricCard for visible/saved count shows detail "Matching this search" (not "Current search result")
- [ ] Empty state (saved view, no saves): message contains "Browse all auditions and bookmark the roles that fit your profile."
- [ ] Empty state (all view, no results): message reads "Try removing a filter or clearing all to see every active casting call."
- [ ] SafetyNotice "Never pay to audition" visible at page bottom after load (results or empty)
- [ ] SafetyNotice NOT visible during loading state or error state

**Casting brief detail page** (`/auditions/[id]`):
- [ ] Apply aside shows sub-text: "Your profile and media are included automatically. Use this message to stand out to the casting team."
- [ ] When audition is CLOSED/CANCELLED/DRAFT: amber notice "This audition is no longer accepting applications." appears above textarea
- [ ] When not logged in: apply button reads "Log in to apply"
- [ ] When logged in and audition is ACTIVE: apply button reads "Submit application"
- [ ] Post-apply guidance text "After applying, track your status in My Applications." visible below button

**Dashboard — Recent applications widget** (`/dashboard`):
- [ ] APPLIED status reads: "Waiting for the casting team to open your application."
- [ ] CALLBACK status reads: "You have a callback — watch for a message."
- [ ] SELECTED status reads: "You were selected. Expect a message with next steps."
- [ ] REJECTED status reads: "The casting team moved forward with another applicant."

## Profile and portfolio experience checks

After deploying the talent portfolio and recruiter profile experience upgrade pass, verify the following manually:

**Talent profile** (`/talent/profile`):
- [ ] All form field labels render `font-bold` (not `font-semibold`)
- [ ] "Enable public portfolio page" checkbox label visible (was "Public profile enabled")
- [ ] Verification pending notice reads "verification review queue" with no "private-beta" qualifier

**Public Talent portfolio** (`/t/[slug]`):
- [ ] Profile card has rounded corners (`rounded-md`)
- [ ] Profile photo has rounded corners (`rounded-md`)
- [ ] Skills chips render in neutral grey style with "Skills" label above the group
- [ ] Languages chips render in teal-tinted style with "Languages" label above the group
- [ ] Skills and languages render as two separate rows, not one merged group
- [ ] "Selected work" section has a border and rounded corners
- [ ] Showreel link items have rounded corners
- [ ] Professional links section has rounded corners
- [ ] Footer reads "Casting inquiries go through Nata Connect." with link to `/auth/login`
- [ ] Page 404s for unknown slugs and for profiles with `enabled: false`

**Recruiter profile** (`/recruiter/profile`):
- [ ] All form field labels render `font-bold`
- [ ] Bio section shows teal `PrivacyNote` "Platform safety expectation" (no amber box)
- [ ] `ReadinessChecklist` still shows all 5 items with correct completion states

**Recruiter verification** (`/recruiter/verification`):
- [ ] Page title reads "Company verification" (not "Private-beta verification")
- [ ] Success message reads "Verification submitted. The trust team will review your details and get back to you."
- [ ] Documents section copy contains no "beta" qualifier

**Applicant review** (`/recruiter/auditions/[id]/applicants`):
- [ ] TalentChip row shows experience level between category and location chips
- [ ] "Portfolio" button visible in card action row when talent has a publicSlug; opens `/t/[slug]` in new tab
- [ ] Expanded "Talent profile" section shows Skills and Languages as two labeled rows
- [ ] "View public portfolio →" link appears in expanded section when talent has publicSlug
- [ ] `ApplicantDetail` values render `font-bold` (not `font-semibold`)

## Role onboarding and first-session experience checks

After deploying the role onboarding and first-session experience upgrade pass, verify the following manually:

**Signup page** (`/auth/signup`):
- [ ] No "Private beta — controlled rollout" banner above the role picker
- [ ] No link to `/beta-feedback` appears on the signup page
- [ ] Role picker and form are the first visible elements after the page header
- [ ] Submit with mismatched passwords: error block is amber (`bg-amber-50 border-amber-300 text-amber-900`), `rounded-md`, `font-bold`
- [ ] No red error styling visible anywhere on the signup page

**Login page** (`/auth/login`):
- [ ] Submit with wrong password: error block is amber (`bg-amber-50 border-amber-300 text-amber-900`), `rounded-md`, `font-bold`
- [ ] No red error styling visible anywhere on the login page

**Email verified page** (`/auth/email-verified`):
- [ ] Open while signed in and verified: description reads "Your Nata Connect account trust status is up to date."
- [ ] Open while signed out: description reads "Sign in to finish updating your Nata Connect account status."
- [ ] During status check: description reads "Nata Connect is refreshing your secure account status."
- [ ] Trust explanation body reads "Email verification helps keep Nata Connect trusted for Talent, Recruiters, and casting teams."
- [ ] No occurrence of "FirstTake" anywhere on this page in any state

**Email verification prompt** (visible on `/talent/profile`, `/recruiter/profile`, `/dashboard` while unverified):
- [ ] Click "Send verification email"
- [ ] Status message reads "Open the link in your inbox, then return here. Nata Connect will check your account status automatically."
- [ ] No occurrence of "FirstTake" in this message

**Recruiter onboarding checklist** (`/dashboard` — sign in as a new Recruiter with 0 auditions):
- [ ] Checklist is visible below the hero when 0 auditions posted
- [ ] "Verify your email" step is unchecked if email is unverified, checked if verified
- [ ] "Complete your company profile" step reflects actual profile data — NOT pre-checked when profile fields are empty
- [ ] Steps with `done: false` and an href render as teal links (not plain text, not strikethrough)
- [ ] Counter "N/4 done" shows the real completion count

## Private beta launch system checks

After deploying the private beta launch system, verify the following manually:

**Beta feedback form** (`/beta-feedback`):
- [ ] "Private beta — controlled rollout" banner visible above form
- [ ] Severity dropdown shows all four options: Low, Medium, High, Blocking
- [ ] `performance` type appears in the Feedback type dropdown
- [ ] Submitting with `blocking` severity saves to Firestore with `severity: 'blocking'`

**Dashboard onboarding checklists**:
- [ ] Sign in as a new Talent with zero applications — checklist appears below hero
- [ ] Complete a step (e.g. verify email) — corresponding item shows ticked/strikethrough
- [ ] Submit one application — checklist disappears from Talent dashboard
- [ ] Sign in as a new Recruiter with zero auditions — checklist appears below hero
- [ ] Post one audition — checklist disappears from Recruiter dashboard

**Signup page**:
- [ ] Private beta notice visible above the signup form in production

**Admin beta feedback** (`/admin/beta-feedback`):
- [ ] Type filter dropdown shows all six types
- [ ] Blocking items display a danger-tone severity badge
- [ ] Feedback list sorted: blocking before high before medium before low

**Admin dashboard** (`/admin`):
- [ ] "Beta control center" card visible with four links
- [ ] All four links resolve to the correct admin routes

## Admin operations hardening checks

Use an admin account to verify the following after the admin operations
hardening pass:

**Reports page** (`/admin/reports`):
- [ ] Open any report — "Reporter" field shows role only (e.g., `talent`), no UID
- [ ] "Target owner" shows last 8 characters only (e.g., `…abc12345`)
- [ ] Expand "Safe evidence snapshot" — shows key/value list, not raw JSON; any
      field whose name ends in `id` or `uid` shows `[internal reference]`
- [ ] Expand audit trail — actor shows `Admin`, not a raw Firebase UID
- [ ] All action buttons still require a reason for destructive actions
  (resolve, dismiss, suspend, remove, hide)

**Users page** (`/admin/users` on desktop ≥ 1024px):
- [ ] Card-row layout visible — no HTML table
- [ ] A user with `emailVerified: false` shows an amber "Email unverified" badge
- [ ] A suspended user shows a red badge alongside any email-verification state
- [ ] Mobile view (< 1024px) also shows email-verified badge when applicable

**Admin dashboard** (`/admin`) urgency callout:
- [ ] When recruiter or Talent verification queues have pending items, amber
      "Action needed now" banner appears below the hero with an accurate count
- [ ] When all queues are empty, the amber banner is absent
- [ ] Operational summary shows curated stats in priority order (users →
      talent → recruiters → approved → auditions → applications → self-tape)

## Admin experience continuity checks

Use an admin account and review the following routes after the Admin continuity
pass:

- `/admin` shows the command-center hero, trust metrics, verification queue,
  platform trust summary, and recent privileged actions.
- `/admin/verifications` shows recruiter verification metrics, trust-focused
  guidance, status badges, and clear approve/reject/suspend/restore actions.
- `/admin/talents` separates profile completion, verification signals,
  portfolio review, and account safety.
- `/admin/auditions` distinguishes active, closed/draft, visible, and removed
  casting calls with clearer marketplace enforcement actions.
- `/admin/audit-logs` shows human-readable action labels, actor, target, note,
  time, and action filtering.
- Secondary admin routes use safe recovery copy when data cannot be loaded.

Mobile QA checklist:

- In an iPhone-sized viewport, `/admin` shows the Nata Connect brand header,
  notification control, compact admin menu button, and immediate command-center
  content without a full desktop sidebar.
- The Admin bottom navigation shows Dashboard, Verify, Moderate, Logs, and
  More, and the active state follows the current admin section.
- More opens the full trust-operations menu without horizontal overflow.
- `/admin/verifications`, `/admin/talents`, `/admin/auditions`, and
  `/admin/audit-logs` keep cards, metrics, actions, and audit rows readable on
  mobile.
- Compare `/dashboard`, `/auditions`, `/applications`, and
  `/recruiter/auditions` with Admin mobile pages to confirm they feel like one
  application shell.

This pass is UI and copy only. It does not change Firestore rules, admin
claims, API permissions, database schema, or Firebase deployment requirements.

## Full mobile product QA checklist

Run this pass in a narrow phone viewport and compare Talent, Recruiter, and
Admin as one product:

- `/` shows the brand, Telugu name, primary actions, readable hero text, and no
  horizontal overflow.
- `/dashboard`, `/auditions`, `/applications`, `/messages`, and `/profile`
  use the unified mobile header and bottom navigation with reachable controls.
- `/profile` redirects the signed-in user to the correct role-specific profile
  or Admin workspace.
- `/recruiter/auditions` and `/recruiter/verification` keep hero copy, cards,
  safety notices, forms, and action buttons readable on mobile.
- `/admin`, `/admin/verifications`, `/admin/talents`, `/admin/auditions`, and
  `/admin/audit-logs` use the compact Admin header, bottom trust navigation,
  and safe admin copy.
- Empty, loading, and error states use product-safe language such as "We could
  not load this section. Try refreshing the page."
- Confirm there is no content hidden behind the browser bottom bar or app
  bottom navigation, and no raw service, index, permission, claim, or document
  wording appears to normal users.
- Confirm the final micro-polish pass keeps mobile heroes compact, metric-card
  accents subtle, bottom safe-area spacing comfortable, and dashboard email
  verification prompts clear without feeling oversized.

## End-to-end product flow QA checklist

Run this pass after any significant UI change to confirm that core user
journeys are still intact across all three roles:

Talent:
- Dashboard shows workspace hero, next-best-action CTA, application metrics,
  and secondary cards without dead buttons or broken links.
- `/auditions` loads active casting calls, filters by category/experience/
  location/language, sorts by relevance/deadline, and saves/unsaves roles.
- `/auditions/[id]` shows role detail, apply form, self-tape note if enabled,
  and a recruiter-owned view for the recruiting account.
- `/applications` shows all statuses, self-tape panel where needed, message
  button, and a working withdraw flow.
- `/notifications` filters by type, marks all read, and shows empty state.
- `/messages` shows conversation list with search and filters.
- `/messages/[id]` loads and sends messages safely.
- All error states use product-safe copy — no Firebase, Firestore, or
  permission wording visible to users.

Recruiter:
- `/recruiter/verification` shows the current status, form, and trust guidance
  — no "coming soon" or disabled-upload CTAs visible.
- `/recruiter/auditions/new` creates an audition with all required fields —
  no "Direct upload coming soon" checkbox visible in the self-tape section.
- `/recruiter/auditions` lists live briefs with applicant counts linking to
  the pipeline.
- `/recruiter/auditions/[id]/applicants` lets the recruiter move applicants
  through stages, send messages, set ratings and notes, and reject with reason.

Admin:
- `/admin` shows the command-center hero with correct verification queue counts
  and recent audit log rows.
- `/admin/verifications` and `/admin/talents` show correct pending counts and
  clear approve/reject/suspend actions.
- All admin action buttons require a reason for destructive actions and display
  user-safe error copy on failure.
- Empty states use `AdminEmptyState` rather than raw empty list renders.

Cross-role:
- No broken links or dead buttons across all three roles.
- Mobile bottom nav clears browser bottom bar on iPhone-sized viewport.
- Switching between Talent and Recruiter accounts in separate tabs shows the
  correct role-aware shell without cross-contamination.

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
- Shared Talent/Admin profile completeness rules
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
6. Confirm the inbox shows participant, audition title, application status,
   unread state, and last-message time.
7. Confirm All, Unread, Active, and Archived filters behave as expected.
8. Confirm the thread sidebar shows audition context and application status.
9. Confirm role-aware safety reminders appear in the message composer.
10. Confirm email addresses and phone numbers are blocked.
11. Confirm unrelated accounts cannot access the conversation.
12. Withdraw the application and confirm messaging becomes unavailable.
13. As Admin, block the conversation from `/admin/messages` with a reason.

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

## Product experience QA checklist

Use this after marketplace or workspace UI changes:

1. Open `/` on mobile and desktop and confirm the hero, how-it-works section,
   Talent/Recruiter value props, trust section, and footer feel connected.
2. Log in as Talent and open `/auditions`. Confirm search, saved/all toggle,
   metrics, filter chips, sort dropdown, saved state, applied state, and empty
   states do not overlap or overflow.
3. Open `/applications` and confirm Active, Shortlisted, Completed, and All
   views show meaningful counts, next actions, self-tape state, messages, and
   respectful closed-state copy.
4. Log in as Recruiter and open `/recruiter/auditions`. Confirm active calls,
   applicant totals, self-tape briefs, drafts, review applicant CTAs, and the
   professional safety reminder are visible on mobile and desktop.
5. Open `/messages` and `/notifications` for both roles and confirm unread
   states, action labels, and related audition/application context are clear.
6. Open Admin pages and confirm trust, verification, moderation, public profile,
   and completeness concepts are not mixed together.
7. Search visible UI for implementation wording such as database/index/provider
   setup details. Normal Talent and Recruiter users should see product-safe
   guidance instead.
8. Confirm no payment, subscription, document-upload, or billing workflow was
   introduced.

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
6. Confirm the Applications, Messages, Auditions, and Trust / Account filters
   show only their matching activity types.
7. Confirm notification cards show a category badge, readable message, unread
   marker, timestamp, and clear action label.
8. Confirm Viewed appears as in-app activity but does not map to an email
   preference category.
9. Confirm Callback and Final Round remain application email categories when
   email delivery is configured.
10. Withdraw a non-rejected application and confirm both roles receive the
   correct update.
11. Submit Talent and Recruiter verification requests and confirm the submitting
   user and each Admin receive their appropriate notification.
12. Mark one item read, then use **Mark all as read** and verify the bell count
   reaches zero.
13. Confirm a second signed-in account cannot read or modify the first account's
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
3. Confirm required missing fields and recommended actions are clear.
4. Confirm verification cannot be submitted below 70%.
5. Save a profile at or above 70% and submit it for review.
6. Confirm the status becomes `pending` without blocking auditions/applications.
7. Log in as Admin and open `/admin/talents`.
8. Confirm the Admin profile completeness percentage matches `/talent/profile`.
9. Confirm verification status, public profile status, and portfolio moderation
   are shown separately from profile completeness.
10. Reject with a reason, then confirm Talent can fix the profile and resubmit.
11. Verify the Talent and confirm the badge appears in the recruiter applicant
   pipeline.
12. Suspend and restore the Talent, confirming both audit-log events appear.

Completeness should reach 100% when the required profile source-of-truth items
are present: name, category, experience, location, 80+ character bio, at least
one portfolio signal, and at least one skill plus one language. Email
verification, Talent verification, public-profile state, profile photo, and
portfolio moderation are separate trust or presentation signals.

Talent review test records should use an `E2E_TEST_` name and should be removed
from `talentVerifications`, the Talent profile, and `auditLogs` after destructive
manual testing.

Document upload must remain disabled during beta verification until a secure
document-review workflow is available.

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
3. Confirm audition title, category, deadline, status, total applicants,
   stage counts, and self-tape submission count render.
4. Confirm tabs work for All, New, Viewed, Shortlisted, Callback, Final Round,
   Selected, and Rejected.
5. Move the application through Viewed, Shortlisted, Callback, Final Round,
   Selected, and Rejected with the owning Recruiter account.
6. Confirm status timestamps, status history, and last action information update.
7. Add a private note, one or more tags, and a 1-5 rating.
8. Refresh and confirm private review data persists.
9. Confirm Shortlisted, Callback, Final Round, Rejected, and Selected create
   Talent notifications.
10. Confirm Viewed, note, tag, and rating changes do not create notification
    spam.
11. If self-tape is required, submit an external link from `/applications` and
    confirm the recruiter can open it from the applicant card/panel.
12. Withdraw a separate application as Talent and confirm it becomes
    read-only in the recruiter pipeline.
13. Confirm another Recruiter cannot read or update the application.
14. Confirm Talent cannot write recruiter status, notes, tags, or ratings.
15. Confirm no payment, subscription, document upload, or file upload workflow
    appears in this applicant review phase.

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

## Beta Launch Readiness Checks

Run this pass immediately before inviting first beta users. It combines the
production smoke flow with first-user-experience validation.

### Pre-launch commands

```powershell
npm run lint
npm test
npm run build
git diff --check
```

All four must pass before proceeding.

### Production environment verification

1. Confirm all required Vercel environment variables are set (see
   `BETA_LAUNCH_READINESS_CHECKLIST.md` section 1.2).
2. Confirm `NEXT_PUBLIC_SHOW_TEST_CASES` is NOT set in Vercel.
3. Open the production URL and confirm the landing page loads without a
   browser console error.
4. Open browser DevTools Network tab and confirm no Firebase API keys or
   service-account values appear in any response body.
5. Open `/admin/beta-readiness` as Admin and confirm environment check results.

### First-user onboarding validation

1. Open the production URL in a private browser window (no cookies, no session).
2. Confirm the landing page has a "Join the beta" or "Get started" CTA.
3. Sign up as a new Talent account using a real email address.
4. Confirm redirect to the correct role workspace.
5. Email verification prompt appears when email is unverified.
6. Complete the Talent profile from scratch (no presets available in production).
7. Confirm profile completeness score increases with each saved field.
8. Browse `/auditions` and apply to one audition.
9. Open `/applications` and confirm the application appears with the correct status.
10. Open `/beta-feedback` and submit one test feedback item.

### Public and trust page verification

- [ ] `/` — landing page loads correctly
- [ ] `/terms` — renders as a beta draft, clearly labeled
- [ ] `/privacy` — renders as a beta draft, clearly labeled
- [ ] `/community-guidelines` — renders with appropriate beta copy
- [ ] `/safety` — "Never Pay to Audition" warning is visible
- [ ] `/help` — help center loads correctly
- [ ] `/contact` — loads without a hardcoded placeholder email
- [ ] `/beta-feedback` — form loads and can be submitted while signed out

### Error copy audit

In an incognito window with DevTools network throttle set to Slow 3G:

- Apply to an audition and confirm slow-load states show retry actions.
- Confirm no error state ever shows "Firebase", "Firestore",
  "permission denied", "Missing or insufficient permissions", or a stack trace.
- Confirm all error messages use product-safe language.

### Mobile launch checklist

Run in Chrome DevTools mobile simulation at 390×844 (iPhone 14):

- [ ] Landing page — no horizontal scroll
- [ ] Auth pages — usable on mobile keyboard
- [ ] Talent dashboard — bottom nav clears browser bar
- [ ] Auditions list — scrollable, filterable
- [ ] Audition detail — apply button is reachable
- [ ] Applications — status readable, actions reachable
- [ ] Messages — list and conversation usable
- [ ] Notifications — list readable, mark-all-read works
- [ ] Recruiter auditions — cards readable
- [ ] Admin dashboard — compact header, bottom trust nav visible

### Known limitations to confirm before launch

Verbally confirm each limitation is acceptable for the invited beta cohort:

- [ ] No document upload — manual review only
- [ ] No direct self-tape video upload — external links only
- [ ] No payments — compensation is recruiter-provided context only
- [ ] Email delivery requires provider setup — in-app notifications only without it
- [ ] Verification is manual admin review — no automated approval
- [ ] Legal pages are beta drafts — not final legal documents

### Launch go/no-go

**Ready for controlled private beta when:**

- All four pre-launch commands pass
- Admin `/admin/beta-readiness` shows no critical gaps
- At least one full Talent and one full Recruiter journey pass in production
- All known limitations have been accepted and communicated to beta users
- A support contact point is monitored
- At least one admin operator is available for the first beta week

## Live Production Beta Smoke Test Checklist

Run this checklist against the live Vercel deployment before inviting beta users.

### Public routes (verifiable without auth)
1. Open `/` and confirm brand ("FirstTake by MVA Studios", "Nata Connect",
   "నట కనెక్ట్"), headline, and CTA buttons render correctly.
2. Open `/auth/login` and confirm no test panel is visible. No raw Firebase
   errors. Email + password form loads.
3. Open `/auth/signup` and confirm Talent/Recruiter role selection. No billing,
   storage, or "coming soon" upload copy.
4. Open `/auth/forgot-password` and confirm email field + reset link button.
5. Open `/auth/email-verified` and confirm verification-check page loads.
6. Open `/help`, `/safety`, `/community-guidelines`, `/terms`, `/privacy`,
   `/contact`, `/beta-feedback` and confirm all load with no placeholder text
   and appropriate beta disclaimers.
7. Open an unknown route (e.g. `/does-not-exist`) and confirm the branded
   404 page shows ("This page does not exist" + Back to home + Help center).
8. Confirm no secrets, Firebase SDK keys, or service account values appear in
   browser DevTools → Network → page source.

### Auth behavior (verifiable with accounts)
9. Sign up as a new Talent user. Confirm email verification prompt appears.
10. Send verification email. Confirm email arrives with the production URL (not
    `localhost:3000`).
11. Open the email link. Confirm `/auth/email-verified` is the redirect target.
12. Return to dashboard. Confirm verification prompt disappears.
13. Log out. Confirm redirect to `/auth/login`.
14. Try to access `/dashboard` without logging in. Confirm redirect to login.
15. Log in as a non-admin. Try to access `/admin`. Confirm "Administrator access
    required" page shows.

### Talent flow (authenticated)
16. Open `/dashboard` as Talent at 1280px. Confirm hero and workspace cards are
    above the fold.
17. Open `/talent/profile`. Confirm completeness score and save works.
18. Open `/auditions`. Confirm audition cards load and filters work.
19. Apply to an active audition. Confirm application appears in `/applications`.
20. Open `/messages`. Confirm conversations load.
21. Open a read-only conversation (closed application). Confirm amber read-only
    banner shows above composer.
22. Open `/notifications`. Confirm mark-all-read works.

### Recruiter flow (authenticated)
23. Open `/recruiter/verification`. Confirm status badge pill renders.
24. Open `/recruiter/auditions/new`. Confirm "Before you publish" shows
    structured checklist.
25. Open `/recruiter/auditions/[id]/applicants`. Confirm metrics show 2 rows
    (6-col grid on xl screen, 3-col on sm).
26. Confirm "Casting calls" nav item is NOT active when on the applicants page.
27. Confirm "Applicants" nav item IS active on the applicants page.

### Admin flow (admin account required)
28. Log in as admin. Confirm admin dashboard loads with metric cards.
29. Open `/admin/verifications`. Confirm pending queue loads.
30. Open `/admin/beta-readiness`. Confirm known limitations checklist renders.
31. Confirm admin moderation actions require confirmation before executing.

## Laptop UX Polish Regression Checks

Run after any deployment that includes the Laptop Screen Recording UX Polish Pass:

1. Open `/dashboard` as Talent at 1280px width. Confirm the next-best-action
   card and profile readiness card are visible above the fold without scrolling.
2. Open `/dashboard` as Recruiter at 1280px. Confirm stat cards appear without
   excessive vertical space.
3. Open `/recruiter/auditions/[id]/applicants`. Confirm metrics show 2 rows
   (6 columns on xl, 3 on sm), not 3 rows.
4. Navigate to `/recruiter/auditions/[id]/applicants` and confirm only
   "Applicants" is highlighted in the sidebar — not "Casting calls".
5. Navigate to `/recruiter/auditions` (exact URL) and confirm only "Casting
   calls" is highlighted — not "Applicants".
6. Open a read-only conversation (closed application) and confirm the amber
   read-only banner appears above the message composer.
7. Open `/notifications`. Confirm cards are compact with no redundant "Unread"
   badge — unread items should only show a colored dot and blue border.
8. Open `/recruiter/verification` and confirm the status badge is a compact
   rounded pill.
9. Open `/recruiter/auditions/new` and confirm the "Before you publish" sidebar
   card shows a structured checklist with four items.
10. Confirm email verification prompt shows the compact design on both Talent
    and Recruiter dashboards (no large banners).

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
