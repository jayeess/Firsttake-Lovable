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
  'MAYBE',
  'REJECTED',
  'SELECTED',
  'WITHDRAWN',
];

export const RECRUITER_CONTROLLED_STATUSES: ApplicationStatus[] = [
  'VIEWED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'MAYBE',
  'REJECTED',
  'SELECTED',
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Submitted',
  VIEWED: 'Viewed',
  UNDER_REVIEW: 'Under review',
  SHORTLISTED: 'Shortlisted',
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
  | 'UPDATED';

export type ApplicantFilters = {
  status: ApplicationStatus | 'ALL';
  verifiedOnly: boolean;
  hasMedia: boolean;
  hasShowreel: boolean;
  completenessAbove70: boolean;
  minimumRating: number;
  search: string;
};

export type RecruiterReviewInput = {
  status?: ApplicationStatus;
  recruiterNote?: string;
  recruiterRating?: number | null;
  internalTags?: string[];
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
