import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getTalentPoolEmptyState,
  getTalentPoolGuidance,
  getTalentPoolReviewSummary,
  getTalentPoolSafetyFlags,
  getTalentPoolStatusLabel,
  getTalentPoolStatusTone,
  normalizeTalentPoolTags,
  TALENT_POOL_MAX_NOTE_LENGTH,
  validateTalentPoolEntryInput,
  validateTalentPoolNote,
  validateTalentPoolTag,
} from '../app/lib/recruiter-talent-pool-policy.ts';
import type { RecruiterTalentPoolEntry } from '../app/lib/types.ts';

test('normalizes and dedupes safe Talent Pool tags', () => {
  assert.deepEqual(
    normalizeTalentPoolTags(
      ' Telugu speaker, dancer, telugu speaker, good   diction, , tag, tags '
    ),
    ['Telugu speaker', 'dancer', 'good diction']
  );
});

test('validates live safe Talent Pool save input', () => {
  assert.deepEqual(
    validateTalentPoolEntryInput({
      status: 'SAVED',
      tags: 'Callback potential',
      privateNote: 'Good timing.',
    }),
    {
      status: 'SAVED',
      tags: ['Callback potential'],
      privateNote: 'Good timing.',
    }
  );
});

test('enforces tag count and tag length limits', () => {
  assert.throws(
    () => normalizeTalentPoolTags(Array.from({ length: 21 }, (_, index) => `pool-${index}`)),
    /20 tags or fewer/
  );
  assert.match(validateTalentPoolTag('a'.repeat(33)) ?? '', /32 characters/);
});

test('enforces private note length and unsafe language rules', () => {
  assert.match(
    validateTalentPoolNote('x'.repeat(TALENT_POOL_MAX_NOTE_LENGTH + 1)) ?? '',
    /1000 characters/
  );
  assert.match(
    validateTalentPoolNote('Ask for Aadhaar before callback') ?? '',
    /private document/i
  );
  assert.equal(validateTalentPoolNote('Strong expressions and good diction.'), null);
});

test('flags unsafe tags and notes without blocking safe casting language', () => {
  assert.match(validateTalentPoolTag('WhatsApp only') ?? '', /off-platform/i);
  assert.equal(validateTalentPoolTag('callback potential'), null);
  assert.equal(validateTalentPoolTag('Telugu speaker'), null);
  assert.equal(validateTalentPoolTag('future fit'), null);
  assert.equal(validateTalentPoolTag('Hyderabad'), null);
  assert.equal(getTalentPoolSafetyFlags('Please share OTP').length, 1);
});

test('offline office wording is allowed when it is not contact pressure', () => {
  assert.equal(
    validateTalentPoolNote('Check with him once at the offline office workshop.'),
    null
  );
  assert.equal(
    validateTalentPoolEntryInput({
      status: 'SAVED',
      tags: 'callback, Telugu speaker',
      privateNote: 'Good availability for an offline office workshop.',
    }).privateNote,
    'Good availability for an offline office workshop.'
  );
});

test('unsafe Talent Pool notes produce specific field guidance', () => {
  assert.match(
    validateTalentPoolNote('Ask for WhatsApp before callback') ?? '',
    /private note/i
  );
  assert.match(
    validateTalentPoolNote('Ask for WhatsApp before callback') ?? '',
    /off-platform contact pressure/i
  );
});

test('validates entry input and allowed statuses', () => {
  assert.deepEqual(
    validateTalentPoolEntryInput({
      status: 'WATCHLIST',
      tags: 'theatre, voice artist, theatre',
      privateNote: 'Could revisit for a dialogue-heavy role.',
    }),
    {
      status: 'WATCHLIST',
      tags: ['theatre', 'voice artist'],
      privateNote: 'Could revisit for a dialogue-heavy role.',
    }
  );

  assert.throws(
    () =>
      validateTalentPoolEntryInput({
        status: 'SELECTED' as never,
        tags: [],
      }),
    /valid Talent Pool status/
  );
});

test('status labels and tones stay stable', () => {
  assert.equal(getTalentPoolStatusLabel('SAVED'), 'Saved');
  assert.equal(getTalentPoolStatusLabel('FUTURE_FIT'), 'Future fit');
  assert.equal(getTalentPoolStatusTone('WATCHLIST'), 'attention');
  assert.equal(getTalentPoolStatusTone('DO_NOT_CONTACT'), 'caution');
});

test('summary and guidance avoid overclaiming language', () => {
  const entry: RecruiterTalentPoolEntry = {
    id: 'recruiter-a__talent-a',
    recruiterId: 'recruiter-a',
    talentId: 'talent-a',
    talentNameSnapshot: 'Maya Rao',
    sourceAuditionTitleSnapshot: 'Campus short film',
    status: 'FUTURE_FIT',
    tags: ['Telugu speaker', 'good diction'],
  };

  const copy = [
    getTalentPoolReviewSummary(entry),
    getTalentPoolEmptyState().description,
    getTalentPoolGuidance().description,
  ].join(' ');

  assert.doesNotMatch(copy, /\bAI\b/i);
  assert.doesNotMatch(copy, /\brank/i);
  assert.doesNotMatch(copy, /\bbest talent\b/i);
  assert.doesNotMatch(copy, /\bguarantee/i);
  assert.doesNotMatch(copy, /\blegal certificate\b/i);
  assert.match(copy, /human-led/i);
});
