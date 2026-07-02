# Changelog

### Application Tracking and Full Flow Polish

- Fixed `/applications` data consistency by keeping the Talent application
  tracker on the intended `collectionGroup('applications')` query and removing
  the blocked all-auditions fallback.
- Application detail hydration is now resilient per application: if an audition
  detail cannot refresh, the application status still renders.
- `/applications` no longer converts a failed application fetch into an empty
  list. It now shows a retryable error state with a link to Notifications.
- Status board metrics and tab counts are hidden until the application fetch
  succeeds, preventing misleading zeroes.
- Centralized application tracker grouping in `application-pipeline.ts`:
  Active, Shortlisted, Completed, and All.
- Added tests for callback/final-round grouping, completed grouping, failed
  fetch empty-state protection, legacy application summaries, and the exact
  Firestore collection group query used by the tracker.
- Created `APPLICATION_TRACKING_AND_FULL_FLOW_POLISH_REPORT.md`.

### Recruiter Talent Pool and Private Casting CRM

- Added `RecruiterTalentPoolEntry` and `TalentPoolStatus` to `app/lib/types.ts`
  for recruiter-owned saved Talent records with display snapshots, bounded
  private notes, tags, source audition context, and status.
- Added `app/lib/recruiter-talent-pool-policy.ts`, a pure helper for Talent Pool
  status labels/tones, tag normalization, note validation, unsafe language
  detection, safe guidance copy, and empty-state copy.
- Added Firestore service helpers for saving, loading, updating, and removing
  recruiter Talent Pool entries. Deterministic IDs prevent duplicate entries for
  the same recruiter/Talent pair in normal use.
- Added `recruiterTalentPool/{entryId}` Firestore rules so only the owning
  recruiter can create/read/update/delete their entries. Talent, unrelated
  recruiters, and unauthenticated users cannot read private recruiter notes.
- Updated `/recruiter/auditions/[id]/applicants` with an inline "Private Talent
  Pool" panel in expanded applicant review. This does not change application
  status transitions or Talent-visible application history.
- Added `/recruiter/talent-pool` with metrics, status filter, search, private
  note previews, tags, source audition links, public portfolio links when
  available, and remove action.
- Added a recruiter navigation item for Talent Pool.
- Added `tests/recruiter-talent-pool-policy.test.mts` and updated
  `tests/firestore.rules.mts` with privacy and validation emulator coverage.
- Created `RECRUITER_TALENT_POOL_PRIVATE_CASTING_CRM_REPORT.md`.
- No AI, automatic ranking, automatic selection, payment, calendar, video call,
  self-tape upload, fake data, guaranteed casting, or private Talent data
  exposure was added.

### Casting Application Kit and Screening Questions

- Added `app/lib/casting-application-kit-policy.ts`, a self-contained, rule-based
  policy module with no cross-module imports beyond `types.ts`. Exports constants,
  validation, safety flag detection, normalization, templates, answer sanitization,
  Talent-facing summaries, and Recruiter-facing review helpers.
- Added `ScreeningQuestionType`, `ScreeningQuestion`, and `ScreeningAnswer` to
  `app/lib/types.ts`. Added `screeningQuestions?: ScreeningQuestion[]` to `Audition`
  and `screeningAnswers?: ScreeningAnswer[]` to `Application`.
- Added `screeningQuestions` size limit (≤ 8) to Firestore rules for both audition
  create and update paths.
- Updated `app/lib/firestore-service.ts`: `createAudition` accepts
  `screeningQuestions`; `submitApplication` accepts and passes `screeningAnswers`.
- Updated `app/api/applications/route.ts` POST handler: accepts
  `screeningAnswers` from request body, sanitizes each answer inline (trim,
  enforce type-specific size limits, filter unknown shapes), and stores sanitized
  answers alongside the application document.
- Updated `app/recruiter/auditions/new/page.tsx`: added "04 · Casting Application
  Kit" section with up to 8 editable questions, template picker (6 templates),
  inline safety flag warnings, options editor for choice questions, and counter.
  Publishing section renumbered to "05 · Publishing". Questions are normalized and
  passed to `createAudition` on submit.
- Updated `app/auditions/[id]/page.tsx`: Talent apply form now shows inline
  screening questions when the audition has them. Required questions must be
  answered before submission. Answers are passed to `submitApplication`.
- Updated `app/recruiter/auditions/[id]/applicants/page.tsx`: `ScreeningAnswersPanel`
  added to `ApplicantCard` expanded view (after "Application message", before
  "Status timeline") using `getRecruiterScreeningReview` to display formatted
  answer rows per question.
- Updated `app/applications/page.tsx`: pack tags row shows a "N screening answer(s)"
  cue when `application.screeningAnswers` is present.
- Added `tests/casting-application-kit-policy.test.mts` with 38 test cases covering
  safety flag detection, question validation, multi-question validation, normalization,
  checklist generation, template validation, answer sanitization, answer validation,
  screening summaries, recruiter review, and Talent guidance.
- Added 4 Firestore rules emulator tests for screeningQuestions size limit
  (create reject over 8, create allow up to 8, update reject over 8, update allow up to 8).
- No AI, no auto-ranking, no auto-selection, no payment, no fake data, no guaranteed
  casting, no private data exposure, no security weakening.

### Audition Share Kit and Public Opportunity Page

- Added `app/lib/audition-share-kit-policy.ts`, a pure, rule-based helper for
  share readiness bands, share kit checklists, safe share copy templates, public
  opportunity summaries, public safety notes, and improvement tips. Self-contained
  module with no cross-module imports beyond `types.ts`.
- Added `OpportunityShareKitPanel` to `/auditions/[id]` showing a structured
  public opportunity context card: casting source, category, location, deadline,
  compensation, self-tape note, share copy (owner-only), missing item tips
  (owner-only), safety notes, and disclaimer.
- Added `ShareReadinessPill` to `/recruiter/auditions` for both mobile card view
  and desktop row view, showing share readiness band (Share-ready, Good
  opportunity page, Needs brief detail, Needs trust review) alongside Brief
  Quality and Source Transparency pills.
- Added share kit improvement tips to the recruiter auditions list: missing item
  count tip for addressable gaps, and a "ready to share" confirmation for
  share-ready briefs.
- Added `tests/audition-share-kit-policy.test.mts` with 26 test cases covering:
  band assignment for all four bands, self-tape instruction completeness, share
  copy language safety, safety note content, public summary structure, missing
  item filtering, copy template output, and improvement tip safety for
  `needs_trust_review`.
- No new public route, Firestore rules, schema changes, AI, auto-ranking,
  payment, calendar, video calls, direct video upload, self-tape video upload,
  fake data, celebrity names, copyrighted project names, guaranteed casting
  claims, certificate language, or private data exposure was added.

### Talent Opportunity Radar and Career Command Center

- Added `app/lib/talent-opportunity-radar-policy.ts`, a pure, rule-based helper
  for Talent opportunity guidance, command-center summaries, next actions,
  opportunity buckets, profile growth plans, application focus, safety focus,
  and empty states.
- Upgraded `/dashboard` for Talent into a Career Command Center with metrics,
  next actions, Opportunity Radar preview, application focus, profile/passport
  readiness, saved audition continuity, messages, and safety links.
- Updated `/auditions` and `components/audition-card.tsx` with lightweight
  Talent-facing cues such as Profile-ready, Worth reviewing, Prepare first,
  and Needs safety review.
- Added a compact Application Focus section to `/applications` for active
  applications, callback/final activity, self-tape needs, and unread messages.
- Added a Growth Plan section to `/talent/profile` using existing profile and
  media fields to explain what improves Talent Passport and Public Casting
  Passport readiness.
- Added `tests/talent-opportunity-radar-policy.test.mts`.
- Created `TALENT_OPPORTUNITY_RADAR_CAREER_COMMAND_CENTER_REPORT.md`.
- No Firestore rules, schemas, APIs, auth permissions, payment, AI, calendar,
  video calls, direct video upload, self-tape video upload, fake data,
  automatic ranking, or guaranteed casting claims were added.

### Recruiter Casting Slate and Decision Room

- Added `app/lib/casting-slate-policy.ts`, a pure, rule-based helper for
  recruiter slate grouping, stage counts, applicant decision readiness,
  review checklists, next actions, and safety notes.
- Added a Casting Slate overview to
  `/recruiter/auditions/[id]/applicants` with review-ready counts,
  self-tape pending counts, stage-safe next action copy, and safety reminders.
- Added a Casting Decision Room panel to expanded applicant review using
  existing application, Talent profile, portfolio, self-tape, note, tag, and
  rating fields.
- Updated `/recruiter/auditions` so recruiter-owned briefs clearly route to
  the decision room without pretending stage counts are available on the list.
- Added Talent-facing stage clarity copy to `/applications`, explaining that
  statuses are progress signals and not guaranteed work.
