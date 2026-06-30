import type {
  Application,
  ApplicationStatus,
  Audition,
  TalentMedia,
  TalentProfile,
} from './types';

export type TalentRadarBand =
  | 'profile_ready'
  | 'worth_reviewing'
  | 'prepare_before_applying'
  | 'needs_safety_review'
  | 'already_applied';

export type TalentActionTone = 'priority' | 'growth' | 'safety' | 'neutral';

export interface TalentOpportunityRadarOptions {
  savedAuditionIds?: string[];
  unreadMessageCount?: number;
  unreadNotificationCount?: number;
  publicMediaCount?: number;
}

export interface TalentOpportunitySignal {
  label: string;
  detail: string;
  tone: TalentActionTone;
}

export interface TalentOpportunityItem {
  auditionId: string;
  title: string;
  band: TalentRadarBand;
  bandLabel: string;
  headline: string;
  detail: string;
  actionLabel: string;
  actionHref: string;
  score: number;
  saved: boolean;
  applied: boolean;
  signals: TalentOpportunitySignal[];
}

export interface TalentOpportunityBucket {
  key:
    | 'profile_ready'
    | 'worth_reviewing'
    | 'prepare'
    | 'safety_review'
    | 'saved'
    | 'applied';
  label: string;
  description: string;
  items: TalentOpportunityItem[];
}

export interface TalentNextAction {
  title: string;
  detail: string;
  actionLabel: string;
  actionHref: string;
  tone: TalentActionTone;
}

export interface TalentCommandCenterSummary {
  headline: string;
  detail: string;
  nextActions: TalentNextAction[];
  metrics: Array<{
    label: string;
    value: number;
    detail: string;
    tone: TalentActionTone;
  }>;
}

export interface TalentProfileGrowthPlan {
  score: number;
  bandLabel: string;
  headline: string;
  actions: TalentNextAction[];
  missingFields: string[];
}

export interface TalentApplicationFocus {
  activeCount: number;
  callbackCount: number;
  selectedCount: number;
  selfTapeMissingCount: number;
  unreadMessageCount: number;
  headline: string;
  nextAction: TalentNextAction;
}

export interface TalentSafetyFocus {
  needsReviewCount: number;
  unclearSourceCount: number;
  selfTapeRequiredCount: number;
  headline: string;
  reminders: string[];
}

export interface TalentOpportunityRadar {
  headline: string;
  detail: string;
  opportunities: TalentOpportunityItem[];
  buckets: TalentOpportunityBucket[];
  nextActions: TalentNextAction[];
  safetyFocus: TalentSafetyFocus;
}

const activeApplicationStatuses: ApplicationStatus[] = [
  'APPLIED',
  'VIEWED',
  'UNDER_REVIEW',
  'MAYBE',
  'SHORTLISTED',
  'CALLBACK',
  'FINAL_ROUND',
  'SELECTED',
];

const callbackStatuses: ApplicationStatus[] = [
  'CALLBACK',
  'FINAL_ROUND',
];

const paymentRiskPatterns = [
  /\bpay\s+(to|for)\s+(audition|apply|registration)\b/i,
  /\b(audition|application|registration|processing|security)\s+fee\b/i,
  /\bdeposit\b|\bupi\b|\bbank\s+transfer\b|\bwallet\b/i,
];

const privateContactPatterns = [
  /\bwhats\s?app\b|\btelegram\b/i,
  /\bdm\s+(me|us)\b|\bdirect\s+message\b/i,
  /\boutside\s+(the\s+)?platform\b/i,
  /\bshare\s+(your\s+)?(phone|mobile|email)\b/i,
];

const documentRiskPatterns = [
  /\bpassport\b|\baadhaar\b|\baadhar\b|\bpan\s+card\b/i,
  /\bbank\s+(statement|details|account)\b/i,
  /\bcredit\s+card\b|\botp\b|\bpassword\b/i,
];

const guaranteePatterns = [
  /\bguaranteed\s+(selection|role|job|casting)\b/i,
  /\bselected\s+without\s+audition\b/i,
  /\bimmediate\s+selection\b/i,
];

