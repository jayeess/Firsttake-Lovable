import type {
  ApplicationStatus,
  Audition,
  AuditionApplicant,
  SelfTapeStatus,
} from './types';

export type CastingSlateStage =
  | 'new'
  | 'viewed'
  | 'shortlisted'
  | 'callback'
  | 'final_round'
  | 'selected'
  | 'rejected'
  | 'completed';

export type CastingDecisionReadinessBand =
  | 'review_ready'
  | 'needs_profile_context'
  | 'needs_self_tape'
  | 'decision_stage'
  | 'closed';

export interface CastingSlateCounts {
  total: number;
  new: number;
  viewed: number;
  shortlisted: number;
  callback: number;
  finalRound: number;
  selected: number;
  rejected: number;
  completed: number;
  selfTapeMissing: number;
  reviewReady: number;
  decisionPending: number;
}

export interface CastingSlateStageBucket {
  stage: CastingSlateStage;
  label: string;
  description: string;
  applicants: AuditionApplicant[];
}

export interface CastingSlateSummary {
  counts: CastingSlateCounts;
  headline: string;
  detail: string;
  nextAction: string;
}

export interface CastingDecisionSignal {
  label: string;
  value: string;
  tone: 'good' | 'attention' | 'neutral';
}

export interface CastingDecisionReadiness {
  band: CastingDecisionReadinessBand;
  bandLabel: string;
  headline: string;
  summary: string;
  nextAction: string;
  safetyNote: string;
  signals: CastingDecisionSignal[];
}

export interface CastingSlateChecklistItem {
  label: string;
  complete: boolean;
  detail: string;
}

const statusLabels: Record<ApplicationStatus, string> = {
  APPLIED: 'New',
  VIEWED: 'Viewed',
  UNDER_REVIEW: 'Under review',
  SHORTLISTED: 'Shortlisted',
  CALLBACK: 'Callback',
  FINAL_ROUND: 'Final round',
  MAYBE: 'Review pool',
  REJECTED: 'Not selected',
  SELECTED: 'Selected',
  WITHDRAWN: 'Withdrawn',
};

const stageMeta: Record<
  CastingSlateStage,
  { label: string; description: string }
> = {
  new: {
    label: 'New',
    description: 'Fresh applications waiting for first recruiter review.',
  },
  viewed: {
    label: 'Viewed',
    description: 'Opened applications that still need a human next step.',
  },
  shortlisted: {
    label: 'Shortlisted',
    description: 'Profiles marked for deeper review against this role.',
  },
  callback: {
    label: 'Callback',
    description: 'Applicants moving into callback communication or prep.',
  },
  final_round: {
    label: 'Final round',
    description: 'Applicants at the final casting decision stage.',
  },
  selected: {
    label: 'Selected',
    description: 'Applicants selected for the role or next production step.',
  },
  rejected: {
    label: 'Not selected',
    description: 'Closed applications with a respectful final status.',
  },
  completed: {
    label: 'Completed',
    description: 'Withdrawn or otherwise closed applications.',
  },
};

export function getCastingSlateStage(status: ApplicationStatus): CastingSlateStage {
  if (status === 'APPLIED') return 'new';
  if (status === 'SHORTLISTED') return 'shortlisted';
  if (status === 'CALLBACK') return 'callback';
  if (status === 'FINAL_ROUND') return 'final_round';
  if (status === 'SELECTED') return 'selected';
  if (status === 'REJECTED') return 'rejected';
  if (status === 'WITHDRAWN') return 'completed';
  return 'viewed';
}

export function getCastingSlateBuckets(
  applicants: AuditionApplicant[]
): CastingSlateStageBucket[] {
  const stages = Object.keys(stageMeta) as CastingSlateStage[];
  return stages.map((stage) => ({
    stage,
    ...stageMeta[stage],
    applicants: applicants.filter(
      (applicant) =>
        getCastingSlateStage(getApplicantStatus(applicant)) === stage
    ),
  }));
}

