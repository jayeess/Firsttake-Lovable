import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_PORTFOLIO_IMAGE_COUNT,
  buildUploadPath,
  sanitizeUploadFileName,
  validatePortfolioImageCount,
  validateUploadFile,
} from '../app/lib/upload-policy.ts';

test('valid Talent image types are accepted', () => {
  assert.equal(
    validateUploadFile(
      { type: 'image/webp', size: 1024 },
      'talent_profile_photo'
    ),
    null
  );
  assert.equal(
    validateUploadFile(
      { type: 'image/png', size: 1024 },
      'talent_portfolio_image'
    ),
    null
  );
});

test('invalid image and document types are rejected by category', () => {
  assert.match(
    validateUploadFile(
      { type: 'application/pdf', size: 1024 },
      'talent_portfolio_image'
    ) ?? '',
    /JPEG, PNG, or WebP/
  );
  assert.match(
    validateUploadFile(
      { type: 'video/mp4', size: 1024 },
      'recruiter_verification_evidence'
    ) ?? '',
    /JPEG, PNG, WebP, or PDF/
  );
});

test('oversized files are rejected with safe size messages', () => {
  assert.match(
    validateUploadFile(
      { type: 'image/jpeg', size: 6 * 1024 * 1024 },
      'talent_portfolio_image'
    ) ?? '',
    /5 MB/
  );
  assert.match(
    validateUploadFile(
      { type: 'application/pdf', size: 11 * 1024 * 1024 },
      'recruiter_verification_evidence'
    ) ?? '',
    /10 MB/
  );
});

test('upload paths are user-scoped and filenames are sanitized', () => {
  assert.equal(
    sanitizeUploadFileName('My Proof (Final)!!.PDF'),
    'my-proof-final'
  );
  assert.equal(
    buildUploadPath({
      uid: 'recruiter-a',
      category: 'recruiter_verification_evidence',
      uploadId: 'evidence_1',
      fileName: 'Business Proof Final.pdf',
      mimeType: 'application/pdf',
    }),
    'recruiter-verification-evidence/recruiter-a/evidence_1/business-proof-final.pdf'
  );
});

test('portfolio image limit is enforced', () => {
  assert.equal(validatePortfolioImageCount(MAX_PORTFOLIO_IMAGE_COUNT - 1), null);
  assert.match(
    validatePortfolioImageCount(MAX_PORTFOLIO_IMAGE_COUNT) ?? '',
    /limited to 6 images/
  );
});

test('recruiter evidence accepts PDF but Talent image upload does not', () => {
  assert.equal(
    validateUploadFile(
      { type: 'application/pdf', size: 1024 },
      'recruiter_verification_evidence'
    ),
    null
  );
  assert.notEqual(
    validateUploadFile(
      { type: 'application/pdf', size: 1024 },
      'talent_profile_photo'
    ),
    null
  );
});
