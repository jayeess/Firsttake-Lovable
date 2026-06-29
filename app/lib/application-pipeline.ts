import type {
  Application,
  ApplicationStatus,
  AuditionApplicant,
  TalentMedia,
} from './types';

export const APPLICATION_PIPELINE_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'VIEWED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'CALLBACK',
  'FINAL_ROUND',
  'MAYBE',
  'REJECTED',
  'SELECTED',
  'WITHDRAWN',
];

export const RECRUITER_CONTROLLED_STATUSES: ApplicationStatus[] = [
  'VIEWED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'CALLBACK',
  'FINAL_ROUND',
  'MAYBE',
  'REJECTED',
  'SELECTED',
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Submitted',
  VIEWED: 'Viewed',
  UNDER_REVIEW: 'Under review',
  SHORTLISTED: 'Shortlisted',
  CALLBACK: 'Callback',
  FINAL_ROUND: 'Final round',
  MAYBE: 'Maybe',
  REJECTED: 'Rejected',
  SELECTED: 'Selected',
  WITHDRAWN: 'Withdrawn',
};

export type ApplicantSort =
  | 'NEWEST'
  | 'OLDEST'
  | 'COMPLETENESS'
  | 'RATING'
  | 'UPDATED'
  | 'VERIFIED'
  | 'MEDIA';

export type ApplicantFilters = {
  status: ApplicationStatus | 'ALL';
  verifiedOnly: boolean;
  hasMedia: boolean;
  hasShowreel: boolean;
  completenessAbove70: boolean;
  minimumRating: number;
  search: string;
  tag: string;
  category: string;
  location: string;
  language: string;
};

export const TALENT_VISIBLE_NOTE_MAX_LENGTH = 400;

const CONTACT_DETAIL_PATTERN =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\+?\d[\s().-]*){8,}/i;

export const validateTalentVisibleNote = (note: string): string | null => {
  const trimmed = note.trim();
  if (trimmed.length > TALENT_VISIBLE_NOTE_MAX_LENGTH) {
    return `Note must be ${TALENT_VISIBLE_NOTE_MAX_LENGTH} characters or fewer.`;
  }
  if (CONTACT_DETAIL_PATTERN.test(trimmed)) {
    return 'Remove contact details before saving. Keep all communication on-platform.';
  }
  return null;
};

export type RecruiterReviewInput = {
  status?: ApplicationStatus;
  recruiterNote?: string;
  recruiterRating?: number | null;
  internalTags?: string[];
  talentNextStepNote?: string;
};

export const getApplicationStatus = (
  application: Pick<Application, 'status' | 'recruiterStatus'>
): ApplicationStatus => application.recruiterStatus ?? application.status ?? 'APPLIED';

export const canRecruiterTransition = (
  currentStatus: ApplicationStatus,
  nextStatus: ApplicationStatus
) =>
  currentStatus !== 'WITHDRAWN' &&
  RECRUITER_CONTROLLED_STATUSES.includes(nextStatus);

export const validateRecruiterReview = (
  currentStatus: ApplicationStatus,
  input: RecruiterReviewInput
): string | null => {
  if (
    input.status &&
    !canRecruiterTransition(currentStatus, input.status)
  ) {
    return currentStatus === 'WITHDRAWN'
      ? 'Withdrawn applications cannot be moved through the recruiter pipeline.'
      : 'That application status transition is not allowed.';
  }
  if (
    input.recruiterRating !== undefined &&
    input.recruiterRating !== null &&
    (!Number.isInteger(input.recruiterRating) ||
      input.recruiterRating < 1 ||
      input.recruiterRating > 5)
  ) {
    return 'Recruiter rating must be a whole number from 1 to 5.';
  }
  if (input.recruiterNote !== undefined && input.recruiterNote.length > 2000) {
    return 'Recruiter note must be 2,000 characters or fewer.';
  }
  if (
    input.internalTags &&
    (input.internalTags.length > 10 ||
      input.internalTags.some((tag) => tag.length > 30))
  ) {
    return 'Use no more than 10 tags with 30 characters per tag.';
  }
  if (input.talentNextStepNote !== undefined) {
    const noteError = validateTalentVisibleNote(input.talentNextStepNote);
    if (noteError) return noteError;
  }
  return null;
};

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

const hasShowreel = (media: TalentMedia[]) =>
  media.some(
    (item) => item.type === 'showreel_link' || item.type === 'video_link'
  );