export function getCastingSlateCounts(
  applicants: AuditionApplicant[],
  audition?: Audition | null
): CastingSlateCounts {
  const buckets = getCastingSlateBuckets(applicants);
  const countStage = (stage: CastingSlateStage) =>
    buckets.find((bucket) => bucket.stage === stage)?.applicants.length ?? 0;

  const selfTapeMissing = applicants.filter(
    (applicant) => getSelfTapeCue(applicant, audition).status === 'missing'
  ).length;
  const reviewReady = applicants.filter(
    (applicant) =>
      getCastingDecisionReadiness(applicant, audition).band === 'review_ready'
  ).length;
  const decisionPending = applicants.filter((applicant) =>
    ['SHORTLISTED', 'CALLBACK', 'FINAL_ROUND', 'MAYBE'].includes(
      getApplicantStatus(applicant)
    )
  ).length;

  return {
    total: applicants.length,
    new: countStage('new'),
    viewed: countStage('viewed'),
    shortlisted: countStage('shortlisted'),
    callback: countStage('callback'),
    finalRound: countStage('final_round'),
    selected: countStage('selected'),
    rejected: countStage('rejected'),
    completed: countStage('completed'),
    selfTapeMissing,
    reviewReady,
    decisionPending,
  };
}

export function getCastingSlateSummary(
  applicants: AuditionApplicant[],
  audition?: Audition | null
): CastingSlateSummary {
  const counts = getCastingSlateCounts(applicants, audition);

  if (counts.total === 0) {
    return {
      counts,
      headline: 'No applicants in this slate yet.',
      detail:
        'When Talent applies, this room will organize them by review stage without changing the casting decision process.',
      nextAction: 'Keep the brief clear and share the public audition link in appropriate channels.',
    };
  }

  if (counts.new > 0) {
    return {
      counts,
      headline: `${counts.new} new ${pluralize('application', counts.new)} to open.`,
      detail:
        'Start with new applicants, confirm their profile context, and move each one only when the stage reflects your real review.',
      nextAction: 'Open new profiles and mark them viewed or under review after reading the application.',
    };
  }

  if (counts.selfTapeMissing > 0) {
    return {
      counts,
      headline: `${counts.selfTapeMissing} self-tape ${pluralize('item', counts.selfTapeMissing)} still pending.`,
      detail:
        'Some applicants need to add or update external self-tape links before the role review is complete.',
      nextAction: 'Use messages only for clear role-specific instructions and keep all links tied to the audition.',
    };
  }

  if (counts.decisionPending > 0) {
    return {
      counts,
      headline: `${counts.decisionPending} ${pluralize('applicant', counts.decisionPending)} in active decision stages.`,
      detail:
        'Shortlist, callback, review pool, and final-round stages should reflect the current human casting discussion.',
      nextAction: 'Add private notes, compare role requirements, then record the next stage when ready.',
    };
  }

  return {
    counts,
    headline: 'The slate is up to date.',
    detail:
      'Applicants have clear recorded statuses. Continue reviewing new applications as they arrive.',
    nextAction: 'Keep notes respectful and close the loop when a decision changes.',
  };
}

