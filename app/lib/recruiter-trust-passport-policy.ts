import type {
  AccountStatus,
  Audition,
  RecruiterProfile,
  RecruiterVerification,
  VerificationStatus,
} from './types';
import type { CastingBriefQualitySummary } from './casting-brief-quality-policy';

export type RecruiterTrustBand =
  | 'verified_source'
  | 'clear_source'
  | 'needs_source_detail'
  | 'needs_trust_review';

export type RecruiterTrustSignalStatus =
  | 'strong'
  | 'clear'
  | 'attention'
  | 'review';

export type RecruiterTrustSignal = {
  key:
    | 'verification'
    | 'accountStatus'
    | 'sourceName'
    | 'contactRole'
    | 'publicProof'
    | 'workDescription'
    | 'briefQuality'
    | 'communication'
    | 'safety'
    | 'selfTape';
  label: string;
  status: RecruiterTrustSignalStatus;
  detail: string;
  publicSafe: boolean;
};

export type RecruiterTrustPassport = {
  band: RecruiterTrustBand;
  bandLabel: string;
  headline: string;
  summary: string;
  sourceName: string;
  signals: RecruiterTrustSignal[];
  publicSignals: RecruiterTrustSignal[];
  talentGuidance: string[];
  recruiterActions: string[];
  adminReviewCues: string[];
};

export type RecruiterTrustContext = {
  verification?: Partial<RecruiterVerification> | null;
  verificationStatus?: VerificationStatus;
  accountStatus?: AccountStatus | string | null;
  briefQuality?: Pick<
    CastingBriefQualitySummary,
    'band' | 'bandLabel' | 'safetySignals' | 'missingItems'
  > | null;
};

type RecruiterTrustProfile = Partial<RecruiterProfile> | null | undefined;
type RecruiterTrustAudition = Partial<Audition> | null | undefined;

const hasText = (value?: string | null) => Boolean(value?.trim());

const titleCase = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const makeSignal = (signal: RecruiterTrustSignal): RecruiterTrustSignal =>
  signal;

const getVerificationStatus = (
  profile: RecruiterTrustProfile,
  audition: RecruiterTrustAudition,
  context: RecruiterTrustContext
): VerificationStatus => {
  if (context.verificationStatus) return context.verificationStatus;
  if (context.verification?.status) return context.verification.status;
  if (profile?.verificationStatus) return profile.verificationStatus;
  if (profile?.isVerified || audition?.recruiterVerified) return 'approved';
  return 'not_submitted';
};

const getSourceName = (
  profile: RecruiterTrustProfile,
  audition: RecruiterTrustAudition,
  context: RecruiterTrustContext
) =>
  profile?.companyName?.trim() ||
  context.verification?.legalName?.trim() ||
  audition?.recruiterName?.trim() ||
  'Recruiter';