export function getTalentOpportunityRadar(
  profile: TalentProfile | null,
  auditions: Audition[] = [],
  applications: Application[] = [],
  options: TalentOpportunityRadarOptions = {}
): TalentOpportunityRadar {
  const opportunities = getOpportunityItems(
    profile,
    auditions,
    applications,
    options
  );
  const buckets = getTalentOpportunityBuckets(
    profile,
    auditions,
    applications,
    options
  );
  const nextActions = getTalentNextBestActions(
    profile,
    auditions,
    applications,
    options
  );
  const safetyFocus = getTalentSafetyFocus(auditions);
  const reviewable = opportunities.filter((item) => !item.applied);

  if (reviewable.length === 0) {
    const empty = getTalentOpportunityRadarEmptyState(profile);
    return {
      headline: empty.title,
      detail: empty.message,
      opportunities,
      buckets,
      nextActions,
      safetyFocus,
    };
  }

  const profileReadyCount = opportunities.filter(
    (item) => item.band === 'profile_ready'
  ).length;

  return {
    headline:
      profileReadyCount > 0
        ? `${profileReadyCount} profile-ready ${pluralize('opportunity', profileReadyCount)} to review.`
        : 'Review opportunities with profile and safety context.',
    detail:
      'Use the radar as guidance: compare role fit, brief clarity, source trust, self-tape needs, and your profile readiness before applying.',
    opportunities,
    buckets,
    nextActions,
    safetyFocus,
  };
}

export function getTalentCommandCenterSummary(
  profile: TalentProfile | null,
  auditions: Audition[] = [],
  applications: Application[] = [],
  options: TalentOpportunityRadarOptions = {}
): TalentCommandCenterSummary {
  const growthPlan = getTalentProfileGrowthPlan(
    profile,
    undefined,
    options.publicMediaCount
  );
  const appFocus = getTalentApplicationFocus(applications, {
    unreadMessageCount: options.unreadMessageCount,
  });
  const radar = getTalentOpportunityRadar(profile, auditions, applications, options);
  const profileReadyCount = radar.opportunities.filter(
    (item) => item.band === 'profile_ready'
  ).length;
  const savedCount = options.savedAuditionIds?.length ?? 0;
  const nextActions = getTalentNextBestActions(
    profile,
    auditions,
    applications,
    options
  );

  return {
    headline: 'Career Command Center',
    detail:
      'A rule-based workspace for profile readiness, safer opportunity discovery, applications, messages, and public sharing.',
    nextActions,
    metrics: [
      {
        label: 'Profile score',
        value: growthPlan.score,
        detail: growthPlan.bandLabel,
        tone: growthPlan.score >= 80 ? 'growth' : 'priority',
      },
      {
        label: 'Profile-ready',
        value: profileReadyCount,
        detail: 'Auditions aligned with current profile signals',
        tone: profileReadyCount > 0 ? 'growth' : 'neutral',
      },
      {
        label: 'Active applications',
        value: appFocus.activeCount,
        detail: 'Submitted or in recruiter review',
        tone: appFocus.activeCount > 0 ? 'priority' : 'neutral',
      },
      {
        label: 'Saved roles',
        value: savedCount,
        detail: 'Private shortlist for later review',
        tone: savedCount > 0 ? 'priority' : 'neutral',
      },
    ],
  };
}

