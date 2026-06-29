import type { Application, ApplicationStatus, Audition } from './types';

// These three helpers are inlined from application-pipeline to keep this module
// dependency-free (other policy files follow the same pattern; the bundler
// resolves extensionless imports but Node's ESM test runner does not).

const STATUS_LABELS: Record<ApplicationStatus, string> = {
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

const NEXT_STEP_MESSAGES: Record<ApplicationStatus, string> = {
  APPLIED: 'Waiting for the casting team to open your application.',
  VIEWED: 'The casting team opened your application and may be reviewing other applicants.',
  UNDER_REVIEW: 'The casting team is reviewing your profile and materials.',
  MAYBE: 'You are in the casting pool. Watch for an update.',
  SHORTLISTED: 'You are on the shortlist. Watch for a callback via messages.',
  CALLBACK: 'A callback was requested. Check messages for details.',
  FINAL_ROUND: 'You are in the final round. Keep messages open for updates.',
  SELECTED: 'You were selected. The recruiter will contact you through messages with next steps.',
  REJECTED: 'The casting team moved forward with another applicant. Keep applying — every audition is a separate opportunity.',
  WITHDRAWN: 'You withdrew this application.',
};

const resolveStatus = (
  application: Pick<Application, 'status' | 'recruiterStatus'>
): ApplicationStatus => application.recruiterStatus ?? application.status ?? 'APPLIED';

export type JourneyStepStatus = 'completed' | 'current' | 'pending' | 'skipped';

export type CastingJourneyStep = {
  key: string;
  label: string;
  status: JourneyStepStatus;
  date?: string;
  detail: string;
};

export type ApplicationProofReceipt = {
  auditionTitle: string;
  recruiterName: string;
  submittedDate: string;
  currentStatus: string;
  currentStatusLabel: string;
  packItems: string[];
  selfTapeUrl?: string;
  disclaimer: string;
};

export type ProofChecklistItem = {
  key: string;
  label: string;
  included: boolean;
  detail: string;
};

export type RecruiterJourneySummary = {
  submittedDate: string;
  currentStatus: string;
  currentStatusLabel: string;
  selfTapeStatus: string;
  hasCoverMessage: boolean;
  packReadiness: string;
  safetyNote: string;
};

const fmt = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const safeFormatDate = (value?: unknown): string | undefined => {
  if (!value) return undefined;
  try {
    if (value instanceof Date) return fmt.format(value);
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate: unknown }).toDate === 'function'
    ) {
      return fmt.format((value as { toDate: () => Date }).toDate());
    }
  } catch {
    // ignore malformed date values
  }
  return undefined;
};

// Milestone ordering for determining how far an application has progressed.
// MAYBE sits at the UNDER_REVIEW level — it's a hold state, not a forward milestone.
const MILESTONE_ORDER: ApplicationStatus[] = [
  'APPLIED',
  'VIEWED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'CALLBACK',
  'FINAL_ROUND',
  'SELECTED',
];

const milestoneRank = (status: ApplicationStatus): number => {
  if (status === 'MAYBE') return MILESTONE_ORDER.indexOf('UNDER_REVIEW');
  return MILESTONE_ORDER.indexOf(status);
};

const hasReached = (
  current: ApplicationStatus,
  target: ApplicationStatus
): boolean => {
  const cr = milestoneRank(current);
  const tr = MILESTONE_ORDER.indexOf(target);
  return cr !== -1 && tr !== -1 && cr >= tr;
};

type ApplicationSnapshot = Pick<
  Application,
  | 'status'
  | 'recruiterStatus'
  | 'createdAt'
  | 'coverMessage'
  | 'selfTapeSubmission'
  | 'selfTapeReviewedAt'
  | 'reviewedAt'
  | 'shortlistedAt'
  | 'rejectedAt'
  | 'selectedAt'
>;

type AuditionSnapshot = Pick<
  Audition,
  'title' | 'recruiterName' | 'selfTapeEnabled' | 'selfTapeRequired'
>;

// ── Journey steps ─────────────────────────────────────────────────────────────

