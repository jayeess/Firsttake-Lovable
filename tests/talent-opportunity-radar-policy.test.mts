import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getTalentApplicationFocus,
  getTalentCommandCenterSummary,
  getTalentNextBestActions,
  getTalentOpportunityBuckets,
  getTalentOpportunityRadar,
  getTalentOpportunityRadarEmptyState,
  getTalentProfileGrowthPlan,
  getTalentSafetyFocus,
} from '../app/lib/talent-opportunity-radar-policy.ts';
import type {
  Application,
  ApplicationStatus,
  Audition,
  TalentMedia,
  TalentProfile,
} from '../app/lib/types.ts';

const profile = (overrides: Partial<TalentProfile> = {}): TalentProfile => ({
  firstName: 'Maya',
  lastName: 'Rao',
  age: 24,
  gender: 'FEMALE',
  height: '5 ft 6 in',
  bio: 'Screen actor with theatre training, short-film experience, and comfort working in Telugu, Hindi, and English roles.',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Hyderabad, Telangana',
  instagramUrl: 'https://instagram.com/maya.demo',
  youtubeUrl: 'https://youtube.com/@maya-demo',
  websiteUrl: 'https://maya.example.com',
  profilePhotoUrl: 'https://example.com/maya.jpg',
  skills: ['Screen acting', 'Improvisation'],
  languages: ['Telugu', 'Hindi', 'English'],
  isPublic: true,
  publicProfileEnabled: true,
  publicSlug: 'maya-rao',
  publicShowLocation: true,
  publicShowSocialLinks: true,
  talentVerificationStatus: 'verified',
  profileCompletenessScore: 92,
  ...overrides,
});

const audition = (overrides: Partial<Audition> = {}): Audition => ({
  id: 'audition-a',
  recruiterId: 'recruiter-a',
  recruiterName: 'Northstar Motion Pictures',
  title: 'Lead actor for bilingual streaming drama',
  description:
    'Casting a grounded actor for a six-episode Hindi-English drama about friendship, ambition, and family expectations.',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Hyderabad, Telangana',
  duration: '12 shooting days',
  requirements:
    'Playing age 22-28. Strong Hindi and conversational Telugu. Natural screen presence and emotional range.',
  numberOfPositions: 1,
  payInfo: 'Paid role with travel and meals covered.',
  languages: ['Hindi', 'Telugu'],
  auditionType: 'SERIES',
  workMode: 'ONSITE',
  paymentType: 'PAID',
  deadline: new Date('2026-08-30T00:00:00Z'),
  status: 'ACTIVE',
  applicantCount: 3,
  recruiterVerified: true,
  selfTapeEnabled: false,
  ...overrides,
});

const application = (
  auditionId: string,
  status: ApplicationStatus,
  overrides: Partial<Application> = {}
): Application => ({
  id: `application-${auditionId}`,
  auditionId,
  talentId: 'talent-a',
  status,
  recruiterStatus: status,
  coverMessage: 'I am interested in this role.',
  createdAt: new Date('2026-06-10T00:00:00Z'),
  ...overrides,
});

const media = (overrides: Partial<TalentMedia> = {}): TalentMedia => ({
  id: 'media-a',
  ownerId: 'talent-a',
  type: 'image',
  title: 'Headshot',
  description: 'Natural light casting headshot.',
  url: 'https://example.com/headshot.jpg',
  sortOrder: 0,
  isFeatured: true,
  visibility: 'public',
  moderationStatus: 'active',
  ...overrides,
});

test('complete profile with strong auditions produces profile-ready guidance', () => {
  const radar = getTalentOpportunityRadar(profile(), [audition()], [], {
    savedAuditionIds: ['audition-a'],
  });

  assert.equal(radar.opportunities[0].band, 'profile_ready');
  assert.equal(radar.opportunities[0].saved, true);
  assert.match(radar.headline, /profile-ready/i);
  assert.ok(
    radar.opportunities[0].signals.some(
      (signal) => signal.label === 'Source transparency'
    )
  );
});

test('incomplete profile produces profile growth actions', () => {
  const incomplete = profile({
    firstName: '',
    lastName: '',
    bio: 'Short bio.',
    profileCompletenessScore: 32,
    skills: [],
    languages: [],
    profilePhotoUrl: '',
    youtubeUrl: '',
    websiteUrl: '',
  });
  const plan = getTalentProfileGrowthPlan(incomplete, []);
  const actions = getTalentNextBestActions(incomplete, [audition()], []);

  assert.equal(plan.bandLabel, 'Profile setup needed');
  assert.ok(plan.missingFields.includes('name'));
  assert.equal(actions[0].actionHref, '/talent/profile');
});

