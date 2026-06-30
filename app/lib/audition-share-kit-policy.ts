import type { Audition, RecruiterProfile } from './types';

export type ShareReadinessBand =
  | 'share_ready'
  | 'good_opportunity_page'
  | 'needs_brief_detail'
  | 'needs_trust_review';

export type AuditionShareChecklistItem = {
  key: string;
  label: string;
  complete: boolean;
  detail: string;
};

export type AuditionShareKit = {
  band: ShareReadinessBand;
  bandLabel: string;
  headline: string;
  summary: string;
  shareCopyTemplates: string[];
  checklist: AuditionShareChecklistItem[];
  missingItems: AuditionShareChecklistItem[];
  publicSafetyNotes: string[];
  disclaimer: string;
};

export type AuditionShareReadiness = {
  band: ShareReadinessBand;
  bandLabel: string;
  missingCount: number;
  headline: string;
};

export type PublicOpportunitySummary = {
  title: string;
  sourceName: string;
  category: string;
  location: string;
  deadline: string;
  compensation: string;
  selfTapeNote: string;
  applyPath: string;
};

// ── Label tables (inlined to keep this module dependency-free) ────────────────

const CATEGORY_LABELS: Record<string, string> = {
  ACTOR: 'Actor',
  MODEL: 'Model',
  DANCER: 'Dancer',
  VOICE_ARTIST: 'Voice artist',
  ANCHOR: 'Anchor',
};

const PAYMENT_LABELS: Record<string, string> = {
  PAID: 'Paid',
  HONORARIUM: 'Honorarium',
  UNPAID: 'Unpaid',
};

const BAND_LABELS: Record<ShareReadinessBand, string> = {
  share_ready: 'Share-ready',
  good_opportunity_page: 'Good opportunity page',
  needs_brief_detail: 'Needs brief detail',
  needs_trust_review: 'Needs trust review',
};

const BAND_HEADLINES: Record<ShareReadinessBand, string> = {
  share_ready: 'This brief is ready to share as a public casting opportunity.',
  good_opportunity_page: 'This brief can be shared with minor details to add.',
  needs_brief_detail: 'Add more brief detail before sharing this casting opportunity.',
  needs_trust_review: 'Resolve safety or source cues before sharing this brief.',
};

const BAND_SUMMARIES: Record<ShareReadinessBand, string> = {
  share_ready:
    'Clear title, source, location, deadline, and compensation support a trustworthy opportunity page.',
  good_opportunity_page:
    'Main role details are present. Filling in the remaining items will strengthen the opportunity page.',
  needs_brief_detail:
    'Add missing brief details so Talent can understand the role, location, compensation, and expectations before applying.',
  needs_trust_review:
    'Resolve any safety or source transparency cues before using this brief as a shareable casting opportunity.',
};

// ── Date helpers ──────────────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const toDate = (value?: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object' && value !== null) {
    if (
      'toDate' in value &&
      typeof (value as { toDate: unknown }).toDate === 'function'
    ) {
      const d = (value as { toDate: () => Date }).toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }
    if (
      'seconds' in value &&
      typeof (value as { seconds: unknown }).seconds === 'number'
    ) {
      return new Date((value as { seconds: number }).seconds * 1000);
    }
  }
  return null;
};

const safeFormatDate = (value?: unknown): string => {
  const date = toDate(value);
  if (!date) return 'deadline not specified';
  try {
    return dateFmt.format(date);
  } catch {
    return 'deadline not specified';
  }
};

// ── Safety pattern matching ───────────────────────────────────────────────────

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

// ── Field helpers ─────────────────────────────────────────────────────────────

const hasText = (value?: string | null): boolean => Boolean(value?.trim());
const norm = (value?: string | null): string => value?.trim() ?? '';

const combinedText = (audition: Partial<Audition>): string =>
  [
    audition.title,
    audition.description,
    audition.requirements,
    audition.payInfo,
    audition.selfTapeInstructions,
  ]
    .filter(Boolean)
    .join(' ');

const matchesAny = (text: string, patterns: RegExp[]): boolean =>
  patterns.some((p) => p.test(text));

const MIN_TITLE = 14;
const MIN_DESCRIPTION = 100;
const MIN_REQUIREMENTS = 45;
const MIN_SELF_TAPE_INSTRUCTIONS = 40;

// ── Checklist builder ─────────────────────────────────────────────────────────

