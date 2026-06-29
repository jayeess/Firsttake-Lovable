# Casting Brief Quality Engine + Scam Shield Report

## Summary

This pass adds a transparent, rule-based Casting Brief Quality Engine and Scam
Shield layer to FirstTake / Nata Connect. It helps recruiters write clearer
casting briefs, helps Talent understand whether an audition is clear and safe,
and helps Admin review risky or incomplete posts faster.

This is not AI, automatic fraud detection, or applicant ranking. It is
explainable product guidance based on fields already present in each audition.

## Casting Brief Quality Engine Logic

The policy helper in `app/lib/casting-brief-quality-policy.ts` evaluates:

- specific title
- detailed role description
- category
- location or work mode
- valid future deadline
- compensation clarity
- requirements clarity
- self-tape instructions when self-tape is required
- recruiter trust status when available

Quality bands:

- Strong brief
- Good brief
- Needs detail
- Needs review

## Scam Shield / Safety Signal Logic

Safety signals look for potential risk language in existing brief text:

- payment request language
- off-platform/private contact pressure
- pressure or guarantee language
- sensitive or unrelated document requests

The UI uses careful wording such as "potential risk language" and "needs
review." It does not claim automatic scam detection.

## Recruiter Publishing Improvements

`/recruiter/auditions/new` now includes a Publish Readiness panel that updates
from the current form state. It shows:

- quality band and score
- completed checklist items
- missing details
- safety reminders
- self-tape instruction reminders when required

Publishing behavior is unchanged. Guidance does not block saving or publishing
beyond existing validation.

## Talent Audition Safety Improvements

Talent-facing audition cards and detail pages now show:

- brief quality band
- verified recruiter cue when available
- keep communication on-platform cue
- never pay to audition cue
- gentle review guidance only when safety language is present

The experience avoids making normal legitimate posts look suspicious.

## Admin Audition Risk Improvements

`/admin/auditions` now shows:

- brief quality/risk badge
- quality score
- count of readiness items to review
- admin review cues for unsafe language, expired deadlines, missing critical
  details, or active briefs without visible recruiter verification

No private recruiter evidence is exposed.

## Files Changed

- `app/lib/casting-brief-quality-policy.ts`
- `app/recruiter/auditions/new/page.tsx`
- `app/recruiter/auditions/page.tsx`
- `components/audition-card.tsx`
- `app/auditions/[id]/page.tsx`
- `app/admin/auditions/page.tsx`
- `tests/casting-brief-quality-policy.test.mts`
- `README.md`
- `CHANGELOG.md`
- `TESTING.md`
- `PRODUCT_STATUS_AND_ROADMAP.md`
- `FULL_APP_UX_POLISH_REPORT.md`

## Tests Added

`tests/casting-brief-quality-policy.test.mts` covers:

- strong brief quality
- missing description detail lowering quality
- expired deadline review item
- payment request safety signal
- private contact pressure safety signal
- unrelated document request safety signal
- required self-tape without instructions
- no AI or fake detection language in helper labels
- band logic
- admin risk output

## Security Notes

- No Firestore rules changed.
- No Storage rules changed.
- No schemas changed.
- No auth, role, or admin permissions changed.
- No secrets exposed.
- No client-side admin writes added.
- No private recruiter verification evidence exposed.

## What Was Intentionally Not Added

- AI matching or AI safety
- automatic scam detection claims
- payment or subscription behavior
- calendar scheduling
- video calls
- direct video upload
- self-tape video upload
- fake data or fake users
- guaranteed casting or guaranteed jobs

Self-tapes remain external links only.

## Known Limitations

- The safety layer is rule-based and text-pattern driven, so it can miss subtle
  unsafe behavior and may flag benign wording for admin review.
- Recruiter trust status appears only when the audition object already carries
  verified recruiter context.
- Quality guidance does not replace human moderation.

## Firebase Deploy Notes

No Firebase deploy is needed because no Firestore rules, indexes, Storage
rules, Auth behavior, or backend configuration changed.

## Vercel Deploy Notes

Vercel redeploy is needed after pushing this pass because client UI and shared
TypeScript code changed.

## Manual QA Checklist

- [ ] Open `/recruiter/auditions/new` and confirm Publish Readiness updates as
  title, description, requirements, deadline, pay info, and self-tape fields
  change.
- [ ] Save a normal draft and confirm existing validation behavior is unchanged.
- [ ] Open `/recruiter/auditions` and confirm each brief shows a compact quality
  cue.
- [ ] Open `/auditions` and confirm audition cards show quality bands without
  excessive warnings.
- [ ] Open `/auditions/[id]` and confirm brief quality and safety cues appear
  near the role details.
- [ ] Open `/admin/auditions` and confirm admin rows show quality/risk cues and
  human-readable reasons.
- [ ] Confirm no flow asks Talent to upload self-tape video directly.
