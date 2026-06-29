import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMissingFitItems,
  getRoleFitChecklist,
  getRoleFitSignals,
  getRoleFitSummary,
  getRoleReadinessBand,
  getTalentPassportSummary,
  type RoleFitSignal,
} from '../app/lib/role-fit-policy.ts';
import type { Audition, TalentProfile } from '../app/lib/types.ts';

const audition = (overrides: Partial<Audition> = {}): Audition => ({
  id: 'audition-a',
  recruiterId: 'recruiter-a',
  recruiterName: 'Northstar Motion Pictures',
  title: 'Lead actor for bilingual drama',
  description:
    'A grounded screen role for a Hindi and English drama with improvisation scenes.',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Mumbai, Maharashtra',
  duration: '10 shoot days',
  requirements:
    'Screen acting, improvisation, Hindi, English, and natural camera presence.',
  numberOfPositions: 1,
  languages: ['Hindi', 'English'],
  deadline: new Date('2026-07-10T00:00:00Z'),
  status: 'ACTIVE',
  applicantCount: 0,
  selfTapeEnabled: false,
  selfTapeRequired: false,
  ...overrides,
});

const talent = (overrides: Partial<TalentProfile> = {}): TalentProfile => ({
  firstName: 'Aarav',
  lastName: 'Mehta',
  age: 24,
  gender: 'MALE',
  height: '5 ft 10 in',
  bio: 'Screen and theatre actor trained in contemporary performance, improvisation, and Hindi-English dialogue for camera.',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Mumbai, Maharashtra',
  youtubeUrl: 'https://youtube.com/@aarav-demo',
  websiteUrl: 'https://aarav.example.com',
  profilePhotoUrl: 'https://example.com/photo.jpg',
  portfolioMediaCount: 2,
  skills: ['Screen acting', 'Improvisation', 'Theatre'],
  languages: ['Hindi', 'English'],
  isPublic: true,
  publicProfileEnabled: true,
  talentVerificationStatus: 'verified',
  profileCompletenessScore: 95,
  ...overrides,
});

test('strong role signals produce a strong readiness band', () => {
  const summary = getRoleFitSummary(talent(), audition(), { mediaCount: 2 });

  assert.equal(summary.band, 'strong_fit_signals');
  assert.equal(summary.bandLabel, 'Strong fit signals');
  assert.ok(summary.score >= 80);
  assert.equal(summary.missingItems.length, 0);
});

test('missing profile details lower readiness and surface missing items', () => {
  const summary = getRoleFitSummary(
    talent({
      profileCompletenessScore: 25,
      skills: [],
      languages: [],
      youtubeUrl: '',
      websiteUrl: '',
      portfolioMediaCount: 0,
      talentVerificationStatus: 'not_submitted',
    }),
    audition({ selfTapeEnabled: true, selfTapeRequired: true })
  );

  assert.notEqual(summary.band, 'strong_fit_signals');
  assert.ok(summary.score < 60);
  assert.ok(
    summary.missingItems.some((item) =>
      item.detail.includes('Finish key profile fields')
    )
  );
});

test('missing media and required self-tape produce clear next actions', () => {
  const missingItems = getMissingFitItems(
    talent({
      youtubeUrl: '',
      websiteUrl: '',
      instagramUrl: '',
      profilePhotoUrl: '',
      portfolioMediaCount: 0,
    }),
    audition({ selfTapeEnabled: true, selfTapeRequired: true })
  );

  assert.ok(
    missingItems.some((item) => item.label === 'Portfolio readiness')
  );
  assert.ok(
    missingItems.some((item) => item.label === 'Self-tape readiness')
  );
  assert.ok(
    missingItems.some((item) =>
      item.detail.includes('external self-tape link')
    )
  );
});

test('role fit helper copy avoids fake AI or ranking language', () => {
  const text = JSON.stringify(getRoleFitSignals(talent(), audition()));

  assert.doesNotMatch(text, /\bAI\b/);
  assert.doesNotMatch(text, /algorithm/i);
  assert.doesNotMatch(text, /automated ranking/i);
  assert.doesNotMatch(text, /guarantee/i);
});

test('readiness band logic handles strong, good, and missing inputs', () => {
  const signal = (
    points: number,
    status: RoleFitSignal['status'] = 'strong'
  ): RoleFitSignal => ({
    key: 'skills',
    label: 'Skills overlap',
    status,
    detail: 'Test signal',
    points,
    maxPoints: 10,
  });

  assert.equal(getRoleReadinessBand([signal(9)]).band, 'strong_fit_signals');
  assert.equal(getRoleReadinessBand([signal(7)]).band, 'good_fit_signals');
  assert.equal(
    getRoleReadinessBand([signal(2, 'missing')]).band,
    'missing_key_information'
  );
});

test('checklist output maps incomplete signals to safe profile actions', () => {
  const checklist = getRoleFitChecklist(
    talent({ skills: [], languages: [] }),
    audition()
  );

  const skills = checklist.find((item) => item.label === 'Skills overlap');
  const languages = checklist.find((item) => item.label === 'Language overlap');

  assert.equal(skills?.complete, false);
  assert.equal(skills?.actionHref, '/talent/profile');
  assert.equal(languages?.complete, false);
});

test('talent passport summarizes profile readiness without blocking usage', () => {
  const passport = getTalentPassportSummary(
    talent({
      talentVerificationStatus: 'pending',
      profileCompletenessScore: 90,
    }),
    2
  );

  assert.ok(passport.score >= 80);
  assert.ok(passport.highlights.includes('Profile foundation'));
  assert.ok(
    passport.items.some((item) => item.label === 'Trust status' && !item.complete)
  );
});
