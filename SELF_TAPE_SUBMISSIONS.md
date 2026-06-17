# Self-Tape Audition Submissions

Phase 5A adds a beta-safe self-tape workflow to Nata Connect. Recruiters can
request a self-tape on an audition, Talent can submit an external video link
after applying, and recruiters can review the submission from the applicant
pipeline.

## Product Flow

1. Recruiter creates a casting call and optionally enables self-tape
   requirements.
2. Recruiter marks the self-tape as required or optional, adds instructions,
   and may add a recommended duration.
3. Talent sees the self-tape prompt on the audition detail page.
4. Talent applies first, then submits or replaces the self-tape link from
   `/applications` while the application is active and the deadline has not
   passed.
5. Recruiter opens the applicant pipeline, views the self-tape link, and can
   mark it reviewed.

## Recruiter Workflow

- Self-tape is off by default for existing and new auditions.
- The create-audition form includes a `Self-tape requirements` section.
- External video links are enabled in Phase 5A.
- Direct video upload is modeled for future work but disabled in the UI until a
  private video serving path is available.
- Applicant cards show a self-tape badge:
  - Not requested
  - Requested
  - Required missing
  - Submitted
  - Reviewed

## Talent Workflow

- Talent can submit only for their own application.
- Talent can replace or remove the link before the audition deadline while the
  application is active.
- Withdrawn applications and expired auditions lock self-tape changes.
- Talent receives confirmation after submitting.

## Data Model

Auditions may include:

```ts
selfTapeEnabled?: boolean;
selfTapeRequired?: boolean;
selfTapeInstructions?: string;
selfTapeSubmissionTypes?: Array<'upload' | 'link'>;
selfTapeMaxDurationSeconds?: number | null;
```

Applications may include:

```ts
selfTapeStatus?:
  | 'not_requested'
  | 'requested'
  | 'submitted'
  | 'missing'
  | 'reviewed';
selfTapeSubmission?: {
  type: 'upload' | 'link';
  url?: string;
  storagePath?: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
  submittedAt?: Timestamp;
  updatedAt?: Timestamp;
};
selfTapeReviewedAt?: Timestamp;
```

## Security and Access Model

- Self-tape writes go through authenticated server APIs using Firebase Admin
  verification.
- Talent cannot update another Talent member's application.
- Talent cannot directly write self-tape fields through client Firestore rules.
- Recruiters can review self-tapes only for auditions they own.
- Admin overview can see self-tape request/submission counts through server-only
  Admin SDK reads.
- External self-tape URLs are validated as `http` or `https`, length-limited,
  and blocked from obvious HTML/script input.

## Storage Strategy

Phase 5A does not enable Firebase Storage video uploads. The future private
upload path should be:

```text
self-tapes/{talentUid}/{applicationId}/{fileName}
```

Before enabling upload, add Storage rules and emulator tests for:

- owning Talent upload/update only
- recruiter-owner read access only
- admin read/moderation access
- video content types only
- size limit of 100MB or lower
- no public access

## Notifications and Audit Logs

- Talent gets `self_tape_submitted` after submitting.
- Recruiter gets `self_tape_submitted` when an applicant submits.
- Talent gets `self_tape_reviewed` when recruiter marks reviewed.
- Recruiter review writes an audit log action: `self_tape_reviewed`.

## Known Limitations

- No direct video upload yet.
- No in-browser recording.
- No video transcoding, thumbnails, waveforms, or playback optimization.
- No public self-tape sharing.
- No self-tape report queue beyond existing application/report moderation
  patterns.

## Future Improvements

- Private Firebase Storage upload and signed viewing
- Mux or Cloudinary video processing
- In-browser recording
- Transcoding and thumbnail generation
- Callback scheduling
- Script/sides attachment with watermarking
- Admin removal/hide action for unsafe self-tape metadata
