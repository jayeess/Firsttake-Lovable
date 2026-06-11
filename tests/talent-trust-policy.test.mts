import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateTalentProfileCompleteness,
  canAdminSetTalentVerification,
  canSubmitTalentVerification,
  isVerifiedTalent,
  TALENT_VERIFICATION_MINIMUM_SCORE,
} from '../app/lib/talent-trust-policy.ts';
import type { TalentProfile } from '../app/lib/types.ts';

const completeProfile: TalentProfile = {
  firstName: 'E2E_TEST',
  lastName: 'Talent',
  age: 24,
  gender: 'OTHER',
  height: '5 ft 8 in',
  bio: 'A professional performer profile with enough meaningful detail for a trust review and recruiter evaluation.',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Hyderabad',
  websiteUrl: 'https://example.test/portfolio',
  isPublic: true,
};

test('complete core Talent profile reaches verification eligibility', () => {
  const result = calculateTalentProfileCompleteness(completeProfile);
  assert.equal(result.score, 80);
  assert.equal(result.eligibleForVerification, true);
});

test('incomplete Talent profile cannot submit verification', () => {
  const result = calculateTalentProfileCompleteness({
    ...completeProfile,
    firstName: '',
    bio: '',
    websiteUrl: '',
  });
  assert.ok(result.score < TALENT_VERIFICATION_MINIMUM_SCORE);
  assert.equal(canSubmitTalentVerification('not_submitted', result.score), false);
});

test('rejected Talent can resubmit after reaching the minimum score', () => {
  assert.equal(canSubmitTalentVerification('rejected', 70), true);
  assert.equal(canSubmitTalentVerification('pending', 100), false);
  assert.equal(canSubmitTalentVerification('verified', 100), false);
});

test('only an admin can set a trusted Talent verification state', () => {
  assert.equal(canAdminSetTalentVerification(false, 'verified'), false);
  assert.equal(canAdminSetTalentVerification(true, 'verified'), true);
});

test('verified badge policy is true only for verified Talent', () => {
  assert.equal(isVerifiedTalent('verified'), true);
  for (const status of [
    'not_submitted',
    'pending',
    'rejected',
    'suspended',
  ] as const) {
    assert.equal(isVerifiedTalent(status), false);
  }
});
