import type {
  AuditionStatus,
  AuditionType,
  ExperienceLevel,
  PaymentType,
  SelfTapeSubmissionType,
  TalentCategory,
  WorkMode,
} from './types';

export type CastingBriefQualityBand =
  | 'strong_brief'
  | 'good_brief'
  | 'needs_detail'
  | 'needs_review';

export type CastingBriefSignalStatus =
  | 'complete'
  | 'missing'
  | 'attention'
  | 'risk';

export type CastingBriefSignal = {
  key:
    | 'title'
    | 'description'
    | 'category'
    | 'location'
    | 'deadline'
    | 'compensation'
    | 'requirements'
    | 'selfTape'
    | 'paymentLanguage'
    | 'privateContact'
    | 'urgencyLanguage'
    | 'documentRequest'
    | 'recruiterTrust';
  label: string;
  status: CastingBriefSignalStatus;
  detail: string;
  points: number;
  maxPoints: number;
  kind: 'quality' | 'safety' | 'trust';
};

export type CastingBriefQualitySummary = {
  score: number;
  band: CastingBriefQualityBand;
  bandLabel: string;
  signals: CastingBriefSignal[];
  qualitySignals: CastingBriefSignal[];
  safetySignals: CastingBriefSignal[];
  missingItems: CastingBriefSignal[];
  publishChecklist: CastingBriefChecklistItem[];
};

export type CastingBriefChecklistItem = {
  label: string;
  complete: boolean;
  detail: string;
};

export type CastingBriefAdminRisk = {
  band: CastingBriefQualityBand;
  label: string;
  priority: 'low' | 'medium' | 'high';
  reasons: string[];
};

export type CastingBriefQualityInput = {
  title?: string;
  description?: string;
  category?: TalentCategory | '';
  experienceLevel?: ExperienceLevel | '';
  location?: string;
  duration?: string;
  requirements?: string;
  numberOfPositions?: number;
  payInfo?: string;
  languages?: string[];
  auditionType?: AuditionType | '';
  workMode?: WorkMode | '';
  paymentType?: PaymentType | '';
  deadline?: unknown;
  status?: AuditionStatus | string;
  moderationStatus?: string;
  recruiterVerified?: boolean;
  selfTapeEnabled?: boolean;
  selfTapeRequired?: boolean;
  selfTapeInstructions?: string;
  selfTapeSubmissionTypes?: SelfTapeSubmissionType[] | string[];
  selfTapeMaxDurationSeconds?: number | null;
};

const MIN_TITLE_LENGTH = 14;
const MIN_DESCRIPTION_LENGTH = 100;
const MIN_REQUIREMENTS_LENGTH = 45;
const MIN_SELF_TAPE_INSTRUCTIONS_LENGTH = 40;

const PAYMENT_REQUEST_PATTERNS = [
  /\bpay\s+(to|for)\s+(audition|apply|registration)\b/i,
  /\b(audition|application|registration|processing|security)\s+fee\b/i,
  /\brefundable\s+(deposit|fee|amount)\b/i,
  /\bsend\s+(money|payment|amount)\b/i,
  /\bupi\b|\bbank\s+transfer\b|\bwallet\b/i,
];

const PRIVATE_CONTACT_PATTERNS = [
  /\bwhats\s?app\b|\btelegram\b/i,
  /\bdm\s+(me|us)\b|\bdirect\s+message\b/i,
  /\bcontact\s+(me|us)\s+directly\b/i,
  /\boutside\s+(the\s+)?platform\b/i,
  /\bshare\s+(your\s+)?(phone|mobile|email)\b/i,
  /\bcall\s+(me|us)\b/i,
];

const URGENCY_PATTERNS = [
  /\bguaranteed\s+(selection|role|job|casting)\b/i,
  /\bselected\s+without\s+audition\b/i,
  /\bimmediate\s+selection\b/i,
  /\btoday\s+only\b|\blast\s+chance\b/i,
];

