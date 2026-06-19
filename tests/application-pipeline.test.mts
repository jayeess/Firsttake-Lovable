import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canRecruiterTransition,
  filterApplicants,
  getApplicationStatus,
  getPipelineCounts,
  sortApplicants,
  validateRecruiterReview,
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
