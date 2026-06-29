import type { Audition, TalentProfile } from './types';

export type RoleFitSignalStatus = 'strong' | 'good' | 'attention' | 'missing';

export type RoleReadinessBand =
  | 'strong_fit_signals'
  | 'good_fit_signals'
  | 'needs_profile_detail'
  | 'missing_key_information';

export type RoleFitSignal = {
  key:
    | 'profileCompleteness'
    | 'category'
    | 'experience'
    | 'languages'
    | 'location'
    | 'skills'
    | 'portfolio'
    | 'selfTape'
    | 'trust';
  label: string;
  status: RoleFitSignalStatus;
  detail: string;
  points: number;
  maxPoints: number;
};

export type RoleFitSummary = {
  score: number;
  band: RoleReadinessBand;
  bandLabel: string;
  signals: RoleFitSignal[];
  checklist: RoleFitChecklistItem[];
  missingItems: RoleFitChecklistItem[];
};

export type RoleFitChecklistItem = {
  label: string;
  complete: boolean;
  detail: string;
  actionHref?: string;
};

export type TalentPassportSummary = {
  score: number;
  bandLabel: string;
  highlights: string[];
  nextActions: string[];
  items: RoleFitChecklistItem[];
};

type RoleFitOptions = {
  mediaCount?: number;
  hasSelfTapeSubmission?: boolean;
};

const EXPERIENCE_RANK = {
  FRESHER: 1,
  '1_3_YRS': 2,
  '3_5_YRS': 3,
  '5_PLUS_YRS': 4,
};

const hasText = (value?: string) => Boolean(value?.trim());

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normalizeList = (values?: string[]) =>
  (values ?? []).map(normalize).filter(Boolean);

const textIncludes = (haystack: string, needle: string) => {
  const cleanHaystack = normalize(haystack);
  const cleanNeedle = normalize(needle);
  return (
    Boolean(cleanNeedle) &&
    (cleanHaystack.includes(cleanNeedle) || cleanNeedle.includes(cleanHaystack))
  );
};

const getProfileCompleteness = (profile: TalentProfile) => {
  if (typeof profile.profileCompletenessScore === 'number') {
    return Math.max(0, Math.min(100, profile.profileCompletenessScore));
  }

  const required = [
    hasText(profile.firstName) && hasText(profile.lastName),
    hasText(profile.category),
    hasText(profile.experienceLevel),
    hasText(profile.location),
    profile.bio.trim().length >= 80,
    hasPortfolioSignal(profile),
    normalizeList(profile.skills).length > 0 &&
      normalizeList(profile.languages).length > 0,
  ];

  return Math.round(
    (required.filter(Boolean).length / required.length) * 100
  );
};

const hasPortfolioSignal = (profile: TalentProfile, mediaCount = 0) =>
  Number(profile.portfolioMediaCount ?? mediaCount) > 0 ||
  hasText(profile.youtubeUrl) ||
  hasText(profile.websiteUrl);

const hasAnyMediaSignal = (profile: TalentProfile, mediaCount = 0) =>
  hasPortfolioSignal(profile, mediaCount) ||
  hasText(profile.profilePhotoUrl) ||
  hasText(profile.instagramUrl);

const getSkillOverlap = (profile: TalentProfile, audition: Audition) => {
  const skills = normalizeList(profile.skills);
  if (skills.length === 0) return [];

  const roleText = [
    audition.title,
    audition.description,
    audition.requirements,
    audition.category,
  ].join(' ');

  return skills.filter((skill) => textIncludes(roleText, skill));
};

const getLanguageOverlap = (profile: TalentProfile, audition: Audition) => {
  const profileLanguages = normalizeList(profile.languages);
  const auditionLanguages = normalizeList(audition.languages);

  if (profileLanguages.length === 0 || auditionLanguages.length === 0) {
    return [];
  }

  return profileLanguages.filter((language) =>
    auditionLanguages.some(
      (required) =>
        language === required ||
        language.includes(required) ||
        required.includes(language)
    )
  );
};

