import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canRecruiterPublishAudition,
  canRecruiterReopenAudition,
  canTalentApplyToAudition,
  getAuditionLifecycleBadge,
  getAuditionLifecycleStatus,
  getDuplicateAuditionDraft,
} from '../app/lib/audition-lifecycle-policy.ts';
import type { Audition } from '../app/lib/types.ts';

const now = new Date('2026-06-12T00:00:00.000Z');

const audition = (overrides: Partial<Audition> = {}): Audition => ({
  id: 'audition-a',
  recruiterId: 'recruiter-a',
  recruiterName: 'Northstar Pictures',
  title: 'Lead actor for Telugu streaming drama',
  description:
    'Casting a grounded lead performer for a regional streaming drama with a clear production schedule and professional application process.',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Hyderabad',
  duration: 'Five shoot days',
  requirements:
    'Telugu fluency, screen acting experience, availability for callbacks, and comfort with dramatic dialogue.',
  numberOfPositions: 1,
  payInfo: 'Paid role with final day rate shared after shortlist.',
  deadline: new Date('2030-06-25T00:00:00.000Z'),
  status: 'ACTIVE',
  moderationStatus: 'VISIBLE',
  recruiterVerified: true,
  applicantCount: 7,
  selfTapeEnabled: true,
  selfTapeRequired: false,
  selfTapeInstructions:
    'Share an unlisted one-minute performance link with clear audio and natural light.',
  selfTapeSubmissionTypes: ['link'],
  screeningQuestions: [
    {
      id: 'availability',
      prompt: 'Are you available for callbacks next week?',
      type: 'yes_no',
      required: true,
      order: 0,
    },
  ],
  ...overrides,
});

test('lifecycle status distinguishes active, closing soon, expired, and removed auditions', () => {
  assert.equal(getAuditionLifecycleStatus(audition(), now), 'ACTIVE');
  assert.equal(
    getAuditionLifecycleStatus(
      audition({ deadline: new Date('2026-06-13T00:00:00.000Z') }),
      now
    ),
    'CLOSING_SOON'
  );
  assert.equal(
    getAuditionLifecycleStatus(
      audition({ deadline: new Date('2026-06-01T00:00:00.000Z') }),
      now
    ),
    'EXPIRED'
  );
  assert.equal(
    getAuditionLifecycleStatus(audition({ moderationStatus: 'REMOVED' }), now),
    'REMOVED'
  );
});

test('talent can only apply to visible active auditions before the deadline', () => {
  assert.equal(canTalentApplyToAudition(audition(), now), true);
  assert.equal(canTalentApplyToAudition(audition({ status: 'DRAFT' }), now), false);
  assert.equal(canTalentApplyToAudition(audition({ status: 'CLOSED' }), now), false);
  assert.equal(
    canTalentApplyToAudition(
      audition({ deadline: new Date('2026-06-01T00:00:00.000Z') }),
      now
    ),
    false
  );
});

test('closed auditions can reopen only when visible and before the deadline', () => {
  assert.equal(canRecruiterReopenAudition(audition({ status: 'CLOSED' }), now), true);
  assert.equal(
    canRecruiterReopenAudition(
      audition({
        status: 'CLOSED',
        deadline: new Date('2026-06-01T00:00:00.000Z'),
      }),
      now
    ),
    false
  );
  assert.equal(
    canRecruiterReopenAudition(
      audition({ status: 'CLOSED', moderationStatus: 'REMOVED' }),
      now
    ),
    false
  );
});

test('draft publishing requires a verified recruiter, future deadline, and safe brief', () => {
  assert.equal(
    canRecruiterPublishAudition(audition({ status: 'DRAFT' }), now),
    true
  );
  assert.equal(
    canRecruiterPublishAudition(
      audition({ status: 'DRAFT', recruiterVerified: false }),
      now
    ),
    false
  );
  assert.equal(
    canRecruiterPublishAudition(
      audition({
        status: 'DRAFT',
        deadline: new Date('2026-06-01T00:00:00.000Z'),
      }),
      now
    ),
    false
  );
});

test('duplicate creates a draft without applicant or moderation state', () => {
  const draft = getDuplicateAuditionDraft(
    audition({
      moderationStatus: 'REMOVED',
      moderationReason: 'unsafe',
      applicantCount: 23,
    }),
    now
  );

  assert.equal(draft.status, 'DRAFT');
  assert.equal(draft.title, 'Copy of Lead actor for Telugu streaming drama');
  assert.equal('applicantCount' in draft, false);
  assert.equal('moderationStatus' in draft, false);
  assert.equal('moderationReason' in draft, false);
  assert.notEqual(draft.screeningQuestions?.[0]?.id, 'availability');
  assert.equal(draft.deadline > now, true);
});

test('badge labels are audience-friendly', () => {
  assert.deepEqual(getAuditionLifecycleBadge(audition({ status: 'DRAFT' }), now), {
    label: 'Draft',
    tone: 'attention',
  });
  assert.deepEqual(
    getAuditionLifecycleBadge(audition({ status: 'CLOSED' }), now),
    {
      label: 'Closed',
      tone: 'neutral',
    }
  );
});
