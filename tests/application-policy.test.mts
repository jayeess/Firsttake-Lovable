import assert from 'node:assert/strict';
import test from 'node:test';
import { getApplicationPolicyError } from '../app/lib/application-policy.ts';

const future = new Date('2030-01-01T00:00:00.000Z');
const past = new Date('2020-01-01T00:00:00.000Z');
const now = new Date('2026-06-10T00:00:00.000Z');

test('allows a new application to an active audition before its deadline', () => {
  assert.equal(
    getApplicationPolicyError({
      auditionExists: true,
      alreadyApplied: false,
      status: 'ACTIVE',
      deadline: future,
      now,
    }),
    null
  );
});

test('blocks duplicate applications', () => {
  assert.equal(
    getApplicationPolicyError({
      auditionExists: true,
      alreadyApplied: true,
      status: 'ACTIVE',
      deadline: future,
      now,
    }),
    'You have already applied for this audition.'
  );
});

test('blocks applications to draft, closed, or cancelled auditions', () => {
  for (const status of ['DRAFT', 'CLOSED', 'CANCELLED'] as const) {
    assert.equal(
      getApplicationPolicyError({
        auditionExists: true,
        alreadyApplied: false,
        status,
        deadline: future,
        now,
      }),
      'This audition is not accepting applications.'
    );
  }
});

test('blocks applications after the deadline', () => {
  assert.equal(
    getApplicationPolicyError({
      auditionExists: true,
      alreadyApplied: false,
      status: 'ACTIVE',
      deadline: past,
      now,
    }),
    'The application deadline has passed.'
  );
});

test('reports a deleted audition before evaluating its status', () => {
  assert.equal(
    getApplicationPolicyError({
      auditionExists: false,
      alreadyApplied: false,
      now,
    }),
    'This audition no longer exists.'
  );
});
