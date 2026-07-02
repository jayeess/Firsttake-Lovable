import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applicationMatchesTrackerView,
  canRecruiterTransition,
  filterApplicants,
  getApplicationNextStep,
  getApplicationPackSummary,
  getApplicationStatus,
  getApplicationTrackerViewCount,
  getDecisionSafetyCue,
  getPipelineCounts,
  getRecruiterNextAction,
  getTalentStageGuidance,
  shouldShowApplicationEmptyState,
  sortApplicants,
  validateRecruiterReview,
  validateTalentVisibleNote,
} from '../app/lib/application-pipeline.ts';
import type { AuditionApplicant } from '../app/lib/types.ts';

const applicant = (
  id: string,
  overrides: Partial<AuditionApplicant> = {}
): AuditionApplicant => ({
  application: {
    id,
    auditionId: 'audition-a',
    talentId: id,
    status: 'APPLIED',
    createdAt: new Date('2026-06-01T00:00:00Z'),
  },
  talent: {
    firstName: id,
    lastName: 'Talent',
    age: 24,
    gender: 'OTHER',
    height: '170 cm',
    bio: 'Actor and performer',
    category: 'ACTOR',
    experienceLevel: '1_3_YRS',
    location: 'Dubai',
    isPublic: true,
    profileCompletenessScore: 80,
    talentVerificationStatus: 'verified',
  },
  media: [],
  ...overrides,
});

test('legacy application status remains the display fallback', () => {
  assert.equal(getApplicationStatus({ status: 'SHORTLISTED' }), 'SHORTLISTED');
  assert.equal(
    getApplicationStatus({ status: 'APPLIED', recruiterStatus: 'UNDER_REVIEW' }),
    'UNDER_REVIEW'
  );
});

test('recruiter transitions allow pipeline states but keep withdrawn terminal', () => {
  assert.equal(canRecruiterTransition('APPLIED', 'UNDER_REVIEW'), true);
  assert.equal(canRecruiterTransition('SHORTLISTED', 'SELECTED'), true);
  assert.equal(canRecruiterTransition('SHORTLISTED', 'CALLBACK'), true);
  assert.equal(canRecruiterTransition('CALLBACK', 'FINAL_ROUND'), true);
  assert.equal(canRecruiterTransition('WITHDRAWN', 'SHORTLISTED'), false);
  assert.equal(canRecruiterTransition('APPLIED', 'WITHDRAWN'), false);
});

test('review validation protects rating, tags, notes, and transitions', () => {
  assert.equal(
    validateRecruiterReview('APPLIED', { recruiterRating: 5 }),
    null
  );
  assert.match(
    validateRecruiterReview('APPLIED', { recruiterRating: 6 }) ?? '',
    /1 to 5/
  );
  assert.match(
    validateRecruiterReview('WITHDRAWN', { status: 'SELECTED' }) ?? '',
    /Withdrawn/
  );
  assert.match(
    validateRecruiterReview('APPLIED', {
      internalTags: Array.from({ length: 11 }, (_, index) => `tag-${index}`),
    }) ?? '',
    /10 tags/
  );
});

test('applicant filters cover verification, media, showreel, completeness, rating, and search', () => {
  const strong = applicant('Asha', {
    application: {
      id: 'Asha',
      auditionId: 'audition-a',
      talentId: 'Asha',
      status: 'SHORTLISTED',
      recruiterRating: 5,
      internalTags: ['callback'],
      createdAt: new Date('2026-06-02T00:00:00Z'),
    },
    media: [
      {
        id: 'showreel',
        ownerId: 'Asha',
        type: 'showreel_link',
        title: 'Showreel',
        description: '',
        externalUrl: 'https://example.test/showreel',
        sortOrder: 0,
        isFeatured: true,
        visibility: 'recruiters',
        moderationStatus: 'active',
      },
    ],
    talent: {
      ...applicant('Asha').talent!,
      languages: ['Hindi', 'English'],
    },
  });
  const basic = applicant('Ravi', {
    talent: {
      ...applicant('Ravi').talent!,
      location: 'Hyderabad',
      profileCompletenessScore: 60,
      talentVerificationStatus: 'pending',
    },
  });
  const result = filterApplicants([basic, strong], {
    status: 'SHORTLISTED',
    verifiedOnly: true,
    hasMedia: true,
    hasShowreel: true,
    completenessAbove70: true,
    minimumRating: 4,
    search: 'dubai',
    tag: 'callback',
    category: 'actor',
    location: 'dubai',
    language: 'hindi',
  });
  assert.deepEqual(result.map((item) => item.application.id), ['Asha']);
});

