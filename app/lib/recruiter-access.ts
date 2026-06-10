import type { RecruiterProfile } from './types';

export const hasRecruiterApproval = (
  uid: string,
  profile: RecruiterProfile | null
) => {
  void uid;
  return profile?.verificationStatus === 'approved' || profile?.isVerified === true;
};