export function getTalentNextBestActions(
  profile: TalentProfile | null,
  auditions: Audition[] = [],
  applications: Application[] = [],
  options: TalentOpportunityRadarOptions = {}
): TalentNextAction[] {
  const actions: TalentNextAction[] = [];
  const growthPlan = getTalentProfileGrowthPlan(
    profile,
    undefined,
    options.publicMediaCount
  );
  const appFocus = getTalentApplicationFocus(applications, {
    unreadMessageCount: options.unreadMessageCount,
  });
  const radarItems = getOpportunityItems(profile, auditions, applications, options);
  const selfTapeReady = radarItems.find((item) =>
    item.signals.some(
      (signal) =>
        signal.label === 'Self-tape preparation' && signal.tone === 'priority'
    )
  );

  if (appFocus.unreadMessageCount > 0) actions.push(appFocus.nextAction);
  if (appFocus.selfTapeMissingCount > 0) actions.push(appFocus.nextAction);
  if (growthPlan.score < 80) actions.push(growthPlan.actions[0]);
  if (selfTapeReady) {
    actions.push({
      title: 'Prepare an external self-tape link',
      detail:
        'At least one role asks for self-tape material. Keep it as an external link and follow the brief instructions.',
      actionLabel: 'Review auditions',
      actionHref: '/auditions',
      tone: 'priority',
    });
  }

  const profileReady = radarItems.find(
    (item) => item.band === 'profile_ready' && !item.applied
  );
  if (profileReady) {
    actions.push({
      title: 'Review a profile-ready role',
      detail:
        'One role has enough profile, source, and brief context to review carefully before applying.',
      actionLabel: 'Open auditions',
      actionHref: '/auditions',
      tone: 'growth',
    });
  }

  if ((options.unreadNotificationCount ?? 0) > 0) {
    actions.push({
      title: 'Check casting updates',
      detail: `${options.unreadNotificationCount} notification${options.unreadNotificationCount === 1 ? '' : 's'} need attention.`,
      actionLabel: 'Open notifications',
      actionHref: '/notifications',
      tone: 'priority',
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: 'Browse safer opportunities',
      detail:
        'Look for clear briefs, transparent recruiter sources, role fit signals, and platform-safe communication.',
      actionLabel: 'Find auditions',
      actionHref: '/auditions',
      tone: 'neutral',
    });
  }

  return uniqueActions(actions).slice(0, 4);
}

export function getTalentOpportunityBuckets(
  profile: TalentProfile | null,
  auditions: Audition[] = [],
  applications: Application[] = [],
  options: TalentOpportunityRadarOptions = {}
): TalentOpportunityBucket[] {
  const items = getOpportunityItems(profile, auditions, applications, options);
  const bucketDefs: Array<Omit<TalentOpportunityBucket, 'items'>> = [
    {
      key: 'profile_ready',
      label: 'Profile-ready',
      description: 'Worth reviewing with your current Talent Passport.',
    },
    {
      key: 'worth_reviewing',
      label: 'Worth reviewing',
      description: 'Clear enough to read, save, or compare before applying.',
    },
    {
      key: 'prepare',
      label: 'Prepare first',
      description: 'Improve profile details or self-tape preparation first.',
    },
    {
      key: 'safety_review',
      label: 'Needs safety review',
      description: 'Read carefully and keep communication on-platform.',
    },
    {
      key: 'saved',
      label: 'Saved',
      description: 'Bookmarked roles to revisit before applying.',
    },
    {
      key: 'applied',
      label: 'Applied',
      description: 'Already submitted and tracked in Applications.',
    },
  ];

  return bucketDefs.map((bucket) => ({
    ...bucket,
    items: items.filter((item) => {
      if (bucket.key === 'saved') return item.saved && !item.applied;
      if (bucket.key === 'applied') return item.applied;
      if (bucket.key === 'prepare') {
        return item.band === 'prepare_before_applying' && !item.applied;
      }
      if (bucket.key === 'safety_review') {
        return item.band === 'needs_safety_review' && !item.applied;
      }
      return item.band === bucket.key && !item.applied;
    }),
  }));
}