- Added `tests/casting-slate-policy.test.mts` covering stage grouping,
  slate counts, self-tape readiness, closed statuses, checklist output, empty
  states, next actions, and safety language.
- Created `RECRUITER_CASTING_SLATE_DECISION_ROOM_REPORT.md`.
- No Firestore rules, schemas, APIs, auth permissions, payment, AI, direct video
  upload, self-tape video upload, fake data, applicant ranking, or guaranteed
  casting claims were added.

### Talent Share Kit and Public Casting Passport

- Added `app/lib/talent-share-kit-policy.ts`, a pure, rule-based helper for
  public profile readiness, Share Kit checklists, safe share copy templates,
  public-safe recruiter visibility notes, and privacy reminders.
- Added a Talent Share Kit panel to `/talent/profile` with readiness band,
  public link cue, missing items, share copy templates, and privacy notes.
- Updated `components/talent-media-manager.tsx` so the profile page can evaluate
  actual active public media choices while keeping private media private.
- Upgraded `/t/[slug]` into a Public Casting Passport with identity metrics,
  public media count, trust cue, casting identity summary, and FirstTake /
  Nata Connect sharing context.
- Added a lightweight Public Casting Passport cue to `/applications`.
- Added a recruiter-facing passport context cue to expanded applicant review in
  `/recruiter/auditions/[id]/applicants`, explicitly as guidance only.
- Added `tests/talent-share-kit-policy.test.mts` covering share-ready profiles,
  missing public details, private/document media exclusion, privacy notes, safe
  share copy, checklist safety, and empty fallback text.
- Created `TALENT_SHARE_KIT_PUBLIC_CASTING_PASSPORT_REPORT.md`.
- No Firestore rules, schemas, APIs, auth permissions, payment, AI, direct video
  upload, self-tape video upload, fake data, or guaranteed casting claims were
  added.

### Recruiter Trust Passport and Source Transparency

- Added `app/lib/recruiter-trust-passport-policy.ts`, a pure, rule-based helper
  for recruiter source transparency, trust bands, public-safe signals,
  recruiter improvement tips, Talent guidance, and Admin review cues.
- Added source transparency chips to audition cards and recruiter audition
  rows, alongside existing casting brief quality cues.
- Expanded `/auditions/[id]` with a combined source transparency panel showing
  casting source, brief quality, public-safe recruiter signals, on-platform
  communication guidance, and never-pay safety context.
- Added Recruiter Trust Passport readiness to `/recruiter/profile` and
  `/recruiter/verification`; private verification evidence remains visible only
  through existing recruiter/Admin review flows.
- Added Admin-facing source transparency summaries to `/admin/verifications`
  and `/admin/auditions` without exposing private evidence, storage paths, or
  admin notes through the policy helper.
- Added `tests/recruiter-trust-passport-policy.test.mts` covering verified
  sources, missing source detail, rejected/suspended states, weak brief caution,
  payment-request caution, public-safe signal filtering, evidence redaction, and
  no fake automation/certificate language.
- Created `RECRUITER_TRUST_PASSPORT_SOURCE_TRANSPARENCY_REPORT.md`.
- No Firestore rules, schemas, APIs, auth permissions, payment, AI, fake data,
  direct video upload, or self-tape video upload changed.

### Casting Journey Timeline and Application Proof Receipts

- Added `app/lib/casting-journey-policy.ts` — self-contained policy module with
  rule-based journey steps (4–9 per application), proof checklist, proof receipt
  with safe disclaimer, talent guidance, and recruiter journey summary. Inlines
  status labels and next-step messages to avoid cross-module resolution issues.
- Added `getCastingJourneySteps`: reveals stages progressively; MAYBE maps to
  UNDER_REVIEW rank; duck-typed date helper handles Firestore Timestamp and Date.
- Modified `app/applications/page.tsx`: added `CastingJourneyProof` component
  showing proof chips, step-by-step timeline with status icons, and platform
  record disclaimer under each application card.
- Modified `app/auditions/[id]/page.tsx`: detects if current Talent has already
  applied and shows `AlreadyAppliedPanel` (pack checklist, next step, trust cues)
  instead of the apply form.
- Added `getTalentApplicationForAudition` to `app/lib/firestore-service.ts` —
  direct doc read at `auditions/{id}/applications/{talentId}`.
- Modified `app/recruiter/auditions/[id]/applicants/page.tsx`: added
  `RecruiterJourneySummaryPanel` showing submitted date, status, self-tape status,
  pack readiness, and guidance-only safety note per applicant.
- Added `tests/casting-journey-policy.test.mts` with 39 unit tests. Total: 197.
- Created `CASTING_JOURNEY_TIMELINE_PROOF_RECEIPTS_REPORT.md`.
- No Firestore rules, schemas, APIs, auth permissions, payment, AI, fake data,
  direct video upload, or self-tape video upload changed.

### Message Safety Coach and On-Platform Trust Guard

- Added `app/lib/message-safety-policy.ts` with rule-based (no AI) message
  safety helpers covering payment language, off-platform pressure, unrelated
  document requests, guaranteed role claims, and urgency pressure — each with
  a severity level and a plain-language detail string.
- Added a dynamic safety coach to the message composer in
  `/messages/[conversationId]`: visible only when body length exceeds 15
  characters and a risk signal is detected; shows the band label and flagged
  signal details in amber; never blocks sending.
- Replaced the static "Platform safety" aside in `/messages/[conversationId]`
  with a structured "Safe messaging" trust guard populated dynamically by
  `getSafeConversationReminders`.
- Added two inbox safety cues to the dark panel in `/messages`:
  "Legitimate auditions never charge a fee to apply" and
  "Keep scheduling details on-platform."
- Added "Safe Messaging During Auditions" section to `/safety`.
- Expanded "Messaging Safely" section in `/help` to a full 5-sentence guide.
- Added "Professional messaging" `SafetyNotice` to
  `/recruiter/auditions/[id]/applicants` alongside the existing "Casting
  integrity" notice.
- Added `tests/message-safety-policy.test.mts` with 41 unit tests covering all
  signal detectors, band logic, summary shape, high-risk helper, reminders,
  and safe reply templates.
- Created `MESSAGE_SAFETY_COACH_TRUST_GUARD_REPORT.md`.
- No Firestore rules, schemas, APIs, auth permissions, payment, AI, fake data,
  direct video upload, or self-tape video upload changed.

### Casting Brief Quality Engine and Scam Shield

- Added `app/lib/casting-brief-quality-policy.ts` with transparent,
  rule-based quality and safety helpers for casting briefs.
- Added a live Publish Readiness panel to `/recruiter/auditions/new`.
- Added compact brief quality cues to `/recruiter/auditions` and audition cards.
- Added Talent-facing brief quality and safety context to `/auditions/[id]`.
- Added Admin-facing quality/risk cues to `/admin/auditions`.
- Added `tests/casting-brief-quality-policy.test.mts` covering strong briefs,
  missing detail, expired deadlines, payment language, private contact pressure,
  unrelated document requests, self-tape instructions, band logic, admin risk,
  and no AI/fake detection language.
- Created `CASTING_BRIEF_QUALITY_SCAM_SHIELD_REPORT.md`.
- No Firestore rules, schemas, APIs, auth permissions, payment, AI, fake data,
  direct video upload, or self-tape video upload changed.

### Talent Passport and Role Fit Signals

- Added `app/lib/role-fit-policy.ts` with explainable readiness helpers for
  profile completeness, category, experience, languages, location/work mode,
  skills, portfolio, self-tape readiness, and Talent verification status.
- Added Role Readiness guidance to audition detail pages for Talent users.
- Added a Talent Passport section on `/talent/profile` summarizing profile
  foundation, skills/languages, portfolio, public profile, trust status, and
  self-tape link readiness.
- Added recruiter-facing Role Fit Signals inside applicant review, with clear
  guidance that final casting decisions remain with the recruiter.
- Added lightweight Future Role Readiness cues on `/applications`.
- Added `tests/role-fit-policy.test.mts` covering strong signals, missing
  details, missing media/self-tape actions, readiness bands, checklist output,
  Talent Passport behavior, and no fake AI/ranking language.
- Created `TALENT_PASSPORT_ROLE_FIT_SIGNAL_ENGINE_REPORT.md`.
- No Firestore rules, schemas, permissions, APIs, upload behavior, payment,
  AI, fake data, or security settings changed.

### Pitch Deck Content Pack

- Created founder-ready pitch deck content for FirstTake / Nata Connect without
  creating a PowerPoint file, generating images, redesigning the app, or adding
  product features.
- Added `PITCH_DECK_OUTLINE.md`, `PITCH_DECK_SLIDE_COPY.md`,
  `PITCH_DECK_SPEAKER_NOTES.md`, and `PITCH_DECK_VISUAL_CHECKLIST.md`.
- Updated README, testing, roadmap, and UX polish documentation with concise
  references to the deck pack.