function buildChecklist(
  audition: Partial<Audition>,
  recruiterProfile?: Partial<RecruiterProfile> | null
): AuditionShareChecklistItem[] {
  const title = norm(audition.title);
  const description = norm(audition.description);
  const requirements = norm(audition.requirements);
  const selfTapeInstructions = norm(audition.selfTapeInstructions);
  const deadlineDate = toDate(audition.deadline);
  const deadlineValid = Boolean(deadlineDate && deadlineDate.getTime() > Date.now());
  const compensationClear =
    Boolean(audition.paymentType && audition.paymentType !== 'UNSPECIFIED') ||
    hasText(audition.payInfo);
  const needsSelfTapeInstructions =
    audition.selfTapeEnabled === true && audition.selfTapeRequired === true;
  const sourceName = norm(recruiterProfile?.companyName) || norm(audition.recruiterName);
  const text = combinedText(audition);
  const hasPaymentRisk = matchesAny(text, PAYMENT_REQUEST_PATTERNS);
  const hasPrivateContactRisk = matchesAny(text, PRIVATE_CONTACT_PATTERNS);

  return [
    {
      key: 'title',
      label: 'Specific title',
      complete: title.length >= MIN_TITLE && /\s/.test(title),
      detail:
        title.length >= MIN_TITLE && /\s/.test(title)
          ? 'Title clearly identifies the role.'
          : title
            ? 'Make the title more specific with role and project context.'
            : 'Add a role title that describes the part and production context.',
    },
    {
      key: 'description',
      label: 'Detailed description',
      complete: description.length >= MIN_DESCRIPTION,
      detail:
        description.length >= MIN_DESCRIPTION
          ? 'Description gives Talent enough context to assess fit.'
          : 'Add project context, tone, schedule, and what Talent will perform.',
    },
    {
      key: 'category',
      label: 'Role category',
      complete: Boolean(audition.category),
      detail: audition.category
        ? `${CATEGORY_LABELS[audition.category] ?? audition.category} category is listed.`
        : 'Choose the Talent category for this role.',
    },
    {
      key: 'location',
      label: 'Location or work mode',
      complete: hasText(audition.location) || Boolean(audition.workMode),
      detail:
        hasText(audition.location) || audition.workMode
          ? 'Location or work mode is clear.'
          : 'Add location or mark the role remote or hybrid.',
    },
    {
      key: 'deadline',
      label: 'Valid deadline',
      complete: deadlineValid,
      detail: deadlineValid
        ? 'Deadline is in the future.'
        : deadlineDate
          ? 'Deadline has passed. Update or close this brief before sharing.'
          : 'Add an application deadline.',
    },
    {
      key: 'compensation',
      label: 'Compensation clarity',
      complete: compensationClear,
      detail: compensationClear
        ? 'Compensation type or pay information is listed.'
        : 'Mark paid, honorarium, unpaid, or explain compensation so Talent can decide.',
    },
    {
      key: 'requirements',
      label: 'Clear requirements',
      complete: requirements.length >= MIN_REQUIREMENTS,
      detail:
        requirements.length >= MIN_REQUIREMENTS
          ? 'Requirements are specific enough for Talent to self-assess.'
          : 'Add role-relevant requirements: skills, age range, language, availability, and reel guidance.',
    },
    {
      key: 'self_tape',
      label: 'Self-tape instructions',
      complete:
        !needsSelfTapeInstructions ||
        selfTapeInstructions.length >= MIN_SELF_TAPE_INSTRUCTIONS,
      detail: !audition.selfTapeEnabled
        ? 'No self-tape requested.'
        : !needsSelfTapeInstructions
          ? 'Self-tape is optional for this role.'
          : selfTapeInstructions.length >= MIN_SELF_TAPE_INSTRUCTIONS
            ? 'Required self-tape instructions are clear.'
            : 'Add self-tape prompt, format guidance, and instructions for submitting an external link.',
    },
    {
      key: 'source',
      label: 'Visible casting source',
      complete: hasText(sourceName),
      detail: hasText(sourceName)
        ? `"${sourceName}" is shown as the casting source.`
        : 'Add a company, studio, agency, or casting-team name so Talent knows who is posting.',
    },
    {
      key: 'payment_safety',
      label: 'No payment request language',
      complete: !hasPaymentRisk,
      detail: hasPaymentRisk
        ? 'Payment request language found. Remove before sharing — auditions are free to apply to on Nata Connect.'
        : 'No payment request language found.',
    },
    {
      key: 'communication_safety',
      label: 'No off-platform contact pressure',
      complete: !hasPrivateContactRisk,
      detail: hasPrivateContactRisk
        ? 'Off-platform contact pressure found. Remove before sharing — keep communication on Nata Connect.'
        : 'No off-platform contact pressure found.',
    },
  ];
}

// ── Band logic ────────────────────────────────────────────────────────────────

function deriveShareBand(checklist: AuditionShareChecklistItem[]): ShareReadinessBand {
  const complete = (key: string) =>
    checklist.find((item) => item.key === key)?.complete ?? false;

  if (!complete('payment_safety') || !complete('communication_safety') || !complete('deadline')) {
    return 'needs_trust_review';
  }

  const coreIncomplete = ['title', 'description', 'category', 'location', 'requirements'].some(
    (key) => !complete(key)
  );
  if (coreIncomplete) return 'needs_brief_detail';

  if (checklist.every((item) => item.complete)) return 'share_ready';

  return 'good_opportunity_page';
}

// ── Copy template builder ─────────────────────────────────────────────────────

