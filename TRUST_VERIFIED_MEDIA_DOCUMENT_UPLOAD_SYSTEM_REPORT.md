# Trust-Verified Media and Document Upload System Report

**Date:** June 29, 2026  
**Project:** FirstTake by MVA Studios / Nata Connect  
**Scope:** Controlled Firebase Storage upload foundation for Talent media and Recruiter verification evidence.

## Summary

This pass adds a centralized upload policy and completes the trust-verified upload foundation for Talent profile media and Recruiter verification evidence. Talent profile photo and portfolio image uploads continue to use Firebase Storage, now with shared validation and a stricter portfolio-image limit. Recruiters can upload private verification documents/images, submit safe metadata through the existing secure verification API, and Admin can review those files from the verification queue.

No direct video upload, self-tape upload, payments, AI, fake data, seeding, auth weakening, or client-side admin writes were added.

## Upload Categories Implemented

- Talent profile photo
- Talent portfolio image
- Recruiter verification evidence

## Talent Profile Photo Behavior

- Authenticated Talent can upload their own profile photo.
- Allowed types: JPEG, PNG, WebP.
- Max size: 5 MB.
- Stored metadata: `profilePhotoUrl`, `profilePhotoPath`, `mediaUpdatedAt`.
- UI shows current preview, upload button, progress, errors, remove control, and privacy copy explaining that public profile sharing can expose the profile photo.

## Talent Portfolio Behavior

- Authenticated Talent can upload portfolio images to their own profile.
- Allowed types: JPEG, PNG, WebP.
- Max size: 5 MB per image.
- Image upload limit: 6 portfolio images.
- External showreel links remain supported.
- Direct video upload remains intentionally unavailable.
- UI copy explains ownership/permission expectations and warns not to upload private documents in the portfolio.

## Recruiter Verification Evidence Behavior

- Authenticated Recruiters can upload evidence files to their own private verification evidence path.
- Allowed examples: business registration, production proof, organization document, professional ID or authorization letter, project proof image/PDF.
- Allowed types: JPEG, PNG, WebP, PDF.
- Max size: 10 MB per evidence file.
- Max evidence count: 8 files.
- Evidence metadata is submitted through `/api/recruiter/verification`, which verifies the Firebase ID token and writes with the Admin SDK.
- Evidence files are associated with the matching `recruiterVerifications/{uid}` record.
- UI explains Admin-only review, sensitive-data redaction, and that verification does not guarantee casting outcomes.

## Admin Review Behavior

- `/admin/verifications` now shows uploaded evidence metadata for each recruiter verification.
- Admin can open evidence files from the verification queue.
- Evidence is not shown on public pages, audition pages, Talent-facing pages, or Recruiter public profile areas.
- Empty evidence state remains operational and tells Admin to use written proof and public links when no files are uploaded.

## Storage Path Strategy

Existing Talent paths remain:

- `talent-media/{uid}/profile/{fileName}`
- `talent-media/{uid}/portfolio/{mediaId}/{fileName}`

New Recruiter evidence path:

- `recruiter-verification-evidence/{uid}/{evidenceId}/{fileName}`

The new path is user-scoped and never shared publicly.

## Storage Rules Summary

Updated `storage.rules`:

- Talent profile and portfolio image writes require authenticated ownership, allowed image MIME types, correct metadata, and size limits.
- Talent portfolio image max size is now 5 MB.
- Recruiter evidence writes require authenticated Recruiter ownership, non-suspended account status, allowed image/PDF MIME types, private verification metadata, and 10 MB max size.
- Recruiter evidence reads are limited to the owning Recruiter and Admin users.
- Other Recruiters and anonymous users cannot read private verification evidence.

## Validation Policy

Created `app/lib/upload-policy.ts` to centralize:

- Allowed MIME types
- Max sizes
- Portfolio image count limit
- Recruiter evidence count limit
- Filename normalization
- Storage path generation
- Category labels
- Safe error messages

Existing Talent media policy now wraps the shared upload policy to preserve current imports.

## Tests Added or Updated

- Added `tests/upload-policy.test.mts`.
- Updated Storage emulator tests in `tests/firestore.rules.mts` for recruiter evidence privacy and PDF behavior.
- Existing Talent media tests continue to cover user-scoped Talent upload paths and image validation.

## Security Notes

- Recruiter evidence metadata is submitted through a token-verified server API route, not by insecure client-side admin writes.
- Storage rules enforce owner/admin access to private verification evidence.
- Evidence files are not exposed publicly.
- Admin file access is intentionally operational and tied to admin claim checks.
- Direct video upload and self-tape upload remain disabled; self-tapes stay external links only.

## Known Limitations

- Recruiter evidence files uploaded but never submitted can become orphaned until the user removes them or operational cleanup is added.
- Admin evidence viewing uses Firebase Storage download URL resolution from the admin browser session.
- There is no malware scanning, OCR, or automated document verification yet.
- There is no direct private video upload; this is intentional.
- Storage emulator validation should be run locally before deploying rules.

## Firebase Deploy Notes

Firebase deploy is required because `storage.rules` changed:

```powershell
npx firebase-tools deploy --only storage --project <project-id>
```

If deploying all security rules together:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage --project <project-id>
```

## Vercel Deploy Notes

A Vercel redeploy is required for the UI, API, policy, and documentation changes.

## Manual QA Checklist

- [ ] Talent can upload a JPEG/PNG/WebP profile photo under 5 MB.
- [ ] Talent sees a profile photo preview and can remove it.
- [ ] Talent cannot upload a PDF or video as profile/portfolio media.
- [ ] Talent can upload up to 6 portfolio images and still add external showreel links.
- [ ] Talent sees clear copy warning not to upload private documents in portfolio media.
- [ ] Recruiter can upload JPEG/PNG/WebP/PDF verification evidence under 10 MB.
- [ ] Recruiter sees evidence file metadata before submitting verification.
- [ ] Recruiter can remove evidence before submission.
- [ ] Recruiter submits verification and evidence metadata appears in `recruiterVerifications/{uid}`.
- [ ] Admin can open evidence from `/admin/verifications`.
- [ ] Other Recruiters cannot open another Recruiter's verification evidence.
- [ ] Anonymous users cannot read verification evidence.
- [ ] Self-tape upload is still unavailable and external links still work.
