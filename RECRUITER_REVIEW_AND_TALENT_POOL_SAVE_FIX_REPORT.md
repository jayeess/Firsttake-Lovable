# Recruiter Review and Talent Pool Save Fix Report

## Summary

This pass fixes the recruiter Decision Room save experience for private
casting reviews and Private Talent Pool entries. The goal was not to add new
features, but to make the existing recruiter workflow reliable, explicit, and
safe.

## Root Cause: Talent Pool Save Failure

The Talent Pool save path had two weaknesses:

- The UI converted validation, permission, and write failures into a broad
  "Unable to save Talent Pool entry" message.
- The service used a merge write against the Talent Pool entry. If an older or
  partial entry existed, the write could preserve stale shape problems instead
  of replacing the entry with the current valid schema.

The policy layer was already doing most safety checks, but the UI did not make
those messages clear enough for recruiters.

## Root Cause: Private Review Save Issue

The private review form submitted `talentNextStepNote` as the intended
Talent-visible note, but the direct Firestore rules shape did not include that
field. The API route uses Firebase Admin and validates server-side, but the
rules mismatch meant emulator coverage and direct client/rules expectations
were out of sync with the product model.

The UI also lacked a local success state, so successful private review saves
did not feel confirmed.

## Files Changed

- `app/recruiter/auditions/[id]/applicants/page.tsx`
- `app/lib/recruiter-talent-pool-policy.ts`
- `app/lib/application-pipeline.ts`
- `app/lib/firestore-service.ts`
- `firestore.rules`
- `tests/recruiter-talent-pool-policy.test.mts`
- `tests/application-pipeline.test.mts`
- `tests/firestore.rules.mts`
- `CHANGELOG.md`
- `TESTING.md`
- `FULL_APP_UX_POLISH_REPORT.md`
- `RECRUITER_REVIEW_AND_TALENT_POOL_SAVE_FIX_REPORT.md`

## Validation And UX Fixes

- Private review save now validates before submit and shows a clear success
  message: "Private review saved."
- Private review save now shows specific validation/error copy near the form.
- Talent-visible notes now block contact details and off-platform instructions
  while allowing normal offline shoot or office context.
- Talent Pool tags are trimmed, comma-split, deduped, and empty values are
  removed.
- Placeholder tag text such as "tag" or "tags" is ignored instead of saved.
- Talent Pool policy still accepts normal casting language such as callback,
  Telugu speaker, dancer, theatre, voice artist, Hyderabad, future fit,
  portfolio, and showreel.
- Talent Pool policy allows "offline office" when it is not off-platform
  contact pressure.
- Unsafe Talent Pool notes produce field-specific guidance, for example:
  "Remove off-platform contact pressure from the private note."
- Permission/write failures now show an actionable recruiter-account message
  instead of only a generic failure.
- Existing Talent Pool entries are updated by writing the complete current entry
  shape, keeping deterministic IDs for safe duplicate/update behavior.
- The panel shows when an existing Talent Pool entry was last updated.

## Firestore Rules

`firestore.rules` changed.

The application review update rule now allows the intended
`talentNextStepNote` field and enforces a maximum length of 400 characters.
The rule still only allows the owning recruiter of the audition to update
recruiter-controlled application review fields.

Talent Pool ownership rules were not weakened:

- Only the owning recruiter can create/read/update/delete their Talent Pool
  entries.
- Talent users cannot read recruiter private Talent Pool entries.
- Unrelated recruiters cannot read or write entries.
- Private pool notes and tags remain recruiter-only.

## Tests Added Or Updated

- Talent Pool tag normalization covers comma splitting, trimming, dedupe,
  placeholder filtering, and empty tag removal.
- Safe tags such as callback, Telugu speaker, and future fit remain accepted.
- Unsafe Talent Pool notes produce specific private-note guidance.
- "Offline office" wording remains allowed when it is not contact pressure.
- Talent-visible note validation blocks WhatsApp/off-platform instructions.
- Talent-visible note validation allows normal offline studio callback context.
- Firestore emulator coverage verifies recruiter application review updates can
  include `talentNextStepNote`.
- Firestore emulator coverage rejects oversized Talent-visible notes.

## Firebase Deploy

Firebase deploy is required because `firestore.rules` changed.

Suggested command:

```powershell
npx firebase-tools deploy --only firestore:rules --project lovable-first-take
```

Use the correct production project alias if different.

## Vercel Redeploy

Vercel redeploy is required after pushing the application changes.

## Manual QA Checklist

Recruiter:

- [ ] Open an applicant Decision Room.
- [ ] Add private recruiter note.
- [ ] Add internal tags.
- [ ] Add Talent-visible note.
- [ ] Save private review.
- [ ] Confirm success message appears.
- [ ] Try unsafe off-platform text and confirm clear validation message.
- [ ] Save Talent to Talent Pool with safe tags/note.
- [ ] Confirm success message appears.
- [ ] Open `/recruiter/talent-pool`.
- [ ] Confirm entry appears.
- [ ] Update entry.
- [ ] Remove entry.

Talent:

- [ ] Confirm Talent cannot see private recruiter notes.
- [ ] Confirm Talent cannot see Talent Pool notes.
- [ ] Confirm Talent-visible note only appears where intended.

## Known Limitations

- Firestore rules enforce ownership and field shape. Rich language policy such
  as off-platform pressure and sensitive terms is enforced by shared client/API
  policy helpers.
- No new messaging, calendar, payment, upload, AI, or fake data behavior was
  added.

## Recommended Commit Message

`Fix recruiter review and Talent Pool save flow`
