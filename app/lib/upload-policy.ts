export type UploadCategory =
  | 'talent_profile_photo'
  | 'talent_portfolio_image'
  | 'recruiter_verification_evidence';

export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PORTFOLIO_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const RECRUITER_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;
export const MAX_PORTFOLIO_IMAGE_COUNT = 6;
export const MAX_RECRUITER_EVIDENCE_COUNT = 8;

export const ALLOWED_TALENT_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_RECRUITER_EVIDENCE_TYPES = [
  ...ALLOWED_TALENT_IMAGE_TYPES,
  'application/pdf',
] as const;

const extensionByType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const uploadLabels: Record<UploadCategory, string> = {
  talent_profile_photo: 'Profile photo',
  talent_portfolio_image: 'Portfolio image',
  recruiter_verification_evidence: 'Verification evidence',
};

const maxBytesByCategory: Record<UploadCategory, number> = {
  talent_profile_photo: PROFILE_PHOTO_MAX_BYTES,
  talent_portfolio_image: PORTFOLIO_IMAGE_MAX_BYTES,
  recruiter_verification_evidence: RECRUITER_EVIDENCE_MAX_BYTES,
};

const allowedTypesByCategory: Record<UploadCategory, readonly string[]> = {
  talent_profile_photo: ALLOWED_TALENT_IMAGE_TYPES,
  talent_portfolio_image: ALLOWED_TALENT_IMAGE_TYPES,
  recruiter_verification_evidence: ALLOWED_RECRUITER_EVIDENCE_TYPES,
};

const formatMegabytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

export const getUploadCategoryLabel = (category: UploadCategory) =>
  uploadLabels[category];

export const getUploadMaxBytes = (category: UploadCategory) =>
  maxBytesByCategory[category];

export const getUploadExtension = (mimeType: string) => extensionByType[mimeType];

export const isAllowedUploadMimeType = (
  category: UploadCategory,
  mimeType: string
) => allowedTypesByCategory[category].includes(mimeType);

export const validateUploadFile = (
  file: Pick<File, 'type' | 'size'>,
  category: UploadCategory
) => {
  if (!isAllowedUploadMimeType(category, file.type)) {
    return category === 'recruiter_verification_evidence'
      ? 'Use a JPEG, PNG, WebP, or PDF file.'
      : 'Use a JPEG, PNG, or WebP image.';
  }
  const limit = getUploadMaxBytes(category);
  if (file.size > limit) {
    return `${getUploadCategoryLabel(category)} files must be ${formatMegabytes(limit)} or smaller.`;
  }
  return null;
};

export const sanitizeUploadFileName = (fileName: string, fallback = 'upload') => {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  const normalized = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return normalized || fallback;
};

const isSafePathPart = (value: string) => /^[A-Za-z0-9_-]+$/.test(value);

export const buildUploadPath = ({
  uid,
  category,
  uploadId,
  fileName,
  mimeType,
}: {
  uid: string;
  category: UploadCategory;
  uploadId: string;
  fileName: string;
  mimeType: string;
}) => {
  const extension = getUploadExtension(mimeType);
  if (!extension || !isSafePathPart(uid) || !isSafePathPart(uploadId)) {
    throw new Error('A safe upload path could not be created.');
  }
  const safeName = sanitizeUploadFileName(fileName || uploadId, uploadId);
  if (category === 'talent_profile_photo') {
    return `talent-media/${uid}/profile/${safeName}.${extension}`;
  }
  if (category === 'talent_portfolio_image') {
    return `talent-media/${uid}/portfolio/${uploadId}/${safeName}.${extension}`;
  }
  return `recruiter-verification-evidence/${uid}/${uploadId}/${safeName}.${extension}`;
};

export const validatePortfolioImageCount = (currentImageCount: number) =>
  currentImageCount >= MAX_PORTFOLIO_IMAGE_COUNT
    ? `Portfolio image uploads are limited to ${MAX_PORTFOLIO_IMAGE_COUNT} images. You can still add external showreel links.`
    : null;

export const isRecruiterEvidenceStoragePath = (uid: string, path: string) =>
  path.startsWith(`recruiter-verification-evidence/${uid}/`) &&
  !path.includes('..');

export const normalizeExternalMediaUrl = (value: string) => {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};