const makeSignal = (
  signal: Omit<RoleFitSignal, 'points'> & { points?: number }
): RoleFitSignal => ({
  ...signal,
  points:
    typeof signal.points === 'number'
      ? Math.max(0, Math.min(signal.maxPoints, signal.points))
      : signal.status === 'strong'
        ? signal.maxPoints
        : signal.status === 'good'
          ? Math.round(signal.maxPoints * 0.72)
          : signal.status === 'attention'
            ? Math.round(signal.maxPoints * 0.38)
            : 0,
});

export const getRoleReadinessBand = (
  signals: RoleFitSignal[]
): {
  band: RoleReadinessBand;
  bandLabel: string;
  score: number;
} => {
  const max = signals.reduce((total, signal) => total + signal.maxPoints, 0);
  const points = signals.reduce((total, signal) => total + signal.points, 0);
  const score = max > 0 ? Math.round((points / max) * 100) : 0;
  const hasMissingKey = signals.some(
    (signal) =>
      signal.status === 'missing' &&
      ['profileCompleteness', 'category', 'languages', 'selfTape'].includes(
        signal.key
      )
  );

  if (score >= 80 && !hasMissingKey) {
    return {
      score,
      band: 'strong_fit_signals',
      bandLabel: 'Strong fit signals',
    };
  }

  if (score >= 60 && !hasMissingKey) {
    return {
      score,
      band: 'good_fit_signals',
      bandLabel: 'Good fit signals',
    };
  }

  if (score >= 35) {
    return {
      score,
      band: 'needs_profile_detail',
      bandLabel: 'Needs profile detail',
    };
  }

  return {
    score,
    band: 'missing_key_information',
    bandLabel: 'Missing key information',
  };
};