const DOCUMENT_REQUEST_PATTERNS = [
  /\bpassport\b|\baadhaar\b|\baadhar\b|\bpan\s+card\b/i,
  /\bbank\s+(statement|details|account)\b/i,
  /\bcredit\s+card\b|\botp\b|\bpassword\b/i,
  /\bid\s+proof\s+(before|to)\s+(audition|apply)\b/i,
];

const hasText = (value?: string) => Boolean(value?.trim());

const normalize = (value?: string) => value?.trim() ?? '';

const combinedText = (brief: CastingBriefQualityInput) =>
  [
    brief.title,
    brief.description,
    brief.requirements,
    brief.payInfo,
    brief.selfTapeInstructions,
  ]
    .filter(Boolean)
    .join(' ');

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof value.seconds === 'number'
  ) {
    return new Date(value.seconds * 1000);
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    '_seconds' in value &&
    typeof value._seconds === 'number'
  ) {
    return new Date(value._seconds * 1000);
  }
  return null;
};

const containsAny = (text: string, patterns: RegExp[]) =>
  patterns.some((pattern) => pattern.test(text));

const makeSignal = (
  signal: Omit<CastingBriefSignal, 'points'> & { points?: number }
): CastingBriefSignal => ({
  ...signal,
  points:
    typeof signal.points === 'number'
      ? Math.max(0, Math.min(signal.maxPoints, signal.points))
      : signal.status === 'complete'
        ? signal.maxPoints
        : signal.status === 'attention'
          ? Math.round(signal.maxPoints * 0.45)
          : 0,
});

export const getCastingBriefSafetySignals = (
  brief: CastingBriefQualityInput
): CastingBriefSignal[] => {
  const text = combinedText(brief);
  const paymentRisk = containsAny(text, PAYMENT_REQUEST_PATTERNS);
  const privateContactRisk = containsAny(text, PRIVATE_CONTACT_PATTERNS);
  const urgencyRisk = containsAny(text, URGENCY_PATTERNS);
  const documentRisk = containsAny(text, DOCUMENT_REQUEST_PATTERNS);

  return [
    makeSignal({
      key: 'paymentLanguage',
      label: 'Payment request language',
      status: paymentRisk ? 'risk' : 'complete',
      detail: paymentRisk
        ? 'Potential payment request language found. Auditions should never ask Talent to pay.'
        : 'No payment request language found.',
      maxPoints: 0,
      kind: 'safety',
    }),
    makeSignal({
      key: 'privateContact',
      label: 'Private contact pressure',
      status: privateContactRisk ? 'risk' : 'complete',
      detail: privateContactRisk
        ? 'Potential off-platform contact pressure found. Keep audition communication on Nata Connect.'
        : 'No off-platform contact pressure found.',
      maxPoints: 0,
      kind: 'safety',
    }),
    makeSignal({
      key: 'urgencyLanguage',
      label: 'Pressure or guarantee language',
      status: urgencyRisk ? 'attention' : 'complete',
      detail: urgencyRisk
        ? 'Potential pressure or guarantee language found. Casting outcomes should not be promised.'
        : 'No pressure or guarantee language found.',
      maxPoints: 0,
      kind: 'safety',
    }),
    makeSignal({
      key: 'documentRequest',
      label: 'Sensitive document requests',
      status: documentRisk ? 'risk' : 'complete',
      detail: documentRisk
        ? 'Potential sensitive document request found. Only request role-relevant materials through safe channels.'
        : 'No sensitive document request language found.',
      maxPoints: 0,
      kind: 'safety',
    }),
  ];
};

export const getCastingBriefQualityBand = (
  score: number,
  safetySignals: CastingBriefSignal[] = []
): { band: CastingBriefQualityBand; bandLabel: string } => {
  const hasRisk = safetySignals.some((signal) => signal.status === 'risk');
  const hasAttentionSafety = safetySignals.some(
    (signal) => signal.status === 'attention'
  );

  if (hasRisk || hasAttentionSafety || score < 45) {
    return { band: 'needs_review', bandLabel: 'Needs review' };
  }
  if (score >= 85) {
    return { band: 'strong_brief', bandLabel: 'Strong brief' };
  }
  if (score >= 65) {
    return { band: 'good_brief', bandLabel: 'Good brief' };
  }
  return { band: 'needs_detail', bandLabel: 'Needs detail' };
};

