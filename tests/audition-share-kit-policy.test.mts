import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAuditionShareKit,
  getAuditionShareReadiness,
  getAuditionShareChecklist,
  getAuditionShareMissingItems,
  getAuditionShareCopyTemplates,
  getPublicOpportunitySummary,
  getPublicOpportunitySafetyNotes,
} from '../app/lib/audition-share-kit-policy.ts';
import type { Audition } from '../app/lib/types.ts';

const futureDate = new Date('2026-08-01T00:00:00Z');
const pastDate = new Date('2025-01-01T00:00:00Z');

const audition = (overrides: Partial<Audition> = {}): Partial<Audition> => ({
  id: 'aud-001',
  recruiterId: 'rec-001',
  recruiterName: 'Northstar Casting',
  recruiterVerified: true,
  title: 'Lead performer for bilingual drama series',
  description:
    'Casting a grounded lead performer for a six-episode Hindi-English drama about friendship, ambition, and family expectations in contemporary Mumbai. Strong screen presence required.',
  category: 'ACTOR',
  location: 'Mumbai, Maharashtra',
  deadline: futureDate,
  requirements:
    'Playing age 22-28. Strong Hindi and conversational English. Natural screen presence and emotional range required.',
  payInfo: 'Paid role. Rate confirmed on offer.',
  paymentType: 'PAID',
  workMode: 'ONSITE',
  selfTapeEnabled: false,
  selfTapeRequired: false,
  status: 'ACTIVE',
  ...overrides,
});

// ── Band assignment ───────────────────────────────────────────────────────────

test('clear audition with verified source → share_ready', () => {
  const kit = getAuditionShareKit(audition());
  assert.equal(kit.band, 'share_ready');
  assert.equal(kit.bandLabel, 'Share-ready');
  assert.ok(kit.checklist.every((item) => item.complete));
  assert.equal(kit.missingItems.length, 0);
});

test('missing description → needs_brief_detail', () => {
  const kit = getAuditionShareKit(audition({ description: 'Short role.' }));
  assert.equal(kit.band, 'needs_brief_detail');
});

test('missing title → needs_brief_detail', () => {
  const kit = getAuditionShareKit(audition({ title: 'Cast' }));
  assert.equal(kit.band, 'needs_brief_detail');
});

test('missing category → needs_brief_detail', () => {
  const kit = getAuditionShareKit(audition({ category: undefined }));
  assert.equal(kit.band, 'needs_brief_detail');
});

test('missing location and no workMode → needs_brief_detail', () => {
  const kit = getAuditionShareKit(audition({ location: '', workMode: undefined }));
  assert.equal(kit.band, 'needs_brief_detail');
});

test('expired deadline → needs_trust_review', () => {
  const kit = getAuditionShareKit(audition({ deadline: pastDate }));
  assert.equal(kit.band, 'needs_trust_review');
});

test('payment request language → needs_trust_review', () => {
  const kit = getAuditionShareKit(
    audition({ description: 'Pay an audition fee of 500 to apply for this role. Long enough description to exceed the minimum character count needed here.' })
  );
  assert.equal(kit.band, 'needs_trust_review');
});

test('off-platform contact pressure → needs_trust_review', () => {
  const kit = getAuditionShareKit(
    audition({ description: 'DM us directly on WhatsApp to apply. This description is long enough to exceed the minimum character count needed.' })
  );
  assert.equal(kit.band, 'needs_trust_review');
});

test('all core fields present but optional items missing → good_opportunity_page', () => {
  const kit = getAuditionShareKit(
    audition({
      recruiterName: '',
      paymentType: undefined,
      payInfo: '',
    })
  );
  assert.equal(kit.band, 'good_opportunity_page');
});

// ── Self-tape ─────────────────────────────────────────────────────────────────

test('self-tape required without instructions → self_tape item incomplete', () => {
  const checklist = getAuditionShareChecklist(
    audition({
      selfTapeEnabled: true,
      selfTapeRequired: true,
      selfTapeInstructions: '',
    })
  );
  const item = checklist.find((c) => c.key === 'self_tape');
  assert.ok(item);
  assert.equal(item.complete, false);
});

test('self-tape required with sufficient instructions → self_tape item complete', () => {
  const checklist = getAuditionShareChecklist(
    audition({
      selfTapeEnabled: true,
      selfTapeRequired: true,
      selfTapeInstructions:
        'Record a 60-second monologue in Hindi. Upload as an unlisted YouTube link. Natural lighting preferred.',
    })
  );
  const item = checklist.find((c) => c.key === 'self_tape');
  assert.ok(item);
  assert.equal(item.complete, true);
});

// ── Share copy language safety ────────────────────────────────────────────────

test('share copy avoids "guarantee", "AI", "certificate", "best"', () => {
  const templates = getAuditionShareCopyTemplates(audition());
  const joined = templates.join(' ').toLowerCase();
  assert.ok(!joined.includes('guarantee'), 'must not contain "guarantee"');
  assert.ok(!joined.includes(' ai ') && !joined.startsWith('ai '), 'must not contain "AI"');
  assert.ok(!joined.includes('certificate'), 'must not contain "certificate"');
  assert.ok(!joined.includes('best opportunity'), 'must not contain "best opportunity"');
});