export function getCastingDecisionReadiness(
  applicant: AuditionApplicant,
  audition?: Audition | null
): CastingDecisionReadiness {
  const status = getApplicantStatus(applicant);
  const selfTape = getSelfTapeCue(applicant, audition);
  const profileScore = applicant.talent?.profileCompletenessScore ?? 0;
  const activeMediaCount = getVisiblePortfolioCount(applicant);
  const hasPublicProfile = Boolean(applicant.talent?.publicSlug);
  const hasNotes =
    Boolean(applicant.application.recruiterNote?.trim()) ||
    Boolean(applicant.application.recruiterNotes?.trim()) ||
    (applicant.application.internalTags?.length ?? 0) > 0 ||
    Boolean(applicant.application.recruiterRating);

  const signals: CastingDecisionSignal[] = [
    {
      label: 'Current stage',
      value: statusLabels[status],
      tone: status === 'APPLIED' ? 'attention' : 'neutral',
    },
    {
      label: 'Profile completeness',
      value: `${profileScore}%`,
      tone: profileScore >= 70 ? 'good' : 'attention',
    },
    {
      label: 'Portfolio context',
      value:
        activeMediaCount > 0
          ? `${activeMediaCount} visible ${pluralize('item', activeMediaCount)}`
          : hasPublicProfile
            ? 'Public profile available'
            : 'Needs more context',
      tone: activeMediaCount > 0 || hasPublicProfile ? 'good' : 'attention',
    },
    {
      label: 'Self-tape',
      value: selfTape.label,
      tone: selfTape.status === 'missing' ? 'attention' : selfTape.status === 'submitted' ? 'good' : 'neutral',
    },
    {
      label: 'Private review notes',
      value: hasNotes ? 'Notes started' : 'No notes yet',
      tone: hasNotes ? 'good' : 'neutral',
    },
  ];

  if (['SELECTED', 'REJECTED', 'WITHDRAWN'].includes(status)) {
    return {
      band: 'closed',
      bandLabel: status === 'SELECTED' ? 'Decision recorded' : 'Closed',
      headline:
        status === 'SELECTED'
          ? 'Selection is recorded for this applicant.'
          : 'This application has a final or closed status.',
      summary:
        'Keep any follow-up professional and make sure Talent-visible notes stay respectful and role-specific.',
      nextAction:
        status === 'SELECTED'
          ? 'Use messages for clear next steps, timing, and production expectations.'
          : 'Leave the status as-is unless the casting team intentionally reopens the review.',
      safetyNote: humanDecisionNote(),
      signals,
    };
  }

  if (selfTape.status === 'missing') {
    return {
      band: 'needs_self_tape',
      bandLabel: 'Needs self-tape',
      headline: 'Required self-tape link is still missing.',
      summary:
        'The applicant can still be reviewed, but this role requested an external self-tape link before deeper evaluation.',
      nextAction:
        'Send one clear role-specific reminder through Messages if the external self-tape link is needed.',
      safetyNote: humanDecisionNote(),
      signals,
    };
  }

  if (['SHORTLISTED', 'CALLBACK', 'FINAL_ROUND'].includes(status)) {
    return {
      band: 'decision_stage',
      bandLabel: 'Decision stage',
      headline: `${statusLabels[status]} applicant needs a clear next step.`,
      summary:
        'Review role requirements, notes, Talent-visible instructions, and any submitted self-tape before moving the stage.',
      nextAction: getCastingSlateNextActions(applicant, audition)[0],
      safetyNote: humanDecisionNote(),
      signals,
    };
  }

  if (profileScore >= 70 && (activeMediaCount > 0 || hasPublicProfile)) {
    return {
      band: 'review_ready',
      bandLabel: 'Review-ready',
      headline: 'Profile and portfolio context are ready for review.',
      summary:
        'Use the current application, public-safe profile context, notes, and role requirements to decide the next human stage.',
      nextAction: getCastingSlateNextActions(applicant, audition)[0],
      safetyNote: humanDecisionNote(),
      signals,
    };
  }

  return {
    band: 'needs_profile_context',
    bandLabel: 'Needs context',
    headline: 'Review with care; some profile context is still light.',
    summary:
      'The applicant can still be considered, but profile completeness or portfolio context may need follow-up before a confident next stage.',
    nextAction: getCastingSlateNextActions(applicant, audition)[0],
    safetyNote: humanDecisionNote(),
    signals,
  };
}

export function getCastingSlateNextActions(
  applicant: AuditionApplicant,
  audition?: Audition | null
): string[] {
  const status = getApplicantStatus(applicant);
  const selfTape = getSelfTapeCue(applicant, audition);
  const actions: string[] = [];

  if (status === 'APPLIED') {
    actions.push('Open the profile, read the cover message, then mark it viewed or under review.');
  } else if (status === 'VIEWED' || status === 'UNDER_REVIEW' || status === 'MAYBE') {
    actions.push('Add private notes, then shortlist, callback, keep under review, or close with a respectful status.');
  } else if (status === 'SHORTLISTED') {
    actions.push('Compare against the role needs and move to callback, final round, or close the loop.');
  } else if (status === 'CALLBACK') {
    actions.push('Record callback outcomes and move to final round, selected, or not selected when ready.');
  } else if (status === 'FINAL_ROUND') {
    actions.push('Confirm the final production decision and update the applicant status.');
  } else if (status === 'SELECTED') {
    actions.push('Send clear next steps, timing, and expectations through Messages.');
  } else if (status === 'REJECTED') {
    actions.push('Keep the closure respectful and avoid reopening unless the casting team intentionally changes direction.');
  } else {
    actions.push('This application is withdrawn and should remain read-only.');
  }

  if (selfTape.status === 'missing') {
    actions.push('Request the missing external self-tape link only if it is still required for this role.');
  }

  actions.push('Keep all communication on-platform and never request payment from Talent.');
  return actions;
}