- Deck content keeps claims scoped to controlled beta readiness and avoids fake
  traction, guaranteed casting, unstated partnerships, enterprise-scale claims,
  AI, payments, and direct video upload.

### Founder Demo and Pitch Readiness Pack

- Created founder-ready demo and pitch documentation for FirstTake / Nata
  Connect without changing product features, backend logic, Firebase rules, or
  security behavior.
- Added `FOUNDER_DEMO_SCRIPT.md`, `LIVE_DEMO_ROUTE_ORDER.md`,
  `SCREENSHOT_CHECKLIST.md`, `BETA_ONBOARDING_PLAYBOOK.md`, and
  `PITCH_TALKING_POINTS.md`.
- Added a concise README link section for demo and pitch materials.
- Clarified the README launch gaps so direct self-tape video upload remains
  external-link only while recruiter verification evidence upload remains
  supported.
- No payment, subscription, AI, calendar scheduling, video calls, direct video
  upload, fake data, seeded users, or security changes were added.

### Live Production Smoke Test & Bug Fix Pass

- Inspected 50+ files across public/auth, talent, recruiter, admin, API routes, and security rules.
- No launch-blocker bugs found. All flows are coherent and correctly role-gated.
- Firestore rules and Storage rules confirmed correct: notification updates locked to `read`/`readAt`, conversation updates locked to `unreadBy`/`updatedAt`, application updates require recruiter ownership, `MAYBE` status included in allowed update set.
- `getTalentApplications` confirmed to have a collectionGroup primary path with a full per-audition fallback.
- Self-tape flows confirmed to accept external links only (no upload path exposed to talent).
- Created `LIVE_PRODUCTION_SMOKE_TEST_BUG_FIX_PASS_REPORT.md`.
- No code changes made; lint clean, 100/100 tests pass, build clean.

### Launch Readiness Command Center

- **`app/lib/launch-readiness-policy.ts`** (new): Policy library with `LaunchReadinessBand`, `LaunchReadinessInput`, `LaunchReadinessSummary`, and `LaunchReadinessItem` types. Exports `scoreLaunchReadiness`, `getReadinessBand`, `getLaunchItems`, `getLaunchBlockers`, and `getLaunchReadinessSummary`. Scoring covers 10 weighted signals (100 pts total) across infrastructure, marketplace health, and safety.
- **`app/api/admin/data/route.ts`**: Added `launchReadiness` view that returns checks, real marketplace stats (users, recruiters, approvals, active auditions, applications), live open/urgent report counts, and env details — all in one parallel Firestore batch.
- **`app/admin/beta-readiness/page.tsx`** (upgraded to Launch Readiness Command Center): Band-based readiness score (0–100%) with progress bar, blockers panel with action links, real-time marketplace health section (recruiter pipeline, talent, casting supply), safety queue section (open/urgent reports, suspended accounts), infrastructure checks grid, and all existing manual checklist, admin operations, and production commands sections. Fetches from new `launchReadiness` API view.
- **`components/admin-shell.tsx`**: Renamed nav link label "Beta readiness" → "Launch readiness".
- **`app/admin/page.tsx`**: Renamed "Beta control center" section to "Launch readiness" with updated eyebrow and description linking to the command center.
- **`tests/launch-readiness-policy.test.mts`** (new): 17 tests covering band calculation, score edge cases (zero/full/partial), blocker identification, severity classification, summary helper, and actionHref forwarding. Total: 100 tests, all passing.
- Created `LAUNCH_READINESS_COMMAND_CENTER_REPORT.md`.
- No payment, subscription, AI, calendar, video calls, direct or self-tape video upload, fake data, celebrity names, or security changes.

### End-to-End Marketplace Launch Trial