export const filterApplicants = (
  applicants: AuditionApplicant[],
  filters: ApplicantFilters
) => {
  const search = filters.search.trim().toLowerCase();
  const tag = filters.tag.trim().toLowerCase();
  const category = filters.category.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();
  const language = filters.language.trim().toLowerCase();
  return applicants.filter(({ application, talent, media }) => {
    const status = getApplicationStatus(application);
    const searchable = talent
      ? [
          talent.firstName,
          talent.lastName,
          talent.category,
          talent.location,
          ...(talent.skills ?? []),
        ]
          .join(' ')
          .toLowerCase()
      : '';
    return (
      (filters.status === 'ALL' || status === filters.status) &&
      (!filters.verifiedOnly ||
        talent?.talentVerificationStatus === 'verified') &&
      (!filters.hasMedia || media.length > 0) &&
      (!filters.hasShowreel || hasShowreel(media)) &&
      (!filters.completenessAbove70 ||
        (talent?.profileCompletenessScore ?? 0) >= 70) &&
      (!filters.minimumRating ||
        (application.recruiterRating ?? 0) >= filters.minimumRating) &&
      (!tag ||
        (application.internalTags ?? []).some((item) =>
          item.toLowerCase().includes(tag)
        )) &&
      (!category || talent?.category.toLowerCase() === category) &&
      (!location || talent?.location.toLowerCase().includes(location)) &&
      (!language ||
        (talent?.languages ?? []).some((item) =>
          item.toLowerCase().includes(language)
        )) &&
      (!search || searchable.includes(search))
    );
  });
};

export const sortApplicants = (
  applicants: AuditionApplicant[],
  sort: ApplicantSort
) =>
  [...applicants].sort((left, right) => {
    if (sort === 'OLDEST') {
      return toMillis(left.application.createdAt) - toMillis(right.application.createdAt);
    }
    if (sort === 'COMPLETENESS') {
      return (
        (right.talent?.profileCompletenessScore ?? 0) -
        (left.talent?.profileCompletenessScore ?? 0)
      );
    }
    if (sort === 'RATING') {
      return (
        (right.application.recruiterRating ?? 0) -
        (left.application.recruiterRating ?? 0)
      );
    }
    if (sort === 'UPDATED') {
      return (
        toMillis(
          right.application.lastRecruiterActionAt ??
            right.application.statusUpdatedAt ??
            right.application.updatedAt
        ) -
        toMillis(
          left.application.lastRecruiterActionAt ??
            left.application.statusUpdatedAt ??
            left.application.updatedAt
        )
      );
    }
    if (sort === 'VERIFIED') {
      return (
        Number(right.talent?.talentVerificationStatus === 'verified') -
        Number(left.talent?.talentVerificationStatus === 'verified')
      );
    }
    if (sort === 'MEDIA') {
      return right.media.length - left.media.length;
    }
    return toMillis(right.application.createdAt) - toMillis(left.application.createdAt);
  });

export const getPipelineCounts = (applicants: AuditionApplicant[]) =>
  APPLICATION_PIPELINE_STATUSES.reduce<Record<ApplicationStatus, number>>(
    (counts, status) => {
      counts[status] = applicants.filter(
        ({ application }) => getApplicationStatus(application) === status
      ).length;
      return counts;
    },
    {
      APPLIED: 0,
      VIEWED: 0,
      UNDER_REVIEW: 0,
      SHORTLISTED: 0,
      CALLBACK: 0,
      FINAL_ROUND: 0,
      MAYBE: 0,
      REJECTED: 0,
      SELECTED: 0,
      WITHDRAWN: 0,
    }
  );

export const getStatusTimestampField = (
  status: ApplicationStatus
): 'reviewedAt' | 'shortlistedAt' | 'rejectedAt' | 'selectedAt' | null => {
  if (status === 'VIEWED' || status === 'UNDER_REVIEW') return 'reviewedAt';
  if (status === 'SHORTLISTED') return 'shortlistedAt';
  if (status === 'REJECTED') return 'rejectedAt';
  if (status === 'SELECTED') return 'selectedAt';
  return null;
};

export const TALENT_NEXT_STEP_MESSAGES: Record<ApplicationStatus, string> = {
  APPLIED: 'Waiting for the casting team to open your application.',
  VIEWED:
    'The casting team opened your application and may be reviewing other applicants.',
  UNDER_REVIEW: 'The casting team is reviewing your profile and materials.',
  MAYBE: 'You are in the casting pool. Watch for an update.',
  SHORTLISTED:
    'You made the shortlist. The recruiter may message you about next steps.',
  CALLBACK: 'You have a callback. Watch for a message from the casting team.',
  FINAL_ROUND:
    'You made the final round. The casting team is making their decision.',
  SELECTED:
    'You were selected. The recruiter will contact you through messages with next steps.',
  REJECTED:
    'The casting team moved forward with another applicant. Keep applying — every audition is a separate opportunity.',
  WITHDRAWN: 'You withdrew this application.',
};

