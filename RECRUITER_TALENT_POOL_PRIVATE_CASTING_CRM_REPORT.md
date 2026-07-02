# Recruiter Talent Pool + Private Casting CRM Report

## Summary

Recruiters can now save applicants from the Decision Room into a private Talent
Pool, add bounded private notes and tags, and revisit saved Talent later at
`/recruiter/talent-pool`.

The feature is recruiter-owned, human-led, privacy-safe, and does not rank,
auto-select, or guarantee casting outcomes.

## Data Model Added

`RecruiterTalentPoolEntry` was added to `app/lib/types.ts`.

Fields:

- `id`
- `recruiterId`
- `talentId`
- `talentNameSnapshot`
- `talentPublicSlug`
- `talentCategorySnapshot`
- `sourceApplicationId`
- `sourceAuditionId`
- `sourceAuditionTitleSnapshot`
- `status`
- `tags`
- `privateNote`
- `createdAt`
- `updatedAt`

Status values:

- `SAVED`
- `WATCHLIST`
- `FUTURE_FIT`
- `DO_NOT_CONTACT`

The entry stores display snapshots only. It does not copy Talent email, phone,
private documents, hidden media, admin notes, reports, verification evidence, or
private account fields.

## Talent Pool Policy Logic

`app/lib/recruiter-talent-pool-policy.ts` adds pure helper logic for:

- tag normalization and deduplication
- max 20 tags
- max 32 characters per tag
- max 1000 characters for private notes
- allowed status validation
- safety flag detection for unsafe private notes/tags
- safe status labels, tones, summaries, empty states, and guidance copy

Blocked/flagged language includes payment requests, bank details, OTP/password
requests, private document references, off-platform contact pressure, sensitive
identity categories, body-shaming, and abusive comments.

## Firestore Service Changes

`app/lib/firestore-service.ts` adds:

- `saveTalentToPool(input)`
- `getRecruiterTalentPool(recruiterId?)`
- `updateTalentPoolEntry(entryId, patch)`
- `removeTalentPoolEntry(entryId)`
- `getTalentPoolEntryForTalent(talentId)`
- `getRecruiterTalentPoolEntryId(recruiterId, talentId)`

Entries use deterministic IDs: `{recruiterId}__{talentId}`. This prevents
duplicate pool records for the same recruiter/Talent pair in normal use.

## Firestore Rules and Security

`firestore.rules` adds `recruiterTalentPool/{entryId}`.

Rules ensure:

- only the owning recruiter can create, read, update, or delete an entry
- Talent cannot read recruiter private notes or tags
- unrelated recruiters cannot read or write another recruiter's entries
- unauthenticated users are blocked
- `recruiterId` must equal `request.auth.uid`
- `id` must match `{recruiterId}__{talentId}`
- status must be one of the allowed Talent Pool statuses
- tags are limited to 20 items
- private note is limited to 1000 characters
- only approved schema fields can be written

Known rule limitation: Firestore rules bound the tag list size but do not deeply
validate every tag string length/content. Per-tag length and safety validation
are enforced in the policy helper and covered by unit tests.

## Decision Room Integration

`/recruiter/auditions/[id]/applicants` now shows a "Private Talent Pool" panel
inside expanded applicant review.

Recruiters can:

- see whether the applicant is already saved
- set Talent Pool status
- add comma-separated tags
- add a private pool note
- update an existing entry
- remove the entry
- open the full Talent Pool page

This panel does not affect application status transitions, selected/rejected
logic, Talent-visible notes, messaging, or official application history.

## Talent Pool Page Behavior

`/recruiter/talent-pool` shows:

- saved Talent entries
- summary metrics
- status filter
- search across name, tag, source audition, category, and note
- Talent name snapshot
- public portfolio link when a public slug exists
- source audition review link when source audition exists
- private note preview
- tags
- updated date
- remove action
- polished empty state

The recruiter app shell now includes a "Talent Pool" navigation item.

## Files Changed

- `app/lib/types.ts`
- `app/lib/recruiter-talent-pool-policy.ts`
- `app/lib/firestore-service.ts`
- `app/recruiter/auditions/[id]/applicants/page.tsx`
- `app/recruiter/talent-pool/page.tsx`
- `components/app-shell.tsx`
- `firestore.rules`
- `tests/recruiter-talent-pool-policy.test.mts`
- `tests/firestore.rules.mts`
- `README.md`
- `CHANGELOG.md`
- `TESTING.md`
- `PRODUCT_STATUS_AND_ROADMAP.md`
- `FULL_APP_UX_POLISH_REPORT.md`

## Tests Added/Updated

- Added policy tests for tag normalization, tag count, tag length, note length,
  unsafe tag/note language, allowed casting tags, status labels/tones, and
  summary copy safety.
- Added Firestore emulator tests for recruiter-owned create/read/update/delete,
  cross-recruiter denial, Talent denial, unauthenticated denial, invalid status,
  oversized tag lists, and oversized notes.

## Security and Privacy Notes

- Talent Pool entries are private to the owning recruiter.
- Talent cannot read recruiter private pool notes or tags.
- Recruiters cannot read or write another recruiter's pool.
- The feature does not expose private Talent documents, private media,
  verification evidence, admin notes, reports, emails, phone numbers, or private
  account fields.
- Notes and tags are bounded and safety-checked before write attempts.

## What Was Intentionally Not Added

- No AI
- No automatic ranking
- No automatic selection
- No guaranteed casting or jobs
- No payment/subscription
- No calendar scheduling
- No video calls
- No direct video upload
- No self-tape upload
- No public Talent Pool exposure
- No fake data or fake users

## Known Limitations

- Saving starts from recruiter applicant review only.
- Public Talent profile save action was not added in this MVP to avoid changing
  public profile privacy behavior.
- Firestore rules do not deeply inspect every tag string; app policy validates
  tag length and unsafe words before writes.

## Firebase Deploy Notes

Firestore rules changed, so deploy rules before production use:

```powershell
npx firebase-tools deploy --only firestore:rules --project <project-id>
```

## Vercel Deploy Notes

Vercel redeploy is needed after pushing app code changes.

## Manual QA Checklist

- [ ] Sign in as recruiter.
- [ ] Open `/recruiter/auditions`.
- [ ] Open a brief's Decision Room.
- [ ] Expand an applicant.
- [ ] Save the applicant to Talent Pool with safe tags and note.
- [ ] Reload the applicant review and confirm saved status appears.
- [ ] Open `/recruiter/talent-pool`.
- [ ] Search/filter by status, tag, source audition, and name.
- [ ] Open public portfolio link when available.
- [ ] Remove a Talent Pool entry.
- [ ] Sign in as Talent and confirm `/recruiter/talent-pool` redirects away.
