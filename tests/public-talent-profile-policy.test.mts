import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPublicTalentProfile,
  getPublicTalentMedia,
  normalizePublicTalentSlug,
  validatePublicTalentSlug,
} from '../app/lib/public-talent-profile-policy.ts';

const profile = {
  firstName: 'Maya',
  lastName: 'Rao',
  age: 24,
  gender: 'FEMALE',
  height: '5 ft 6 in',
  bio: 'Actor and movement performer.',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Hyderabad',
  instagramUrl: 'https://instagram.com/maya',
  youtubeUrl: '',
  websiteUrl: '',
  profilePhotoUrl: 'https://example.com/photo.jpg',
  isPublic: true,
  talentVerificationStatus: 'verified',
  publicShowLocation: true,
  publicShowSocialLinks: true,
} as const;

test('normalizes and validates public Talent slugs', () => {
  assert.equal(normalizePublicTalentSlug(' Maya Rao! '), 'maya-rao');
  assert.equal(validatePublicTalentSlug('maya-rao'), null);
  assert.match(validatePublicTalentSlug('admin') ?? '', /reserved/i);
  assert.match(validatePublicTalentSlug('Bad Slug') ?? '', /lowercase/i);
});

test('publishes only active media explicitly marked public', () => {
  const media = getPublicTalentMedia([
    {
      id: 'public-image',
      ownerId: 'talent-1',
      type: 'image',
      title: 'Headshot',
      description: '',
      url: 'https://example.com/headshot.jpg',
      sortOrder: 2,
      isFeatured: false,
      visibility: 'public',
      moderationStatus: 'active',
    },
    {
      id: 'private-image',
      ownerId: 'talent-1',
      type: 'image',
      title: 'Private',
      description: '',
      url: 'https://example.com/private.jpg',
      sortOrder: 1,
      isFeatured: false,
      visibility: 'private',
      moderationStatus: 'active',
    },
    {
      id: 'removed-image',
      ownerId: 'talent-1',
      type: 'image',
      title: 'Removed',
      description: '',
      url: 'https://example.com/removed.jpg',
      sortOrder: 3,
      isFeatured: false,
      visibility: 'public',
      moderationStatus: 'removed',
    },
  ]);
  assert.deepEqual(media.map((item) => item.id), ['public-image']);
});

test('sanitized public profile contains no private account or review fields', () => {
  const result = buildPublicTalentProfile({
    uid: 'talent-1',
    slug: 'maya-rao',
    profile,
    media: [],
  });
  assert.equal(result.displayName, 'Maya Rao');
  assert.equal(result.talentVerificationStatus, 'verified');
  assert.equal('email' in result, false);
  assert.equal('phone' in result, false);
  assert.equal('identityVerificationNote' in result, false);
  assert.equal('profilePhotoPath' in result, false);
});