test('getApplicationNextStep returns per-status talent guidance', () => {
  assert.match(getApplicationNextStep('APPLIED'), /casting team/);
  assert.match(getApplicationNextStep('SHORTLISTED'), /shortlist/);
  assert.match(getApplicationNextStep('SELECTED'), /selected/i);
  assert.match(getApplicationNextStep('REJECTED'), /Keep applying/);
  assert.match(getApplicationNextStep('WITHDRAWN'), /withdrew/);
});

test('getRecruiterNextAction returns per-status recruiter guidance', () => {
  assert.match(getRecruiterNextAction('APPLIED'), /Viewed/);
  assert.match(getRecruiterNextAction('SHORTLISTED'), /Callback/);
  assert.match(getRecruiterNextAction('FINAL_ROUND'), /Select or Reject/);
  assert.match(getRecruiterNextAction('SELECTED'), /message/i);
  assert.equal(getRecruiterNextAction('WITHDRAWN'), '');
});

test('getApplicationPackSummary reflects cover message and self-tape presence', () => {
  assert.deepEqual(
    getApplicationPackSummary({ coverMessage: '', selfTapeSubmission: undefined }, 0),
    { hasCoverMessage: false, hasSelfTape: false, mediaCount: 0 }
  );
  assert.deepEqual(
    getApplicationPackSummary(
      { coverMessage: '  Hello  ', selfTapeSubmission: { type: 'link', url: 'https://vimeo.com/x' } },
      3
    ),
    { hasCoverMessage: true, hasSelfTape: true, mediaCount: 3 }
  );
  assert.deepEqual(
    getApplicationPackSummary(
      { coverMessage: '   ', selfTapeSubmission: { type: 'link', url: '' } },
      0
    ),
    { hasCoverMessage: false, hasSelfTape: false, mediaCount: 0 }
  );
  assert.deepEqual(
    getApplicationPackSummary(
      { coverMessage: undefined, selfTapeSubmission: { type: 'upload', storagePath: 'talent-media/uid/tape.mp4' } },
      1
    ),
    { hasCoverMessage: false, hasSelfTape: true, mediaCount: 1 }
  );
});

test('getTalentStageGuidance returns stage-appropriate copy and checkMessages flag', () => {
  const callback = getTalentStageGuidance('CALLBACK');
  assert.match(callback.headline, /Callback/);
  assert.equal(callback.checkMessages, true);

  const finalRound = getTalentStageGuidance('FINAL_ROUND');
  assert.match(finalRound.detail, /on-platform/);
  assert.equal(finalRound.checkMessages, true);

  const selected = getTalentStageGuidance('SELECTED');
  assert.match(selected.headline, /selected/i);
  assert.match(selected.detail, /platform fee/);
  assert.equal(selected.checkMessages, true);

  const rejected = getTalentStageGuidance('REJECTED');
  assert.equal(rejected.checkMessages, false);

  const withdrawn = getTalentStageGuidance('WITHDRAWN');
  assert.equal(withdrawn.checkMessages, false);
  assert.match(withdrawn.detail, /closed/i);
});

test('getDecisionSafetyCue returns safety copy for sensitive stages only', () => {
  assert.match(getDecisionSafetyCue('SELECTED') ?? '', /platform fee/);
  assert.match(getDecisionSafetyCue('CALLBACK') ?? '', /Nata Connect/);
  assert.match(getDecisionSafetyCue('FINAL_ROUND') ?? '', /contact details/);
  assert.equal(getDecisionSafetyCue('APPLIED'), null);
  assert.equal(getDecisionSafetyCue('SHORTLISTED'), null);
  assert.equal(getDecisionSafetyCue('REJECTED'), null);
});