- **`app/dashboard/page.tsx`**: Removed local `nextStepMessages` constant (duplicate of the lib's `TALENT_NEXT_STEP_MESSAGES`). Updated `RecentApplication` to call `getApplicationNextStep(status)` from `app/lib/application-pipeline` — the canonical unit-tested source.
- **`app/dashboard/page.tsx`**: Added "Complete company verification" step (step 3 of 5) to `RecruiterOnboardingChecklist`. Verification is a hard gate on the dashboard; showing it in the checklist completes the onboarding journey for newly approved recruiters.
- Created `END_TO_END_MARKETPLACE_LAUNCH_TRIAL_REPORT.md` with full audit findings across 25+ routes and components.
- All 83 tests pass, 55 routes build clean, lint clean.

### Callback and Selection Decision Workflow

- **`app/lib/application-pipeline.ts`**: Added `TALENT_VISIBLE_NOTE_MAX_LENGTH`, `validateTalentVisibleNote`, `TalentStageGuidance` type, `getTalentStageGuidance`, and `getDecisionSafetyCue`. Extended `RecruiterReviewInput` with `talentNextStepNote` and `validateRecruiterReview` to validate it.
- **`app/lib/types.ts`**: Added `talentNextStepNote?: string` to `Application` interface.
- **`app/api/applications/route.ts`**: PATCH handler now accepts, validates (server-side via `validateRecruiterReview`), trims, and persists `talentNextStepNote`. Clears with `FieldValue.delete()` when empty. Writes audit log `talent_visible_note_updated`.
- **`app/applications/page.tsx`**: Replaced the single-line "Next step" teal box with `TalentStageCard` — tonal styling per stage, headline, detail, optional recruiter note (amber border), safety cue for CALLBACK/FINAL_ROUND/SELECTED, and a messaging hint when unread. `ApplicationProgress` for REJECTED/WITHDRAWN now returns null (TalentStageCard covers these). Removed unused `getApplicationNextStep` import.
- **`app/recruiter/auditions/[id]/applicants/page.tsx`**: Added "Talent-visible note" textarea (amber border) in the private casting notes aside with inline validation, 400-char cap, and contact-detail blocking. Added decision safety cue to the Next action panel for CALLBACK/FINAL_ROUND/SELECTED stages.
- **`tests/application-pipeline.test.mts`**: Added 4 new tests for `getTalentStageGuidance`, `getDecisionSafetyCue`, `validateTalentVisibleNote`, and `validateRecruiterReview` with `talentNextStepNote`. Total: 83 tests.
- Created `CALLBACK_SELECTION_DECISION_WORKFLOW_REPORT.md`.
- No Firestore rules changed (Admin SDK bypasses client rules for writes; talent reads already covered by wildcard rule).
- No calendar, video, payment, AI, fake data, or security changes.

### Audition Submission Studio and Casting Review Room

- **`app/lib/application-pipeline.ts`**: Extracted `TALENT_NEXT_STEP_MESSAGES`, `getApplicationNextStep`, `getRecruiterNextAction`, `ApplicationPackSummary` type, and `getApplicationPackSummary` into the shared lib — previously inline constants in the page components; now tested and reusable.
- **`app/auditions/[id]/page.tsx`**: Added **Application Pack** section to the Talent apply aside — bullet list of what the recruiter receives (profile snapshot, bio, portfolio media, cover message, self-tape if enabled). Required self-tape uses an amber dot; all other items use teal. Visible to Talent only.
- **`app/applications/page.tsx`**: Replaced local `nextStepMessages` with `getApplicationNextStep` import. Added **PackTag** chip strip to each application card (between ApplicationMeta and Next Step box) — shows Profile snapshot (always included), Cover message (included/absent), and Self-tape pending/submitted when `selfTapeEnabled`.
- **`app/recruiter/auditions/[id]/applicants/page.tsx`**: Replaced local `getNextRecruiterAction` with `getRecruiterNextAction` import. Added **Casting Integrity** `SafetyNotice` below the `NextActionPanel` reminding recruiters never to request payment from applicants. Added **Cover message** and **Self-tape** chips to the `ApplicantCard` compact chip row derived from `getApplicationPackSummary`.
- **`tests/application-pipeline.test.mts`**: Added 3 new tests — `getApplicationNextStep`, `getRecruiterNextAction`, and `getApplicationPackSummary` (4 cases: empty, full, whitespace-only, storagePath-only). Total: 79 tests.
- Created `AUDITION_SUBMISSION_STUDIO_CASTING_REVIEW_ROOM_REPORT.md`.
- No Firestore rules, APIs, authentication, payment, AI, storage upload, video upload, fake data, or security features changed.

### Trust-Verified Media and Document Upload System

- Added shared upload validation and path policy in `app/lib/upload-policy.ts`.
- Kept Talent profile photo and portfolio image uploads on Firebase Storage, with profile photos capped at 5 MB and portfolio images capped at 6 images / 5 MB each.
- Added private Recruiter verification evidence upload for JPEG, PNG, WebP, and PDF files up to 10 MB.
- Submitted Recruiter evidence metadata through the existing secure verification API and showed evidence links in `/admin/verifications`.
- Updated `storage.rules` to enforce owner/admin-only evidence access and stricter Talent portfolio image limits.
- Added `tests/upload-policy.test.mts` and Storage emulator coverage for recruiter evidence privacy.
- Created `TRUST_VERIFIED_MEDIA_DOCUMENT_UPLOAD_SYSTEM_REPORT.md`.
- Direct video upload, self-tape upload, payments, AI, fake data, and seeding remain out of scope.

### Real Launch Demo and Marketplace Content Pass

- Added launch-ready marketplace positioning to `/`, including an honest roadmap note for future video upload, document upload, payments, AI, and marketplace automation.
- Improved empty states and first-time guidance across Talent auditions, applications, messages, notifications, dashboards, recruiter auditions, recruiter verification, recruiter profile, and applicant review.
- Clarified the save-versus-apply mental model, first application guidance, recruiter casting brief requirements, and no-pay-to-audition safety expectations.
- Created `REAL_LAUNCH_DEMO_MARKETPLACE_CONTENT_REPORT.md`.
- No fake marketplace data, Firestore rules, APIs, schemas, authentication, Firebase config, payment, AI, or direct upload behavior changed.

### Cinematic Product Design and Flow Transformation Pass

- Added shared product UI primitives in `components/product-ui.tsx`: `CinematicSectionHeader`, `NextActionPanel`, `FlowStepCard`, and `TrustCueCard`.
- Updated the landing page to position FirstTake / Nata Connect as a cinematic casting operating system, with clearer Talent/Recruiter value, trust cues, and non-beta CTA language.
- Added next-action panels to audition discovery, audition detail, application tracker, messages, notifications, recruiter casting calls, and applicant review.
- Strengthened casting-language hierarchy around saved auditions, application status tracking, recruiter pipeline review, and safe platform messaging.
- Created `CINEMATIC_PRODUCT_DESIGN_FLOW_TRANSFORMATION_REPORT.md`.
- No Firestore rules, APIs, authentication, permissions, schemas, Firebase config, payment, AI, or storage features changed.

### Final Production QA and Live Validation Pass

- **`app/dashboard/page.tsx`**: Auth error block `<p>` missing `rounded-md` — fixed. Recruiter hero CTA "Post an audition" → "Post a casting brief" — now consistent with WorkspaceHero on the auditions list page, the quick-action card on the same dashboard, and all other Recruiter-facing CTA copy.
- **`app/auth/login/page.tsx`**: "Current tab session" info box (`border border-[#b8dce3] bg-[#edf9fb]`) missing `rounded-md` — fixed.
- **`app/admin/reports/page.tsx`**: Three bordered blocks missing `rounded-md` — reporter note (`border-l-2 border-[#e7ad2d] bg-[#fffaf0]`), "Safe evidence snapshot" `<details>`, and "Audit trail" `<details>` — all fixed.
- Created `FINAL_PRODUCTION_QA_LIVE_VALIDATION_REPORT.md` — full QA pass covering Talent, Recruiter, and Admin journeys, mobile/laptop validation, safety/trust messaging, and live check checklist
- No Firestore rules, APIs, authentication, payment, AI, or storage features changed

### Mobile Responsiveness and App-Like Polish Upgrade

- **`components/async-state.tsx`**: Added `rounded-md` to `LoadingState` and `ErrorState` containers — `EmptyState` used the `surface` class (which includes rounding) but the other two states had flat edges; now all three async-state components are visually consistent across the ~14 pages that use them.
- **`app/auditions/[id]/page.tsx`**: Added `order-first lg:order-none` to `<aside>` — on mobile, the apply CTA (cover message textarea, submit button) now appears above the article instead of below it; on desktop the two-column layout is unchanged (article left, aside right).
- **`app/recruiter/auditions/new/page.tsx`**: h1 `text-4xl font-black` → `text-2xl font-black sm:text-3xl lg:text-4xl` — matches the `WorkspaceHero` responsive heading scale used across all other workspace pages.
- **`app/recruiter/verification/page.tsx`**: Added `rounded-md` to the post-submission success message and to the admin review-note block — both were missing corner rounding that all other inline feedback blocks have.
- Created `MOBILE_RESPONSIVENESS_APP_LIKE_POLISH_REPORT.md`
- No Firestore rules, APIs, authentication, payment, AI, or storage features changed

### Role Onboarding and First-Session Experience Upgrade

- **`app/auth/signup/page.tsx`**: Removed "Private beta — controlled rollout" banner — the first thing new users saw above the role picker was beta language linking to `/beta-feedback`; removed entirely. Error block red styling → amber (`rounded-md border-amber-300 bg-amber-50 text-amber-900 font-bold`) — consistent with validation error convention.
- **`app/auth/login/page.tsx`**: Error block red styling → amber — same reasoning.
- **`app/auth/email-verified/page.tsx`**: Four "FirstTake" → "Nata Connect" branding fixes — `verified` state description, `signed_out` state description, `checking` state description, and trust-explanation body copy all contained the repository name instead of the product name.
- **`components/email-verification-prompt.tsx`**: One "FirstTake" → "Nata Connect" branding fix — status message shown after sending a verification email said "FirstTake will check your account status automatically."
- **`app/dashboard/page.tsx`**: `RecruiterProfile` type added to imports; `recruiterProfile` state added; RECRUITER `useEffect` renamed local `profile` variable to `rProfile` to avoid shadowing the Talent profile state, and stores the fetched recruiter profile. `RecruiterOnboardingChecklist` receives `profileReady` prop derived from `recruiterProfile?.companyName && recruiterProfile?.bio` — replaces hardcoded `done: true` on the "Complete your company profile" step.
- Created `ROLE_ONBOARDING_FIRST_SESSION_EXPERIENCE_UPGRADE_REPORT.md`
- No Firestore rules, APIs, authentication, payment, AI, or storage features changed

### Trust, Safety and Reporting Experience Upgrade

- **`app/safety/page.tsx`**: Eyebrow "User safety" → "Platform safety"; title → "Safer casting, every step."; description → practical summary; emergency notice simplified; CTA changed from "Share beta feedback" (→ `/beta-feedback`) to "Read community guidelines" (→ `/community-guidelines`); added dedicated "Red Flags for Fake Casting Calls" section; added "How to Report" section explaining the Report button and reporter confidentiality; added "What Happens After You Report" replacing vague "may be reviewed" copy; strengthened Never Pay to Audition, Keep Communication On-Platform, Verified Recruiter Trust Signals; Safe Meeting and Younger Talent sections tightened.
- **`app/community-guidelines/page.tsx`**: Description updated to mention consequences; "Reporting Abuse" body removes "where available" qualifier, names the trust team, adds reporter confidentiality and confirmation; "Admin Moderation Actions" renamed to "Consequences of Violations" and adds "permanent suspension" for serious or repeated violations.
- **`app/messages/page.tsx`**: Page description "Keep personal contact details private until trust is established." → "Keep all casting communication on-platform — never share personal contact details in messages." (consistent with sidebar's "Never share" inbox habit).
- **`app/messages/[conversationId]/page.tsx`**: `getThreadSafetyReminder` "FirstTake" → "Nata Connect" in both role variants — branding bug fix; Talent variant strengthened to "Never share personal contact details or financial information in messages."
- **`app/admin/reports/page.tsx`**: AdminPageHeader description adds priority guidance ("Urgent and high priority reports involve fraud, unsafe contact, and harassment — review these first"); empty state message made filter-aware (open filter vs. other filter); amber reporter-note block gains "Reporter note" label.
- **`app/lib/report-policy.ts`**: `getReportPriority` escalation — `scam_or_fraud` and `unsafe_contact_request` promoted from `'high'` to `'urgent'` (the type already supported this, unused until now); `impersonation` and `fake_audition` promoted from `'medium'` to `'high'`; `misleading_information` promoted from `'low'` to `'medium'`; reporter notification message updated from "Our trust team will review it." to "Your report was received and will be reviewed by the trust team. We will follow up if more information is needed."
- **`tests/report-policy.test.mts`**: Priority assertions updated to match new mapping; assertions added for harassment, impersonation, fake_audition, and misleading_information.
- Created `TRUST_SAFETY_REPORTING_EXPERIENCE_UPGRADE_REPORT.md`
- No Firestore rules, authentication, payment, AI, or storage features changed

### Recruiter Audition Creation and Publishing Experience Upgrade

- **`app/recruiter/auditions/new/page.tsx`**: Page eyebrow "Create casting call" → "New casting brief"; h1 "Shape the opportunity clearly." → "Build a casting call that attracts the right Talent."; body copy updated to name requirements, compensation, and safety as the three drivers of applicant quality; recruiter access widget "Ready to publish" → "Approved to publish"; error block red styling → amber (consistent with app convention); `Input` component gains optional `helper` prop rendering small contextual text beneath each field; helper text added to Audition title, Location, Languages, Role description, Requirements, self-tape Instructions, Clip duration limit, Application deadline, Pay information, and Compensation type; max duration label "Max duration in seconds" → "Clip duration limit (seconds)"; safety note added beneath self-tape instructions textarea ("Do not ask Talent to contact you directly outside Nata Connect or to make any payment to participate."); "Before you publish" checklist safety item `font-semibold` → `font-bold`.
- **`app/recruiter/auditions/page.tsx`**: WorkspaceHero `actionLabel` "Post audition" → "Post a casting brief"; empty state title "No auditions posted yet" → "No casting briefs yet"; empty state message updated to action-forward copy that mentions verified-recruiter response quality; empty state `actionLabel` "Post an audition" → "Post a casting brief".
- **`app/recruiter/verification/page.tsx`**: Description extended to explain that verified recruiters can publish casting briefs and build Talent trust with a verified badge on every listing.
- Created `RECRUITER_AUDITION_PUBLISHING_EXPERIENCE_UPGRADE_REPORT.md`
- No Firestore rules, APIs, authentication, payment, AI, or storage features changed

### Messaging and Notifications Experience Upgrade

- **`app/messages/page.tsx`**: Talent empty state updated from passive to active copy ("Conversations appear here when a recruiter messages you about an application, or when you message a casting team."); conversation card type chip made role-aware ("Audition conversation" for talent, "Applicant conversation" for recruiter) with "Archived" chip when archived; fallback last-message text "Conversation ready" → "No messages yet"; inbox habits aside: "Avoid sharing personal contact details early." → "Never share personal contact details in chat."
- **`app/messages/[conversationId]/page.tsx`**: Header eyebrow made role-aware ("Audition conversation" for talent / "Applicant conversation" for recruiter); compose placeholder "Write a message" → "Message about the role, next steps, or self-tape."; compose error red styling → amber (consistent with app convention); aside description updated from clinical system copy to context-setting casting language; aside section "Trust reminder" → "Platform safety"; return link label made role-aware ("View in My Applications" for talent / "Open applicant review" for recruiter).
- **`app/notifications/page.tsx`**: Per-category unread counts added to all filter tabs (Applications (N), Messages (N) etc.); error block red → amber; notification timestamp `font-semibold` → `font-bold`; empty states made context-aware by filter tab with casting-specific copy for each category; empty state heading for category tabs "No updates here" → "Nothing here yet".
- **`app/lib/messaging-policy.ts`**: `buildConversationNotification` conversation_started title → "Casting conversation started"; message → "A casting conversation was opened for {title}. Open it to ask questions or discuss next steps."; new_message fallback "You received a new message." → "You received a new message about a casting call."
- **`components/product-ui.tsx`**: MetricCard detail text `font-semibold` → `font-bold` — affects all MetricCard instances across the app.
- **`components/application-message-button.tsx`**: Error text `text-red-700` → `font-bold text-amber-700`.
- Created `MESSAGING_NOTIFICATIONS_EXPERIENCE_UPGRADE_REPORT.md`
- No Firestore rules, APIs, authentication, payment, AI, or storage features changed

### Audition Discovery and Application Conversion Upgrade

- **`app/auditions/page.tsx`**: `SafetyNotice` "Never pay to audition" added at page bottom (visible when loaded, whether results or empty state); view description updated from `font-semibold` to `font-bold` with improved copy ("All active casting calls. Use filters to narrow by category, location, or deadline." / "Roles you bookmarked — review and apply before the deadline closes."); MetricCard visible-match detail updated from "Current search result" to "Matching this search"; empty state messages improved — saved view now directs users to browse and bookmark; no-results view makes "clearing all" a concrete action.
- **`app/auditions/[id]/page.tsx`**: Apply aside gains a sub-line "Your profile and media are included automatically. Use this message to stand out to the casting team."; amber notice added when audition is not ACTIVE ("This audition is no longer accepting applications."); button text adapts for unauthenticated users ("Log in to apply" → "Submit application"); post-apply guidance text added below button ("After applying, track your status in My Applications.").
- **`app/dashboard/page.tsx`**: `nextStepMessages` in the Recent Applications widget updated to casting-specific language consistent with `app/applications/page.tsx` (e.g. APPLIED → "Waiting for the casting team to open your application."; CALLBACK → "You have a callback — watch for a message."; SELECTED → "You were selected. Expect a message with next steps."; REJECTED → "The casting team moved forward with another applicant.").
- Created `AUDITION_DISCOVERY_EXPERIENCE_UPGRADE_REPORT.md` with full audit, before/after table, and manual test checklist
- No Firestore rules, APIs, authentication, payment, AI, or storage features changed

### Applicant Review and Casting Pipeline Experience Upgrade

- **`app/recruiter/auditions/[id]/applicants/page.tsx`**: Header gains audition meta line (Role, Deadline, Status badge, self-tape count when relevant); pipeline summary restructured from 11 to 8 metrics in a clean `sm:grid-cols-4` layout (removed Role/Deadline/Status — now in header); added "Reviewing" (UNDER_REVIEW) and "Maybe" tabs to pipeline stage filter; status timeline entries now show status-specific descriptions ("Profile received — application in the recruiter inbox.") with "Current —" prefix for the active stage; "Next action" panel added in private casting notes aside with stage-specific guidance; StatusTimeline date `font-semibold` → `font-bold`.
- **`app/applications/page.tsx`**: All 10 `nextStepMessages` updated with casting-specific, actionable language (APPLIED → "Waiting for the casting team to open your application."; CALLBACK → "You have a callback. Watch for a message from the casting team."; SELECTED → "You were selected. The recruiter will contact you through messages with next steps."; REJECTED → "The casting team moved forward with another applicant. Keep applying..."); Active view description → "In review or awaiting recruiter action"; Shortlisted view description → "Shortlist, callback, and final round"; view tab descriptions `font-semibold` → `font-bold`; `SafetyNotice` "Never pay to audition" added at page bottom.
- **`app/lib/notification-policy.ts`**: SHORTLISTED, CALLBACK, FINAL_ROUND, REJECTED, and SELECTED notification messages updated with clearer casting language. VIEWED message preserved (test assertion on "opened your application").
- **`app/recruiter/auditions/page.tsx`**: Mobile card "Next action" text `font-semibold` → `font-bold`.
- Created `APPLICANT_PIPELINE_EXPERIENCE_UPGRADE_REPORT.md` with full audit, before/after table, and manual test checklist
- No Firestore rules, APIs, authentication, payment, AI, or storage features changed

### Talent Portfolio and Recruiter Profile Experience Upgrade

- **`app/talent/profile/page.tsx`**: `font-semibold` → `font-bold` on all field labels; checkbox label updated from "Public profile enabled" to "Enable public portfolio page"; verification pending copy removes "private-beta" qualifier.
- **`app/recruiter/profile/page.tsx`**: All form label `font-semibold` → `font-bold`; amber "onboarding phase" notice inside casting-identity section replaced with `PrivacyNote` ("Platform safety expectation") enforcing the no-pay-to-audition rule.
- **`app/recruiter/verification/page.tsx`**: Page title "Private-beta verification" → "Company verification"; success message updated to "The trust team will review your details and get back to you."; docs section copy removes "beta" framing in all three locations.
- **`app/t/[slug]/page.tsx`**: Profile card, photo, selected-work section, showreel items, and professional-links section all gain `rounded-md`; skills and languages separated into two distinct labeled chip groups (Skills: neutral grey, Languages: teal-tinted); casting inquiry footer note added.
- **`app/recruiter/auditions/[id]/applicants/page.tsx`**: Experience level chip added to compact card TalentChip row; "Portfolio" button added to card action row when talent has `publicSlug`; expanded Talent profile section separates skills and languages into labeled rows with distinct chip styles; "View public portfolio →" link added in expanded section; `ApplicantDetail` value `font-semibold` → `font-bold`.
- Created `PROFILE_EXPERIENCE_UPGRADE_REPORT.md` with full audit, before/after table, and manual test checklist
- No Firestore rules, APIs, authentication, payment, AI, or storage features changed

### Core Application Experience Upgrade

- **`app/auditions/[id]/page.tsx`**: Comprehensive brand alignment — article and aside now use `surface` class; recruiter byline uses teal `font-black uppercase tracking-wide`; title uses `font-black`; apply button uses `primary-button` class; save button gains `rounded-md`; `Detail` and `Section` helper components expanded to multi-line with `font-black` typography; detail grid expanded from 6 to up to 10 fields (Project type, Work mode, Compensation, Languages added as conditional entries); `SafetyNotice` "Never pay to audition" added at bottom of article; back link fixed to `text-[#008ca6]`; apply error upgraded from bare `<p className="text-red-700">` to styled amber block; local label maps `AUDITION_TYPE_LABELS`, `WORK_MODE_LABELS`, `PAYMENT_LABELS` added.
- **`app/applications/page.tsx`**: Inline amber error `<div>` replaced with `<ErrorState>` component; inline dashed empty-state `<div>` replaced with `<EmptyState actionHref actionLabel>`; recruiter byline separator changed from ` - ` to ` · `; status filter description changed from internal developer copy to user-facing "Narrow results to a specific pipeline stage."
- **`app/dashboard/page.tsx`**: `TalentOnboardingChecklist` and `RecruiterOnboardingChecklist` eyebrow changed from "Private beta — getting started" to "Getting started" — permanent product guidance, not a beta qualifier.
- **`app/recruiter/auditions/new/page.tsx`**: Self-tape submission type note changed from "For beta safety, self-tapes use unlisted/private links from trusted video platforms." to "Self-tapes use unlisted or private links from YouTube, Vimeo, or a similar platform." — frames a platform decision as policy, not a temporary restriction.
- **`app/messages/page.tsx`**: Page eyebrow changed from "Private casting communication" to "Casting inbox" — the user mental model, not a technical description.
- Created `CORE_APPLICATION_EXPERIENCE_UPGRADE_REPORT.md`
- No Firestore rules, APIs, authentication, payment, AI, storage, or document upload features changed

### Production Reliability and Safe Error-State Hardening

- **`app/error.tsx`** (CREATED): Branded route-level error boundary (`'use client'`,
  `reset` callback). Shows calm "Something went wrong." page with brand header,
  "Try again" (calls `reset`) and "Go to workspace" (Link to `/dashboard`). Raw
  `error.message` and `error.digest` never exposed to users.
- **`app/global-error.tsx`** (CREATED): Root-level error boundary required when
  the root layout throws. Uses inline styles (Tailwind unavailable at this level),
  includes `<html><body>` tags, midnight navy background, teal "Reload page" button.
- **`app/loading.tsx`** (CREATED): Page-transition loading state for Next.js App
  Router Suspense boundaries. Branded teal pulse dot matching `LoadingState` style.
- **`app/lib/error-utils.ts`**: Fixed raw `error.message` passthrough at line 30
  and line 36. Non-auth errors now return `fallback` instead of the raw SDK message.
  Recognised auth codes (7 entries) still resolve to their friendly messages first.
- **`components/async-state.tsx`**: Added `secondaryHref` and `secondaryLabel`
  optional props to `ErrorState`. When provided, a secondary Link button appears
  alongside "Try again" in a flex-wrap row. All existing callers are unaffected
  (props are optional).
- **`components/app-shell.tsx`**: Added "Contact support" Link to `/help` in the
  suspended account section. Previously the only action was "Log out"; suspended
  users now have a path to reach support without logging out first.
- **`app/notifications/page.tsx`**: Replaced bare `<p className="text-sm...">Loading
  activity...</p>` with `<LoadingState label="Loading activity..." />` for visual
  consistency with all other loading states.
- **`app/applications/page.tsx`**: Replaced bare `<p className="text-sm...">Loading
  your applications...</p>` with `<LoadingState label="Loading your applications..." />`.
- Created `PRODUCTION_RELIABILITY_HARDENING_REPORT.md` with full audit and
  before/after summary
- No Firestore rules, APIs, authentication, payment, AI, or storage features
  changed

### Admin Operations Hardening for Private Beta

- **`app/admin/reports/page.tsx`**: Reporter field now shows role only (no UID);
  target owner shows last 8 chars only; evidence snapshot replaced JSON.stringify
  dump with structured `SafeEvidenceDisplay` component that redacts fields ending
  in `id`/`uid` and truncates long values; audit trail actor shows "Admin" instead
  of raw UID
- **`app/admin/users/page.tsx`**: Replaced desktop HTML table with card-row
  `<article>` layout; added `emailVerified?: boolean` to `UserRow` type; updated
  `statusTone` to return `attention` when `emailVerified === false`; "Email
  unverified" badge shown in both desktop and mobile views when explicitly false
- **`app/admin/page.tsx`**: Added amber urgency callout banner that appears only
  when recruiter or Talent verification queues have pending items; replaced
  implicit `Object.entries(data.stats)` loop with a curated ordered key list
  prioritizing users → talent → recruiter → approved → auditions → applications →
  self-tape
- Created `ADMIN_OPERATIONS_HARDENING_REPORT.md` with full audit and before/after
  summary
- No Firestore rules, APIs, authentication, payment, AI, or storage features
  changed

### Cinematic Trust Marketplace Design System Evolution

- Redesigned `components/status-badge.tsx`: replaced generic Tailwind color
  classes with brand-aligned palette — teal for active/applied, gold arc for
  shortlisted/callback/final-round, emerald for selected, muted for
  closed/withdrawn; all badges now `rounded-md border tracking-wide`
- Redesigned `components/audition-card.tsx`: new `Chip` component with 6 brand
  variants, cinematic left-border hover accent (teal on hover, gold when
  applied), `hover:-translate-y-0.5 hover:shadow-md`, CTA renamed "View casting
  brief", `MapPin` icon in location chip, `Video` icon in self-tape chip
- Updated `components/product-ui.tsx` `WorkspaceHero`: added subtle teal radial
  glow gradient at top-right for cinematic depth; gold stripe and layout unchanged
- Replaced HTML table in `app/recruiter/auditions/page.tsx` desktop view with
  card-row layout: `<article>` elements with group hover, teal title transition,
  status + self-tape badges, deadline + applicant count row, primary/secondary
  actions — matches mobile card language
- Improved `app/applications/page.tsx`: `ApplicationMeta` chips use brand label
  sizing (`text-[10px] font-black uppercase tracking-wide`); "Next step" panel
  gained teal dot indicator and teal border accent
- Added `TalentChip` component to applicant review page with three brand-palette
  tones (neutral, score=teal, media=gold) replacing plain unstyled spans
- Created `DESIGN_SYSTEM_EVOLUTION_REPORT.md`
- No Firestore rules, APIs, schemas, authentication, or backend features changed

### Private Beta Launch System

- Added role-aware onboarding checklists to the Talent and Recruiter dashboards;
  checklists show when the user has not yet completed core activation steps and
  disappear once the condition is met
- Upgraded beta feedback policy: added `performance` type (slow or unresponsive
  flows) and `severity` field with values `low`, `medium`, `high`, `blocking`
- Updated `validateBetaFeedback()` to validate severity; unknown values silently
  default to `medium`
- Updated `/api/beta-feedback` route handler to accept and write `severity` to
  Firestore
- Updated `app/beta-feedback/page.tsx`: severity dropdown, humanized type labels,
  private beta trust copy above the form, improved textarea placeholder
- Updated `app/admin/beta-feedback/page.tsx`: type filter, severity badge per
  item (color-coded: blocking=danger, high=attention, medium=neutral, low=muted),
  sort by severity, blocking metric card
- Added private beta trust notice to signup page (informational only — no invite
  code gating)
- Added "Beta control center" card to admin dashboard linking to feedback,
  readiness, audit logs, and reports
- Added severity validation tests to `tests/beta-feedback-policy.test.mts`
- Created `PRIVATE_BETA_LAUNCH_SYSTEM.md` with full feature documentation
- No Firestore rules, authentication, payment, AI, or storage features changed

### Live Production Beta Smoke Test Pass

- Ran remote static HTML inspection against https://firsttake-lovable.vercel.app
  for all public routes: homepage, auth, help, safety, community guidelines,
  terms, privacy, contact, beta feedback, email-verified
- Confirmed no secrets, raw Firebase errors, or test panels in public HTML
- Confirmed test case panel is gated on `NODE_ENV !== 'development'` (absent
  in production)
- Confirmed admin routes display "Administrator access required" for non-admin
  users via `!user || !isAdmin` guard
- Confirmed no billing, storage, or payment promises visible in any page
- Confirmed `localhost:3000` fallback in email verification URL is correctly
  unreachable in browser (overridden by `window.location.origin`)
- Confirmed all anti-payment safety warnings present in messages and community
  guidelines
- Added `app/not-found.tsx`: custom branded 404 page with Back to home and Help
  center links — replaces Next.js default 404
- Created `LIVE_PRODUCTION_BETA_SMOKE_TEST.md` with full audit inventory,
  P0/P1/P2 findings, manual check list, and launch recommendation
- No Firestore rules, APIs, schemas, authentication, or backend features changed

### Laptop Screen Recording UX Polish Pass

- Compacted `WorkspaceHero` and `MetricCard` in `product-ui.tsx` for tighter
  desktop density: smaller padding, title sizes, and icon sizes
- Unified `EmailVerificationPrompt` to one compact design; removed `compact`
  prop; both dashboard usages updated
- Fixed recruiter nav active-state bug: "Casting calls" and "Applicants" were
  both highlighted when visiting `/recruiter/auditions/[id]/applicants`; fixed
  with `exact: true` flag and updated `isActiveLink` logic in `app-shell.tsx`
- Compacted Talent and Recruiter dashboard hero sections, stat cards, next-
  best-action card, profile readiness card, and sidebar articles in
  `dashboard/page.tsx`
- Reduced chat area height in `messages/[conversationId]/page.tsx` from 56vh to
  48vh; added amber read-only banner when conversation status is not active
- Compacted recruiter applicant metrics from 3 rows to 2 rows: changed grid
  from `sm:grid-cols-2 xl:grid-cols-4` to `grid-cols-2 sm:grid-cols-3
  xl:grid-cols-6`; reduced `ReviewMetric` padding and font size
- Replaced "Before you publish" plain-text sidebar with a structured checklist
  in `recruiter/auditions/new/page.tsx`
- Compacted recruiter verification page header, status badge, and form spacing
- Compacted notifications page header, filter tab spacing, and notification
  cards; removed redundant "Unread" text badge
- Compacted admin dashboard metric grid spacing
- Created `LAPTOP_SCREEN_RECORDING_UX_AUDIT.md` with full audit inventory
- No Firestore rules, APIs, schemas, authentication, or backend features changed

### Beta Launch Readiness Pass

- Updated README.md to reflect controlled private beta readiness status
- Rewrote BETA_LAUNCH_READINESS_CHECKLIST.md with comprehensive step-by-step
  manual QA checklists for Talent, Recruiter, Admin, cross-device, mobile,
  error-state, and notification/message flows
- Updated BETA_READINESS_REPORT.md: assessment date June 22, 2026; readiness
  score raised to 8.5/10 reflecting completed QA pass
- Updated PRODUCT_STATUS_AND_ROADMAP.md: document date June 22, 2026; stage
  updated to beta launch readiness pass
- Documented known beta limitations: no document upload, no direct self-tape
  upload, no payments, manual verification review, email delivery conditional
  on provider config
- Launch decision: Ready with limitations for controlled private beta
- No Firestore rules, APIs, schemas, authentication, or backend features changed

### Real End-to-End Product Flow QA Pass

- Audited all Talent, Recruiter, and Admin flows for raw error copy,
  broken links, dead buttons, unsupported CTAs, and mobile issues
- Replaced nine raw Firebase / technical error outputs with
  user-friendly static recovery messages across audition detail,
  messages conversation, notifications, recruiter applicant pipeline,
  create-audition, admin action button, and application message button
- Removed the disabled "Direct upload coming soon" checkbox and
  future-feature copy from the create-audition self-tape section
- Removed the disabled "Document upload coming soon" button from
  recruiter verification; replaced with guidance to keep sensitive
  documents out of public fields
- Added FLOW_QA_REPORT.md with full issue inventory, priority list,
  test results, and recommended fixes
- No Firestore rules, Firebase configuration, APIs, schemas,
  authentication logic, payment, storage, or backend features changed

### Final Mobile Micro-Polish Pass

- Tightened mobile workspace hero spacing so Admin command-center metrics appear
  sooner without losing the premium product feel
- Increased mobile shell bottom safe-area padding across Talent, Recruiter, and
  Admin workspaces so cards and actions clear app navigation and browser bars
- Softened shared metric-card accent bars for calmer visual consistency
- Shortened Admin mobile bottom labels to Verify, Moderate, and Logs
- Made the compact email verification prompt lighter on mobile dashboards while
  keeping the trust message and actions clear
- No backend logic, Firestore rules, APIs, schemas, permissions, auth logic, or
  Firebase configuration changed

### Admin Experience Continuity Pass

- Brought the Admin command center, recruiter verification, Talent review,
  audition moderation, and audit logs onto the shared workspace hero, metric
  card, section header, and safety notice patterns
- Reworked the Admin mobile shell so phones use the unified product header,
  compact menu, and bottom trust-operations navigation instead of a full
  desktop sidebar
- Added clearer Admin trust metrics for pending reviews, active auditions,
  flagged accounts, removed briefs, enforcement events, and recent audit
  activity
- Improved Admin empty, loading, and error copy so normal admin users see
  product-safe recovery language instead of implementation details
- Made audit-log action labels easier to read while preserving the underlying
  action values and permissions
- No Firestore rules, database schema, API contract, server action, or
  permission logic was changed

### Full Mobile Product QA Pass

- Added a role-aware `/profile` bridge so mobile profile links resolve to the
  right Talent, Recruiter, or Admin workspace
- Normalized audited mobile route error states to safe refresh guidance instead
  of raw service messages
- Corrected the Telugu Nata Connect brand text in the shared logo and landing
  hero
- Tuned Admin mobile bottom navigation labels for narrow phone widths
- No backend features, Firestore rules, APIs, schemas, permissions, auth logic,
  or Firebase configuration changed

### Product Experience and Platform Consistency

- Added shared product UI primitives for workspace heroes, metric cards,
  section headers, and safety notices
- Upgraded `/auditions` into a stronger marketplace feed with opportunity
  metrics, verified recruiter count, saved role count, and application context
- Upgraded `/applications` with tracker metrics, clearer status orientation,
  self-tape task visibility, and less technical error copy
- Upgraded `/recruiter/auditions` into a casting command-center view with
  recruiter metrics and a visible professional safety standard
- Improved landing-page credibility with a clearer how-it-works section
- Removed normal-user technical wording from support, recovery, verification,
  and service error messages
- No payment, subscription, document upload, Firebase rules, or billing work was
  added

### Profile Completeness Consistency

- Centralized Talent profile completeness calculation in a shared helper used by
  Talent, Admin, dashboard, and recruiter-facing profile reads
- Fixed Admin Talent review showing stale verification snapshot scores instead
  of the current live profile completeness
- Separated profile completeness from Talent verification, public profile state,
  and portfolio moderation in the Admin Talent view
- Clarified that optional trust signals such as verification status, email
  verification, profile photo, and moderation state do not reduce the profile
  completeness percentage

### Messaging and Notifications Workflow Polish

- Reworked `/notifications` into category-based activity views for
  Applications, Messages, Auditions, and Trust / Account updates
- Upgraded notification cards with category icons, unread badges, clearer action
  labels, and more respectful application-status copy
- Added Talent-facing Viewed application notifications while keeping Viewed out
  of email delivery to avoid noisy inboxes
- Polished `/messages` with archived filtering, application-status badges,
  participant context, and role-aware empty states
- Improved message thread context with application status and stronger casting
  safety reminders
- Added dashboard continuity links so Talent and Recruiter users can reach
  messages and notifications from their workspace
- No payment, subscription, document upload, Firebase Storage, or billing work
  was added

### Applicant Review and Self-Tape Workflow Polish

- Added `CALLBACK` and `FINAL_ROUND` application statuses through the existing
  recruiter-owned application review flow
- Upgraded `/recruiter/auditions/[id]/applicants` into a clearer casting review
  workspace with audition summary metrics, stage tabs, self-tape state, cover
  note previews, status timeline, and faster review actions
- Improved Talent application progress copy for Callback and Final Round stages
  across `/applications` and dashboard summaries
- Added application-update notifications and email preference mapping for the
  new advanced casting stages
- Updated Firestore rules/tests to keep status updates restricted to the
  owning approved Recruiter
- No payment, subscription, document upload, or Firebase Storage upload work was
  added

### Audition Discovery and Application Tracking Polish

- Made saved auditions more visible on `/auditions` and added applied-state
  badges to audition cards
- Added clearer marketplace badges for verified recruiters, new roles,
  deadline-soon roles, work mode, compensation, and self-tape requirements
- Reworked application tracker groups into Active, Shortlisted, Completed, and
  All with clearer next-step messaging and audition links
- Added recruiter audition summary metrics and stronger review-applicants
  actions on mobile and desktop
- Removed beta verification copy that referenced infrastructure constraints and
  clarified that document uploads are a future secure workflow

### UX Alignment and Email Verification Flow

- Realigned Talent dashboard CTAs around auditions, applications, self-tapes,
  saved auditions, recruiter replies, and profile readiness
- Updated Recruiter dashboard copy toward casting-pipeline operations
- Updated the landing page around "Where Talent Meets Opportunity"
- Added real Firebase email verification send/resend and refresh controls
- Added secure Admin-SDK token verified email-verification sync route for the
  current user document
- Polished email verification wording, added automatic checks on mount/focus,
  short post-send polling, Spam/Promotions guidance, and `/auth/email-verified`
  continue page
- Updated UX polish, README, and testing documentation

### Phase 5B: Email Notifications Foundation and PWA Readiness

- Added server-only email provider architecture with safe no-op mode and Resend
  readiness
- Added transactional email templates for critical notification categories
- Added account-level notification preference policy and Talent/Recruiter
  preference UI
- Wired safe email attempts after successful in-app notification creation
- Added PWA manifest, mobile metadata, and installability documentation
- Added admin beta-readiness checks for email foundation, preferences, PWA, and
  push-notification pending status
- Added email/preference tests and documentation

### Phase 5A: Self-Tape Audition Submissions

- Added self-tape request fields to auditions and self-tape status/submission
  fields to applications
- Added a beta-safe external-link self-tape workflow for Talent after applying
- Added recruiter applicant-pipeline self-tape badges, view action, and reviewed
  state
- Added server-side self-tape submit/remove/review API with notifications and
  recruiter review audit logging
- Added admin self-tape request/submission visibility in overview metrics and
  audition moderation badges
- Added self-tape validation/status tests and `SELF_TAPE_SUBMISSIONS.md`

### Phase 4A: Vercel Production Deployment and Beta Launch Setup

- Added `VERCEL_DEPLOYMENT.md` with Vercel import, environment variable,
  Firebase authorized-domain, smoke test, beta launch, rollback, and legal
  placeholder guidance
- Added optional `NEXT_PUBLIC_APP_URL` support for production metadata base URL
  handling, with Vercel URL fallback and request-origin helpers
- Added tests for production URL normalization and safe fallback behavior
- Updated beta readiness, QA, testing, and roadmap documentation for Vercel
  launch preparation

### Phase 3C: Production Beta Readiness and Deployment Hardening

- Added safe Firebase environment validation helpers for public and Admin SDK
  configuration without printing secret values
- Added lightweight server logging and JSON payload guard helpers
- Added `/admin/beta-readiness` with launch checklist, environment status,
  production commands, and admin operations guidance
- Added an emulator-only `npm run demo:seed -- --confirm-demo-data` script for
  safe local beta demos
- Added oversized-payload guards to report creation and admin action APIs
- Updated beta QA, readiness, deployment, and testing documentation
- Added unit and Playwright coverage for environment validation, safe logging,
  API helpers, and beta-readiness route protection

### Phase 3B: Reports, Abuse Handling, and Trust Moderation

- Added private reports for auditions, public Talent profiles, public media,
  messages, conversations, Recruiters, and Talents
- Added token-verified report creation with validation, safe evidence
  snapshots, duplicate suppression, audit logs, and generic notifications
- Added report controls to audition details, public Talent profiles/media, and
  application-linked conversations/messages
- Added `/admin/reports` with status, target, reason, and priority filters,
  evidence review, event history, and moderation actions
- Added report review, dismissal, resolution, content removal, conversation
  blocking, and account suspension support to the secure admin action API
- Added admin-private Firestore report/event rules, a duplicate lookup index,
  policy tests, emulator tests, and route-protection/E2E coverage

### Phase 3A: Application-linked Messaging

- Added deterministic conversations tied to audition applications
- Added secure list, thread, send, and mark-read messaging APIs
- Added responsive conversation lists, message bubbles, unread indicators, and
  application context
- Replaced recruiter email contact with in-platform messaging
- Blocked obvious email addresses and phone numbers in message bodies
- Added conversation and message notifications
- Added Admin conversation metadata review and audited blocking
- Added Firestore participant, sender, moderation, and read-state protections
- Added policy, emulator, and route-protection tests

### Phase 2E: Public and Shareable Talent Profiles

- Added opt-in public Talent pages at `/t/[slug]`
- Added normalized, reserved-name-aware, collision-safe public slugs
- Added server-generated `publicTalentProfiles` snapshots containing only
  approved display fields and active media explicitly marked public
- Added Talent publish, preview, copy, refresh, slug-change, and disable tools
- Added dynamic profile metadata and no-index handling for unavailable pages
- Added Admin public-profile visibility and moderated disable actions
- Added notifications, audit logs, policy tests, Firestore rule tests, and E2E
  public-route coverage

### Phase 2D: Search, Filters, and Discovery

- Added responsive audition search, advanced filters, active chips, result
  counts, saved-only discovery, and five sort modes
- Added rule-based Talent recommendations using category, experience,
  location, skills, and languages
- Added secure owner-only saved auditions through an authenticated API route
- Added structured language, project type, work mode, compensation, and
  normalized search fields for new casting calls with legacy fallbacks
- Extended recruiter applicant discovery with tag, category, location,
  language, verified-first, and media-first controls
- Added discovery policy tests, bookmark security tests, and Playwright checks

### Phase 2C: Recruiter Applicant Pipeline

- Expanded application workflow with Under review, Maybe, Selected, and
  Withdrawn while retaining legacy status compatibility
- Added recruiter-only notes, 1-5 ratings, internal tags, decision timestamps,
  status history, and last-action metadata
- Upgraded the applicant page with counted stages, search, filters, sorting,
  profile completeness, trust badges, featured media, and expandable review
- Kept all recruiter review mutations behind Firebase ID-token and audition
  ownership checks
- Added Talent notifications for Shortlisted, Rejected, and Selected decisions
  without notifying on private notes, tags, or ratings
- Added recruiter audit logs, pipeline policy tests, Firestore rule tests, and
  Playwright coverage

All notable changes to Nata Connect are recorded here.

## Unreleased

### Phase 2B: Talent Media Portfolio

- Added profile photo and portfolio image uploads with progress and validation
- Added external showreel links without large video uploads
- Added user-scoped `talent-media` Storage paths and hardened Storage rules
- Added Talent media metadata, featured media, visibility, and moderation state
- Added recruiter profile-photo, featured-media, gallery, and showreel previews
- Added light Admin media moderation with audit logs and Talent notifications
- Added media completeness, path, URL, Firestore-rule, and Storage-rule tests

### Phase 2A: Notifications and Activity Center

- Added server-owned top-level notifications with role, priority, related
  entity, safe internal action URL, read state, and metadata
- Added authenticated notification list/read/all-read APIs
- Added a role-aware notification bell, unread badge, and `/notifications`
- Added alerts for application, audition publishing, verification, moderation,
  and account-status events
- Moved application mutations through authenticated server handlers so
  notifications originate from trusted workflow events
- Added notification rules, indexes, policy tests, emulator tests, and
  credentialed route smoke coverage

### Talent Trust Layer

- Added optional Talent verification states: not submitted, pending, verified,
  rejected, and suspended
- Added weighted profile completeness scoring, missing fields, and next actions
- Added secure Talent verification submission with server-written audit logs
- Added `/admin/talents` for verify, reject, suspend, and restore actions
- Added verified Talent badges to recruiter applicant review
- Added Talent verification rules and five policy tests

### Phase 1.6: Security and Credential-backed QA

- Added ignored `.env.e2e.local` credential loading and a safe example file
- Strengthened Playwright role assertions for Talent, Recruiter, and Admin
- Added local Firestore Emulator security-rule tests
- Enforced removed-audition visibility and active-deadline application rules
- Added Java 21, emulator rules testing, and secret-free Playwright smoke to CI

### Phase 1.5: Beta Quality and Safety

- Added Playwright public, protected-route, and optional credential-backed role
  smoke tests
- Added GitHub Actions CI for install, lint, unit tests, and production build
- Added a reusable loading/error/empty state system and retry actions across
  Talent, Recruiter, and Admin workflows
- Sanitized unexpected Admin API errors and tightened server-only Admin setup
- Added the private-beta QA checklist and exact emulator test plan
- Documented E2E credentials, CI behavior, Storage limitations, and manual QA

### Phase 1: Trust and Administration

- Added Firebase custom-claim admin foundation and first-admin bootstrap script
- Added secure Next.js admin route handlers backed by Firebase Admin SDK
- Added admin overview, verification, users, auditions, and audit-log routes
- Added text-based recruiter verification with pending, approved, rejected,
  suspended, and resubmission states
- Added trusted recruiter approval, rejection, suspension, and restoration
- Added user suspension/restoration and audition removal/restoration
- Added server-written audit logs for all privileged actions
- Added verified recruiter badges and approved-only audition publishing
- Added optional disabled document-upload section while Storage is unavailable
- Added four trust-policy tests, bringing the suite to nine tests
- Hardened Firestore rules and added Phase 1 indexes

### Added

- Tab-scoped Firebase authentication for concurrent Talent and Recruiter tests
- Development account personas and profile/audition form presets
- Recruiter applicant review and application status workflow
- Application eligibility policy tests using Node's built-in test runner
- `npm run verify` for lint, tests, and production build
- Firebase Emulator Suite configuration and `.firebaserc.example`
- Product roadmap, testing guide, setup guide, and beta-readiness report

### Changed

- Rebranded the product to Nata Connect (`నట కనెక్ట్`)
- Improved navigation, responsive layouts, visual hierarchy, and casting theme
- Application submission now uses a Firestore transaction
- Applicant counts now update atomically with application creation
- Talent application loading now uses a collection-group query instead of
  scanning every audition
- Firebase rules now constrain Talent counter updates and Recruiter status
  updates to their intended fields
- Authentication errors now use clearer user-facing messages

### Fixed

- Login redirect state update during React rendering
- Missing dashboard route after login
- Stale authentication role updates during rapid session changes
- Duplicate and invalid audition application attempts

### Security

- Application creation requires the authenticated Talent user's ID and an
  initial `APPLIED` status
- Recruiters can update only review-related application fields
- Talent users can increment only an audition's applicant counter by one

## Before Public Release

- Add trusted server-side recruiter approval using Admin SDK/custom claims
- Add Firebase Emulator security-rule tests and browser E2E coverage
- Complete media upload, moderation, notification, legal, and monitoring flows