export function getCastingSlateReviewChecklist(
  applicant: AuditionApplicant,
  audition?: Audition | null
): CastingSlateChecklistItem[] {
  const profileScore = applicant.talent?.profileCompletenessScore ?? 0;
  const selfTape = getSelfTapeCue(applicant, audition);

  return [
    {
      label: 'Application message reviewed',
      complete: Boolean(applicant.application.coverMessage?.trim()),
      detail: applicant.application.coverMessage?.trim()
        ? 'Cover message is available.'
        : 'No cover message was submitted.',
    },
    {
      label: 'Profile context reviewed',
      complete: profileScore >= 70,
      detail:
        profileScore >= 70
          ? `Profile is ${profileScore}% complete.`
          : `Profile is ${profileScore}% complete; review missing context carefully.`,
    },
    {
      label: 'Portfolio or public profile reviewed',
      complete:
        getVisiblePortfolioCount(applicant) > 0 || Boolean(applicant.talent?.publicSlug),
      detail:
        getVisiblePortfolioCount(applicant) > 0
          ? 'Visible portfolio media is available.'
          : applicant.talent?.publicSlug
            ? 'Public casting profile is available.'
            : 'No visible portfolio media or public profile link is available.',
    },
    {
      label: 'Self-tape requirement checked',
      complete: selfTape.status !== 'missing',
      detail: selfTape.label,
    },
    {
      label: 'Private notes updated',
      complete:
        Boolean(applicant.application.recruiterNote?.trim()) ||
        Boolean(applicant.application.recruiterNotes?.trim()) ||
        (applicant.application.internalTags?.length ?? 0) > 0 ||
        Boolean(applicant.application.recruiterRating),
      detail: 'Notes help the casting team remember why a stage changed.',
    },
  ];
}

export function getCastingSlateSafetyNotes() {
  return [
    'The slate organizes existing applicant stages; it does not choose Talent for the recruiter.',
    'Status changes should reflect real human review, notes, and role requirements.',
    'Private Talent verification details, admin notes, evidence files, email, phone, and hidden media stay out of the decision room.',
    'Talent should never be asked to pay, deposit money, or share unrelated personal documents to audition.',
  ];
}

export function getCastingSlateEmptyState(stage?: CastingSlateStage) {
  if (!stage) {
    return {
      title: 'No applicants in this decision room yet',
      message:
        'Once Talent applies, the slate will group applicants by stage so the recruiter can review them clearly and responsibly.',
    };
  }

  return {
    title: `No ${stageMeta[stage].label.toLowerCase()} applicants right now`,
    message:
      'Switch stages, clear filters, or keep the casting brief active while new applications come in.',
  };
}

function getApplicantStatus(applicant: AuditionApplicant): ApplicationStatus {
  return (
    applicant.application.recruiterStatus ??
    applicant.application.status ??
    'APPLIED'
  );
}

function getSelfTapeCue(
  applicant: AuditionApplicant,
  audition?: Audition | null
): { status: SelfTapeStatus; label: string } {
  if (!audition?.selfTapeEnabled) {
    return { status: 'not_requested', label: 'Not requested' };
  }

  if (applicant.application.selfTapeSubmission?.url) {
    return {
      status: applicant.application.selfTapeReviewedAt ? 'reviewed' : 'submitted',
      label: applicant.application.selfTapeReviewedAt
        ? 'Submitted and reviewed'
        : 'Submitted',
    };
  }

  if (audition.selfTapeRequired) {
    return { status: 'missing', label: 'Required link missing' };
  }

  return { status: 'requested', label: 'Optional link not submitted' };
}

function getVisiblePortfolioCount(applicant: AuditionApplicant) {
  return applicant.media.filter(
    (item) =>
      item.moderationStatus === 'active' &&
      (item.visibility === 'public' || item.visibility === 'recruiters')
  ).length;
}

function humanDecisionNote() {
  return 'Use this as a review aid only. The final casting decision remains a human recruiter decision.';
}

function pluralize(word: string, count: number) {
  return count === 1 ? word : `${word}s`;
}
