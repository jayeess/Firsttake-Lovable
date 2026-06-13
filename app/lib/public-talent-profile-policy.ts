import type {
  PublicTalentMedia,
  PublicTalentProfile,
  TalentMedia,
  TalentProfile,
} from './types';

export const PUBLIC_TALENT_SLUG_MIN_LENGTH = 3;
export const PUBLIC_TALENT_SLUG_MAX_LENGTH = 48;

export const RESERVED_PUBLIC_TALENT_SLUGS = new Set([
  'admin',
  'api',
  'applications',
  'auditions',
  'auth',
  'dashboard',
  'help',
  'login',
  'notifications',
  'recruiter',
  'settings',
  'signup',
  'support',
  'talent',
]);

export const normalizePublicTalentSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, PUBLIC_TALENT_SLUG_MAX_LENGTH);

export const validatePublicTalentSlug = (value: string): string | null => {
  if (
    value.length < PUBLIC_TALENT_SLUG_MIN_LENGTH ||
    value.length > PUBLIC_TALENT_SLUG_MAX_LENGTH
  ) {
    return `Use ${PUBLIC_TALENT_SLUG_MIN_LENGTH}-${PUBLIC_TALENT_SLUG_MAX_LENGTH} characters.`;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    return 'Use lowercase letters, numbers, and single hyphens only.';
  }
  if (RESERVED_PUBLIC_TALENT_SLUGS.has(value)) {
    return 'This profile address is reserved.';
  }
  return null;
};

const safeUrl = (value?: string) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

export const getPublicTalentMedia = (
  media: Array<TalentMedia | (Omit<TalentMedia, 'id'> & { id: string })>
): PublicTalentMedia[] =>
  media
    .filter(
      (item) =>
        item.visibility === 'public' &&
        item.moderationStatus === 'active' &&
        item.type !== 'document'
    )
    .flatMap((item): PublicTalentMedia[] => {
      const url = safeUrl(item.url ?? item.externalUrl);
      if (!url) return [];
      return [{
        id: item.id,
        type: item.type as PublicTalentMedia['type'],
        title: item.title.trim().slice(0, 120),
        description: item.description?.trim().slice(0, 500) || undefined,
        url,
        thumbnailUrl: safeUrl(item.thumbnailUrl),
        isFeatured: item.isFeatured,
        sortOrder: item.sortOrder,
      }];
    })
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder)
    .slice(0, 24);

export const buildPublicTalentProfile = ({
  uid,
  slug,
  profile,
  media,
}: {
  uid: string;
  slug: string;
  profile: TalentProfile;
  media: TalentMedia[];
}): Omit<PublicTalentProfile, 'createdAt' | 'updatedAt'> => ({
  uid,
  slug,
  enabled: true,
  displayName:
    `${profile.firstName.trim()} ${profile.lastName.trim()}`.trim() || 'Talent',
  category: profile.category,
  experienceLevel: profile.experienceLevel,
  ...(profile.publicShowLocation !== false && profile.location.trim()
    ? { location: profile.location.trim().slice(0, 160) }
    : {}),
  bio: profile.bio.trim().slice(0, 1200),
  ...(safeUrl(profile.profilePhotoUrl)
    ? { profilePhotoUrl: safeUrl(profile.profilePhotoUrl) }
    : {}),
  skills: (profile.skills ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 30),
  languages: (profile.languages ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 30),
  ...(profile.publicShowSocialLinks !== false
    ? {
        ...(safeUrl(profile.instagramUrl)
          ? { instagramUrl: safeUrl(profile.instagramUrl) }
          : {}),
        ...(safeUrl(profile.youtubeUrl)
          ? { youtubeUrl: safeUrl(profile.youtubeUrl) }
          : {}),
        ...(safeUrl(profile.websiteUrl)
          ? { websiteUrl: safeUrl(profile.websiteUrl) }
          : {}),
      }
    : {}),
  talentVerificationStatus:
    profile.talentVerificationStatus === 'verified' ? 'verified' : 'not_submitted',
  media: getPublicTalentMedia(media),
});

export const canPublishTalentProfile = (profile: TalentProfile) =>
  Boolean(
    profile.firstName.trim() &&
      profile.lastName.trim() &&
      profile.bio.trim() &&
      profile.location.trim()
  );
