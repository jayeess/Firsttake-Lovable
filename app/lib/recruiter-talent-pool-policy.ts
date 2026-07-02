import type { RecruiterTalentPoolEntry, TalentPoolStatus } from './types';

export const TALENT_POOL_MAX_TAGS = 20;
export const TALENT_POOL_MAX_TAG_LENGTH = 32;
export const TALENT_POOL_MAX_NOTE_LENGTH = 1000;
const PLACEHOLDER_TAGS = new Set([
  'tag',
  'tags',
  'add tag',
  'add tags',
  'tag 1',
  'tag1',
  'example tag',
  'enter tags',
]);

export const TALENT_POOL_STATUSES: TalentPoolStatus[] = [
  'SAVED',
  'WATCHLIST',
  'FUTURE_FIT',
  'DO_NOT_CONTACT',
];

const unsafePatterns: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(payment|pay me|booking fee|registration fee|advance|commission)\b/i, label: 'payment request' },
  { pattern: /\b(bank|upi|account number|ifsc|swift|routing number)\b/i, label: 'bank detail' },
  { pattern: /\b(otp|password|passcode|pin code|login code)\b/i, label: 'credential request' },
  { pattern: /\b(aadhaar|passport|pan card|driving licence|driver license|government id)\b/i, label: 'private document' },
  { pattern: /\b(whatsapp|phone number|mobile number|dm me|telegram|outside platform)\b/i, label: 'off-platform contact pressure' },
  { pattern: /\b(caste|religion|muslim|hindu|christian|dalit|brahmin)\b/i, label: 'sensitive identity category' },
  { pattern: /\b(fat|ugly|skinny|dark skin|fair skin|body shame|body-shaming)\b/i, label: 'body-shaming language' },
  { pattern: /\b(stupid|idiot|useless|hate|abusive)\b/i, label: 'abusive language' },
];

export type TalentPoolSafetyFlag = {
  key: string;
  label: string;
  detail: string;
};

export type TalentPoolInput = {
  status: TalentPoolStatus;
  tags?: string[] | string;
  privateNote?: string;
};

const collapseWhitespace = (value: string) => value.trim().replace(/\s+/g, ' ');

export const getTalentPoolSafetyFlags = (
  noteOrTags: string | string[] | undefined
): TalentPoolSafetyFlag[] => {
  const value = Array.isArray(noteOrTags)
    ? noteOrTags.join(' ')
    : noteOrTags ?? '';

  return unsafePatterns
    .filter(({ pattern }) => pattern.test(value))
    .map(({ label }) => ({
      key: label.replace(/\s+/g, '_'),
      label,
      detail:
        'Keep private casting notes focused on role fit, availability context, and portfolio observations.',
    }));
};

export const validateTalentPoolTag = (tag: string): string | null => {
  const normalized = collapseWhitespace(tag);

  if (!normalized) {
    return 'Tags cannot be empty.';
  }

  if (normalized.length > TALENT_POOL_MAX_TAG_LENGTH) {
    return `Tags must be ${TALENT_POOL_MAX_TAG_LENGTH} characters or fewer.`;
  }

  const [flag] = getTalentPoolSafetyFlags(normalized);
  if (flag) {
    return `Remove ${flag.label} from Talent Pool tags.`;
  }

  return null;
};

export const normalizeTalentPoolTags = (tags: string[] | string | undefined) => {
  const rawTags = Array.isArray(tags)
    ? tags
    : (tags ?? '').split(',');
  const seen = new Set<string>();
  const normalizedTags: string[] = [];

  for (const rawTag of rawTags) {
    const tag = collapseWhitespace(rawTag);
    if (!tag) continue;
    if (PLACEHOLDER_TAGS.has(tag.toLocaleLowerCase())) continue;

    const error = validateTalentPoolTag(tag);
    if (error) {
      throw new Error(error);
    }

    const key = tag.toLocaleLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      normalizedTags.push(tag);
    }
  }

  if (normalizedTags.length > TALENT_POOL_MAX_TAGS) {
    throw new Error(`Use ${TALENT_POOL_MAX_TAGS} tags or fewer.`);
  }

  return normalizedTags;
};

export const validateTalentPoolNote = (note = ''): string | null => {
  const normalized = collapseWhitespace(note);

  if (normalized.length > TALENT_POOL_MAX_NOTE_LENGTH) {
    return `Private note must be ${TALENT_POOL_MAX_NOTE_LENGTH} characters or fewer.`;
  }

  const [flag] = getTalentPoolSafetyFlags(normalized);
  if (flag) {
    return `Remove ${flag.label} from the private note.`;
  }

  return null;
};

export const validateTalentPoolEntryInput = (input: TalentPoolInput) => {
  if (!TALENT_POOL_STATUSES.includes(input.status)) {
    throw new Error('Choose a valid Talent Pool status.');
  }

  const tags = normalizeTalentPoolTags(input.tags);
  const privateNote = collapseWhitespace(input.privateNote ?? '');
  const noteError = validateTalentPoolNote(privateNote);
  if (noteError) {
    throw new Error(noteError);
  }

  return {
    status: input.status,
    tags,
    privateNote,
  };
};

export const getTalentPoolSaveErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lowerMessage = message.toLocaleLowerCase();

  if (lowerMessage.includes('permission') || lowerMessage.includes('missing or insufficient')) {
    return 'We could not save this Talent Pool entry for this recruiter account. Refresh, sign in again, and try once more.';
  }

  if (lowerMessage.includes('offline') && lowerMessage.includes('contact')) {
    return 'Remove off-platform contact instructions before saving this Talent Pool note.';
  }

  return message || 'We could not save this entry. Please refresh and try again.';
};

export const getTalentPoolStatusLabel = (status: TalentPoolStatus) => {
  const labels: Record<TalentPoolStatus, string> = {
    SAVED: 'Saved',
    WATCHLIST: 'Watchlist',
    FUTURE_FIT: 'Future fit',
    DO_NOT_CONTACT: 'Do not contact',
  };

  return labels[status];
};

export const getTalentPoolStatusTone = (status: TalentPoolStatus) => {
  const tones: Record<TalentPoolStatus, 'neutral' | 'attention' | 'positive' | 'caution'> = {
    SAVED: 'neutral',
    WATCHLIST: 'attention',
    FUTURE_FIT: 'positive',
    DO_NOT_CONTACT: 'caution',
  };

  return tones[status];
};

export const getTalentPoolReviewSummary = (entry: RecruiterTalentPoolEntry) => {
  const status = getTalentPoolStatusLabel(entry.status);
  const tagCopy = entry.tags.length ? `Tags: ${entry.tags.join(', ')}.` : 'No tags added yet.';
  const source = entry.sourceAuditionTitleSnapshot
    ? `Saved from ${entry.sourceAuditionTitleSnapshot}.`
    : 'Saved from applicant review.';

  return `${entry.talentNameSnapshot} is marked ${status}. ${tagCopy} ${source} Use this as recruiter memory only; every casting decision remains human-led and role-specific.`;
};

export const getTalentPoolEmptyState = () => ({
  title: 'No saved Talent yet',
  description:
    'Open an applicant review and save promising Talent into your private pool for future casting conversations.',
  action: 'Review applicants',
});

export const getTalentPoolGuidance = () => ({
  title: 'Private casting memory',
  description:
    'Talent Pool notes are only for your recruiter workflow. Store role-fit observations, portfolio context, and callback ideas. Do not store payment requests, private documents, sensitive identity details, or off-platform pressure.',
});
