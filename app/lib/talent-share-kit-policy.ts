import type {
  PublicTalentMedia,
  PublicTalentProfile,
  TalentMedia,
  TalentProfile,
} from './types';

export type TalentShareReadinessBand =
  | 'share_ready'
  | 'good_public_profile'
  | 'needs_profile_detail'
  | 'keep_private_until_complete';

export type TalentShareChecklistItem = {
  key:
    | 'publicProfile'
    | 'displayName'
    | 'category'
    | 'location'
    | 'bio'
    | 'skills'
    | 'languages'
    | 'publicMedia'
    | 'showreel'
    | 'trustBadge';
  label: string;
  complete: boolean;
  detail: string;
  publicSafe: boolean;
  optional?: boolean;
};

export type TalentShareKit = {
  band: TalentShareReadinessBand;
  bandLabel: string;
  score: number;
  publicUrl?: string;
  displayName: string;
  headline: string;
  summary: string;
  checklist: TalentShareChecklistItem[];
  missingItems: TalentShareChecklistItem[];
  whatRecruitersSee: string[];
  shareCopyTemplates: string[];
  privacyNotes: string[];
};

type PublicMediaInput = Array<
  | TalentMedia
  | PublicTalentMedia
  | (Partial<TalentMedia> & { id: string })
  | (Partial<PublicTalentMedia> & { id: string })
>;

const hasText = (value?: string | null) => Boolean(value?.trim());

