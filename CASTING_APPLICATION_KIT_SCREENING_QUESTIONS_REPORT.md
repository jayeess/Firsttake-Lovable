# Casting Application Kit — Screening Questions Report

**Pass:** 27  
**Date:** 2026-06-30  
**Branch:** main  
**Status:** Complete — lint ✓, 311 unit tests ✓, build ✓, git diff --check ✓

---

## What Was Built

A core product workflow allowing recruiters to add role-specific screening
questions to auditions, Talent to answer those questions while applying, and
recruiters to see answers clearly inside the applicant Decision Room.

This makes FirstTake more useful than WhatsApp, Google Forms, Instagram, or
spreadsheets for casting workflows — while keeping the process transparent,
rule-based, recruiter-controlled, Talent-friendly, privacy-safe, and
safety-first.

---

## Changed Files

| File | Change |
|------|--------|
| `app/lib/types.ts` | Added `ScreeningQuestionType`, `ScreeningQuestion`, `ScreeningAnswer` types; added `screeningQuestions` to `Audition`; added `screeningAnswers` to `Application` |
| `app/lib/casting-application-kit-policy.ts` | **NEW** — Self-contained policy module. See below. |
| `firestore.rules` | Added `screeningQuestions` size limit (≤ 8) to audition create and update rules |
| `app/lib/firestore-service.ts` | `createAudition` accepts `screeningQuestions`; `submitApplication` accepts and passes `screeningAnswers` |
| `app/api/applications/route.ts` | POST handler accepts, sanitizes, and stores `screeningAnswers` |
| `app/recruiter/auditions/new/page.tsx` | Added "04 · Casting Application Kit" section with full question editor, template picker, safety flags, and options editor |
| `app/auditions/[id]/page.tsx` | Apply form shows inline screening questions; required answers block submit |
| `app/recruiter/auditions/[id]/applicants/page.tsx` | `ScreeningAnswersPanel` in Decision Room expanded view |
| `app/applications/page.tsx` | Pack tags row shows screening answer count cue |
| `tests/casting-application-kit-policy.test.mts` | **NEW** — 38 unit tests |
| `tests/firestore.rules.mts` | 4 new emulator tests for screeningQuestions size rule |

---

## Policy Module: `app/lib/casting-application-kit-policy.ts`

Self-contained (only imports from `./types`). Key exports:

**Constants:** `MAX_SCREENING_QUESTIONS` (8), `MAX_PROMPT_LENGTH` (180),
`MAX_HELP_TEXT_LENGTH` (240), `MAX_SHORT_ANSWER_LENGTH` (600),
`MAX_MULTI_CHOICE_SELECTED` (4), `MAX_OPTIONS` (6), `MAX_OPTION_LENGTH` (80).

**Safety patterns blocked:**
- Payment/fee requests (registration fee, audition fee, pay to audition, etc.)
- Deposit requests
- Bank account/details/transfer requests
- OTP/password requests
- Government ID number requests (Aadhaar, PAN, passport number, voter ID)
- Private document requests (upload Aadhaar, share PAN card, etc.)
- Off-platform contact pressure (WhatsApp, Telegram, Instagram DM, "outside the platform")
- Sensitive medical data (medical certificate, blood group, pregnancy status)
- Political/religious identity (political party/affiliation, caste certificate)

**Safe patterns NOT blocked:** language availability, date availability,
location/travel, experience, dance/theatre/acting, self-tape readiness, role
requirements.

**Templates (6):**
1. "Are you available for the listed shoot or event dates?" — yes_no, required
2. "Which languages can you perform in for this role?" — short_text, optional
3. "Do you have relevant dance, theatre, or acting experience for this role?" — yes_no, optional
4. "Can you travel to or work at the listed location?" — yes_no, required
5. "Do you have an external self-tape or showreel link ready to share?" — yes_no, optional
6. "Are you comfortable with the listed role requirements?" — yes_no, optional

---

## Firestore Security Rules

Both audition `create` and `update` paths now enforce:

```
&& request.resource.data.get('screeningQuestions', []).size() <= 8
```

Application creation goes through the Admin SDK (server-side API route) which
bypasses Firestore rules. Sanitization is done inline in the route handler.

---

## UI Flow

### Recruiter: Create Audition

1. Section "04 · Casting Application Kit" appears in the form (publishing section is "05").
2. Click "Add question" to create a blank question card (up to 8).
3. Edit: prompt (max 180 chars), answer type (yes_no / short_text / single_choice / multi_choice), required toggle, options (for choice types, max 6 × 80 chars), help text (optional, max 240 chars).
4. Safety flags appear inline if unsafe language is detected.
5. Template chips (6) let recruiters start from safe examples.
6. Questions with blank prompts are filtered out before saving.

### Talent: Apply

1. If the audition has screening questions, they appear below the cover message.
2. Required questions show a `*` marker.
3. yes_no renders radio buttons (Yes/No); short_text renders a textarea; single_choice renders radios; multi_choice renders checkboxes.
4. Clicking "Submit application" validates required answers. Missing required answers show an error and block submission.
5. Answers are stored on the application document via the API route.

### Recruiter: Decision Room

1. Expanding an applicant card shows a "Screening answers" section after "Application message".
2. Each question shows: Required/Optional label, prompt, and formatted answer.
3. Unanswered questions show "—".
4. Note: "Screening answers are a reference for your review. They do not constitute automatic ranking or selection."

### Talent: My Applications

Pack tags row shows "N screening answer(s)" when answers exist on the application.

---

## Test Results

```
npm run lint      → pass (0 warnings)
npm test          → 311 pass, 0 fail
npm run build     → ✓ Compiled successfully
git diff --check  → 0 whitespace errors (CRLF line-ending warnings only, Windows)
npm run emulators:test → Requires local Firebase emulators (not available in this environment)
```

**Unit tests (38):** Safety flag detection (8), question validation (8),
multi-question validation (3), normalization (3), checklist (3), templates (3),
answer sanitization (4), answer validation (6), screening summary (5), recruiter
review (3), Talent guidance (3).

**Firestore emulator tests (4):** Create reject over 8, create allow up to 8,
update reject over 8, update allow up to 8.

---

## Safety and Privacy

- No AI. Nothing is called "AI screening," "AI ranking," "AI selection," or "AI matching."
- No auto-ranking. No auto-selection.
- No payment or subscription added.
- No calendar scheduling, video calls, direct video upload, or self-tape upload.
- Self-tapes remain external links only.
- No fake data, no fake users, no celebrity names, no copyrighted project names.
- No guarantee of casting or jobs to Talent.
- Talent are never asked to pay.
- Screening questions blocking unsafe prompts via content patterns.
- Screening answers are stored on the application document, visible only to the recruiter and admins.
- No private Talent documents exposed.
- No private recruiter evidence exposed.
- No admin notes, private moderation data, hidden media, email, or phone exposed.
- No Firebase/Auth/Admin security weakened.
- No secrets exposed. `.env`, `.env.local`, `node_modules`, `.next`, service-account files untouched.
