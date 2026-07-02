import type { Audition, ScreeningQuestion } from './types';
import type { CastingBriefQualityBand } from './casting-brief-quality-policy';

export type AuditionLifecycleStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'CLOSING_SOON'
  | 'CLOSED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REMOVED';

export type AuditionLifecycleBadge = {
  label: string;
  tone: 'success' | 'attention' | 'neutral' | 'danger';
};

export type DuplicateAuditionDraft = {
  recruiterName?: string;
  title: string;
  description: string;
  category: Audition['category'];
  experienceLevel: Audition['experienceLevel'];
  location: string;
  duration: string;
  requirements: string;
  numberOfPositions: number;
  payInfo?: string;
  languages?: string[];
  auditionType?: Audition['auditionType'];
  workMode?: Audition['workMode'];
  paymentType?: Audition['paymentType'];
  selfTapeEnabled?: boolean;
  selfTapeRequired?: boolean;
  selfTapeInstructions?: string;
  selfTapeSubmissionTypes?: Audition['selfTapeSubmissionTypes'];
  selfTapeMaxDurationSeconds?: number | null;
  screeningQuestions?: ScreeningQuestion[];
  deadline: Date;
  status: 'DRAFT';
};

export const toAuditionDate = (value: unknown): Date | null => {
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
  return null;
};

export const getAuditionLifecycleStatus = (
  audition: Pick<Audition, 'status' | 'deadline' | 'moderationStatus'>,
  now = new Date()
): AuditionLifecycleStatus => {
  if (audition.moderationStatus === 'REMOVED') return 'REMOVED';
  if (audition.status === 'DRAFT') return 'DRAFT';
  if (audition.status === 'CANCELLED') return 'CANCELLED';
  if (audition.status === 'CLOSED') return 'CLOSED';

  const deadline = toAuditionDate(audition.deadline);
  if (!deadline || deadline.getTime() <= now.getTime()) return 'EXPIRED';

  const threeDaysFromNow = now.getTime() + 3 * 86_400_000;
  if (deadline.getTime() <= threeDaysFromNow) return 'CLOSING_SOON';

  return 'ACTIVE';
};

export const canTalentApplyToAudition = (
  audition: Pick<Audition, 'status' | 'deadline' | 'moderationStatus'>,
  now = new Date()
) => {
  const status = getAuditionLifecycleStatus(audition, now);
  return status === 'ACTIVE' || status === 'CLOSING_SOON';
};

export const canRecruiterEditAudition = (
  audition: Pick<Audition, 'recruiterId' | 'status' | 'deadline' | 'moderationStatus'>,
  recruiterId: string
) =>
  audition.recruiterId === recruiterId &&
  audition.moderationStatus !== 'REMOVED' &&
  audition.status !== 'CANCELLED';

export const canRecruiterCloseAudition = (
  audition: Pick<Audition, 'status' | 'deadline' | 'moderationStatus'>,
  now = new Date()
) => {
  const status = getAuditionLifecycleStatus(audition, now);
  return status === 'ACTIVE' || status === 'CLOSING_SOON' || status === 'DRAFT';
};

export const canRecruiterReopenAudition = (
  audition: Pick<Audition, 'status' | 'deadline' | 'moderationStatus'>,
  now = new Date()
) =>
  audition.moderationStatus !== 'REMOVED' &&
  audition.status === 'CLOSED' &&
  Boolean(toAuditionDate(audition.deadline)?.getTime() ?? 0) &&
  (toAuditionDate(audition.deadline)?.getTime() ?? 0) > now.getTime();

export const canRecruiterPublishAudition = (
  audition: Pick<
    Audition,
    | 'title'
    | 'description'
    | 'category'
    | 'experienceLevel'
    | 'location'
    | 'duration'
    | 'requirements'
    | 'numberOfPositions'
    | 'payInfo'
    | 'deadline'
    | 'status'
    | 'moderationStatus'
    | 'recruiterVerified'
    | 'selfTapeEnabled'
    | 'selfTapeRequired'
    | 'selfTapeInstructions'
      | 'selfTapeSubmissionTypes'
      | 'selfTapeMaxDurationSeconds'
  >,
  now = new Date(),
  briefQualityBand?: CastingBriefQualityBand
) => {
  if (audition.status !== 'DRAFT') return false;
  if (audition.moderationStatus === 'REMOVED') return false;
  if (!audition.recruiterVerified) return false;
  const deadline = toAuditionDate(audition.deadline);
  if (!deadline || deadline.getTime() <= now.getTime()) return false;
  return briefQualityBand !== 'needs_review';
};

