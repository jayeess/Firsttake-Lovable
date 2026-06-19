import type {
  TalentVerificationStatus,
} from './types';

export const canSubmitTalentVerification = (
  status: TalentVerificationStatus,
  score: number
) =>
  score >= 70 &&
  (status === 'not_submitted' || status === 'rejected');

export const isVerifiedTalent = (status?: TalentVerificationStatus) =>
  status === 'verified';

export const canAdminSetTalentVerification = (
  isAdmin: boolean,
  status: TalentVerificationStatus
) =>
  isAdmin &&
  ['pending', 'verified', 'rejected', 'suspended'].includes(status);