test('validateTalentVisibleNote accepts valid notes and rejects violations', () => {
  assert.equal(validateTalentVisibleNote(''), null);
  assert.equal(validateTalentVisibleNote('Callback at 2 pm. Please confirm availability.'), null);

  const tooLong = 'x'.repeat(401);
  assert.match(validateTalentVisibleNote(tooLong) ?? '', /400 characters/);

  assert.match(
    validateTalentVisibleNote('Email us at casting@example.com') ?? '',
    /contact details/
  );
  assert.match(
    validateTalentVisibleNote('Call +91 98765 43210 to confirm') ?? '',
    /contact details/
  );
  assert.match(
    validateTalentVisibleNote('Send a WhatsApp message to confirm') ?? '',
    /off-platform contact/
  );
  assert.equal(
    validateTalentVisibleNote('Callback will be offline at the studio office.'),
    null
  );
});

test('validateRecruiterReview rejects invalid talentNextStepNote', () => {
  assert.equal(
    validateRecruiterReview('SHORTLISTED', { talentNextStepNote: 'Callback tomorrow.' }),
    null
  );
  assert.match(
    validateRecruiterReview('CALLBACK', {
      talentNextStepNote: 'Contact us at director@studio.com',
    }) ?? '',
    /contact details/
  );
  assert.match(
    validateRecruiterReview('FINAL_ROUND', {
      talentNextStepNote: 'x'.repeat(401),
    }) ?? '',
    /400 characters/
  );
});

test('pipeline counts and sorting use normalized statuses', () => {
  const older = applicant('older', {
    application: {
      id: 'older',
      auditionId: 'audition-a',
      talentId: 'older',
      status: 'APPLIED',
      recruiterStatus: 'CALLBACK',
      recruiterRating: 2,
      createdAt: new Date('2026-05-01T00:00:00Z'),
    },
  });
  const newer = applicant('newer', {
    application: {
      id: 'newer',
      auditionId: 'audition-a',
      talentId: 'newer',
      status: 'SELECTED',
      recruiterRating: 5,
      createdAt: new Date('2026-06-01T00:00:00Z'),
    },
  });
  const counts = getPipelineCounts([older, newer]);
  assert.equal(counts.CALLBACK, 1);
  assert.equal(counts.SELECTED, 1);
  assert.deepEqual(
    sortApplicants([older, newer], 'RATING').map(
      (item) => item.application.id
    ),
    ['newer', 'older']
  );
});

test('application tracker groups callback, final round, and closed statuses correctly', () => {
  const applications = [
    { status: 'APPLIED' },
    { status: 'VIEWED' },
    { status: 'CALLBACK' },
    { status: 'FINAL_ROUND' },
    { status: 'SELECTED' },
    { status: 'REJECTED' },
    { status: 'WITHDRAWN' },
  ] as const;

  assert.equal(getApplicationTrackerViewCount(applications, 'ACTIVE'), 2);
  assert.equal(getApplicationTrackerViewCount(applications, 'SHORTLISTED'), 2);
  assert.equal(getApplicationTrackerViewCount(applications, 'COMPLETED'), 3);
  assert.equal(getApplicationTrackerViewCount(applications, 'ALL'), 7);
  assert.equal(
    applicationMatchesTrackerView({ status: 'CALLBACK' }, 'SHORTLISTED'),
    true
  );
  assert.equal(
    applicationMatchesTrackerView({ status: 'FINAL_ROUND' }, 'SHORTLISTED'),
    true
  );
  assert.equal(
    applicationMatchesTrackerView({ status: 'REJECTED' }, 'COMPLETED'),
    true
  );
});

test('application fetch failure does not produce an empty state', () => {
  assert.equal(
    shouldShowApplicationEmptyState({
      loading: false,
      error: 'Failed to load talent applications',
      filteredCount: 0,
    }),
    false
  );
  assert.equal(
    shouldShowApplicationEmptyState({
      loading: false,
      error: '',
      filteredCount: 0,
    }),
    true
  );
});

test('legacy applications without screening answers still summarize safely', () => {
  const summary = getApplicationPackSummary(
    {
      id: 'talent-a',
      auditionId: 'audition-a',
      talentId: 'talent-a',
      status: 'CALLBACK',
    },
    0
  );

  assert.equal(summary.hasCoverMessage, false);
  assert.equal(summary.hasSelfTape, false);
});
