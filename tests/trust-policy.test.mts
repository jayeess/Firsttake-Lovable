import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canRecruiterPost,
  canResubmitVerification,
  isAuditionDiscoverable,
  isPrivilegedAdminAction,
} from '../app/lib/trust-policy.ts';

test('rejected recruiter can resubmit verification', () => {
  assert.equal(canResubmitVerification('rejected'), true);
  assert.equal(canResubmitVerification('pending'), false);
  assert.equal(canResubmitVerification('approved'), false);
});

test('only approved active recruiter can post', () => {
  assert.equal(canRecruiterPost('approved', 'ACTIVE'), true);
  assert.equal(canRecruiterPost('pending', 'ACTIVE'), false);
  assert.equal(canRecruiterPost('approved', 'SUSPENDED'), false);
});

test('removed auditions are hidden from discovery', () => {
  assert.equal(isAuditionDiscoverable('ACTIVE', 'VISIBLE'), true);
  assert.equal(isAuditionDiscoverable('ACTIVE', 'REMOVED'), false);
  assert.equal(isAuditionDiscoverable('DRAFT', 'VISIBLE'), false);
});

test('non-admin users cannot perform privileged actions', () => {
  assert.equal(isPrivilegedAdminAction(false), false);
  assert.equal(isPrivilegedAdminAction(true), true);
});
