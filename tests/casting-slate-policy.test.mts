import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCastingDecisionReadiness,
  getCastingSlateBuckets,
  getCastingSlateCounts,
  getCastingSlateEmptyState,
  getCastingSlateNextActions,
  getCastingSlateReviewChecklist,
  getCastingSlateSafetyNotes,
  getCastingSlateStage,
  getCastingSlateSummary,
} from '../app/lib/casting-slate-policy.ts';
import type {
  Application,
  ApplicationStatus,
  Audition,
  AuditionApplicant,
  TalentMedia,
  TalentProfile,
} from '../app/lib/types.ts';

const audition = (overrides: Partial<Audition> = {}): Audition => ({
  id: 'audition-a',
  recruiterId: 'recruiter-a',
  recruiterName: 'Northstar Motion Pictures',
  title: 'Lead actor for bilingual streaming drama',
  description: 'A grounded role for a contemporary drama.',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Hyderabad, Telangana',
  duration: '12 shooting days',
  requirements: 'Telugu and Hindi fluency.',
  numberOfPositions: 1,
  deadline: new Date('2026-08-30T00:00:00Z'),
  status: 'ACTIVE',
  applicantCount: 0,
  selfTapeEnabled: true,
  selfTapeRequired: true,
  selfTapeInstructions: 'Send an unlisted scene reading link.',
  ...overrides,
});

const talent = (overrides: Partial<TalentProfile> = {}): TalentProfile => ({
  firstName: 'Maya',
  lastName: 'Rao',
  age: 24,
  gender: 'FEMALE',
  height: '5 ft 6 in',
  bio: 'Screen actor with theatre training and short-film experience.',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Hyderabad, Telangana',
  skills: ['Screen acting', 'Improvisation'],
  languages: ['Telugu', 'Hindi'],
  isPublic: true,
  publicProfileEnabled: true,
  publicSlug: 'maya-rao',
  publicShowLocation: true,
  publicShowSocialLinks: true,
  talentVerificationStatus: 'verified',
  profileCompletenessScore: 88,
  ...overrides,
});

const media = (overrides: Partial<TalentMedia> = {}): TalentMedia => ({
  id: 'media-a',
  ownerId: 'talent-a',
  type: 'image',
  title: 'Headshot',
  description: 'Casting headshot.',
  url: 'https://example.com/headshot.jpg',
  sortOrder: 0,
  isFeatured: true,
  visibility: 'public',
  moderationStatus: 'active',
  ...overrides,
});

const application = (
  status: ApplicationStatus,
  overrides: Partial<Application> = {}
): Application => ({
  id: `application-${status}`,
  auditionId: 'audition-a',
  talentId: 'talent-a',
  talentEmail: 'maya@example.com',
  coverMessage: 'I am interested in this role.',
  status,
  recruiterStatus: status,
  createdAt: new Date('2026-06-10T00:00:00Z'),
  ...overrides,
});

const applicant = (
  status: ApplicationStatus,
  overrides: {
    application?: Partial<Application>;
    talent?: Partial<TalentProfile> | null;
    media?: TalentMedia[];
  } = {}
): AuditionApplicant => ({
  application: application(status, overrides.application),
  talent:
    overrides.talent === null
      ? null
      : talent({ ...(overrides.talent ?? {}) }),
  media: overrides.media ?? [media()],
});

test('maps applicant statuses into casting slate stages', () => {
  assert.equal(getCastingSlateStage('APPLIED'), 'new');
  assert.equal(getCastingSlateStage('VIEWED'), 'viewed');
  assert.equal(getCastingSlateStage('UNDER_REVIEW'), 'viewed');
  assert.equal(getCastingSlateStage('MAYBE'), 'viewed');
  assert.equal(getCastingSlateStage('SHORTLISTED'), 'shortlisted');
  assert.equal(getCastingSlateStage('CALLBACK'), 'callback');
  assert.equal(getCastingSlateStage('FINAL_ROUND'), 'final_round');
  assert.equal(getCastingSlateStage('SELECTED'), 'selected');
  assert.equal(getCastingSlateStage('REJECTED'), 'rejected');
  assert.equal(getCastingSlateStage('WITHDRAWN'), 'completed');
});

