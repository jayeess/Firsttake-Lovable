import type {
  ProfileCompletenessChecklist,
  TalentProfile,
} from './types';

export const TALENT_VERIFICATION_MINIMUM_SCORE = 70;

type RequiredCompletenessKey =
  | 'basicInfo'
  | 'category'
  | 'experience'
  | 'location'
  | 'bio'
  | 'portfolioMedia'
  | 'skillsAndLanguages';

type OptionalCompletenessKey = 'demographics' | 'professionalLinks' | 'profilePhoto';

type CompletenessItem<Key extends string> = {
  key: Key;
  label: string;
  complete: boolean;
  weight?: number;
};

const requiredWeights: Record<RequiredCompletenessKey, number> = {
  basicInfo: 15,
  category: 12,
  experience: 12,
  location: 12,
  bio: 18,
  portfolioMedia: 15,
  skillsAndLanguages: 16,
};

const hasText = (value?: string) => Boolean(value?.trim());

const hasListValue = (values?: string[]) => Boolean(values?.some(hasText));

const hasPortfolioSignal = (profile: TalentProfile) =>
  Number(profile.portfolioMediaCount ?? 0) > 0 ||
  hasText(profile.youtubeUrl) ||
  hasText(profile.websiteUrl);

export const calculateTalentProfileCompleteness = (profile: TalentProfile) => {
  const requiredItems: Array<CompletenessItem<RequiredCompletenessKey>> = [
    {
      key: 'basicInfo',
      label: 'Add your first and last name',
      complete: hasText(profile.firstName) && hasText(profile.lastName),
      weight: requiredWeights.basicInfo,
    },
    {
      key: 'category',
      label: 'Choose a talent category',
      complete: hasText(profile.category),
      weight: requiredWeights.category,
    },
    {
      key: 'experience',
      label: 'Choose your experience level',
      complete: hasText(profile.experienceLevel),
      weight: requiredWeights.experience,
    },
    {
      key: 'location',
      label: 'Add your current location',
      complete: hasText(profile.location),
      weight: requiredWeights.location,
    },
    {
      key: 'bio',
      label: 'Write a professional bio of at least 80 characters',
      complete: profile.bio.trim().length >= 80,
      weight: requiredWeights.bio,
    },
    {
      key: 'portfolioMedia',
      label: 'Add at least one portfolio image, YouTube reel, or portfolio website',
      complete: hasPortfolioSignal(profile),
      weight: requiredWeights.portfolioMedia,
    },
    {
      key: 'skillsAndLanguages',
      label: 'Add at least one skill and one language',
      complete: hasListValue(profile.skills) && hasListValue(profile.languages),
      weight: requiredWeights.skillsAndLanguages,
    },
  ];

  const optionalItems: Array<CompletenessItem<OptionalCompletenessKey>> = [
    {
      key: 'demographics',
      label: 'Age, gender, and height help casting context',
      complete:
        Number(profile.age ?? 0) >= 18 &&
        hasText(profile.gender) &&
        hasText(profile.height),
    },
    {
      key: 'professionalLinks',
      label: 'Instagram, YouTube, or portfolio links add extra context',
      complete:
        hasText(profile.instagramUrl) ||
        hasText(profile.youtubeUrl) ||
        hasText(profile.websiteUrl),
    },
    {
      key: 'profilePhoto',
      label: 'A professional profile photo improves first impressions',
      complete: hasText(profile.profilePhotoUrl),
    },
  ];

  const checklist: ProfileCompletenessChecklist = {
    basicInfo: requiredItems.find((item) => item.key === 'basicInfo')?.complete ?? false,
    demographics:
      optionalItems.find((item) => item.key === 'demographics')?.complete ?? false,
    category: requiredItems.find((item) => item.key === 'category')?.complete ?? false,
    experience:
      requiredItems.find((item) => item.key === 'experience')?.complete ?? false,
    location: requiredItems.find((item) => item.key === 'location')?.complete ?? false,
    bio: requiredItems.find((item) => item.key === 'bio')?.complete ?? false,
    professionalLinks:
      optionalItems.find((item) => item.key === 'professionalLinks')?.complete ?? false,
    profilePhoto:
      optionalItems.find((item) => item.key === 'profilePhoto')?.complete ?? false,
    portfolioMedia:
      requiredItems.find((item) => item.key === 'portfolioMedia')?.complete ?? false,
    skillsAndLanguages:
      requiredItems.find((item) => item.key === 'skillsAndLanguages')?.complete ??
      false,
  };

  const score = requiredItems.reduce(
    (total, item) => total + (item.complete ? item.weight ?? 0 : 0),
    0
  );
  const missingRequiredItems = requiredItems.filter((item) => !item.complete);
  const completedRequiredItems = requiredItems.filter((item) => item.complete);
  const missingFields = missingRequiredItems.map((item) => item.label);

  return {
    percent: score,
    score,
    summary: `${score}% complete`,
    explanation:
      missingRequiredItems.length === 0
        ? 'All required profile completeness items are complete.'
        : `${missingRequiredItems.length} required profile item${
            missingRequiredItems.length === 1 ? '' : 's'
          } missing.`,
    checklist,
    requiredItems,
    optionalItems,
    missingRequiredItems,
    completedRequiredItems,
    missingFields,
    eligibleForVerification: score >= TALENT_VERIFICATION_MINIMUM_SCORE,
  };
};
