import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildTalentMediaPath,
  normalizeExternalMediaUrl,
  validateTalentImage,
} from '../app/lib/talent-media-policy.ts';

test('upload path helper creates user-scoped safe paths', () => {
  assert.equal(
    buildTalentMediaPath({
      uid: 'talent-a',
      kind: 'profile',
      mediaId: 'photo_1',
      mimeType: 'image/webp',
    }),
    'talent-media/talent-a/profile/photo_1.webp'
  );
  assert.equal(
    buildTalentMediaPath({
      uid: 'talent-a',
      kind: 'portfolio',
      mediaId: 'media_1',
      mimeType: 'image/jpeg',
    }),
    'talent-media/talent-a/portfolio/media_1/media_1.jpg'
  );
});

test('image validation enforces MIME type and phase size limits', () => {
  assert.equal(
    validateTalentImage({ type: 'image/jpeg', size: 1024 }, 'profile'),
    null
  );
  assert.match(
    validateTalentImage({ type: 'video/mp4', size: 1024 }, 'portfolio') ?? '',
    /JPEG, PNG, or WebP/
  );
  assert.match(
    validateTalentImage(
      { type: 'image/png', size: 6 * 1024 * 1024 },
      'profile'
    ) ?? '',
    /5 MB/
  );
});

test('external media URLs accept only safe http and https URLs', () => {
  assert.equal(
    normalizeExternalMediaUrl('https://youtube.com/watch?v=test'),
    'https://youtube.com/watch?v=test'
  );
  assert.equal(normalizeExternalMediaUrl('javascript:alert(1)'), null);
  assert.equal(normalizeExternalMediaUrl('not a url'), null);
});