export const getApplicationNextStep = (status: ApplicationStatus): string =>
  TALENT_NEXT_STEP_MESSAGES[status];

const RECRUITER_NEXT_ACTION_MAP: Record<ApplicationStatus, string> = {
  APPLIED: 'Open this profile and log your first look by moving to Viewed.',
  VIEWED:
    'Review the profile and materials. Move to Shortlisted, Reviewing, or Rejected.',
  UNDER_REVIEW:
    'Compare with your shortlist. Move to Shortlisted, Maybe, or Rejected.',
  MAYBE: 'Make a final call — Shortlist, Callback, or Reject this application.',
  SHORTLISTED:
    'Confirm your shortlist. Move to Callback or message to discuss next steps.',
  CALLBACK: 'Discuss next steps via messages. Move to Final Round when ready.',
  FINAL_ROUND: 'Make the casting decision — Select or Reject.',
  SELECTED: 'Send a message to share next steps with the Talent member.',
  REJECTED: 'Application closed. No further action required.',
  WITHDRAWN: '',
};

export const getRecruiterNextAction = (status: ApplicationStatus): string =>
  RECRUITER_NEXT_ACTION_MAP[status] ?? '';

export type ApplicationPackSummary = {
  hasCoverMessage: boolean;
  hasSelfTape: boolean;
  mediaCount: number;
};

export const getApplicationPackSummary = (
  application: Pick<Application, 'coverMessage' | 'selfTapeSubmission'>,
  mediaCount: number
): ApplicationPackSummary => ({
  hasCoverMessage: Boolean(application.coverMessage?.trim()),
  hasSelfTape: Boolean(
    application.selfTapeSubmission?.url ||
      application.selfTapeSubmission?.storagePath
  ),
  mediaCount,
});

export type TalentStageGuidance = {
  headline: string;
  detail: string;
  checkMessages: boolean;
};

const TALENT_STAGE_GUIDANCE: Record<ApplicationStatus, TalentStageGuidance> = {
  APPLIED: {
    headline: 'Application submitted.',
    detail: 'The casting team will review your profile when applications are opened.',
    checkMessages: false,
  },
  VIEWED: {
    headline: 'Your application was opened.',
    detail: 'The recruiter has seen your profile. Watch for a status update.',
    checkMessages: false,
  },
  UNDER_REVIEW: {
    headline: 'Actively under review.',
    detail: 'The casting team is comparing your profile and materials.',
    checkMessages: false,
  },
  MAYBE: {
    headline: 'In the consideration pool.',
    detail: 'The casting team has not made a final decision. Watch for a status update.',
    checkMessages: true,
  },
  SHORTLISTED: {
    headline: 'You made the shortlist.',
    detail: 'Strong application. The recruiter may message you about next steps.',
    checkMessages: true,
  },
  CALLBACK: {
    headline: 'Callback received.',
    detail: 'Prepare for the next step. Check Messages for recruiter instructions and respond promptly.',
    checkMessages: true,
  },
  FINAL_ROUND: {
    headline: 'You are in serious consideration.',
    detail: 'The casting team is making their final decision. Keep all communication on-platform.',
    checkMessages: true,
  },
  SELECTED: {
    headline: 'You have been selected.',
    detail: 'Confirm role details through Messages on Nata Connect. Selection never requires a platform fee.',
    checkMessages: true,
  },
  REJECTED: {
    headline: 'This role is not moving forward.',
    detail: 'The casting team chose another applicant. Keep your profile ready for the next opportunity.',
    checkMessages: false,
  },
  WITHDRAWN: {
    headline: 'You withdrew this application.',
    detail: 'This application is closed. Apply to new casting calls when ready.',
    checkMessages: false,
  },
};

export const getTalentStageGuidance = (
  status: ApplicationStatus
): TalentStageGuidance => TALENT_STAGE_GUIDANCE[status];

export const getDecisionSafetyCue = (status: ApplicationStatus): string | null => {
  if (status === 'SELECTED') {
    return 'Selection on Nata Connect never requires a platform fee. If anyone asks you to pay, report it immediately.';
  }
  if (status === 'CALLBACK' || status === 'FINAL_ROUND') {
    return 'Keep all next-step communication on Nata Connect. Do not share personal contact details.';
  }
  return null;
};
