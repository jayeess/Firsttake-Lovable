import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterAuditions,
  initialAuditionFilters,
  scoreAuditionRecommendation,
  sortAuditions,
} from '../app/lib/audition-discovery.ts';
import type { Audition, TalentProfile } from '../app/lib/types.ts';

const now = new Date('2026-06-12T00:00:00Z');

const audition = (
  id: string,
  overrides: Partial<Audition> = {}
): Audition => ({
  id,
  recruiterId: 'recruiter-a',
  recruiterName: 'Northstar Pictures',
  title: 'Lead actor for Telugu drama',
  description: 'A character-led regional series',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Hyderabad',
  duration: 'Five days',
  requirements: 'Telugu and English. Strong dramatic performance.',
  numberOfPositions: 1,
  payInfo: 'Paid role',
  deadline: new Date('2026-06-25T00:00:00Z'),
  status: 'ACTIVE',
  moderationStatus: 'VISIBLE',
  recruiterVerified: true,
  applicantCount: 0,
  createdAt: new Date('2026-06-10T00:00:00Z'),
  updatedAt: new Date('2026-06-11T00:00:00Z'),
  ...overrides,
});

const profile: TalentProfile = {
  firstName: 'Asha',
  lastName: 'Rao',
  age: 25,
  gender: 'OTHER',
  height: '170 cm',
  bio: 'Actor',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Hyderabad',
  skills: ['dramatic performance'],
  languages: ['Telugu', 'English'],
  profileCompletenessScore: 90,
  talentVerificationStatus: 'verified',
  isPublic: true,
};

test('audition filters support legacy fields and verified recruiter discovery', () => {
  const result = filterAuditions(
    [audition('matching'), audition('unverified', { recruiterVerified: false })],
    {
      ...initialAuditionFilters,
      search: 'northstar',
      category: 'ACTOR',
      location: 'hyderabad',
      language: 'telugu',
      paymentType: 'PAID',
      workMode: 'ONSITE',
      verifiedOnly: true,
    },
    new Set(),
    now
  );
  assert.deepEqual(result.map((item) => item.id), ['matching']);
});

test('inactive, draft, removed, expired, and unsaved auditions stay out of discovery', () => {
  const result = filterAuditions(
    [
      audition('active'),
      audition('draft', { status: 'DRAFT' }),
      audition('removed', { moderationStatus: 'REMOVED' }),
      audition('expired', { deadline: new Date('2026-06-01T00:00:00Z') }),
    ],
    { ...initialAuditionFilters, savedOnly: true },
    new Set(['active']),
    now
  );
  assert.deepEqual(result.map((item) => item.id), ['active']);
});

test('recommendation scoring uses category, experience, location, skills, and languages', () => {
  const strong = scoreAuditionRecommendation(audition('strong'), profile);
  const weak = scoreAuditionRecommendation(
    audition('weak', {
      category: 'MODEL',
      experienceLevel: 'FRESHER',
      location: 'Mumbai',
      requirements: 'No language requirement',
      description: 'Lifestyle still photography',
    }),
    profile
  );
  assert.equal(strong, 85);
  assert.ok(weak < strong);
});

test('audition sorting supports deadline, updated, and recommendation modes', () => {
  const first = audition('first', {
    deadline: new Date('2026-06-20T00:00:00Z'),
    updatedAt: new Date('2026-06-09T00:00:00Z'),
  });
  const second = audition('second', {
    category: 'MODEL',
    deadline: new Date('2026-06-15T00:00:00Z'),
    updatedAt: new Date('2026-06-12T00:00:00Z'),
  });
  assert.deepEqual(
    sortAuditions([first, second], 'DEADLINE', profile, '').map(
      (item) => item.id
    ),
    ['second', 'first']
  );
  assert.deepEqual(
    sortAuditions([first, second], 'RECOMMENDED', profile, '').map(
      (item) => item.id
    ),
    ['first', 'second']
  );
});
