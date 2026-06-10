import type { AuditionStatus } from './types';

export type ApplicationPolicyInput = {
  auditionExists: boolean;
  alreadyApplied: boolean;
  status?: AuditionStatus;
  deadline?: Date;
  now?: Date;
};

export const getApplicationPolicyError = ({
  auditionExists,
  alreadyApplied,
  status,
  deadline,
  now = new Date(),
}: ApplicationPolicyInput): string | null => {
  if (!auditionExists) {
    return 'This audition no longer exists.';
  }

  if (alreadyApplied) {
    return 'You have already applied for this audition.';
  }

  if (status !== 'ACTIVE') {
    return 'This audition is not accepting applications.';
  }

  if (!deadline || deadline.getTime() < now.getTime()) {
    return 'The application deadline has passed.';
  }

  return null;
};