const getName = (profile?: Partial<TalentProfile | PublicTalentProfile> | null) =>
  'displayName' in (profile ?? {})
    ? (profile as Partial<PublicTalentProfile>).displayName?.trim() || 'Talent'
    : [
        (profile as Partial<TalentProfile> | null | undefined)?.firstName,
        (profile as Partial<TalentProfile> | null | undefined)?.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Talent';

const isPublicMedia = (item: PublicMediaInput[number]) => {
  if ('visibility' in item || 'moderationStatus' in item) {
    return (
      item.visibility === 'public' &&
      item.moderationStatus === 'active' &&
      item.type !== 'document'
    );
  }
  return item.type === 'image' || item.type === 'video_link' || item.type === 'showreel_link';
};

const getMediaUrl = (item: PublicMediaInput[number]) =>
  'externalUrl' in item ? item.url ?? item.externalUrl : item.url;

const getPublicMedia = (media: PublicMediaInput = []) =>
  media.filter((item) => isPublicMedia(item) && hasText(getMediaUrl(item)));

const hasShowreel = (
  profile?: Partial<TalentProfile | PublicTalentProfile> | null,
  media: PublicMediaInput = []
) =>
  hasText((profile as Partial<TalentProfile>)?.youtubeUrl) ||
  getPublicMedia(media).some(
    (item) => item.type === 'showreel_link' || item.type === 'video_link'
  );

const getPublicSlug = (
  profile?: Partial<TalentProfile | PublicTalentProfile> | null
) =>
  'slug' in (profile ?? {})
    ? (profile as Partial<PublicTalentProfile>).slug
    : (profile as Partial<TalentProfile>)?.publicSlug;

const isPublicEnabled = (
  profile?: Partial<TalentProfile | PublicTalentProfile> | null
) =>
  'enabled' in (profile ?? {})
    ? (profile as Partial<PublicTalentProfile>).enabled === true
    : (profile as Partial<TalentProfile>)?.publicProfileEnabled === true ||
      (profile as Partial<TalentProfile>)?.isPublic === true;

const getPublicUrl = (
  profile?: Partial<TalentProfile | PublicTalentProfile> | null
) => {
  const slug = getPublicSlug(profile);
  return slug ? `/t/${slug}` : undefined;
};

export const getPublicProfileChecklist = (
  profile?: Partial<TalentProfile | PublicTalentProfile> | null,
  publicMedia: PublicMediaInput = []
): TalentShareChecklistItem[] => {
  const displayName = getName(profile);
  const media = getPublicMedia(publicMedia);
  const skills = profile?.skills ?? [];
  const languages = profile?.languages ?? [];
  const publicUrl = getPublicUrl(profile);
  const verificationStatus = profile?.talentVerificationStatus;

  return [
    {
      key: 'publicProfile',
      label: 'Public profile link',
      complete: Boolean(publicUrl && isPublicEnabled(profile)),
      detail: publicUrl
        ? 'A shareable public casting link is available.'
        : 'Create a public profile address before sharing externally.',
      publicSafe: true,
    },
    {
      key: 'displayName',
      label: 'Display name',
      complete: displayName !== 'Talent',
      detail:
        displayName !== 'Talent'
          ? `${displayName} is visible as the casting identity.`
          : 'Add first and last name before sharing.',
      publicSafe: true,
    },
    {
      key: 'category',
      label: 'Talent category',
      complete: hasText(profile?.category),
      detail: hasText(profile?.category)
        ? 'Primary casting category is visible.'
        : 'Choose a primary casting category.',
      publicSafe: true,
    },
    {
      key: 'location',
      label: 'Public location',
      complete: hasText(profile?.location),
      detail: hasText(profile?.location)
        ? 'Location helps casting teams understand availability context.'
        : 'Add location or keep it intentionally hidden until ready.',
      publicSafe: true,
      optional: true,
    },
    {
      key: 'bio',
      label: 'Casting bio',
      complete: (profile?.bio?.trim().length ?? 0) >= 80,
      detail:
        (profile?.bio?.trim().length ?? 0) >= 80
          ? 'Bio gives recruiters enough professional context.'
          : 'Write an 80+ character bio with training, strengths, and role interests.',
      publicSafe: true,
    },
    {
      key: 'skills',
      label: 'Skills',
      complete: skills.length > 0,
      detail: skills.length > 0
        ? 'Skills help recruiters scan performance strengths.'
        : 'Add at least one performance skill.',
      publicSafe: true,
    },
    {
      key: 'languages',
      label: 'Languages',
      complete: languages.length > 0,
      detail: languages.length > 0
        ? 'Languages are visible for casting fit.'
        : 'Add at least one spoken language.',
      publicSafe: true,
    },
    {
      key: 'publicMedia',
      label: 'Public portfolio media',
      complete: media.length > 0,
      detail:
        media.length > 0
          ? `${media.length} public portfolio item${media.length === 1 ? '' : 's'} can be shown.`
          : 'Mark at least one active portfolio item as public before sharing.',
      publicSafe: true,
    },
    {
      key: 'showreel',
      label: 'Showreel or public work link',
      complete: hasShowreel(profile, publicMedia),
      detail: hasShowreel(profile, publicMedia)
        ? 'A showreel or public work link is available.'
        : 'Add an external showreel or portfolio link when available.',
      publicSafe: true,
      optional: true,
    },
    {
      key: 'trustBadge',
      label: 'Verified Talent badge',
      complete: verificationStatus === 'verified',
      detail:
        verificationStatus === 'verified'
          ? 'Verified Talent badge can appear publicly.'
          : 'Verification is optional and never guarantees selection.',
      publicSafe: true,
      optional: true,
    },
  ];
};

export const getTalentShareReadiness = (
  profile?: Partial<TalentProfile | PublicTalentProfile> | null,
  publicMedia: PublicMediaInput = []
) => {
  const checklist = getPublicProfileChecklist(profile, publicMedia);
  const required = checklist.filter((item) => !item.optional);
  const completeRequired = required.filter((item) => item.complete).length;
  const completeOptional = checklist.filter(
    (item) => item.optional && item.complete
  ).length;
  const score = Math.min(
    100,
    Math.round(
      (completeRequired / Math.max(1, required.length)) * 82 +
        (completeOptional / Math.max(1, checklist.length - required.length)) * 18
    )
  );

  const missingRequired = required.some((item) => !item.complete);
  const publicProfileReady = checklist.find((item) => item.key === 'publicProfile')
    ?.complete;
  const mediaReady = checklist.find((item) => item.key === 'publicMedia')
    ?.complete;

  if (score >= 88 && publicProfileReady && mediaReady && !missingRequired) {
    return { band: 'share_ready' as const, bandLabel: 'Share-ready', score };
  }
  if (score >= 68 && publicProfileReady && !missingRequired) {
    return {
      band: 'good_public_profile' as const,
      bandLabel: 'Good public profile',
      score,
    };
  }
  if (score >= 35) {
    return {
      band: 'needs_profile_detail' as const,
      bandLabel: 'Needs profile detail',
      score,
    };
  }
  return {
    band: 'keep_private_until_complete' as const,
    bandLabel: 'Keep private until complete',
    score,
  };
};

export const getTalentShareMissingItems = (
  profile?: Partial<TalentProfile | PublicTalentProfile> | null,
  publicMedia: PublicMediaInput = []
) => getPublicProfileChecklist(profile, publicMedia).filter((item) => !item.complete);

export const getTalentShareCopyTemplates = (
  profile?: Partial<TalentProfile | PublicTalentProfile> | null
) => {
  const displayName = getName(profile);
  const publicUrl = getPublicUrl(profile) ?? '/talent/profile';
  const category = profile?.category
    ? profile.category.toString().replace(/_/g, ' ').toLowerCase()
    : 'performer';

  return [
    `Hi, I am ${displayName}. Here is my FirstTake public casting passport for ${category} opportunities: ${publicUrl}`,
    `Sharing my Nata Connect casting profile with bio, skills, languages, and selected public work: ${publicUrl}`,
    `For casting review, you can see my public FirstTake profile here: ${publicUrl}`,
  ];
};

export const getPublicProfilePrivacyNotes = () => [
  'Public casting passports never show email, phone, private account fields, private verification documents, private reports, or admin notes.',
  'Only active media marked Public profile can appear on the public page.',
  'Verification badges are trust context only. They do not guarantee casting, jobs, callbacks, or selection.',
  'Self-tapes remain external links. Do not publish private or sensitive media you are not comfortable sharing.',
];

export const getTalentShareKit = (
  profile?: Partial<TalentProfile | PublicTalentProfile> | null,
  publicMedia: PublicMediaInput = []
): TalentShareKit => {
  const readiness = getTalentShareReadiness(profile, publicMedia);
  const checklist = getPublicProfileChecklist(profile, publicMedia);
  const missingItems = checklist.filter((item) => !item.complete);
  const publicUrl = getPublicUrl(profile);
  const displayName = getName(profile);
  const media = getPublicMedia(publicMedia);

  return {
    ...readiness,
    publicUrl,
    displayName,
    headline:
      readiness.band === 'share_ready'
        ? 'A polished public casting identity is ready to share.'
        : readiness.band === 'good_public_profile'
          ? 'Your public casting profile is useful, with a few improvements left.'
          : readiness.band === 'needs_profile_detail'
            ? 'Add more public profile detail before sharing broadly.'
            : 'Keep this profile private until the basics are complete.',
    summary:
      'The Talent Share Kit packages public-safe profile details, selected media, skills, languages, and trust cues into one clean casting link.',
    checklist,
    missingItems,
    whatRecruitersSee: [
      `${displayName} as the public Talent identity.`,
      profile?.category ? 'Primary category and experience level.' : 'Primary category once added.',
      profile?.location ? 'Public location if enabled.' : 'Location only when provided and enabled.',
      media.length > 0
        ? 'Selected public portfolio media and showreel links.'
        : 'Public portfolio media once you mark items as public.',
      profile?.talentVerificationStatus === 'verified'
        ? 'Verified Talent badge as platform trust context.'
        : 'No private verification notes or documents.',
    ],
    shareCopyTemplates: getTalentShareCopyTemplates(profile),
    privacyNotes: getPublicProfilePrivacyNotes(),
  };
};

export const getPublicCastingPassport = getTalentShareKit;