export const getCastingJourneySteps = (
  application: ApplicationSnapshot,
  audition?: AuditionSnapshot | null
): CastingJourneyStep[] => {
  const status = resolveStatus(application);
  const isClosed =
    status === 'REJECTED' || status === 'WITHDRAWN' || status === 'SELECTED';
  const steps: CastingJourneyStep[] = [];

  steps.push({
    key: 'submitted',
    label: 'Application submitted',
    status: 'completed',
    date: safeFormatDate(application.createdAt),
    detail: 'Profile and application materials were sent to the casting team.',
  });

  const hasCoverMessage = Boolean(application.coverMessage?.trim());
  steps.push({
    key: 'cover_message',
    label: 'Cover message',
    status: hasCoverMessage ? 'completed' : 'skipped',
    detail: hasCoverMessage
      ? 'A cover message was included with this application.'
      : 'No cover message was added to this application.',
  });

  if (audition?.selfTapeEnabled) {
    const hasSelfTape = Boolean(application.selfTapeSubmission?.url);
    const selfTapeReviewed = Boolean(application.selfTapeReviewedAt);
    steps.push({
      key: 'self_tape',
      label: audition.selfTapeRequired
        ? 'Self-tape (required)'
        : 'Self-tape (optional)',
      status: hasSelfTape
        ? 'completed'
        : audition.selfTapeRequired
          ? 'pending'
          : 'skipped',
      date: hasSelfTape
        ? safeFormatDate(application.selfTapeSubmission?.submittedAt)
        : undefined,
      detail: hasSelfTape
        ? selfTapeReviewed
          ? 'Self-tape submitted and reviewed by the casting team.'
          : 'Self-tape link submitted. Awaiting recruiter review.'
        : audition.selfTapeRequired
          ? 'Self-tape is required for this role. Submit your link from My Applications.'
          : 'Optional self-tape not submitted for this application.',
    });
  }

  const opened = hasReached(status, 'VIEWED') || isClosed;
  steps.push({
    key: 'opened',
    label: 'Application opened',
    status: opened ? 'completed' : 'pending',
    date: opened ? safeFormatDate(application.reviewedAt) : undefined,
    detail: opened
      ? 'The casting team opened your application.'
      : 'Waiting for the casting team to open your application.',
  });

  if (opened) {
    const underReview = hasReached(status, 'UNDER_REVIEW') || isClosed;
    steps.push({
      key: 'under_review',
      label: 'Under review',
      status: underReview
        ? status === 'VIEWED'
          ? 'current'
          : 'completed'
        : 'current',
      detail: underReview
        ? 'The casting team is reviewing your profile and materials.'
        : 'Awaiting active review from the casting team.',
    });
  }

  const shortlistStatuses: ApplicationStatus[] = [
    'SHORTLISTED',
    'CALLBACK',
    'FINAL_ROUND',
    'SELECTED',
  ];
  const isShortlisted = shortlistStatuses.includes(status);

  if (hasReached(status, 'UNDER_REVIEW') || isClosed) {
    steps.push({
      key: 'shortlisted',
      label: 'Shortlisted',
      status: isShortlisted
        ? status === 'SHORTLISTED'
          ? 'current'
          : 'completed'
        : 'pending',
      date: isShortlisted ? safeFormatDate(application.shortlistedAt) : undefined,
      detail: isShortlisted
        ? 'You were added to the casting shortlist.'
        : 'The shortlist decision is pending.',
    });
  }

  const callbackStatuses: ApplicationStatus[] = ['CALLBACK', 'FINAL_ROUND', 'SELECTED'];
  const hasCallback = callbackStatuses.includes(status);

  if (isShortlisted || hasCallback) {
    steps.push({
      key: 'callback',
      label: 'Callback',
      status: hasCallback
        ? status === 'CALLBACK'
          ? 'current'
          : 'completed'
        : 'pending',
      detail: hasCallback
        ? 'A callback was requested by the casting team. Check Messages for details.'
        : 'Callback decision pending.',
    });
  }

  const finalStatuses: ApplicationStatus[] = ['FINAL_ROUND', 'SELECTED'];
  const inFinal = finalStatuses.includes(status);

  if (hasCallback || inFinal) {
    steps.push({
      key: 'final_round',
      label: 'Final round',
      status: inFinal
        ? status === 'FINAL_ROUND'
          ? 'current'
          : 'completed'
        : 'pending',
      detail: inFinal
        ? 'You are in the final casting round. Keep Messages open for updates.'
        : 'Final round decision pending.',
    });
  }

  if (status === 'SELECTED') {
    steps.push({
      key: 'selected',
      label: 'Selected',
      status: 'completed',
      date: safeFormatDate(application.selectedAt),
      detail:
        'You were selected for this role. Keep all next-step communication on Nata Connect. Selection never requires a platform fee.',
    });
  } else if (status === 'REJECTED') {
    steps.push({
      key: 'not_selected',
      label: 'Not selected',
      status: 'completed',
      date: safeFormatDate(application.rejectedAt),
      detail:
        'The casting team moved forward with another applicant for this role.',
    });
  } else if (status === 'WITHDRAWN') {
    steps.push({
      key: 'withdrawn',
      label: 'Withdrawn',
      status: 'completed',
      detail: 'You withdrew this application.',
    });
  }

  return steps;
};

// ── Current stage and next step ───────────────────────────────────────────────

export const getJourneyCurrentStage = (
  application: Pick<Application, 'status' | 'recruiterStatus'>
) => {
  const status = resolveStatus(application);
  return {
    status,
    label: STATUS_LABELS[status],
    detail: NEXT_STEP_MESSAGES[status],
  };
};

export const getJourneyNextStep = (
  application: ApplicationSnapshot,
  audition?: AuditionSnapshot | null
): string => {
  const status = resolveStatus(application);
  if (
    status === 'APPLIED' &&
    audition?.selfTapeEnabled &&
    !application.selfTapeSubmission?.url
  ) {
    return audition.selfTapeRequired
      ? 'Submit your required self-tape link from My Applications.'
      : 'Consider adding an optional self-tape link from My Applications.';
  }
  return NEXT_STEP_MESSAGES[status];
};

