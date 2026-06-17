import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getInitialSelfTapeStatus,
  getSelfTapeBadgeTone,
  getSelfTapeStatus,
  normalizeSelfTapeSubmissionTypes,
  validateSelfTapeInstructions,
  validateSelfTapeLink,
} from '../app/lib/self-tape-policy.ts';

test('self-tape status defaults follow audition requirements', () => {
  assert.equal(
    getInitialSelfTapeStatus({
      selfTapeEnabled: false,
      selfTapeRequired: false,
    }),
    'not_requested'
  );
  assert.equal(
    getInitialSelfTapeStatus({
      selfTapeEnabled: true,
      selfTapeRequired: false,
    }),
    'requested'
  );
  assert.equal(
    getInitialSelfTapeStatus({
      selfTapeEnabled: true,
      selfTapeRequired: true,
    }),
    'missing'
  );
});

test('self-tape application status prefers explicit submission state', () => {
  assert.equal(
    getSelfTapeStatus(
      { selfTapeStatus: undefined, selfTapeSubmission: undefined },
      { selfTapeEnabled: true, selfTapeRequired: true }
    ),
    'missing'
  );
  assert.equal(
    getSelfTapeStatus({
      selfTapeStatus: undefined,
      selfTapeSubmission: { type: 'link', url: 'https://example.com/tape' },
    }),
    'submitted'
  );
  assert.equal(
    getSelfTapeStatus({
      selfTapeStatus: 'reviewed',
      selfTapeSubmission: { type: 'link', url: 'https://example.com/tape' },
    }),
    'reviewed'
  );
});

test('self-tape links are normalized and reject unsafe input', () => {
  assert.equal(
    validateSelfTapeLink(' https://youtu.be/example '),
    'https://youtu.be/example'
  );
  assert.throws(() => validateSelfTapeLink('javascript:alert(1)'), /http/);
  assert.throws(() => validateSelfTapeLink('<script>alert(1)</script>'), /HTML/);
  assert.throws(() => validateSelfTapeLink(''), /Add a self-tape/);
});

test('self-tape instructions and submission type settings are bounded', () => {
  assert.equal(validateSelfTapeInstructions('  Read scene two.  '), 'Read scene two.');
  assert.throws(
    () => validateSelfTapeInstructions('<strong>Read scene two</strong>'),
    /HTML/
  );
  assert.deepEqual(normalizeSelfTapeSubmissionTypes(false, ['link']), []);
  assert.deepEqual(normalizeSelfTapeSubmissionTypes(true, ['link']), ['link']);
  assert.deepEqual(normalizeSelfTapeSubmissionTypes(true, ['unsafe']), ['link']);
});

test('self-tape badge tones highlight required and complete states', () => {
  assert.equal(getSelfTapeBadgeTone('missing'), 'danger');
  assert.equal(getSelfTapeBadgeTone('requested'), 'attention');
  assert.equal(getSelfTapeBadgeTone('submitted'), 'success');
  assert.equal(getSelfTapeBadgeTone('reviewed'), 'success');
});
