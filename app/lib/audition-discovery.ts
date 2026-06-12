import type {
  Audition,
  AuditionType,
  ExperienceLevel,
  PaymentType,
  TalentCategory,
  TalentProfile,
  WorkMode,
} from './types';

export type AuditionSort =
  | 'RELEVANCE'
  | 'RECOMMENDED'
  | 'NEWEST'
  | 'DEADLINE'
  | 'UPDATED';

export type AuditionDiscoveryFilters = {
  search: string;
  category: TalentCategory | '';
  experience: ExperienceLevel | '';
  location: string;
  language: string;
  auditionType: AuditionType | '';
  paymentType: PaymentType | '';
  workMode: WorkMode | '';
  verifiedOnly: boolean;
  recentlyPosted: boolean;
  deadlineSoon: boolean;
  savedOnly: boolean;
};

export const initialAuditionFilters: AuditionDiscoveryFilters = {
  search: '',
  category: '',
  experience: '',
  location: '',
  language: '',
  auditionType: '',
  paymentType: '',
  workMode: '',
  verifiedOnly: false,
  recentlyPosted: false,
  deadlineSoon: false,
  savedOnly: false,
};

const normalize = (value?: string) => value?.trim().toLowerCase() ?? '';

const toMillis = (value: unknown) => {
  if (value instanceof Date) return value.getTime();
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof value.toMillis === 'function'
  ) {
    return value.toMillis();
  }
  return 0;
};

export const inferPaymentType = (audition: Audition): PaymentType => {
  if (audition.paymentType) return audition.paymentType;
  const pay = normalize(audition.payInfo);
  if (!pay) return 'UNSPECIFIED';
  if (pay.includes('unpaid') || pay.includes('no pay')) return 'UNPAID';
  if (pay.includes('honorarium') || pay.includes('stipend')) return 'HONORARIUM';
  return 'PAID';
};

export const inferWorkMode = (audition: Audition): WorkMode => {
  if (audition.workMode) return audition.workMode;
  const location = normalize(audition.location);
  if (location.includes('remote')) return 'REMOTE';
  if (location.includes('hybrid')) return 'HYBRID';
  return 'ONSITE';
};

export const getAuditionLanguages = (audition: Audition) => {
  if (audition.languages?.length) return audition.languages.map(normalize);
  const text = normalize(`${audition.requirements} ${audition.description}`);
  const common = [
    'english',
    'hindi',
    'telugu',
    'tamil',
    'marathi',
    'malayalam',
    'kannada',
    'bengali',
    'urdu',
    'arabic',
  ];
  return common.filter((language) => text.includes(language));
};

export const buildAuditionSearchFields = ({
  title,
  recruiterName,
  location,
  category,
  languages = [],
  description,
  requirements,
}: Pick<
  Audition,
  | 'title'
  | 'recruiterName'
  | 'location'
  | 'category'
  | 'languages'
  | 'description'
  | 'requirements'
>) => {
  const words = [
    title,
    recruiterName,
    location,
    category,
    ...languages,
    description,
    requirements,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1);
  return {
    normalizedTitle: normalize(title),
    normalizedLocation: normalize(location),
    normalizedCategory: normalize(category),
    normalizedLanguages: languages.map(normalize),
    searchKeywords: Array.from(new Set(words)).slice(0, 80),
  };
};

export const scoreAuditionRecommendation = (
  audition: Audition,
  profile: TalentProfile | null
) => {
  if (!profile) return 0;
  let score = 0;
  if (audition.category === profile.category) score += 40;
  if (audition.experienceLevel === profile.experienceLevel) score += 15;
  if (
    normalize(audition.location).includes(normalize(profile.location)) ||
    inferWorkMode(audition) === 'REMOTE'
  ) {
    score += 15;
  }
  const auditionText = normalize(
    `${audition.title} ${audition.description} ${audition.requirements}`
  );
  score += Math.min(
    20,
    (profile.skills ?? []).filter((skill) =>
      auditionText.includes(normalize(skill))
    ).length * 5
  );
  score += Math.min(
    10,
    (profile.languages ?? []).filter((language) =>
      getAuditionLanguages(audition).includes(normalize(language))
    ).length * 5
  );
  return score;
};

export const filterAuditions = (
  auditions: Audition[],
  filters: AuditionDiscoveryFilters,
  savedIds: Set<string>,
  now = new Date()
) => {
  const search = normalize(filters.search);
  const location = normalize(filters.location);
  const language = normalize(filters.language);
  const recentThreshold = now.getTime() - 7 * 86_400_000;
  const deadlineThreshold = now.getTime() + 7 * 86_400_000;

  return auditions.filter((audition) => {
    if (
      audition.status !== 'ACTIVE' ||
      audition.moderationStatus === 'REMOVED' ||
      toMillis(audition.deadline) <= now.getTime()
    ) {
      return false;
    }
    const searchable = normalize(
      [
        audition.title,
        audition.recruiterName,
        audition.description,
        audition.location,
        ...(audition.searchKeywords ?? []),
      ].join(' ')
    );
    return (
      (!search || searchable.includes(search)) &&
      (!filters.category || audition.category === filters.category) &&
      (!filters.experience ||
        audition.experienceLevel === filters.experience) &&
      (!location || normalize(audition.location).includes(location)) &&
      (!language || getAuditionLanguages(audition).includes(language)) &&
      (!filters.auditionType ||
        audition.auditionType === filters.auditionType) &&
      (!filters.paymentType ||
        inferPaymentType(audition) === filters.paymentType) &&
      (!filters.workMode || inferWorkMode(audition) === filters.workMode) &&
      (!filters.verifiedOnly || audition.recruiterVerified === true) &&
      (!filters.recentlyPosted ||
        toMillis(audition.createdAt) >= recentThreshold) &&
      (!filters.deadlineSoon ||
        toMillis(audition.deadline) <= deadlineThreshold) &&
      (!filters.savedOnly || savedIds.has(audition.id))
    );
  });
};

export const sortAuditions = (
  auditions: Audition[],
  sort: AuditionSort,
  profile: TalentProfile | null,
  search: string
) =>
  [...auditions].sort((left, right) => {
    if (sort === 'DEADLINE') {
      return toMillis(left.deadline) - toMillis(right.deadline);
    }
    if (sort === 'UPDATED') {
      return toMillis(right.updatedAt) - toMillis(left.updatedAt);
    }
    if (sort === 'RECOMMENDED') {
      return (
        scoreAuditionRecommendation(right, profile) -
        scoreAuditionRecommendation(left, profile)
      );
    }
    if (sort === 'RELEVANCE' && search.trim()) {
      const query = normalize(search);
      const relevance = (audition: Audition) =>
        normalize(audition.title).includes(query)
          ? 3
          : normalize(audition.recruiterName).includes(query)
            ? 2
            : normalize(audition.description).includes(query)
              ? 1
              : 0;
      return relevance(right) - relevance(left);
    }
    return toMillis(right.createdAt) - toMillis(left.createdAt);
  });