export const getAuditionLifecycleActions = (
  audition: Audition,
  recruiterId: string,
  now = new Date()
) => ({
  canEdit: canRecruiterEditAudition(audition, recruiterId),
  canPublish: canRecruiterPublishAudition(audition, now),
  canClose: canRecruiterCloseAudition(audition, now),
  canReopen: canRecruiterReopenAudition(audition, now),
  canDuplicate:
    audition.recruiterId === recruiterId && audition.moderationStatus !== 'REMOVED',
});

export const getAuditionLifecycleBadge = (
  audition: Pick<Audition, 'status' | 'deadline' | 'moderationStatus'>,
  now = new Date()
): AuditionLifecycleBadge => {
  const status = getAuditionLifecycleStatus(audition, now);
  const badges: Record<AuditionLifecycleStatus, AuditionLifecycleBadge> = {
    DRAFT: { label: 'Draft', tone: 'attention' },
    ACTIVE: { label: 'Open', tone: 'success' },
    CLOSING_SOON: { label: 'Closing soon', tone: 'attention' },
    CLOSED: { label: 'Closed', tone: 'neutral' },
    EXPIRED: { label: 'Expired', tone: 'neutral' },
    CANCELLED: { label: 'Cancelled', tone: 'danger' },
    REMOVED: { label: 'Removed', tone: 'danger' },
  };
  return badges[status];
};

export const getAuditionLifecycleGuidance = (
  audition: Pick<Audition, 'status' | 'deadline' | 'moderationStatus'>,
  now = new Date()
) => {
  const status = getAuditionLifecycleStatus(audition, now);
  if (status === 'DRAFT') return 'Draft briefs are private until published.';
  if (status === 'ACTIVE') return 'Open for applications.';
  if (status === 'CLOSING_SOON') return 'Open for applications, but the deadline is close.';
  if (status === 'CLOSED') return 'Closed by the recruiter. Existing applicants remain in review.';
  if (status === 'EXPIRED') return 'The application deadline has passed.';
  if (status === 'CANCELLED') return 'This casting call was cancelled.';
  return 'This casting call is not visible to Talent.';
};

const cloneScreeningQuestions = (questions?: ScreeningQuestion[]) =>
  (questions ?? []).map((question, index) => ({
    ...question,
    id: `${question.id || 'question'}-copy-${index + 1}`,
    order: index,
    options: question.options ? [...question.options] : undefined,
  }));

export const getDuplicateAuditionDraft = (
  audition: Audition,
  now = new Date()
): DuplicateAuditionDraft => {
  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + 14);

  return {
    recruiterName: audition.recruiterName,
    title: `Copy of ${audition.title}`.slice(0, 140),
    description: audition.description,
    category: audition.category,
    experienceLevel: audition.experienceLevel,
    location: audition.location,
    duration: audition.duration,
    requirements: audition.requirements,
    numberOfPositions: audition.numberOfPositions,
    payInfo: audition.payInfo ?? '',
    languages: audition.languages ? [...audition.languages] : [],
    auditionType: audition.auditionType,
    workMode: audition.workMode,
    paymentType: audition.paymentType,
    selfTapeEnabled: audition.selfTapeEnabled ?? false,
    selfTapeRequired: audition.selfTapeRequired ?? false,
    selfTapeInstructions: audition.selfTapeInstructions ?? '',
    selfTapeSubmissionTypes: audition.selfTapeSubmissionTypes
      ? [...audition.selfTapeSubmissionTypes]
      : ['link'],
    selfTapeMaxDurationSeconds: audition.selfTapeMaxDurationSeconds ?? null,
    screeningQuestions: cloneScreeningQuestions(audition.screeningQuestions),
    deadline,
    status: 'DRAFT',
  };
};