test('share copy for needs_trust_review returns guidance, not real copy', () => {
  const templates = getAuditionShareCopyTemplates(
    audition({ deadline: pastDate })
  );
  assert.equal(templates.length, 1);
  assert.ok(templates[0].toLowerCase().includes('resolve') || templates[0].toLowerCase().includes('update'));
});

// ── Public safety notes ───────────────────────────────────────────────────────

test('public safety notes mention never paying to audition', () => {
  const notes = getPublicOpportunitySafetyNotes(audition());
  const joined = notes.join(' ').toLowerCase();
  assert.ok(joined.includes('free') || joined.includes('never') || joined.includes('pay'));
});

test('public safety notes do not expose private evidence', () => {
  const notes = getPublicOpportunitySafetyNotes(audition());
  const joined = notes.join(' ').toLowerCase();
  assert.ok(!joined.includes('admin'), 'must not reference admin notes');
  assert.ok(!joined.includes('moderation'), 'must not reference moderation');
  assert.ok(!joined.includes('@'), 'must not expose email addresses');
  assert.ok(!joined.includes('phone') && !joined.includes('mobile'), 'must not expose phone');
});

test('self-tape note inserted at index 2 when selfTapeEnabled', () => {
  const notes = getPublicOpportunitySafetyNotes(
    audition({ selfTapeEnabled: true })
  );
  assert.ok(notes.length >= 5);
  assert.ok(notes[2].toLowerCase().includes('self-tape'));
});

// ── Source transparency ───────────────────────────────────────────────────────

test('missing source name → source checklist item incomplete', () => {
  const checklist = getAuditionShareChecklist(
    audition({ recruiterName: '' })
  );
  const item = checklist.find((c) => c.key === 'source');
  assert.ok(item);
  assert.equal(item.complete, false);
});

test('recruiterProfile companyName used as source when present', () => {
  const summary = getPublicOpportunitySummary(audition({ recruiterName: '' }), {
    companyName: 'Studio North',
  });
  assert.equal(summary.sourceName, 'Studio North');
});

// ── getAuditionShareReadiness ─────────────────────────────────────────────────

test('getAuditionShareReadiness returns band, label, missingCount, headline', () => {
  const readiness = getAuditionShareReadiness(audition());
  assert.equal(readiness.band, 'share_ready');
  assert.ok(typeof readiness.bandLabel === 'string' && readiness.bandLabel.length > 0);
  assert.equal(readiness.missingCount, 0);
  assert.ok(typeof readiness.headline === 'string' && readiness.headline.length > 0);
});

test('getAuditionShareReadiness missingCount reflects incomplete items', () => {
  const readiness = getAuditionShareReadiness(
    audition({ description: 'Short.', category: undefined })
  );
  assert.ok(readiness.missingCount >= 2);
});

// ── getPublicOpportunitySummary ───────────────────────────────────────────────

test('getPublicOpportunitySummary returns safe structured summary', () => {
  const summary = getPublicOpportunitySummary(audition());
  assert.ok(summary.title.length > 0);
  assert.ok(summary.sourceName.length > 0);
  assert.ok(summary.category.length > 0);
  assert.ok(summary.location.length > 0);
  assert.ok(summary.deadline.length > 0);
  assert.ok(summary.compensation.length > 0);
  assert.ok(summary.applyPath.startsWith('/auditions'));
});

test('getPublicOpportunitySummary selfTapeNote empty when no self-tape', () => {
  const summary = getPublicOpportunitySummary(
    audition({ selfTapeEnabled: false })
  );
  assert.equal(summary.selfTapeNote, '');
});

// ── getAuditionShareMissingItems ──────────────────────────────────────────────

test('getAuditionShareMissingItems returns only incomplete items', () => {
  const missing = getAuditionShareMissingItems(
    audition({ description: 'Short.', category: undefined })
  );
  assert.ok(missing.length > 0);
  assert.ok(missing.every((item) => !item.complete));
});

test('getAuditionShareMissingItems empty for share_ready brief', () => {
  const missing = getAuditionShareMissingItems(audition());
  assert.equal(missing.length, 0);
});

// ── getAuditionShareCopyTemplates ─────────────────────────────────────────────

test('getAuditionShareCopyTemplates returns non-empty strings for share_ready', () => {
  const templates = getAuditionShareCopyTemplates(audition());
  assert.equal(templates.length, 3);
  assert.ok(templates.every((t) => t.length > 0));
});

// ── Improvement tip for needs_trust_review ────────────────────────────────────

test('improvement tip for needs_trust_review avoids share recommendation', () => {
  const kit = getAuditionShareKit(audition({ deadline: pastDate }));
  assert.equal(kit.band, 'needs_trust_review');
  const tipText = kit.shareCopyTemplates.join(' ').toLowerCase();
  assert.ok(!tipText.includes('apply on nata connect'), 'must not recommend sharing');
});