export function getTalentProfileGrowthPlan(
  profile: TalentProfile | null,
  publicMedia: TalentMedia[] = [],
  explicitPublicMediaCount?: number
): TalentProfileGrowthPlan {
  if (!profile) {
    return {
      score: 0,
      bandLabel: 'Create profile',
      headline: 'Create your Talent Passport before applying.',
      missingFields: ['profile'],
      actions: [
        {
          title: 'Build your Talent profile',
          detail:
            'Add name, category, location, bio, skills, languages, and links so recruiters understand your casting fit.',
          actionLabel: 'Create profile',
          actionHref: '/talent/profile',
          tone: 'priority',
        },
      ],
    };
  }

  const score = getProfileScore(profile);
  const publicMediaCount =
    typeof explicitPublicMediaCount === 'number'
      ? explicitPublicMediaCount
      : publicMedia.filter(
          (item) =>
            item.visibility === 'public' &&
            item.moderationStatus === 'active' &&
            item.type !== 'document'
        ).length;
  const missingFields = getMissingProfileFields(profile, publicMediaCount);
  const actions: TalentNextAction[] = [];

  if (score < 80 || missingFields.length > 0) {
    actions.push({
      title: 'Complete profile signals',
      detail:
        missingFields.length > 0
          ? `Add ${missingFields.slice(0, 3).join(', ')} to improve recruiter context.`
          : 'Refresh your core details so recruiters can understand you faster.',
      actionLabel: 'Improve profile',
      actionHref: '/talent/profile',
      tone: 'growth',
    });
  }

  if (!profile.publicProfileEnabled && !profile.isPublic) {
    actions.push({
      title: 'Prepare Public Casting Passport',
      detail:
        'Enable your public profile when you are ready to share a clean casting page externally.',
      actionLabel: 'Open profile',
      actionHref: '/talent/profile',
      tone: 'growth',
    });
  }

  if (publicMediaCount === 0 && !hasText(profile.youtubeUrl) && !hasText(profile.websiteUrl)) {
    actions.push({
      title: 'Add portfolio context',
      detail:
        'Add public media or external work links so recruiters can review your range before messaging.',
      actionLabel: 'Manage media',
      actionHref: '/talent/profile',
      tone: 'growth',
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: 'Keep your passport fresh',
      detail:
        'Update skills, languages, media, and recent work as your credits grow.',
      actionLabel: 'Review profile',
      actionHref: '/talent/profile',
      tone: 'neutral',
    });
  }

  return {
    score,
    bandLabel:
      score >= 90
        ? 'Career-ready profile'
        : score >= 70
          ? 'Strong profile base'
          : score >= 45
            ? 'Needs profile detail'
            : 'Profile setup needed',
    headline:
      score >= 80
        ? 'Your Talent Passport has strong recruiter-facing context.'
        : 'Your Talent Passport needs more context before stronger applications.',
    missingFields,
    actions,
  };
}

export function getTalentApplicationFocus(
  applications: Application[] = [],
  options: { unreadMessageCount?: number } = {}
): TalentApplicationFocus {
  const activeCount = applications.filter((application) =>
    activeApplicationStatuses.includes(getApplicationStatus(application))
  ).length;
  const callbackCount = applications.filter((application) =>
    callbackStatuses.includes(getApplicationStatus(application))
  ).length;
  const selectedCount = applications.filter(
    (application) => getApplicationStatus(application) === 'SELECTED'
  ).length;
  const selfTapeMissingCount = applications.filter(
    (application) =>
      application.audition?.selfTapeEnabled &&
      application.audition.selfTapeRequired &&
      !application.selfTapeSubmission?.url &&
      getApplicationStatus(application) !== 'WITHDRAWN'
  ).length;
  const unreadMessageCount = options.unreadMessageCount ?? 0;

  let nextAction: TalentNextAction = {
    title: 'Track application stages',
    detail:
      'Application statuses help you understand recruiter review progress. They are not casting guarantees.',
    actionLabel: 'Open applications',
    actionHref: '/applications',
    tone: 'neutral',
  };

  if (unreadMessageCount > 0) {
    nextAction = {
      title: 'Reply to recruiter messages',
      detail: `${unreadMessageCount} unread conversation${unreadMessageCount === 1 ? '' : 's'} may need a timely, professional response.`,
      actionLabel: 'Open messages',
      actionHref: '/messages',
      tone: 'priority',
    };
  } else if (selfTapeMissingCount > 0) {
    nextAction = {
      title: 'Submit requested self-tape links',
      detail:
        'One or more active applications need an external self-tape link before deeper review.',
      actionLabel: 'Open applications',
      actionHref: '/applications',
      tone: 'priority',
    };
  } else if (callbackCount > 0) {
    nextAction = {
      title: 'Prepare for callback or final review',
      detail:
        'Check the brief, messages, and Talent-visible notes before responding.',
      actionLabel: 'Open applications',
      actionHref: '/applications',
      tone: 'growth',
    };
  }

  return {
    activeCount,
    callbackCount,
    selectedCount,
    selfTapeMissingCount,
    unreadMessageCount,
    headline:
      applications.length > 0
        ? 'Application focus is active.'
        : 'No applications yet.',
    nextAction,
  };
}