export const getRoleFitSignals = (
  profile: TalentProfile,
  audition: Audition,
  options: RoleFitOptions = {}
): RoleFitSignal[] => {
  const mediaCount = options.mediaCount ?? Number(profile.portfolioMediaCount ?? 0);
  const completeness = getProfileCompleteness(profile);
  const languageOverlap = getLanguageOverlap(profile, audition);
  const requiredLanguages = normalizeList(audition.languages);
  const skillOverlap = getSkillOverlap(profile, audition);
  const profileSkillCount = normalizeList(profile.skills).length;
  const locationFits =
    audition.workMode === 'REMOTE' ||
    textIncludes(profile.location, audition.location) ||
    textIncludes(audition.location, profile.location);
  const profileExperienceRank = EXPERIENCE_RANK[profile.experienceLevel];
  const auditionExperienceRank = EXPERIENCE_RANK[audition.experienceLevel];
  const experienceGap = profileExperienceRank - auditionExperienceRank;
  const hasSelfTapeSubmission = options.hasSelfTapeSubmission === true;

  return [
    makeSignal({
      key: 'profileCompleteness',
      label: 'Profile completeness',
      status:
        completeness >= 80 ? 'strong' : completeness >= 60 ? 'good' : 'missing',
      detail:
        completeness >= 80
          ? `${completeness}% complete profile gives recruiters enough context.`
          : completeness >= 60
            ? `${completeness}% complete. Add missing profile details for clearer review.`
            : `${completeness}% complete. Finish key profile fields before applying.`,
      points: Math.round((completeness / 100) * 18),
      maxPoints: 18,
    }),
    makeSignal({
      key: 'category',
      label: 'Category alignment',
      status: profile.category === audition.category ? 'strong' : 'attention',
      detail:
        profile.category === audition.category
          ? 'Your primary category matches this role category.'
          : 'Your primary category is different from this role category.',
      maxPoints: 14,
    }),
    makeSignal({
      key: 'experience',
      label: 'Experience readiness',
      status:
        experienceGap >= 0
          ? experienceGap <= 1
            ? 'strong'
            : 'good'
          : 'attention',
      detail:
        experienceGap >= 0
          ? 'Your listed experience meets or exceeds the role expectation.'
          : 'The role asks for more experience than your current profile lists.',
      maxPoints: 10,
    }),
    makeSignal({
      key: 'languages',
      label: 'Language overlap',
      status:
        requiredLanguages.length === 0
          ? 'good'
          : languageOverlap.length > 0
            ? 'strong'
            : normalizeList(profile.languages).length > 0
              ? 'attention'
              : 'missing',
      detail:
        requiredLanguages.length === 0
          ? 'The casting brief does not list required languages.'
          : languageOverlap.length > 0
            ? `Listed overlap: ${languageOverlap.join(', ')}.`
            : 'Add relevant languages if you can perform in the requested language.',
      maxPoints: 12,
    }),
    makeSignal({
      key: 'location',
      label: 'Location or work mode',
      status: locationFits ? 'strong' : hasText(profile.location) ? 'attention' : 'missing',
      detail:
        audition.workMode === 'REMOTE'
          ? 'This role is marked remote, so location is less restrictive.'
          : locationFits
            ? 'Your profile location aligns with the casting location.'
            : 'Check travel, availability, or update your location before applying.',
      maxPoints: 10,
    }),
    makeSignal({
      key: 'skills',
      label: 'Skills overlap',
      status:
        skillOverlap.length > 0
          ? 'strong'
          : profileSkillCount > 0
            ? 'attention'
            : 'missing',
      detail:
        skillOverlap.length > 0
          ? `Relevant profile skills found: ${skillOverlap.join(', ')}.`
          : profileSkillCount > 0
            ? 'Your skills are listed, but the brief does not clearly reference them.'
            : 'Add performance skills so recruiters can scan your strengths.',
      maxPoints: 12,
    }),
    makeSignal({
      key: 'portfolio',
      label: 'Portfolio readiness',
      status: hasPortfolioSignal(profile, mediaCount)
        ? 'strong'
        : hasAnyMediaSignal(profile, mediaCount)
          ? 'attention'
          : 'missing',
      detail: hasPortfolioSignal(profile, mediaCount)
        ? 'Portfolio media, a showreel link, or a website is available.'
        : hasAnyMediaSignal(profile, mediaCount)
          ? 'Add a work sample, showreel link, or portfolio website for stronger review.'
          : 'Add at least one work sample or external showreel link.',
      maxPoints: 10,
    }),
    makeSignal({
      key: 'selfTape',
      label: 'Self-tape readiness',
      status: !audition.selfTapeEnabled
        ? 'good'
        : hasSelfTapeSubmission
          ? 'strong'
          : audition.selfTapeRequired
            ? 'missing'
            : hasPortfolioSignal(profile, mediaCount)
              ? 'attention'
              : 'missing',
      detail: !audition.selfTapeEnabled
        ? 'No self-tape is requested for this role.'
        : hasSelfTapeSubmission
          ? 'A self-tape link is attached to this application.'
          : audition.selfTapeRequired
            ? 'This role requires an external self-tape link after applying.'
            : 'Optional self-tape link can strengthen the application after applying.',
      maxPoints: 8,
    }),
    makeSignal({
      key: 'trust',
      label: 'Trust status',
      status:
        profile.talentVerificationStatus === 'verified'
          ? 'strong'
          : profile.talentVerificationStatus === 'pending'
            ? 'good'
            : 'attention',
      detail:
        profile.talentVerificationStatus === 'verified'
          ? 'Talent verification is approved.'
          : profile.talentVerificationStatus === 'pending'
            ? 'Talent verification is under review.'
            : 'Verification is optional, but it adds trust context for recruiters.',
      maxPoints: 6,
    }),
  ];
};

export const getRoleFitChecklist = (
  profile: TalentProfile,
  audition: Audition,
  options: RoleFitOptions = {}
): RoleFitChecklistItem[] =>
  getRoleFitSignals(profile, audition, options).map((signal) => ({
    label: signal.label,
    complete: signal.status === 'strong' || signal.status === 'good',
    detail: signal.detail,
    actionHref:
      signal.key === 'selfTape'
        ? '/applications'
        : signal.key === 'portfolio'
          ? '/talent/profile#media-portfolio'
          : signal.key === 'trust'
            ? '/talent/profile#profile-completeness'
            : '/talent/profile',
  }));