export const getRecruiterTrustPassport = (
  recruiterProfile?: RecruiterTrustProfile,
  audition?: RecruiterTrustAudition,
  context: RecruiterTrustContext = {}
): RecruiterTrustPassport => {
  const sourceName = getSourceName(recruiterProfile, audition, context);
  const verificationStatus = getVerificationStatus(
    recruiterProfile,
    audition,
    context
  );
  const accountStatus = context.accountStatus;
  const briefQuality = context.briefQuality;
  const companyNameReady =
    hasText(recruiterProfile?.companyName) ||
    hasText(context.verification?.legalName) ||
    hasText(audition?.recruiterName);
  const contactReady =
    hasText(context.verification?.contactPerson) ||
    hasText(context.verification?.phone) ||
    hasText(recruiterProfile?.phone);
  const publicProofReady =
    hasText(recruiterProfile?.website) ||
    hasText(context.verification?.website) ||
    hasText(context.verification?.socialProofUrl);
  const workDescriptionReady =
    hasText(recruiterProfile?.bio) ||
    hasText(context.verification?.workDescription);
  const briefNeedsReview =
    briefQuality?.band === 'needs_review' ||
    Boolean(briefQuality?.safetySignals?.some((signal) => signal.status !== 'complete'));
  const briefNeedsDetail = briefQuality?.band === 'needs_detail';

  const signals: RecruiterTrustSignal[] = [
    makeSignal({
      key: 'verification',
      label: 'Recruiter verification',
      status:
        verificationStatus === 'approved'
          ? 'strong'
          : verificationStatus === 'pending'
            ? 'attention'
            : verificationStatus === 'rejected' ||
                verificationStatus === 'suspended'
              ? 'review'
              : 'attention',
      detail:
        verificationStatus === 'approved'
          ? 'Recruiter identity has been approved by the platform review team.'
          : verificationStatus === 'pending'
            ? 'Recruiter verification is under platform review.'
            : verificationStatus === 'rejected'
              ? 'Recruiter verification needs corrections before stronger trust can show.'
              : verificationStatus === 'suspended'
                ? 'Recruiter publishing access is paused for trust review.'
                : 'Recruiter verification has not been submitted yet.',
      publicSafe: true,
    }),
    makeSignal({
      key: 'accountStatus',
      label: 'Account safety',
      status: accountStatus === 'SUSPENDED' ? 'review' : 'clear',
      detail:
        accountStatus === 'SUSPENDED'
          ? 'Account activity is paused until admin review is resolved.'
          : 'No account pause is shown for this recruiter context.',
      publicSafe: accountStatus === 'SUSPENDED',
    }),
    makeSignal({
      key: 'sourceName',
      label: 'Visible source name',
      status: companyNameReady ? 'clear' : 'attention',
      detail: companyNameReady
        ? `${sourceName} is shown as the casting source.`
        : 'Add a clear company, studio, agency, or casting-team name.',
      publicSafe: true,
    }),
    makeSignal({
      key: 'contactRole',
      label: 'Contact accountability',
      status: contactReady ? 'clear' : 'attention',
      detail: contactReady
        ? 'A contact path is available for review and accountability.'
        : 'Add a contact person, phone, or business contact details.',
      publicSafe: false,
    }),
    makeSignal({
      key: 'publicProof',
      label: 'Public proof link',
      status: publicProofReady ? 'clear' : 'attention',
      detail: publicProofReady
        ? 'A website or public proof link supports source transparency.'
        : 'Add a website, portfolio, company page, or public work link.',
      publicSafe: true,
    }),
    makeSignal({
      key: 'workDescription',
      label: 'Casting context',
      status: workDescriptionReady ? 'clear' : 'attention',
      detail: workDescriptionReady
        ? 'The recruiter explains their production or casting work.'
        : 'Add specific production, casting, or company context.',
      publicSafe: true,
    }),
  ];

  if (briefQuality) {
    signals.push(
      makeSignal({
        key: 'briefQuality',
        label: 'Casting brief clarity',
        status: briefNeedsReview
          ? 'review'
          : briefNeedsDetail
            ? 'attention'
            : 'clear',
        detail:
          briefQuality.band === 'needs_review'
            ? 'This brief has safety or clarity cues that should be reviewed before Talent proceeds.'
            : briefQuality.band === 'needs_detail'
              ? 'This brief would benefit from more role, timeline, compensation, or self-tape detail.'
              : `${briefQuality.bandLabel} supports Talent decision-making.`,
        publicSafe: true,
      })
    );
  }

  signals.push(
    makeSignal({
      key: 'communication',
      label: 'Communication channel',
      status: 'clear',
      detail: 'Keep audition communication on Nata Connect whenever possible.',
      publicSafe: true,
    }),
    makeSignal({
      key: 'safety',
      label: 'Payment safety',
      status: briefNeedsReview ? 'review' : 'clear',
      detail: briefNeedsReview
        ? 'Review the brief carefully. Talent should never pay to audition.'
        : 'Talent should never be asked to pay to audition.',
      publicSafe: true,
    })
  );

  if (audition?.selfTapeEnabled) {
    signals.push(
      makeSignal({
        key: 'selfTape',
        label: 'Self-tape expectation',
        status: hasText(audition.selfTapeInstructions) ? 'clear' : 'attention',
        detail: hasText(audition.selfTapeInstructions)
          ? 'Self-tape expectations are described in the brief.'
          : 'Add self-tape instructions before asking Talent for media links.',
        publicSafe: true,
      })
    );
  }

  const hasReviewSignal = signals.some((signal) => signal.status === 'review');
  const missingSourceDetail = signals.some(
    (signal) =>
      ['sourceName', 'publicProof', 'workDescription', 'contactRole'].includes(
        signal.key
      ) && signal.status === 'attention'
  );

  const band: RecruiterTrustBand = hasReviewSignal
    ? 'needs_trust_review'
    : verificationStatus === 'approved' &&
        companyNameReady &&
        (publicProofReady || workDescriptionReady)
      ? 'verified_source'
      : companyNameReady && !missingSourceDetail
        ? 'clear_source'
        : missingSourceDetail
          ? 'needs_source_detail'
          : 'clear_source';

  const bandLabel = getRecruiterTrustBandLabel(band);
  const publicSignals = signals.filter((signal) => signal.publicSafe);
  const recruiterActions = getRecruiterTrustImprovementTipsFromSignals(signals);
  const adminReviewCues = getAdminCuesFromSignals(signals);

  return {
    band,
    bandLabel,
    headline:
      band === 'verified_source'
        ? 'Verified source with clear casting context'
        : band === 'clear_source'
          ? 'Source details are visible'
          : band === 'needs_source_detail'
            ? 'More source detail would improve trust'
            : 'Needs trust review before stronger visibility',
    summary:
      band === 'verified_source'
        ? 'Talent can see who is casting and review the brief with stronger platform trust signals.'
        : band === 'clear_source'
          ? 'The source is understandable, but verification or supporting proof may still improve confidence.'
          : band === 'needs_source_detail'
            ? 'Add public company context, proof links, and complete contact details before relying on this source signal.'
            : 'Review verification, account status, and brief safety cues before treating this as a trusted source.',
    sourceName,
    signals,
    publicSignals,
    talentGuidance: getTalentSourceGuidance(band, briefNeedsReview),
    recruiterActions,
    adminReviewCues,
  };
};

