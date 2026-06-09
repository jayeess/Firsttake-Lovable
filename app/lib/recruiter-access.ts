import type { RecruiterProfile } from './types';

const demoApprovalKey = (uid: string) => `nata_connect_demo_approval_${uid}`;

export const hasRecruiterApproval = (
  uid: string,
  profile: RecruiterProfile | null
) => {
  if (profile?.isVerified === true) {
    return true;
  }

  return (
    process.env.NODE_ENV === 'development' &&
    typeof window !== 'undefined' &&
    (window.localStorage.getItem(demoApprovalKey(uid)) === 'approved' ||
      window.localStorage.getItem(`firsttake_demo_approval_${uid}`) ===
        'approved')
  );
};

export const setDemoRecruiterApproval = (uid: string) => {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(demoApprovalKey(uid), 'approved');
};
