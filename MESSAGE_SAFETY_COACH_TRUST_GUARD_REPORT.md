# Message Safety Coach and On-Platform Trust Guard — Implementation Report

**Date:** June 29, 2026
**Pass:** 24 — Message Safety Coach + On-Platform Trust Guard
**Repository:** `jayeess/Firsttake-Nata-Connect`

---

## Goal

Build transparent, rule-based message safety guidance that displays inside the
messaging flow without blocking sending, without using AI, and without
introducing any new backend permissions, schemas, payments, or upload behavior.

---

## Files Created

### `app/lib/message-safety-policy.ts`

Rule-based message safety library. Five private signal detectors (regex only,
no AI, no network calls):

| Signal key | Severity | Examples caught |
|---|---|---|
| `payment` | caution | registration fee, audition fee, pay first, deposit required, bank account details |
| `offPlatform` | warning | WhatsApp, Telegram, contact me on signal, move off the app |
| `document` | caution | Aadhaar, PAN card, passport copy, government ID, address proof |
| `guarantee` | warning | guaranteed role, 100% selected, you have been selected, we confirm your selection |
| `urgency` | attention | respond now, last chance, today only, time is running out, respond within X minutes |

Band logic:

- No flagged signals → `looks_professional`
- `attention` only → `review_recommended`
- Any `warning` (no caution) → `strong_caution`
- Any `caution` → `needs_trust_review`

Exported API:
- `getMessageSafetySignals(text)` — returns all 5 signals with `ok` or risk status
- `getMessageSafetyBand(signals)` — derives band from signal array
- `getMessageSafetySummary(text)` — combined summary with band, flagged signals, and hasHighRisk
- `hasHighRiskMessageLanguage(text)` — true if any caution signal
- `getSafeConversationReminders(role?)` — 5 role-specific reminder strings
- `getSuggestedSafeReplyTemplates(role?)` — 4 safe reply templates per role

### `tests/message-safety-policy.test.mts`

41 new unit tests covering:
- Signal structure (5 signals always returned)
- Payment language detection — positive and false-positive avoidance
- Off-platform pressure detection — positive and false-positive avoidance
- Document request detection — positive and false-positive avoidance
- Guaranteed role language detection — positive and false-positive avoidance
- Urgency pressure detection — positive and false-positive avoidance
- Band logic for all four outcomes
- `getMessageSafetySummary` shape and high-risk flag
- `hasHighRiskMessageLanguage` true/false cases
- `getSafeConversationReminders` count and content per role
- `getSuggestedSafeReplyTemplates` count and content per role

---

## Files Modified

### `app/messages/[conversationId]/page.tsx`

1. Added `useMemo` to React import (was missing).
2. Imported `getMessageSafetySummary`, `getSafeConversationReminders`.
3. Added `safetySummary` derived state via `useMemo([body])` — re-runs on every
   keystroke using pure regex; no network calls.
4. Added dynamic safety coach in the compose form: appears only when
   `body.length > 15` and the band is not `looks_professional`. Shows the band
   label and all flagged signal details in amber. Does NOT block sending.
5. Replaced plain-text "Platform safety" aside section with a structured
   "Safe messaging" trust guard panel populated by `getSafeConversationReminders`.

### `app/messages/page.tsx`

Added two inbox safety cues to the dark aside panel:
- "Legitimate auditions never charge a fee to apply."
- "Keep scheduling details on-platform."

### `app/safety/page.tsx`

Added "Safe Messaging During Auditions" section covering fee requests,
off-platform pressure, document requests, guaranteed role claims, and urgency
tactics — with guidance to stay inside Nata Connect and use the Report button.

### `app/help/page.tsx`

Expanded "Messaging Safely" section body from a 2-sentence summary to a
5-sentence guide covering: platform-linked conversations, no personal/financial
info in chat, no fees or off-platform pressure, reporting unsafe messages, and
the right not to respond.

### `app/recruiter/auditions/[id]/applicants/page.tsx`

- Added `MessageSquare` to lucide-react import (was already imported in prior pass — confirmed).
- Added "Professional messaging" `SafetyNotice` alongside the existing "Casting
  integrity" notice in a two-column grid. Covers: professional and role-specific
  messages, no fee requests, no unrelated documents, clear on-platform
  scheduling.

---

## Design Decisions

**No blocking:** The safety coach never prevents sending. It is guidance only,
consistent with platform policy and the feature brief.

**False-positive resistance:** Patterns require contextual phrases (`"audition fee"`,
not just `"fee"`; `"contact me on WhatsApp"`, not just `"WhatsApp"`). The
`payment` detector does not fire on `"pay attention"` or `"payment terms"`. The
`urgency` detector does not fire on normal deadline reminders.

**Performance:** `getMessageSafetySignals` runs synchronously on each keystroke
inside a `useMemo([body])`. All computation is pure regex — no state side
effects, no network calls.

**No AI language:** No output copy or UI label claims AI detection, AI
moderation, or AI safety. Every signal is described as rule-based.

---

## No-Change Checklist

- Firestore security rules: unchanged
- Firebase Auth / Admin SDK: unchanged
- Firestore schemas: unchanged
- API routes: unchanged
- Application submission logic: unchanged
- Payment or subscription: not introduced
- Calendar scheduling: not introduced
- Video calls: not introduced
- Self-tape upload: unchanged (external links only)
- `.env` / `.env.local` / service-account files: not touched
- Fake users or celebrity names: not introduced
- Guaranteed casting claims: not made

---

## Test Results

```
ℹ tests 158
ℹ pass  158
ℹ fail  0
```

Lint: clean. Build: all routes compiled.