export const getCastingBriefQuality = (
  brief: CastingBriefQualityInput,
  now = new Date()
): CastingBriefQualitySummary => {
  const title = normalize(brief.title);
  const description = normalize(brief.description);
  const requirements = normalize(brief.requirements);
  const payInfo = normalize(brief.payInfo);
  const deadline = toDate(brief.deadline);
  const deadlineValid = Boolean(deadline && deadline.getTime() > now.getTime());
  const compensationClear =
    Boolean(brief.paymentType && brief.paymentType !== 'UNSPECIFIED') ||
    hasText(payInfo);
  const selfTapeInstructions = normalize(brief.selfTapeInstructions);
  const needsSelfTapeInstructions =
    brief.selfTapeEnabled === true && brief.selfTapeRequired === true;

  const qualitySignals = [
    makeSignal({
      key: 'title',
      label: 'Specific title',
      status:
        title.length >= MIN_TITLE_LENGTH && /\s/.test(title)
          ? 'complete'
          : title
            ? 'attention'
            : 'missing',
      detail:
        title.length >= MIN_TITLE_LENGTH && /\s/.test(title)
          ? 'Title gives Talent a clear role signal.'
          : title
            ? 'Make the title more specific with role and project context.'
            : 'Add a specific audition title.',
      maxPoints: 10,
      kind: 'quality',
    }),
    makeSignal({
      key: 'description',
      label: 'Detailed description',
      status:
        description.length >= MIN_DESCRIPTION_LENGTH
          ? 'complete'
          : description
            ? 'attention'
            : 'missing',
      points: description.length >= MIN_DESCRIPTION_LENGTH ? 18 : 0,
      detail:
        description.length >= MIN_DESCRIPTION_LENGTH
          ? 'Description includes enough context for Talent to assess fit.'
          : 'Add project tone, role context, schedule context, and what Talent will perform.',
      maxPoints: 18,
      kind: 'quality',
    }),
    makeSignal({
      key: 'category',
      label: 'Role category',
      status: brief.category ? 'complete' : 'missing',
      detail: brief.category
        ? 'Role category is listed.'
        : 'Choose the Talent category for this role.',
      maxPoints: 8,
      kind: 'quality',
    }),
    makeSignal({
      key: 'location',
      label: 'Location or work mode',
      status:
        hasText(brief.location) || brief.workMode
          ? 'complete'
          : 'missing',
      detail:
        hasText(brief.location) || brief.workMode
          ? 'Location or work mode is clear.'
          : 'Add location or mark the role remote/hybrid.',
      maxPoints: 10,
      kind: 'quality',
    }),
    makeSignal({
      key: 'deadline',
      label: 'Valid deadline',
      status: deadlineValid ? 'complete' : deadline ? 'risk' : 'missing',
      detail: deadlineValid
        ? 'Deadline is in the future.'
        : deadline
          ? 'Deadline has passed. Close or update this brief.'
          : 'Add an application deadline.',
      maxPoints: 12,
      kind: 'quality',
    }),
    makeSignal({
      key: 'compensation',
      label: 'Compensation clarity',
      status: compensationClear ? 'complete' : 'attention',
      detail: compensationClear
        ? 'Compensation type or pay information is listed.'
        : 'Mark paid, honorarium, unpaid, or explain compensation honestly.',
      maxPoints: 12,
      kind: 'quality',
    }),
    makeSignal({
      key: 'requirements',
      label: 'Clear requirements',
      status:
        requirements.length >= MIN_REQUIREMENTS_LENGTH
          ? 'complete'
          : requirements
            ? 'attention'
            : 'missing',
      detail:
        requirements.length >= MIN_REQUIREMENTS_LENGTH
          ? 'Requirements are specific enough for Talent to self-assess.'
          : 'Add role-relevant requirements such as age range, skills, language, availability, or reel needs.',
      maxPoints: 16,
      kind: 'quality',
    }),
    makeSignal({
      key: 'selfTape',
      label: 'Self-tape instructions',
      status: !needsSelfTapeInstructions
        ? 'complete'
        : selfTapeInstructions.length >= MIN_SELF_TAPE_INSTRUCTIONS_LENGTH
          ? 'complete'
          : 'missing',
      detail: !brief.selfTapeEnabled
        ? 'Self-tape is not requested.'
        : !needsSelfTapeInstructions
          ? 'Self-tape is optional or not required.'
          : selfTapeInstructions.length >= MIN_SELF_TAPE_INSTRUCTIONS_LENGTH
            ? 'Required self-tape instructions are clear.'
            : 'Required self-tape needs a prompt, duration guidance, and external link instructions.',
      maxPoints: 8,
      kind: 'quality',
    }),
    makeSignal({
      key: 'recruiterTrust',
      label: 'Recruiter trust status',
      status: brief.recruiterVerified ? 'complete' : 'attention',
      detail: brief.recruiterVerified
        ? 'Recruiter verification is approved.'
        : 'Recruiter verification is not visible on this brief.',
      maxPoints: 6,
      kind: 'trust',
    }),
  ];
  const safetySignals = getCastingBriefSafetySignals(brief);
  const max = qualitySignals.reduce((total, signal) => total + signal.maxPoints, 0);
  const points = qualitySignals.reduce((total, signal) => total + signal.points, 0);
  const score = max > 0 ? Math.round((points / max) * 100) : 0;
  let band = getCastingBriefQualityBand(score, [
    ...safetySignals,
    ...qualitySignals.filter((signal) => signal.status === 'risk'),
  ]);
  const hasCoreDetailGap = qualitySignals.some(
    (signal) =>
      ['description', 'requirements', 'compensation'].includes(signal.key) &&
      signal.status === 'attention'
  );
  if (band.band === 'strong_brief' && hasCoreDetailGap) {
    band = { band: 'good_brief', bandLabel: 'Good brief' };
  }
  const signals = [...qualitySignals, ...safetySignals];
  const missingItems = signals.filter(
    (signal) => signal.status === 'missing' || signal.status === 'risk'
  );

  return {
    score,
    ...band,
    signals,
    qualitySignals,
    safetySignals: safetySignals.filter(
      (signal) => signal.status === 'risk' || signal.status === 'attention'
    ),
    missingItems,
    publishChecklist: qualitySignals.map((signal) => ({
      label: signal.label,
      complete: signal.status === 'complete',
      detail: signal.detail,
    })),
  };
};

