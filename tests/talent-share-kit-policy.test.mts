import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPublicCastingPassport,
  getPublicProfileChecklist,
  getPublicProfilePrivacyNotes,
  getTalentShareCopyTemplates,
  getTalentShareKit,
  getTalentShareMissingItems,
  getTalentShareReadiness,
} from '../app/lib/talent-share-kit-policy.ts';
import type { TalentMedia, TalentProfile } from '../app/lib/types.ts';

const profile = (overrides: Partial<TalentProfile> = {}): TalentProfile => ({
  firstName: 'Maya',
  lastName: 'Rao',
  age: 24,
  gender: 'FEMALE',
  height: '5 ft 6 in',
  bio: 'Screen actor and movement performer with theatre training, short-film experience, and comfort working in Hindi, Telugu, and English productions.',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Hyderabad, Telangana',
  instagramUrl: 'https://instagram.com/maya.demo',
  youtubeUrl: 'https://youtube.com/@maya-demo',
  websiteUrl: 'https://maya-demo.example.com',
  profilePhotoUrl: 'https://example.com/maya.jpg',
  skills: ['Screen acting', 'Movement', 'Improvisation'],
  languages: ['Telugu', 'Hindi', 'English'],
  isPublic: true,
  publicProfileEnabled: true,
  publicSlug: 'maya-rao',
  publicShowLocation: true,
  publicShowSocialLinks: true,
  talentVerificationStatus: 'verified',
  profileCompletenessScore: 96,
  ...overrides,
});

const media = (overrides: Partial<TalentMedia> = {}): TalentMedia => ({
  id: 'media-a',
  ownerId: 'talent-a',
  type: 'image',
  title: 'Headshot',
  description: 'Natural-light casting headshot.',
  url: 'https://example.com/headshot.jpg',
  sortOrder: 0,
  isFeatured: true,
  visibility: 'public',
  moderationStatus: 'active',
  ...overrides,
});

test('complete public Talent profile produces share-ready band', () => {
  const kit = getTalentShareKit(profile(), [
    media(),
    media({
      id: 'showreel',
      type: 'showreel_link',
      title: 'Showreel',
      externalUrl: 'https://example.com/showreel',
      url: undefined,
      isFeatured: false,
      sortOrder: 1,
    }),
  ]);

  assert.equal(kit.band, 'share_ready');
  assert.equal(kit.bandLabel, 'Share-ready');
  assert.ok(kit.score >= 88);
  assert.equal(kit.publicUrl, '/t/maya-rao');
});

test('missing slug, name, and public media produces missing items', () => {
  const kit = getTalentShareKit(
    profile({
      firstName: '',
      lastName: '',
      publicSlug: '',
      publicProfileEnabled: false,
      bio: 'Short bio.',
      skills: [],
      languages: [],
    }),
    []
  );

  assert.notEqual(kit.band, 'share_ready');
  assert.ok(kit.missingItems.some((item) => item.key === 'publicProfile'));
  assert.ok(kit.missingItems.some((item) => item.key === 'displayName'));
  assert.ok(kit.missingItems.some((item) => item.key === 'publicMedia'));
});

test('private and document media are not counted as public portfolio', () => {
  const readiness = getTalentShareReadiness(profile(), [
    media({ id: 'private-image', visibility: 'private' }),
    media({ id: 'document', type: 'document', visibility: 'public' }),
    media({ id: 'removed-image', moderationStatus: 'removed' }),
  ]);
  const missing = getTalentShareMissingItems(profile(), [
    media({ id: 'private-image', visibility: 'private' }),
  ]);

  assert.notEqual(readiness.band, 'share_ready');
  assert.ok(missing.some((item) => item.key === 'publicMedia'));
});

test('privacy notes do not expose private documents or contact fields', () => {
  const text = JSON.stringify(getPublicProfilePrivacyNotes());

  assert.match(text, /never show email, phone/i);
  assert.match(text, /private verification documents/i);
  assert.doesNotMatch(text, /storagePath/i);
  assert.doesNotMatch(text, /adminNote/i);
});

test('share copy avoids guarantee, legal certificate, AI, and fake verification claims', () => {
  const text = JSON.stringify(getTalentShareCopyTemplates(profile()));

  assert.doesNotMatch(text, /\bAI\b/i);
  assert.doesNotMatch(text, /guaranteed|guarantee/i);
  assert.doesNotMatch(text, /legal certificate/i);
  assert.doesNotMatch(text, /fake verification/i);
});

test('checklist output is public-safe and guidance-only', () => {
  const checklist = getPublicProfileChecklist(profile(), [media()]);
  const text = JSON.stringify(checklist);

  assert.equal(checklist.every((item) => item.publicSafe), true);
  assert.doesNotMatch(text, /blocked|must pass|rank/i);
  assert.ok(checklist.some((item) => item.key === 'trustBadge'));
});

test('empty optional fields produce safe fallback text', () => {
  const kit = getPublicCastingPassport(
    profile({
      firstName: '',
      lastName: '',
      location: '',
      youtubeUrl: '',
      websiteUrl: '',
      instagramUrl: '',
      publicShowLocation: false,
      talentVerificationStatus: 'not_submitted',
    }),
    []
  );

  assert.equal(kit.displayName, 'Talent');
  assert.ok(kit.whatRecruitersSee.some((item) => /once added|only when/i.test(item)));
  assert.ok(kit.privacyNotes.length > 0);
});