function buildCopyTemplates(
  audition: Partial<Audition>,
  recruiterProfile?: Partial<RecruiterProfile> | null,
  band?: ShareReadinessBand
): string[] {
  if (band === 'needs_trust_review') {
    return [
      'Update the brief to resolve safety or source cues before sharing this casting opportunity.',
    ];
  }

  const title = norm(audition.title) || 'Casting opportunity';
  const category = CATEGORY_LABELS[audition.category ?? ''] ?? 'Talent';
  const location = norm(audition.location) || 'location not specified';
  const deadline = safeFormatDate(audition.deadline);
  const source =
    norm(recruiterProfile?.companyName) || norm(audition.recruiterName) || 'Casting team';
  const path = audition.id ? `/auditions/${audition.id}` : '/auditions';

  return [
    `${title} — ${category} casting opportunity in ${location}. Apply on Nata Connect before ${deadline}.`,
    `${source} is looking for ${category.toLowerCase()} talent for "${title}" in ${location}. Deadline: ${deadline}. Apply: ${path}`,
    `Casting call: ${title} | ${category} | ${location} | Deadline: ${deadline}`,
  ];
}

// ── Public exports ────────────────────────────────────────────────────────────

export const getAuditionShareKit = (
  audition: Partial<Audition>,
  recruiterProfile?: Partial<RecruiterProfile> | null
): AuditionShareKit => {
  const checklist = buildChecklist(audition, recruiterProfile);
  const missingItems = checklist.filter((item) => !item.complete);
  const band = deriveShareBand(checklist);

  return {
    band,
    bandLabel: BAND_LABELS[band],
    headline: BAND_HEADLINES[band],
    summary: BAND_SUMMARIES[band],
    shareCopyTemplates: buildCopyTemplates(audition, recruiterProfile, band),
    checklist,
    missingItems,
    publicSafetyNotes: getPublicOpportunitySafetyNotes(audition),
    disclaimer:
      'This opportunity page is platform context, not a guarantee of casting or selection. Casting decisions are made by the recruiting team.',
  };
};

export const getAuditionShareReadiness = (
  audition: Partial<Audition>,
  recruiterProfile?: Partial<RecruiterProfile> | null
): AuditionShareReadiness => {
  const checklist = buildChecklist(audition, recruiterProfile);
  const missingCount = checklist.filter((item) => !item.complete).length;
  const band = deriveShareBand(checklist);
  return {
    band,
    bandLabel: BAND_LABELS[band],
    missingCount,
    headline: BAND_HEADLINES[band],
  };
};

export const getAuditionShareChecklist = (
  audition: Partial<Audition>,
  recruiterProfile?: Partial<RecruiterProfile> | null
): AuditionShareChecklistItem[] => buildChecklist(audition, recruiterProfile);

export const getAuditionShareMissingItems = (
  audition: Partial<Audition>,
  recruiterProfile?: Partial<RecruiterProfile> | null
): AuditionShareChecklistItem[] =>
  buildChecklist(audition, recruiterProfile).filter((item) => !item.complete);

export const getAuditionShareCopyTemplates = (
  audition: Partial<Audition>,
  recruiterProfile?: Partial<RecruiterProfile> | null
): string[] => {
  const checklist = buildChecklist(audition, recruiterProfile);
  const band = deriveShareBand(checklist);
  return buildCopyTemplates(audition, recruiterProfile, band);
};

export const getPublicOpportunitySummary = (
  audition: Partial<Audition>,
  recruiterProfile?: Partial<RecruiterProfile> | null
): PublicOpportunitySummary => {
  const sourceName =
    norm(recruiterProfile?.companyName) || norm(audition.recruiterName) || 'Recruiter';
  const category = CATEGORY_LABELS[audition.category ?? ''] ?? '';

  let compensation = 'Not specified';
  if (audition.paymentType && audition.paymentType !== 'UNSPECIFIED') {
    compensation = PAYMENT_LABELS[audition.paymentType] ?? 'Compensation listed';
  } else if (hasText(audition.payInfo)) {
    compensation = 'Compensation listed';
  }

  let selfTapeNote = '';
  if (audition.selfTapeEnabled) {
    selfTapeNote = audition.selfTapeRequired
      ? 'Self-tape link is required for this role. Submit your external link from My Applications after applying.'
      : 'An optional self-tape link can be added from My Applications after applying.';
  }

  return {
    title: norm(audition.title) || 'Casting opportunity',
    sourceName,
    category,
    location: norm(audition.location),
    deadline: safeFormatDate(audition.deadline),
    compensation,
    selfTapeNote,
    applyPath: audition.id ? `/auditions/${audition.id}` : '/auditions',
  };
};

export const getPublicOpportunitySafetyNotes = (
  audition?: Partial<Audition>
): string[] => {
  const notes: string[] = [
    'Casting calls on Nata Connect are free to apply to.',
    'Keep all casting communication on-platform.',
    'Never share financial details or sensitive personal documents as part of audition consideration.',
    'This opportunity page is platform context, not a guarantee of casting or selection.',
  ];

  if (audition?.selfTapeEnabled) {
    notes.splice(2, 0, 'Self-tape links must be external links submitted through My Applications only.');
  }

  return notes;
};