test('applied auditions are grouped as applied, not fresh opportunities', () => {
  const radar = getTalentOpportunityRadar(
    profile(),
    [audition()],
    [application('audition-a', 'APPLIED')]
  );
  const buckets = getTalentOpportunityBuckets(
    profile(),
    [audition()],
    [application('audition-a', 'APPLIED')]
  );

  assert.equal(radar.opportunities[0].band, 'already_applied');
  assert.equal(
    buckets.find((bucket) => bucket.key === 'profile_ready')?.items.length,
    0
  );
  assert.equal(buckets.find((bucket) => bucket.key === 'applied')?.items.length, 1);
});

test('weak brief quality produces preparation guidance', () => {
  const weak = audition({
    id: 'weak-a',
    description: 'Short.',
    requirements: 'Anyone can apply.',
    payInfo: '',
    paymentType: 'UNSPECIFIED',
  });
  const radar = getTalentOpportunityRadar(profile(), [weak], []);

  assert.notEqual(radar.opportunities[0].band, 'profile_ready');
  assert.ok(
    radar.opportunities[0].signals.some(
      (signal) => signal.label === 'Brief clarity' && signal.tone === 'growth'
    )
  );
});

test('unverified or unclear recruiter source produces source-check guidance', () => {
  const unclear = audition({
    id: 'unclear-source',
    recruiterName: '',
    recruiterVerified: false,
  });
  const radar = getTalentOpportunityRadar(profile(), [unclear], []);
  const sourceSignal = radar.opportunities[0].signals.find(
    (signal) => signal.label === 'Source transparency'
  );

  assert.equal(sourceSignal?.tone, 'growth');
  assert.match(sourceSignal?.detail ?? '', /Source details are light/i);
});

test('self-tape required produces preparation action', () => {
  const selfTape = audition({
    id: 'self-tape-a',
    selfTapeEnabled: true,
    selfTapeRequired: true,
    selfTapeInstructions:
      'Please submit an unlisted scene reading link under two minutes.',
  });
  const actions = getTalentNextBestActions(profile(), [selfTape], []);

  assert.ok(
    actions.some((action) => action.title === 'Prepare an external self-tape link')
  );
});

test('active applications produce follow-up guidance', () => {
  const focus = getTalentApplicationFocus(
    [
      application('audition-a', 'CALLBACK'),
      application('audition-b', 'APPLIED', {
        audition: audition({
          id: 'audition-b',
          selfTapeEnabled: true,
          selfTapeRequired: true,
        }),
      }),
    ],
    { unreadMessageCount: 2 }
  );

  assert.equal(focus.activeCount, 2);
  assert.equal(focus.callbackCount, 1);
  assert.equal(focus.selfTapeMissingCount, 1);
  assert.equal(focus.nextAction.actionHref, '/messages');
});

test('safety focus catches payment, private contact, documents, and guarantee language', () => {
  const safety = getTalentSafetyFocus([
    audition({
      id: 'risky-a',
      description:
        'Pay audition fee by UPI and message us on WhatsApp for guaranteed selection.',
      requirements: 'Send passport and bank details before applying.',
    }),
  ]);

  assert.equal(safety.needsReviewCount, 1);
  assert.match(safety.headline, /extra safety review/i);
});

test('command center summary exposes useful metrics', () => {
  const summary = getTalentCommandCenterSummary(
    profile(),
    [audition()],
    [application('audition-b', 'UNDER_REVIEW')],
    {
      savedAuditionIds: ['audition-a'],
      unreadMessageCount: 1,
      unreadNotificationCount: 2,
    }
  );

  assert.equal(summary.headline, 'Career Command Center');
  assert.equal(summary.metrics.length, 4);
  assert.ok(summary.nextActions.some((action) => action.actionHref === '/messages'));
});

test('empty auditions and applications produce safe empty state', () => {
  const empty = getTalentOpportunityRadarEmptyState(profile());
  const radar = getTalentOpportunityRadar(profile(), [], []);

  assert.match(empty.title, /No fresh opportunities/i);
  assert.equal(radar.opportunities.length, 0);
  assert.match(radar.detail, /profile fresh/i);
});

test('helper copy avoids AI, ranking, best, and guarantee language', () => {
  const radar = getTalentOpportunityRadar(profile(), [audition()], []);
  const plan = getTalentProfileGrowthPlan(profile(), [media()]);
  const text = JSON.stringify({ radar, plan });

  assert.doesNotMatch(text, /\bAI\b|ranking|best|guaranteed|guarantee/i);
});
