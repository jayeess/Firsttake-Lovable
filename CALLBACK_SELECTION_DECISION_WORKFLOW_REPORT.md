# Callback & Selection Decision Workflow

**Pass 20 — Completed 2026-06-29**

## Objective

Improve the clarity and trust of the pipeline journey for both Talent and Recruiter at the most consequential stages: Callback, Final Round, and Selected. Give recruiters a structured way to write a talent-visible note while keeping all private casting data private. Extend the shared pipeline lib with new tested helpers.

---

## Changes Delivered

### 1. `app/lib/application-pipeline.ts` — New exported helpers

| Export | Purpose |
|---|---|
| `TALENT_VISIBLE_NOTE_MAX_LENGTH` | Constant — max 400 chars for recruiter-to-talent note |
| `validateTalentVisibleNote(note)` | Returns error string or null; blocks contact details and enforces length |
| `TalentStageGuidance` (type) | `{ headline, detail, checkMessages }` per pipeline status |
| `getTalentStageGuidance(status)` | Returns stage-appropriate headline and detail copy |
| `getDecisionSafetyCue(status)` | Returns safety reminder string for CALLBACK/FINAL_ROUND/SELECTED; null otherwise |

`RecruiterReviewInput` now includes `talentNextStepNote?: string`. `validateRecruiterReview` calls `validateTalentVisibleNote` when the field is present.

`validateTalentVisibleNote` uses an inline contact-detail regex (email pattern + phone digit count) — same logic as the messaging policy — without creating a cross-lib dependency.

---

### 2. `app/lib/types.ts` — New optional field on Application

Added `talentNextStepNote?: string` to the `Application` interface. This field is Talent-readable (already covered by the existing wildcard read rule in `firestore.rules`) and written only through the Admin SDK API route.

No Firestore rules change was needed: recruiter writes go through `app/api/applications/route.ts` which uses the Firebase Admin SDK and bypasses client-side rules.

---

### 3. `app/api/applications/route.ts` — PATCH handler extended

- Added `talentNextStepNote?: string` to the request body type.
- `hasReviewChange` now also triggers on `talentNextStepNote !== undefined`.
- `validateRecruiterReview` receives `talentNextStepNote` and validates it server-side.
- Trimmed and sliced to 400 chars before writing. Empty string clears the field with `FieldValue.delete()`.
- Audit log action `talent_visible_note_updated` written when the field changes.
- Added `TALENT_VISIBLE_NOTE_MAX_LENGTH` to the import from `application-pipeline`.

---

### 4. `app/applications/page.tsx` — TalentStageCard replacing the Next Step box

**Old:** A single teal box showing a one-line `getApplicationNextStep(status)` string.

**New:** `TalentStageCard` component:
- Tonal styling per stage (emerald for SELECTED, amber for CALLBACK/FINAL_ROUND, gray for REJECTED/WITHDRAWN, teal for all others).
- `guidance.headline` — concise status name in sentence form.
- `guidance.detail` — 1–2 sentence explanation of what happens next.
- `talentNextStepNote` block (amber left-border) when the recruiter has written one, labelled "Recruiter note".
- `safetyCue` paragraph (small, muted) for CALLBACK/FINAL_ROUND/SELECTED.
- `checkMessages` hint line — bright teal when there is an unread message, muted otherwise.

`ApplicationProgress` for REJECTED/WITHDRAWN now returns `null` since `TalentStageCard` fully covers those states (removes the earlier "Closed state" box).

`hasUnread` is now computed once in the card IIFE and shared between `TalentStageCard` and the `ApplicationMessageButton` label.

Removed unused `getApplicationNextStep` import.

---

### 5. `app/recruiter/auditions/[id]/applicants/page.tsx` — Decision composer

**Talent-visible note field:** Added a `textarea` labelled "Talent-visible note (optional · shown to applicant)" in the Private casting notes aside, between Internal tags and the Save button.

- Amber border distinguishes it from the private Recruiter note (blue/gray border).
- `onBlur` validation — shows inline error if contact details are detected.
- `validateTalentVisibleNote` is called again on save to guard against stale state.
- Save button is disabled while `talentNoteError` is non-empty.
- `maxLength={400}` on the textarea.
- Sends `talentNextStepNote` to the API via `onUpdate`.

**Decision safety cue in Next action panel:** When `getDecisionSafetyCue(status)` returns a value (CALLBACK, FINAL_ROUND, SELECTED), it appears below the next-action copy with a top border separator.

Local state update in `updateReview` also spreads `review.talentNextStepNote` into the optimistic UI.

---

### 6. `tests/application-pipeline.test.mts` — 4 new tests (83 total)

| Test | Asserts |
|---|---|
| `getTalentStageGuidance returns stage-appropriate copy and checkMessages flag` | CALLBACK/FINAL_ROUND/SELECTED checkMessages true; REJECTED/WITHDRAWN false; SELECTED detail mentions platform fee |
| `getDecisionSafetyCue returns safety copy for sensitive stages only` | SELECTED → fee warning; CALLBACK/FINAL_ROUND → Nata Connect / contact details; APPLIED/SHORTLISTED/REJECTED → null |
| `validateTalentVisibleNote accepts valid notes and rejects violations` | Empty ok; 401 chars blocked; email pattern blocked; phone pattern blocked |
| `validateRecruiterReview rejects invalid talentNextStepNote` | Valid note ok; email in note blocked; 401-char note blocked |

---

## Verification

| Check | Result |
|---|---|
| `npm run lint` | Clean |
| `npm test` | 83 / 83 pass |
| `npm run build` | 55 routes, TypeScript clean, no errors |
| `git diff --check` | CRLF line-ending notices only (Windows, expected) |

---

## Security constraints respected

- No Firestore rules changed (write goes through Admin SDK; talent read already covered by wildcard rule)
- No calendar, video calls, direct video upload, self-tape video upload, payment, subscription, or AI added
- No fake data seeded, no test users, no celebrity names
- Firebase/Auth/Admin security unchanged
- No `.env`, service account, or `node_modules` files touched
- No automatic commit
