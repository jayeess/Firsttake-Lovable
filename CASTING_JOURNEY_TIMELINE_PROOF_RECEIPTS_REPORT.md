# Casting Journey Timeline and Application Proof Receipts — June 29, 2026

**Goal:** Build transparent, rule-based application journey timelines and proof
receipts for FirstTake / Nata Connect so that Talent and Recruiters have a clear,
structured view of every application's casting progress — without AI, guarantees,
legal certificates, payment, or fake data.

---

## What was built

### `app/lib/casting-journey-policy.ts` (new)

A self-contained policy module (no transitive local imports) with:

- **`getCastingJourneySteps(application, audition?)`** — returns 4–9 ordered
  `CastingJourneyStep[]` items. Steps are revealed progressively: advanced stages
  (shortlisted, callback, final round) only appear once the application has
  reached or passed them, avoiding a wall of pending items.
  - Terminal steps: `selected`, `not_selected`, or `withdrawn`.
  - `MAYBE` maps to the `UNDER_REVIEW` milestone rank (hold state, not forward).
  - Dates are populated from Firestore `Timestamp` or `Date` via a duck-typed
    `safeFormatDate` helper — no Firebase import needed in the policy module.

- **`getApplicationProofChecklist(application, audition?)`** — returns
  `ProofChecklistItem[]`: profile snapshot (always included), cover message
  (included/not), self-tape link (if `selfTapeEnabled`, included/not).

- **`getApplicationProofReceipt(application, audition?)`** — returns a
  `ApplicationProofReceipt` with audition title, recruiter name, submitted date,
  current status, pack items, and a safe disclaimer:
  > "This is a platform record of your application activity on Nata Connect. It
  > is not a casting guarantee, official certificate, or confirmation of
  > selection. Casting decisions are made by the recruiting team."

- **`getJourneyCurrentStage(application)`** — returns `{ status, label, detail }`.

- **`getJourneyNextStep(application, audition?)`** — returns actionable guidance
  string; surfaces self-tape prompt if required and not yet submitted.

- **`getTalentJourneyGuidance(application, audition?)`** — returns headline,
  detail, nextStep, safetyReminder. SELECTED/CALLBACK/FINAL_ROUND stages include
  stronger payment/contact-sharing safety reminders.

- **`getRecruiterJourneySummary(application, audition?)`** — returns
  `RecruiterJourneySummary` with submitted date, status label, self-tape status,
  pack readiness string, and a guidance-only safety note:
  > "Casting decisions should not be communicated as guaranteed or confirmed
  > until a formal offer is made through Nata Connect."

Status labels and next-step messages are inlined (not imported from
`application-pipeline`) so the module works in both the Next.js bundler and
Node's native ESM test runner.

---

### `app/applications/page.tsx` (modified)

- Imported `getCastingJourneySteps`, `getApplicationProofChecklist`.
- Added `<CastingJourneyProof>` component inside each application article,
  rendered after `<ApplicationProgress>`.
- `CastingJourneyProof` shows:
  - A "Casting journey" eyebrow label.
  - Proof chips for included pack items (profile, cover message, self-tape).
  - A step-by-step ordered list with `JourneyStepIndicator` icons (teal filled
    check for completed, teal ring for current, grey ring for pending, flat grey
    for skipped).
  - Step dates and detail text for current/pending steps.
  - A footer: "Platform record — not a casting guarantee or official certificate."

---

### `app/auditions/[id]/page.tsx` (modified)

- Added `getTalentApplicationForAudition` Firestore call in the Talent `useEffect`
  (parallel with saved-auditions and profile lookups).
- Added `existingApplication` state.
- When `existingApplication` is set, the sidebar shows `AlreadyAppliedPanel`
  instead of the apply form:
  - Submitted date + status badge.
  - Application pack checklist (profile, cover message, self-tape).
  - Self-tape pending warning (amber) when required/optional and not yet submitted.
  - Next-step guidance string.
  - "Keep casting communication on Nata Connect" trust cue.
  - "Platform record — not a casting guarantee" footer.
  - "Track in My Applications" primary button.

---

### `app/lib/firestore-service.ts` (modified)

- Added `getTalentApplicationForAudition(auditionId, talentId)` — direct doc read
  at `auditions/{auditionId}/applications/{talentId}` (application ID equals
  talentId in the Firestore structure). Returns `Application | null`.

---

### `app/recruiter/auditions/[id]/applicants/page.tsx` (modified)

- Added `getRecruiterJourneySummary` import.
- Added `<RecruiterJourneySummaryPanel>` inside the expanded applicant card aside,
  before "Private casting notes".
- `RecruiterJourneySummaryPanel` renders submitted date, status label, self-tape
  status, pack readiness, and the guidance-only safety note using a `<dl>` layout.

---

### `tests/casting-journey-policy.test.mts` (new)

39 unit tests covering:

- `getCastingJourneySteps`: submitted always completed, cover message
  completed/skipped, self-tape step presence, required self-tape pending/completed,
  VIEWED/SHORTLISTED/SELECTED/REJECTED/WITHDRAWN terminal states, MAYBE rank.
- `getJourneyCurrentStage`: status and label for APPLIED and SHORTLISTED.
- `getJourneyNextStep`: self-tape prompt when required/not submitted; standard
  guidance when submitted.
- `getApplicationProofChecklist`: profile always included, cover message
  included/not, self-tape item absent/not-included/included.
- `getApplicationProofReceipt`: disclaimer, audition title/recruiter, pack items,
  selfTapeUrl presence/absence.
- `getTalentJourneyGuidance`: all four returned fields; SELECTED payment reminder.
- `getRecruiterJourneySummary`: submittedDate, all four selfTapeStatus variants,
  hasCoverMessage, packReadiness, safetyNote.

Total tests: **197 pass, 0 fail**.

---

## What was NOT changed

- No AI, no AI labels, no AI matching.
- No payment, subscription, calendar scheduling, or video calls.
- No direct or self-tape video upload — self-tape remains external links only.
- No fake users, celebrity names, or copyrighted project names.
- No guarantee-of-selection or legal-certificate language.
- No Firestore rules, Firebase Auth, Admin SDK, or security model changes.
- No `.env`, `.env.local`, `node_modules`, `.next`, or service-account files.
- No automatic commit.