export function getTalentSafetyFocus(
  auditions: Audition[] = []
): TalentSafetyFocus {
  const reviewAuditions = auditions.filter((audition) =>
    getSafetySignals(audition).some((signal) => signal.tone === 'safety')
  );
  const unclearSourceCount = auditions.filter(
    (audition) => !audition.recruiterVerified && !hasText(audition.recruiterName)
  ).length;
  const selfTapeRequiredCount = auditions.filter(
    (audition) => audition.selfTapeEnabled && audition.selfTapeRequired
  ).length;

  return {
    needsReviewCount: reviewAuditions.length,
    unclearSourceCount,
    selfTapeRequiredCount,
    headline:
      reviewAuditions.length > 0
        ? 'Some briefs need extra safety review.'
        : 'Safety checks look calm across visible briefs.',
    reminders: [
      'Legitimate auditions on Nata Connect are free to apply to.',
      'Keep communication on-platform and tied to the audition.',
      'Use external self-tape links only when a brief asks for them.',
      'Do not share financial details or unrelated private documents to audition.',
    ],
  };
}

export function getTalentOpportunityRadarEmptyState(profile?: TalentProfile | null) {
  if (!profile) {
    return {
      title: 'Create your Talent Passport to unlock opportunity guidance.',
      message:
        'Once your profile exists, the radar can explain profile readiness, safer opportunity cues, saved roles, and application focus.',
      actionLabel: 'Create profile',
      actionHref: '/talent/profile',
    };
  }

  return {
    title: 'No fresh opportunities need attention right now.',
    message:
      'Keep your profile fresh, save roles worth revisiting, and check applications or messages for next steps.',
    actionLabel: 'Browse auditions',
    actionHref: '/auditions',
  };
}

function getOpportunityItems(
  profile: TalentProfile | null,
  auditions: Audition[],
  applications: Application[],
  options: TalentOpportunityRadarOptions
): TalentOpportunityItem[] {
  const appliedIds = new Set(
    applications
      .filter((application) =>
        activeApplicationStatuses.includes(getApplicationStatus(application))
      )
      .map((application) => application.auditionId)
  );
  const savedIds = new Set(options.savedAuditionIds ?? []);

  return auditions.map((audition) => {
    const applied = appliedIds.has(audition.id);
    const saved = savedIds.has(audition.id);
    const signals = getOpportunitySignals(profile, audition, applied);
    const safetyIssues = signals.filter((signal) => signal.tone === 'safety').length;
    const growthIssues = signals.filter((signal) => signal.tone === 'growth').length;
    const prioritySignals = signals.filter((signal) => signal.tone === 'priority').length;
    const score = Math.max(
      0,
      Math.min(
        100,
        68 +
          signals.filter((signal) => signal.tone === 'neutral').length * 4 -
          safetyIssues * 24 -
          growthIssues * 10 -
          prioritySignals * 4 +
          (saved ? 4 : 0)
      )
    );
    const band = getOpportunityBand({
      applied,
      safetyIssues,
      growthIssues,
      score,
    });

    return {
      auditionId: audition.id,
      title: audition.title,
      band,
      bandLabel: getBandLabel(band),
      headline: getOpportunityHeadline(band, audition),
      detail: getOpportunityDetail(band),
      actionLabel: applied ? 'Track application' : 'View casting brief',
      actionHref: applied ? '/applications' : `/auditions/${audition.id}`,
      score,
      saved,
      applied,
      signals,
    };
  });
}