// ── Proof checklist and receipt ───────────────────────────────────────────────

export const getApplicationProofChecklist = (
  application: ApplicationSnapshot,
  audition?: AuditionSnapshot | null
): ProofChecklistItem[] => {
  const hasCoverMessage = Boolean(application.coverMessage?.trim());
  const hasSelfTape = Boolean(application.selfTapeSubmission?.url);

  const checklist: ProofChecklistItem[] = [
    {
      key: 'profile',
      label: 'Profile snapshot',
      included: true,
      detail: 'Category, experience, location, bio, and professional links.',
    },
    {
      key: 'cover_message',
      label: 'Cover message',
      included: hasCoverMessage,
      detail: hasCoverMessage
        ? 'A cover message was included with this application.'
        : 'No cover message was added.',
    },
  ];

  if (audition?.selfTapeEnabled) {
    checklist.push({
      key: 'self_tape',
      label: audition.selfTapeRequired
        ? 'Self-tape link (required)'
        : 'Self-tape link (optional)',
      included: hasSelfTape,
      detail: hasSelfTape
        ? 'A self-tape link was submitted with this application.'
        : audition.selfTapeRequired
          ? 'Required self-tape has not been submitted yet.'
          : 'Optional self-tape was not submitted.',
    });
  }

  return checklist;
};

export const getApplicationProofReceipt = (
  application: ApplicationSnapshot,
  audition?: AuditionSnapshot | null
): ApplicationProofReceipt => {
  const status = resolveStatus(application);
  const checklist = getApplicationProofChecklist(application, audition);

  return {
    auditionTitle: audition?.title ?? 'Casting call',
    recruiterName: audition?.recruiterName ?? 'Recruiter',
    submittedDate: safeFormatDate(application.createdAt) ?? 'Not recorded',
    currentStatus: status,
    currentStatusLabel: STATUS_LABELS[status],
    packItems: checklist
      .filter((item) => item.included)
      .map((item) => item.label),
    selfTapeUrl: application.selfTapeSubmission?.url,
    disclaimer:
      'This is a platform record of your application activity on Nata Connect. It is not a casting guarantee, official certificate, or confirmation of selection. Casting decisions are made by the recruiting team.',
  };
};

// ── Talent guidance ───────────────────────────────────────────────────────────

export const getTalentJourneyGuidance = (
  application: ApplicationSnapshot,
  audition?: AuditionSnapshot | null
): { headline: string; detail: string; nextStep: string; safetyReminder: string } => {
  const status = resolveStatus(application);
  const safetyByStatus: Partial<Record<ApplicationStatus, string>> = {
    SELECTED:
      'Keep all post-selection communication on Nata Connect. You will never be asked to pay to confirm a role.',
    CALLBACK:
      'Keep callback communication on-platform. Do not share personal contact details.',
    FINAL_ROUND:
      'Keep all communication on Nata Connect during the final casting round.',
  };
  return {
    headline: STATUS_LABELS[status],
    detail: NEXT_STEP_MESSAGES[status],
    nextStep: getJourneyNextStep(application, audition),
    safetyReminder:
      safetyByStatus[status] ??
      'Keep all casting communication on Nata Connect.',
  };
};

// ── Recruiter summary ─────────────────────────────────────────────────────────

export const getRecruiterJourneySummary = (
  application: ApplicationSnapshot,
  audition?: AuditionSnapshot | null
): RecruiterJourneySummary => {
  const status = resolveStatus(application);
  const hasCoverMessage = Boolean(application.coverMessage?.trim());
  const hasSelfTape = Boolean(application.selfTapeSubmission?.url);
  const selfTapeReviewed = Boolean(application.selfTapeReviewedAt);

  let selfTapeStatus: string;
  if (!audition?.selfTapeEnabled) {
    selfTapeStatus = 'Not requested for this role';
  } else if (selfTapeReviewed) {
    selfTapeStatus = 'Submitted and reviewed';
  } else if (hasSelfTape) {
    selfTapeStatus = 'Submitted — awaiting review';
  } else if (audition.selfTapeRequired) {
    selfTapeStatus = 'Required — not yet submitted';
  } else {
    selfTapeStatus = 'Optional — not submitted';
  }

  const packParts: string[] = ['Profile snapshot'];
  if (hasCoverMessage) packParts.push('Cover message');
  if (hasSelfTape) packParts.push('Self-tape link');

  return {
    submittedDate: safeFormatDate(application.createdAt) ?? 'Not recorded',
    currentStatus: status,
    currentStatusLabel: STATUS_LABELS[status],
    selfTapeStatus,
    hasCoverMessage,
    packReadiness: packParts.join(' · '),
    safetyNote:
      'Casting decisions should not be communicated as guaranteed or confirmed until a formal offer is made through Nata Connect.',
  };
};