export const getCastingBriefMissingItems = (
  brief: CastingBriefQualityInput,
  now = new Date()
) => getCastingBriefQuality(brief, now).missingItems;

export const getCastingBriefPublishChecklist = (
  brief: CastingBriefQualityInput,
  now = new Date()
): CastingBriefChecklistItem[] => {
  const summary = getCastingBriefQuality(brief, now);
  return summary.qualitySignals.map((signal) => ({
    label: signal.label,
    complete: signal.status === 'complete',
    detail: signal.detail,
  }));
};

export const getCastingBriefAdminRisk = (
  brief: CastingBriefQualityInput,
  now = new Date()
): CastingBriefAdminRisk => {
  const summary = getCastingBriefQuality(brief, now);
  const safetyReasons = summary.safetySignals.map((signal) => signal.detail);
  const criticalMissing = summary.missingItems
    .filter((signal) =>
      ['deadline', 'description', 'requirements', 'selfTape'].includes(signal.key)
    )
    .map((signal) => signal.detail);
  const unverifiedActive =
    brief.status === 'ACTIVE' && brief.recruiterVerified !== true;
  const reasons = [
    ...safetyReasons,
    ...criticalMissing,
    ...(unverifiedActive
      ? ['Active brief does not show recruiter verification.']
      : []),
  ].slice(0, 5);
  const priority =
    summary.band === 'needs_review' && reasons.length > 0
      ? 'high'
      : summary.band === 'needs_detail'
        ? 'medium'
        : 'low';

  return {
    band: summary.band,
    label: summary.bandLabel,
    priority,
    reasons,
  };
};