test('counts slate stages and decision room signals', () => {
  const applicants = [
    applicant('APPLIED'),
    applicant('VIEWED', {
      application: {
        selfTapeSubmission: {
          type: 'link',
          url: 'https://example.com/tape',
        },
      },
    }),
    applicant('SHORTLISTED'),
    applicant('CALLBACK'),
    applicant('FINAL_ROUND'),
    applicant('SELECTED'),
    applicant('REJECTED'),
    applicant('WITHDRAWN'),
  ];

  const counts = getCastingSlateCounts(applicants, audition());

  assert.equal(counts.total, 8);
  assert.equal(counts.new, 1);
  assert.equal(counts.viewed, 1);
  assert.equal(counts.shortlisted, 1);
  assert.equal(counts.callback, 1);
  assert.equal(counts.finalRound, 1);
  assert.equal(counts.selected, 1);
  assert.equal(counts.rejected, 1);
  assert.equal(counts.completed, 1);
  assert.equal(counts.selfTapeMissing, 7);
  assert.equal(counts.decisionPending, 3);
});

test('creates ordered buckets without changing applicant data', () => {
  const buckets = getCastingSlateBuckets([
    applicant('SELECTED'),
    applicant('APPLIED'),
    applicant('CALLBACK'),
  ]);

  assert.deepEqual(
    buckets.map((bucket) => bucket.stage),
    [
      'new',
      'viewed',
      'shortlisted',
      'callback',
      'final_round',
      'selected',
      'rejected',
      'completed',
    ]
  );
  assert.equal(buckets.find((bucket) => bucket.stage === 'new')?.applicants.length, 1);
  assert.equal(
    buckets.find((bucket) => bucket.stage === 'selected')?.applicants[0]
      .application.id,
    'application-SELECTED'
  );
});

test('flags missing required self-tape before deeper decision stage copy', () => {
  const readiness = getCastingDecisionReadiness(
    applicant('SHORTLISTED'),
    audition({ selfTapeRequired: true })
  );

  assert.equal(readiness.band, 'needs_self_tape');
  assert.equal(readiness.bandLabel, 'Needs self-tape');
  assert.match(readiness.nextAction, /external self-tape link/i);
});

test('marks complete applicant context as review-ready', () => {
  const readiness = getCastingDecisionReadiness(
    applicant('VIEWED', {
      application: {
        selfTapeSubmission: {
          type: 'link',
          url: 'https://example.com/tape',
        },
      },
    }),
    audition()
  );

  assert.equal(readiness.band, 'review_ready');
  assert.ok(readiness.signals.some((signal) => signal.label === 'Portfolio context'));
});

test('closed statuses do not imply guaranteed casting outcome', () => {
  const selected = getCastingDecisionReadiness(applicant('SELECTED'), audition());
  const rejected = getCastingDecisionReadiness(applicant('REJECTED'), audition());

  assert.equal(selected.band, 'closed');
  assert.equal(rejected.band, 'closed');
  assert.doesNotMatch(`${selected.summary} ${rejected.summary}`, /guarantee/i);
});

test('next actions cover the main recruiter-controlled stages', () => {
  const statuses: ApplicationStatus[] = [
    'APPLIED',
    'VIEWED',
    'UNDER_REVIEW',
    'MAYBE',
    'SHORTLISTED',
    'CALLBACK',
    'FINAL_ROUND',
    'SELECTED',
    'REJECTED',
    'WITHDRAWN',
  ];

  statuses.forEach((status) => {
    const actions = getCastingSlateNextActions(applicant(status), audition());
    assert.ok(actions.length >= 2);
    assert.match(actions.at(-1) ?? '', /on-platform|payment/i);
  });
});

test('review checklist uses existing public-safe applicant fields', () => {
  const checklist = getCastingSlateReviewChecklist(
    applicant('VIEWED', {
      application: {
        recruiterRating: 4,
        internalTags: ['dialogue'],
        selfTapeSubmission: {
          type: 'link',
          url: 'https://example.com/tape',
        },
      },
    }),
    audition()
  );

  assert.equal(checklist.length, 5);
  assert.equal(checklist.every((item) => typeof item.detail === 'string'), true);
  assert.equal(
    checklist.find((item) => item.label === 'Private notes updated')?.complete,
    true
  );
});

test('summary and empty states provide clear room-level guidance', () => {
  const emptySummary = getCastingSlateSummary([], audition());
  const newSummary = getCastingSlateSummary([applicant('APPLIED')], audition());
  const emptyState = getCastingSlateEmptyState('callback');

  assert.match(emptySummary.headline, /No applicants/i);
  assert.match(newSummary.headline, /new/i);
  assert.match(emptyState.title, /callback/i);
});

test('safety notes avoid automation and private evidence language', () => {
  const text = getCastingSlateSafetyNotes().join(' ');

  assert.doesNotMatch(text, /\bAI\b|ranking|auto-select|best applicant/i);
  assert.doesNotMatch(text, /storage path|document path|admin uid/i);
  assert.match(text, /human recruiter decision|human review/i);
});