function getOpportunitySignals(
  profile: TalentProfile | null,
  audition: Audition,
  applied: boolean
): TalentOpportunitySignal[] {
  const signals: TalentOpportunitySignal[] = [];
  const profileScore = profile ? getProfileScore(profile) : 0;
  const safetySignals = getSafetySignals(audition);

  if (applied) {
    signals.push({
      label: 'Application record',
      detail: 'Already applied; track progress in Applications.',
      tone: 'neutral',
    });
  }

  signals.push({
    label: 'Profile readiness',
    detail:
      profileScore >= 80
        ? `${profileScore}% profile gives recruiters strong context.`
        : `${profileScore}% profile. Add missing details before stronger applications.`,
    tone: profileScore >= 80 ? 'neutral' : 'growth',
  });

  if (profile) {
    signals.push({
      label: 'Role category',
      detail:
        profile.category === audition.category
          ? 'Primary category matches this role.'
          : 'Primary category differs from this role.',
      tone: profile.category === audition.category ? 'neutral' : 'growth',
    });

    if (audition.languages?.length) {
      const overlap = getLanguageOverlap(profile.languages, audition.languages);
      signals.push({
        label: 'Language context',
        detail:
          overlap.length > 0
            ? `${overlap.join(', ')} language context is available.`
            : 'Add relevant languages if you are comfortable with this role.',
        tone: overlap.length > 0 ? 'neutral' : 'growth',
      });
    }
  }

  if (audition.selfTapeEnabled) {
    signals.push({
      label: 'Self-tape preparation',
      detail: audition.selfTapeRequired
        ? 'This role asks for an external self-tape link.'
        : 'Self-tape link is optional for this role.',
      tone: audition.selfTapeRequired ? 'priority' : 'neutral',
    });
  }

  signals.push({
    label: 'Brief clarity',
    detail: getBriefClarityDetail(audition),
    tone: isBriefClear(audition) ? 'neutral' : 'growth',
  });

  signals.push({
    label: 'Source transparency',
    detail: audition.recruiterVerified
      ? 'Recruiter source has platform verification context.'
      : hasText(audition.recruiterName)
        ? 'Visible source name is available; review the brief details carefully.'
        : 'Source details are light. Review before applying.',
    tone: audition.recruiterVerified ? 'neutral' : 'growth',
  });

  return [...signals, ...safetySignals];
}

function getSafetySignals(audition: Audition): TalentOpportunitySignal[] {
  const text = [
    audition.title,
    audition.description,
    audition.requirements,
    audition.payInfo,
    audition.selfTapeInstructions,
  ]
    .filter(Boolean)
    .join(' ');
  const signals: TalentOpportunitySignal[] = [];

  if (matchesAny(text, paymentRiskPatterns)) {
    signals.push({
      label: 'Payment safety',
      detail: 'Review carefully: auditions should never ask Talent to pay.',
      tone: 'safety',
    });
  }
  if (matchesAny(text, privateContactPatterns)) {
    signals.push({
      label: 'Communication safety',
      detail: 'Keep audition communication on Nata Connect.',
      tone: 'safety',
    });
  }
  if (matchesAny(text, documentRiskPatterns)) {
    signals.push({
      label: 'Document safety',
      detail: 'Do not share unrelated private documents to audition.',
      tone: 'safety',
    });
  }
  if (matchesAny(text, guaranteePatterns)) {
    signals.push({
      label: 'Outcome language',
      detail: 'Be careful with posts that promise selection or work.',
      tone: 'safety',
    });
  }

  return signals;
}

function getOpportunityBand({
  applied,
  safetyIssues,
  growthIssues,
  score,
}: {
  applied: boolean;
  safetyIssues: number;
  growthIssues: number;
  score: number;
}): TalentRadarBand {
  if (applied) return 'already_applied';
  if (safetyIssues > 0) return 'needs_safety_review';
  if (score >= 78 && growthIssues === 0) return 'profile_ready';
  if (score >= 62) return 'worth_reviewing';
  return 'prepare_before_applying';
}

function getBandLabel(band: TalentRadarBand) {
  if (band === 'profile_ready') return 'Profile-ready';
  if (band === 'worth_reviewing') return 'Worth reviewing';
  if (band === 'prepare_before_applying') return 'Prepare first';
  if (band === 'needs_safety_review') return 'Needs safety review';
  return 'Already applied';
}

