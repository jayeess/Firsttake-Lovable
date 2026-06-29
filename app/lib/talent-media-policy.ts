export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PORTFOLIO_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MAX_PORTFOLIO_IMAGE_COUNT = 6;

export const ALLOWED_TALENT_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const extensionByType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const formatMegabytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

export const validateTalentImage = (
  file: Pick<File, 'type' | 'size'>,
  kind: 'profile' | 'portfolio'
) => {
  if (!ALLOWED_TALENT_IMAGE_TYPES.includes(file.type as never)) {
    return 'Use a JPEG, PNG, or WebP image.';
  }
  const limit =
    kind === 'profile' ? PROFILE_PHOTO_MAX_BYTES : PORTFOLIO_IMAGE_MAX_BYTES;
  if (file.size > limit) {
    return `${kind === 'profile' ? 'Profile photo' : 'Portfolio image'} files must be ${formatMegabytes(limit)} or smaller.`;
  }
  return null;
};

export const validatePortfolioImageCount = (currentImageCount: number) =>
  currentImageCount >= MAX_PORTFOLIO_IMAGE_COUNT
    ? `Portfolio image uploads are limited to ${MAX_PORTFOLIO_IMAGE_COUNT} images. You can still add external showreel links.`
    : null;

const isSafePathPart = (value: string) => /^[A-Za-z0-9_-]+$/.test(value);

export const buildTalentMediaPath = ({
  uid,
  kind,
  mediaId,
  mimeType,
}: {
  uid: string;
  kind: 'profile' | 'portfolio';
  mediaId: string;
  mimeType: string;
}) => {
  const extension = extensionByType[mimeType];
  if (!extension || !isSafePathPart(uid) || !isSafePathPart(mediaId)) {
    throw new Error('A safe upload path could not be created.');
  }
  if (kind === 'profile') {
    return `talent-media/${uid}/profile/${mediaId}.${extension}`;
  }
  return `talent-media/${uid}/portfolio/${mediaId}/${mediaId}.${extension}`;
};

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
