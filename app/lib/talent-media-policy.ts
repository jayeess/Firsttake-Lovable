export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PORTFOLIO_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
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
    return `${kind === 'profile' ? 'Profile photos' : 'Portfolio images'} must be ${kind === 'profile' ? '5 MB' : '10 MB'} or smaller.`;
  }
  return null;
};

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
  if (!extension || !/^[A-Za-z0-9_-]+$/.test(uid + mediaId)) {
    throw new Error('A safe Talent media path could not be created.');
  }
  return kind === 'profile'
    ? `talent-media/${uid}/profile/${mediaId}.${extension}`
    : `talent-media/${uid}/portfolio/${mediaId}/${mediaId}.${extension}`;
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
