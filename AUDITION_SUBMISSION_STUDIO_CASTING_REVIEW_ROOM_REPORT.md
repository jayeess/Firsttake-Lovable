# Audition Submission Studio + Casting Review Room

**Pass 19 — Completed 2026-06-29**

## Objective

Make the audition application and recruiter applicant-review experience feel like a premium casting operating system. Connect Talent submission clarity to Recruiter review power with shared helpers, consistent copy, and trust cues throughout.

---

## Changes Delivered

### 1. `app/lib/application-pipeline.ts` — New exported helpers

Three sets of helpers extracted into the shared lib for testability and reuse across both the Talent and Recruiter surfaces:

| Export | Purpose |
|---|---|
| `TALENT_NEXT_STEP_MESSAGES` | Record mapping every `ApplicationStatus` to the talent-facing "what happens next" copy |
| `getApplicationNextStep(status)` | Accessor for the above map |
| `getRecruiterNextAction(status)` | Per-status guidance for the recruiter's next pipeline move |
| `ApplicationPackSummary` (type) | `{ hasCoverMessage, hasSelfTape, mediaCount }` |
| `getApplicationPackSummary(application, mediaCount)` | Derives the pack summary from an application and a media count |

Previously `TALENT_NEXT_STEP_MESSAGES` lived as an inline constant in `app/applications/page.tsx` and `getRecruiterNextAction` was an inline function in the recruiter applicants page. Both are now in the shared lib and tested.

---

### 2. `app/auditions/[id]/page.tsx` — Application Pack in apply aside

Added an **Application Pack** section to the Talent apply aside (visible only to Talent, not Recruiter).

- Shows a bullet list of everything the recruiter will receive: profile snapshot, bio and professional links, portfolio media and showreel links, cover message (recommended), and — when `selfTapeEnabled` — the self-tape link status (required vs optional, with instruction to add from My Applications after submitting).
- Uses an amber bullet for required self-tape vs teal for all other items, giving an immediate visual signal if this role needs extra action after applying.

---

### 3. `app/applications/page.tsx` — Pack strip + lib refactor

**Refactor:** Replaced the local `nextStepMessages` constant with the imported `getApplicationNextStep()` from `application-pipeline`. This brings the copy into the shared lib where it can be tested and reused.

**Application Pack strip:** Each application card now shows a compact **Pack** chip row between the ApplicationMeta grid and the Next Step box:

- **Profile snapshot** — always included (teal chip, always green)
- **Cover message** — teal chip when included, muted chip when absent
- **Self-tape** — shown only when `selfTapeEnabled`; chip reads "Self-tape submitted" (teal) or "Self-tape pending" (muted)

The `PackTag` helper component handles the two visual states. It uses `getApplicationPackSummary` from the lib to derive the self-tape boolean.

---

### 4. `app/recruiter/auditions/[id]/applicants/page.tsx` — Review Room upgrades

**Lib refactor:** Replaced the local `getNextRecruiterAction` function with the imported `getRecruiterNextAction()` from `application-pipeline`. Copy is now shared and tested.

**Pack chips in `ApplicantCard`:** Added two new `TalentChip` entries to the chip row in the collapsed card view:

- **Cover message** — neutral chip when the applicant included a cover message
- **Self-tape** — score-toned (teal) chip when a self-tape link has been submitted

Both derive from `getApplicationPackSummary(application, media.length)` which is computed once at the top of `ApplicantCard`.

**Casting integrity safety notice:** Added a `SafetyNotice` component directly below the `NextActionPanel` in the recruiter workspace:

> Never request payment, deposits, or personal financial information from applicants. All casting decisions must stay within Nata Connect. Applicants can report policy violations immediately.

This gives the recruiter a persistent reminder of platform rules without blocking the workflow.

---

### 5. `tests/application-pipeline.test.mts` — 3 new tests (79 total)

| Test | Asserts |
|---|---|
| `getApplicationNextStep returns per-status talent guidance` | Key phrases present for APPLIED, SHORTLISTED, SELECTED, REJECTED, WITHDRAWN |
| `getRecruiterNextAction returns per-status recruiter guidance` | Key phrases for APPLIED, SHORTLISTED, FINAL_ROUND, SELECTED; WITHDRAWN returns `''` |
| `getApplicationPackSummary reflects cover message and self-tape presence` | 4 input combinations: empty, full (url), whitespace-only message + empty url, storagePath-only self-tape |

---

## Verification

| Check | Result |
|---|---|
| `npm run lint` | Clean |
| `npm test` | 79 / 79 pass |
| `npm run build` | 55 routes, TypeScript clean, no errors |
| `git diff --check` | CRLF line-ending notices only (Windows, expected) |

---

## Security constraints respected

- No video upload added
- No self-tape video upload (external links only)
- No payment, subscription, AI, Firebase Storage, document upload changes
- No fake data seeded, no test users created, no celebrity names
- Firebase/Auth/Admin security unchanged
- No `.env`, service account files, or `node_modules` touched
- No automatic commit
