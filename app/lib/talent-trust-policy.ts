import type {
  ProfileCompletenessChecklist,
  TalentProfile,
  TalentVerificationStatus,
} from './types';

export const TALENT_VERIFICATION_MINIMUM_SCORE = 70;

const weights: Record<keyof ProfileCompletenessChecklist, number> = {
  basicInfo: 15,
  demographics: 10,
  category: 10,
  experience: 10,
  location: 10,
  bio: 15,
  professionalLinks: 10,
  profilePhoto: 5,
  portfolioMedia: 5,
  skillsAndLanguages: 10,
};

const hasText = (value?: string) => Boolean(value?.trim());

export const calculateTalentProfileCompleteness = (
  profile: TalentProfile
) => {
  const checklist: ProfileCompletenessChecklist = {
    basicInfo: hasText(profile.firstName) && hasText(profile.lastName),
    demographics:
      profile.age >= 18 && hasText(profile.gender) && hasText(profile.height),
    category: hasText(profile.category),
    experience: hasText(profile.experienceLevel),
    location: hasText(profile.location),
    bio: profile.bio.trim().length >= 80,
    professionalLinks: Boolean(
      hasText(profile.instagramUrl) ||
        hasText(profile.youtubeUrl) ||
        hasText(profile.websiteUrl)
    ),
    profilePhoto: hasText(profile.profilePhotoUrl),
    portfolioMedia: Number(profile.portfolioMediaCount ?? 0) > 0,
    skillsAndLanguages: Boolean(
      profile.skills?.some(hasText) || profile.languages?.some(hasText)
    ),
  };

  const score = Object.entries(checklist).reduce(
    (total, [key, complete]) =>
      total +
      (complete ? weights[key as keyof ProfileCompletenessChecklist] : 0),
    0
  );

  const labels: Record<keyof ProfileCompletenessChecklist, string> = {
    basicInfo: 'Add your first and last name',
    demographics: 'Complete age, gender, and height',
    category: 'Choose a talent category',
    experience: 'Choose your experience level',
    location: 'Add your current location',
    bio: 'Write a professional bio of at least 80 characters',
    professionalLinks: 'Add Instagram, YouTube, or a portfolio website',
    profilePhoto: 'Add a professional profile photo',
    portfolioMedia: 'Add at least one portfolio image or showreel',
    skillsAndLanguages: 'Add skills or languages',
  };

  return {
    score,
    checklist,
    missingFields: Object.entries(checklist)
      .filter(([, complete]) => !complete)
      .map(([key]) => labels[key as keyof ProfileCompletenessChecklist]),
    eligibleForVerification: score >= TALENT_VERIFICATION_MINIMUM_SCORE,
  };
};

export const canSubmitTalentVerification = (
  status: TalentVerificationStatus,
  score: number
) =>
  score >= TALENT_VERIFICATION_MINIMUM_SCORE &&
  (status === 'not_submitted' || status === 'rejected');

export const isVerifiedTalent = (status?: TalentVerificationStatus) =>
  status === 'verified';

export const canAdminSetTalentVerification = (
  isAdmin: boolean,
  status: TalentVerificationStatus
) =>
  isAdmin &&
  ['pending', 'verified', 'rejected', 'suspended'].includes(status);
