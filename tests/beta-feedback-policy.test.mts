import assert from 'node:assert/strict';
import test from 'node:test';
import { validateBetaFeedback } from '../app/lib/beta-feedback-policy.ts';

test('beta feedback validation accepts safe optional fields', () => {
  const result = validateBetaFeedback({
    type: 'bug',
    rating: '5',
    message: 'The audition form was confusing after clicking submit.',
    route: '/recruiter/auditions/new',
    contactEmail: 'beta@example.com',
  });

  assert.equal(result.type, 'bug');
  assert.equal(result.rating, 5);
  assert.equal(result.route, '/recruiter/auditions/new');
  assert.equal(result.contactEmail, 'beta@example.com');
});

test('beta feedback validation rejects unsupported type and short message', () => {
  assert.throws(
    () =>
      validateBetaFeedback({
        type: 'payment',
        message: 'This message is long enough.',
      }),
    /valid feedback type/
  );
  assert.throws(
    () =>
      validateBetaFeedback({
        type: 'general',
        message: 'Too short',
      }),
    /at least 10 characters/
  );
});

test('beta feedback validation bounds rating, message, and email', () => {
  assert.throws(
    () =>
      validateBetaFeedback({
        type: 'general',
        rating: 6,
        message: 'This message is long enough.',
      }),
    /between 1 and 5/
  );
  assert.throws(
    () =>
      validateBetaFeedback({
        type: 'general',
        message: 'x'.repeat(2001),
      }),
    /2000 characters/
  );
  assert.throws(
    () =>
      validateBetaFeedback({
        type: 'general',
        message: 'This message is long enough.',
        contactEmail: 'not-an-email',
      }),
    /valid contact email/
  );
});