export const getRecruiterTrustBandLabel = (band: RecruiterTrustBand) => {
  const labels: Record<RecruiterTrustBand, string> = {
    verified_source: 'Verified source',
    clear_source: 'Clear source',
    needs_source_detail: 'Needs source detail',
    needs_trust_review: 'Needs trust review',
  };
  return labels[band];
};

export const getSourceTransparencySignals = (
  recruiterProfile?: RecruiterTrustProfile,
  audition?: RecruiterTrustAudition,
  context: RecruiterTrustContext = {}
) => getRecruiterTrustPassport(recruiterProfile, audition, context).publicSignals;

export const getRecruiterTrustChecklist = (
  recruiterProfile?: RecruiterTrustProfile,
  audition?: RecruiterTrustAudition,
  context: RecruiterTrustContext = {}
) =>
  getRecruiterTrustPassport(recruiterProfile, audition, context).signals.map(
    (signal) => ({
      label: signal.label,
      complete: signal.status === 'strong' || signal.status === 'clear',
      detail: signal.detail,
    })
  );

export const getRecruiterTrustImprovementTips = (
  recruiterProfile?: RecruiterTrustProfile,
  context: RecruiterTrustContext = {}
) => getRecruiterTrustPassport(recruiterProfile, null, context).recruiterActions;

export const getAdminRecruiterTrustSummary = (
  recruiterProfile?: RecruiterTrustProfile,
  audition?: RecruiterTrustAudition,
  context: RecruiterTrustContext = {}
) => {
  const passport = getRecruiterTrustPassport(
    recruiterProfile,
    audition,
    context
  );
  return {
    band: passport.band,
    bandLabel: passport.bandLabel,
    headline: passport.headline,
    sourceName: passport.sourceName,
    publicSignals: passport.publicSignals.map((signal) => ({
      key: signal.key,
      label: signal.label,
      status: signal.status,
      detail: signal.detail,
    })),
    adminReviewCues: passport.adminReviewCues,
  };
};

const getTalentSourceGuidance = (
  band: RecruiterTrustBand,
  briefNeedsReview: boolean
) => {
  const guidance = [
    'Review the recruiter name, project details, compensation, and self-tape expectations before applying.',
    'Keep casting communication on Nata Connect and report requests for fees or unsafe personal details.',
  ];
  if (band === 'verified_source') {
    guidance.unshift(
      'The recruiter has stronger platform trust signals, but selection is never guaranteed.'
    );
  }
  if (band === 'needs_source_detail') {
    guidance.unshift(
      'Look for clearer company context or public proof before sharing extra materials.'
    );
  }
  if (band === 'needs_trust_review' || briefNeedsReview) {
    guidance.unshift(
      'Proceed carefully and use the report option if the brief pressures you to pay or move off-platform.'
    );
  }
  return guidance;
};

const getRecruiterTrustImprovementTipsFromSignals = (
  signals: RecruiterTrustSignal[]
) => {
  const tips = signals
    .filter((signal) => signal.status === 'attention' || signal.status === 'review')
    .map((signal) => signal.detail);
  if (tips.length > 0) return tips;
  return [
    'Keep company details current and make every casting brief clear, specific, and free of payment requests.',
  ];
};

const getAdminCuesFromSignals = (signals: RecruiterTrustSignal[]) => {
  const cues = signals
    .filter((signal) => signal.status === 'attention' || signal.status === 'review')
    .map((signal) => `${titleCase(signal.status)}: ${signal.detail}`);
  if (cues.length > 0) return cues;
  return ['No immediate recruiter trust cues require action.'];
};
