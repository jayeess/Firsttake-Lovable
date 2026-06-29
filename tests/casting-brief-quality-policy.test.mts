import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCastingBriefAdminRisk,
  getCastingBriefMissingItems,
  getCastingBriefQuality,
  getCastingBriefQualityBand,
  getCastingBriefSafetySignals,
} from '../app/lib/casting-brief-quality-policy.ts';
import type { Audition } from '../app/lib/types.ts';

const futureDate = new Date('2026-08-01T00:00:00Z');
const now = new Date('2026-06-29T00:00:00Z');

const brief = (overrides: Partial<Audition> = {}): Audition => ({
  id: 'brief-a',
  recruiterId: 'recruiter-a',
  recruiterName: 'Northstar Casting',
  title: 'Lead actor for bilingual streaming drama',
  description:
    'Casting a grounded lead performer for a six-episode Hindi-English drama about friendship, ambition, and family expectations in contemporary Mumbai.',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Mumbai, Maharashtra',
  duration: '12 shooting days across 3 weeks',
  requirements:
    'Playing age 22-28. Strong Hindi and conversational English. Natural screen presence, emotional range, and availability for an in-person callback.',
  numberOfPositions: 1,
  payInfo: 'Paid role. Final rate based on experience and production schedule.',
  languages: ['Hindi', 'English'],
  auditionType: 'SERIES',
  workMode: 'ONSITE',
  paymentType: 'PAID',
  deadline: futureDate,
  status: 'ACTIVE',
  moderationStatus: 'VISIBLE',
  recruiterVerified: true,
  applicantCount: 0,
  selfTapeEnabled: false,
  selfTapeRequired: false,
  ...overrides,
});

test('strong brief returns strong quality band', () => {
  const summary = getCastingBriefQuality(brief(), now);

  assert.equal(summary.band, 'strong_brief');
  assert.equal(summary.bandLabel, 'Strong brief');
  assert.ok(summary.score >= 85);
  assert.equal(summary.safetySignals.length, 0);
});

test('missing description details lowers quality', () => {
  const summary = getCastingBriefQuality(
    brief({ description: 'Short role.' }),
    now
  );

  assert.notEqual(summary.band, 'strong_brief');
  assert.ok(summary.score < 85);
  assert.ok(
    summary.qualitySignals.some(
      (signal) =>
        signal.key === 'description' && signal.status === 'attention'
    )
  );
});

test('expired deadline creates review item', () => {
  const summary = getCastingBriefQuality(
    brief({ deadline: new Date('2026-01-01T00:00:00Z') }),
    now
  );

  assert.equal(summary.band, 'needs_review');
  assert.ok(
    summary.missingItems.some((signal) => signal.key === 'deadline')
  );
});

test('payment request language creates safety signal', () => {
  const signals = getCastingBriefSafetySignals(
    brief({ payInfo: 'Applicants must pay a refundable registration fee.' })
  );

  assert.ok(
    signals.some(
      (signal) =>
        signal.key === 'paymentLanguage' && signal.status === 'risk'
    )
  );
});

test('private contact pressure creates safety signal', () => {
  const signals = getCastingBriefSafetySignals(
    brief({ requirements: 'DM us on WhatsApp after applying.' })
  );

  assert.ok(
    signals.some(
      (signal) => signal.key === 'privateContact' && signal.status === 'risk'
    )
  );
});

test('unrelated document requests create safety signal', () => {
  const signals = getCastingBriefSafetySignals(
    brief({ requirements: 'Send passport and bank details before audition.' })
  );

  assert.ok(
    signals.some(
      (signal) => signal.key === 'documentRequest' && signal.status === 'risk'
    )
  );
});

test('self-tape required without instructions creates missing item', () => {
  const missingItems = getCastingBriefMissingItems(
    brief({
      selfTapeEnabled: true,
      selfTapeRequired: true,
      selfTapeInstructions: '',
    }),
    now
  );

  assert.ok(missingItems.some((signal) => signal.key === 'selfTape'));
});

test('helper labels do not use AI or fake detection language', () => {
  const text = JSON.stringify(getCastingBriefQuality(brief(), now));

  assert.doesNotMatch(text, /\bAI\b/i);
  assert.doesNotMatch(text, /detection/i);
  assert.doesNotMatch(text, /fraud score/i);
});

test('band logic handles strong, good, detail, and review states', () => {
  assert.equal(getCastingBriefQualityBand(90).band, 'strong_brief');
  assert.equal(getCastingBriefQualityBand(70).band, 'good_brief');
  assert.equal(getCastingBriefQualityBand(50).band, 'needs_detail');
  assert.equal(getCastingBriefQualityBand(20).band, 'needs_review');
  assert.equal(
    getCastingBriefQualityBand(90, [
      {
        key: 'paymentLanguage',
        label: 'Payment request language',
        status: 'risk',
        detail: 'Potential payment request language found.',
        points: 0,
        maxPoints: 0,
        kind: 'safety',
      },
    ]).band,
    'needs_review'
  );
});

test('admin risk highlights unsafe active briefs', () => {
  const risk = getCastingBriefAdminRisk(
    brief({
      recruiterVerified: false,
      payInfo: 'Pay an audition fee to confirm your slot.',
    }),
    now
  );

  assert.equal(risk.priority, 'high');
  assert.ok(risk.reasons.length >= 1);
});