function getOpportunityHeadline(band: TalentRadarBand, audition: Audition) {
  if (band === 'profile_ready') return 'Your profile has strong context for this brief.';
  if (band === 'worth_reviewing') return 'Worth reviewing before you decide to apply.';
  if (band === 'prepare_before_applying') return 'Improve profile or prep before applying.';
  if (band === 'needs_safety_review') return 'Read this brief carefully before taking action.';
  return `${audition.title} is already in your application tracker.`;
}

function getOpportunityDetail(band: TalentRadarBand) {
  if (band === 'profile_ready') {
    return 'Review the full brief, source context, and self-tape instructions before applying.';
  }
  if (band === 'worth_reviewing') {
    return 'Compare the role details with your profile and save it if you need more time.';
  }
  if (band === 'prepare_before_applying') {
    return 'Add missing profile context or prepare external self-tape material first.';
  }
  if (band === 'needs_safety_review') {
    return 'Avoid payment requests, private contact pressure, and unrelated document sharing.';
  }
  return 'Use Applications and Messages for next steps.';
}

function getProfileScore(profile: TalentProfile) {
  if (typeof profile.profileCompletenessScore === 'number') {
    return clamp(profile.profileCompletenessScore);
  }

  const checks = [
    hasText(profile.firstName) && hasText(profile.lastName),
    hasText(profile.category),
    hasText(profile.experienceLevel),
    hasText(profile.location),
    hasText(profile.height),
    profile.bio.trim().length >= 80,
    (profile.skills?.length ?? 0) > 0,
    (profile.languages?.length ?? 0) > 0,
    hasText(profile.profilePhotoUrl),
    hasText(profile.youtubeUrl) || hasText(profile.websiteUrl),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function getMissingProfileFields(profile: TalentProfile, publicMediaCount: number) {
  const missing: string[] = [];
  if (!hasText(profile.firstName) || !hasText(profile.lastName)) missing.push('name');
  if (!hasText(profile.location)) missing.push('location');
  if (!hasText(profile.height)) missing.push('height');
  if (profile.bio.trim().length < 80) missing.push('80+ character bio');
  if ((profile.skills?.length ?? 0) === 0) missing.push('skills');
  if ((profile.languages?.length ?? 0) === 0) missing.push('languages');
  if (!hasText(profile.profilePhotoUrl)) missing.push('profile photo');
  if (
    publicMediaCount === 0 &&
    !hasText(profile.youtubeUrl) &&
    !hasText(profile.websiteUrl)
  ) {
    missing.push('portfolio media or links');
  }
  return missing;
}

function getBriefClarityDetail(audition: Audition) {
  if (isBriefClear(audition)) {
    return 'Role, requirements, deadline, and location are clear enough to review.';
  }
  return 'Brief would benefit from more role, requirements, deadline, or compensation detail.';
}

function isBriefClear(audition: Audition) {
  return (
    audition.title.trim().length >= 14 &&
    audition.description.trim().length >= 80 &&
    audition.requirements.trim().length >= 35 &&
    hasText(audition.location) &&
    Boolean(audition.deadline) &&
    (hasText(audition.payInfo) || audition.paymentType !== 'UNSPECIFIED')
  );
}

function getApplicationStatus(application: Application): ApplicationStatus {
  return (
    application.recruiterStatus ??
    application.status ??
    'APPLIED'
  );
}

function getLanguageOverlap(profileLanguages: string[] = [], auditionLanguages: string[] = []) {
  const profile = profileLanguages.map(normalize).filter(Boolean);
  const required = auditionLanguages.map(normalize).filter(Boolean);
  return profileLanguages.filter((_, index) =>
    required.some(
      (item) =>
        profile[index] === item ||
        profile[index]?.includes(item) ||
        item.includes(profile[index] ?? '')
    )
  );
}

function uniqueActions(actions: TalentNextAction[]) {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = `${action.title}-${action.actionHref}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pluralize(word: string, count: number) {
  return count === 1 ? word : `${word}s`;
}
