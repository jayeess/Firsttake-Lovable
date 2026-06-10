import type {
  AccountStatus,
  ModerationStatus,
  VerificationStatus,
} from './types';

export const canResubmitVerification = (status: VerificationStatus) =>
  status === 'not_submitted' || status === 'rejected';

export const canRecruiterPost = (
  verificationStatus: VerificationStatus,
  accountStatus: AccountStatus
) => verificationStatus === 'approved' && accountStatus === 'ACTIVE';

export const isAuditionDiscoverable = (
  status: string,
  moderationStatus?: ModerationStatus
) => status === 'ACTIVE' && moderationStatus !== 'REMOVED';

export const isPrivilegedAdminAction = (isAdmin: boolean) => isAdmin;
