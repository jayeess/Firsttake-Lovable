# Talent Pool Write Failure Fix Report

## Summary

This pass fixes the remaining Private Talent Pool write failure from the
recruiter applicant Decision Room. The live-safe values:

- Status: `SAVED`
- Tags: `Callback potential`
- Private note: `Good timing.`

now validate locally and pass Firestore emulator rules for create and update.

## Exact Root Cause

`saveTalentToPool` called `getDoc(entryRef)` before writing the Talent Pool
entry so it could preserve `createdAt`.

For a first-time Talent Pool entry, that document does not exist yet. The
Firestore rule for `recruiterTalentPool/{entryId}` only allowed reads when
`resource.data.recruiterId == request.auth.uid`. On a missing document,
`resource.data` is unavailable, so the pre-write existence check could be
denied before the valid create write ever ran.

That is why safe values such as `Callback potential` and `Good timing.` still
failed.

## Why The Previous Fix Still Failed

The previous pass improved validation, UI messages, and complete entry shape,
but it still performed the blocked existence read inside `saveTalentToPool`.
It also wrapped the underlying Firestore error through generic fallback copy,
which made the live UI show only:

`Failed to save Talent to pool`

instead of the real permission/save category.

## Files Changed

- `app/lib/firestore-service.ts`
- `app/lib/recruiter-talent-pool-policy.ts`
- `app/recruiter/auditions/[id]/applicants/page.tsx`
- `firestore.rules`
- `tests/recruiter-talent-pool-policy.test.mts`
- `tests/firestore.rules.mts`
- `CHANGELOG.md`
- `TESTING.md`
- `FULL_APP_UX_POLISH_REPORT.md`
- `TALENT_POOL_WRITE_FAILURE_FIX_REPORT.md`

## Service And UI Changes

- Removed the blocked pre-write `getDoc` existence check from
  `saveTalentToPool`.
- `saveTalentToPool` now writes the complete deterministic entry directly.
- Existing entries keep their original `createdAt` when the UI has already
  loaded the entry.
- Missing Talent/recruiter context now throws:
  `Missing Talent or recruiter context. Refresh and try again.`
- Firestore permission errors now surface as:
  `Permission denied while saving Talent Pool entry.`
- Unknown save failures now surface as:
  `Could not save Talent Pool entry. Please refresh and try again.`
- The applicant review Talent Pool panel passes the existing entry `createdAt`
  when updating.

## Firestore Rules Changes

`firestore.rules` changed.

- Recruiters can now `get` their own deterministic Talent Pool entry path even
  when the entry does not exist yet.
- `list` remains restricted to entries whose stored `recruiterId` is the
  current recruiter.
- `create` still requires a complete valid entry owned by the current recruiter.
- `update` now allows replacing the complete valid private entry shape when
  `id`, `recruiterId`, and `talentId` remain immutable.

Security remains intact:

- Talent cannot read recruiter Talent Pool entries.
- Unrelated recruiters cannot read or write another recruiter's entries.
- Private notes and tags remain recruiter-private.
- Invalid status and oversized fields remain rejected.

## Tests Added Or Updated

- Unit coverage for the live-safe input:
  `Callback potential` and `Good timing.`
- Emulator coverage for first-time `getDoc` on a deterministic recruiter-owned
  Talent Pool entry path.
- Emulator coverage for creating the exact safe Decision Room entry.
- Emulator coverage for replacing/updating the same deterministic entry.
- Existing privacy and invalid-field rule tests continue to pass.

## Verification

Run in this pass:

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run emulators:test`
- `git diff --check`

## Firebase Deploy

Firebase deploy is required because `firestore.rules` changed.

Suggested command:

```powershell
npx firebase-tools deploy --only firestore:rules --project lovable-first-take
```

Use the correct production project alias if different.

## Vercel Redeploy

Vercel redeploy is required after pushing this application code.

## Manual QA Checklist

- [ ] Open applicant Decision Room.
- [ ] Enter tag: `Callback potential`.
- [ ] Enter private note: `Good timing.`
- [ ] Save to Talent Pool.
- [ ] Confirm success message appears.
- [ ] Refresh page.
- [ ] Confirm existing saved state appears.
- [ ] Open `/recruiter/talent-pool`.
- [ ] Confirm entry appears.
- [ ] Update status/tags/note.
- [ ] Confirm update succeeds.
- [ ] Confirm Talent cannot see Talent Pool notes.

## Recommended Commit Message

`Fix Talent Pool write failure`