export const getMissingFitItems = (
  profile: TalentProfile,
  audition: Audition,
  options: RoleFitOptions = {}
) =>
  getRoleFitChecklist(profile, audition, options).filter(
    (item) => !item.complete
  );

export const getRoleFitSummary = (
  profile: TalentProfile,
  audition: Audition,
  options: RoleFitOptions = {}
): RoleFitSummary => {
  const signals = getRoleFitSignals(profile, audition, options);
  const readiness = getRoleReadinessBand(signals);
  const checklist = getRoleFitChecklist(profile, audition, options);
  return {
    ...readiness,
    signals,
    checklist,
    missingItems: checklist.filter((item) => !item.complete),
  };
};

export const getTalentPassportSummary = (
  profile: TalentProfile,
  mediaCount = Number(profile.portfolioMediaCount ?? 0)
): TalentPassportSummary => {
  const completeness = getProfileCompleteness(profile);
  const portfolioReady = hasPortfolioSignal(profile, mediaCount);
  const skillsReady =
    normalizeList(profile.skills).length > 0 &&
    normalizeList(profile.languages).length > 0;
  const publicReady = profile.publicProfileEnabled || profile.isPublic;
  const verified = profile.talentVerificationStatus === 'verified';
  const hasShowreel = hasText(profile.youtubeUrl) || hasText(profile.websiteUrl);

  const items: RoleFitChecklistItem[] = [
    {
      label: 'Profile foundation',
      complete: completeness >= 70,
      detail:
        completeness >= 70
          ? `${completeness}% complete with enough core casting context.`
          : `${completeness}% complete. Finish core profile fields first.`,
      actionHref: '/talent/profile#profile-completeness',
    },
    {
      label: 'Skills and languages',
      complete: skillsReady,
      detail: skillsReady
        ? 'Skills and languages are ready for recruiter scanning.'
        : 'Add at least one performance skill and one language.',
      actionHref: '/talent/profile#skills-languages',
    },
    {
      label: 'Portfolio and showreel',
      complete: portfolioReady,
      detail: portfolioReady
        ? 'A work sample, showreel link, or portfolio website is available.'
        : 'Add portfolio media or an external showreel link.',
      actionHref: '/talent/profile#media-portfolio',
    },
    {
      label: 'Public profile',
      complete: Boolean(publicReady),
      detail: publicReady
        ? 'Public profile is ready for shareable preview.'
        : 'Enable the public profile when you are ready to share it.',
      actionHref: '/talent/profile#public-profile',
    },
    {
      label: 'Trust status',
      complete: verified,
      detail: verified
        ? 'Talent verification badge can appear on recruiter-facing views.'
        : 'Verification is optional and can be submitted when profile readiness is strong.',
      actionHref: '/talent/profile#profile-completeness',
    },
    {
      label: 'Self-tape link readiness',
      complete: hasShowreel || portfolioReady,
      detail:
        hasShowreel || portfolioReady
          ? 'External reel or portfolio signals can support self-tape requests.'
          : 'Prepare an external self-tape or showreel link for roles that request it.',
      actionHref: '/talent/profile#media-portfolio',
    },
  ];

  const score = Math.round(
    items.filter((item) => item.complete).length * (100 / items.length)
  );

  return {
    score,
    bandLabel:
      score >= 84
        ? 'Passport ready'
        : score >= 58
          ? 'Good foundation'
          : 'Needs profile detail',
    highlights: items
      .filter((item) => item.complete)
      .slice(0, 3)
      .map((item) => item.label),
    nextActions: items
      .filter((item) => !item.complete)
      .slice(0, 3)
      .map((item) => item.detail),
    items,
  };
};
