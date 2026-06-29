import assert from 'node:assert/strict';
import test from 'node:test';
import { getCastingBriefQuality } from '../app/lib/casting-brief-quality-policy.ts';
import {
  getAdminRecruiterTrustSummary,
  getRecruiterTrustImprovementTips,
  getRecruiterTrustPassport,
  getSourceTransparencySignals,
} from '../app/lib/recruiter-trust-passport-policy.ts';
import type { Audition, RecruiterProfile } from '../app/lib/types.ts';

const futureDate = new Date('2026-08-01T00:00:00Z');
const now = new Date('2026-06-29T00:00:00Z');

const profile = (
  overrides: Partial<RecruiterProfile> = {}
): RecruiterProfile => ({
  companyName: 'Northstar Motion Pictures',
  phone: '+91 98765 41020',
  address: 'Andheri West, Mumbai',
  website: 'https://northstar-motion.example.com',
  bio: 'Independent production studio casting transparent roles for regional film and digital series.',
  companyLogo: '',
  isVerified: true,
  verificationStatus: 'approved',
  ...overrides,
});

const brief = (overrides: Partial<Audition> = {}): Audition => ({
  id: 'audition-a',
  recruiterId: 'recruiter-a',
  recruiterName: 'Northstar Motion Pictures',
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

test('approved recruiter with public context receives verified source band', () => {
  const passport = getRecruiterTrustPassport(profile(), brief(), {
    briefQuality: getCastingBriefQuality(brief(), now),
  });

  assert.equal(passport.band, 'verified_source');
  assert.equal(passport.bandLabel, 'Verified source');
  assert.ok(passport.publicSignals.some((signal) => signal.key === 'sourceName'));
});

test('missing company proof and context requests more source detail', () => {
  const passport = getRecruiterTrustPassport(
    profile({
      companyName: '',
      website: '',
      bio: '',
      phone: '',
      isVerified: false,
      verificationStatus: 'not_submitted',
    })
  );

  assert.equal(passport.band, 'needs_source_detail');
  assert.ok(
    passport.recruiterActions.some((action) =>
      /company|context|proof|contact/i.test(action)
    )
  );
});

test('rejected or suspended status produces trust review guidance', () => {
  const rejected = getRecruiterTrustPassport(profile(), null, {
    verificationStatus: 'rejected',
  });
  const suspended = getRecruiterTrustPassport(profile(), null, {
    verificationStatus: 'suspended',
    accountStatus: 'SUSPENDED',
  });

  assert.equal(rejected.band, 'needs_trust_review');
  assert.equal(suspended.band, 'needs_trust_review');
  assert.ok(suspended.adminReviewCues.length > 0);
});

test('weak casting brief quality is surfaced as a source transparency caution', () => {
  const weakBrief = brief({
    title: 'Role',
    description: 'Short role.',
    requirements: 'Apply quickly.',
    deadline: new Date('2026-01-01T00:00:00Z'),
    recruiterVerified: false,
  });
  const passport = getRecruiterTrustPassport(null, weakBrief, {
    briefQuality: getCastingBriefQuality(weakBrief, now),
  });

  assert.notEqual(passport.band, 'verified_source');
  assert.ok(
    passport.publicSignals.some(
      (signal) =>
        signal.key === 'briefQuality' && signal.status !== 'clear'
    )
  );
});

test('payment request language from brief quality creates trust review caution', () => {
  const riskyBrief = brief({
    payInfo: 'Applicants must pay a refundable registration fee.',
  });
  const passport = getRecruiterTrustPassport(null, riskyBrief, {
    briefQuality: getCastingBriefQuality(riskyBrief, now),
  });

  assert.equal(passport.band, 'needs_trust_review');
  assert.ok(
    passport.talentGuidance.some((guidance) =>
      /pay|fee|report|off-platform/i.test(guidance)
    )
  );
});

test('source transparency helper returns public-safe signals only', () => {
  const signals = getSourceTransparencySignals(profile(), null, {
    verification: {
      recruiterId: 'recruiter-a',
      legalName: 'Northstar Motion Pictures',
      contactPerson: 'Priya Rao',
      phone: '+91 98765 41020',
      businessType: 'Production studio',
      workDescription: 'Regional film and digital series production.',
      status: 'approved',
    },
  });

  assert.ok(signals.length > 0);
  assert.equal(signals.every((signal) => signal.publicSafe), true);
  assert.equal(signals.some((signal) => signal.key === 'contactRole'), false);
});

test('admin summary never exposes private evidence or admin notes', () => {
  const summary = getAdminRecruiterTrustSummary(null, null, {
    verification: {
      recruiterId: 'recruiter-a',
      legalName: 'Northstar Motion Pictures',
      contactPerson: 'Priya Rao',
      phone: '+91 98765 41020',
      businessType: 'Production studio',
      workDescription: 'Regional film and digital series production.',
      status: 'pending',
      evidence: [
        {
          id: 'secret',
          fileName: 'private-registration.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1234,
          storagePath: 'recruiters/recruiter-a/private-registration.pdf',
        },
      ],
      adminNote: 'Private admin review note',
    },
  });
  const text = JSON.stringify(summary);

  assert.doesNotMatch(text, /private-registration/i);
  assert.doesNotMatch(text, /Private admin review note/i);
  assert.doesNotMatch(text, /storagePath/i);
});

test('trust copy avoids fake automation and certificate language', () => {
  const text = JSON.stringify(
    getRecruiterTrustPassport(profile(), brief(), {
      briefQuality: getCastingBriefQuality(brief(), now),
    })
  );

  assert.doesNotMatch(text, /\bAI\b/i);
  assert.doesNotMatch(text, /detection/i);
  assert.doesNotMatch(text, /fraud score/i);
  assert.doesNotMatch(text, /legal certificate/i);
  assert.doesNotMatch(text, /official certificate/i);
});

test('improvement tips are guidance-only and do not block usage', () => {
  const tips = getRecruiterTrustImprovementTips(
    profile({
      website: '',
      bio: '',
      verificationStatus: 'pending',
      isVerified: false,
    }),
    { verificationStatus: 'pending' }
  );

  assert.ok(tips.length > 0);
  assert.doesNotMatch(JSON.stringify(tips), /blocked|guaranteed|must pass/i);
});
