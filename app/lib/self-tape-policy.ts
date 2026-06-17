import type { Audition, Application } from './types';

export const SELF_TAPE_SUBMISSION_TYPES = ['link', 'upload'] as const;
export type SelfTapeSubmissionType = (typeof SELF_TAPE_SUBMISSION_TYPES)[number];
export type SelfTapeStatus =
  | 'not_requested'
  | 'requested'
  | 'submitted'
  | 'missing'
  | 'reviewed';

export const SELF_TAPE_MAX_INSTRUCTIONS_LENGTH = 1200;
export const SELF_TAPE_MAX_LINK_LENGTH = 500;
export const SELF_TAPE_MAX_DURATION_SECONDS = 600;
export const SELF_TAPE_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
export const SELF_TAPE_ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export const SELF_TAPE_STATUS_LABELS: Record<SelfTapeStatus, string> = {
  not_requested: 'Not requested',
  requested: 'Requested',
  submitted: 'Submitted',
  missing: 'Required missing',
  reviewed: 'Reviewed',
};

export const getInitialSelfTapeStatus = (
  audition: Pick<Audition, 'selfTapeEnabled' | 'selfTapeRequired'>
): SelfTapeStatus => {
  if (!audition.selfTapeEnabled) return 'not_requested';
  return audition.selfTapeRequired ? 'missing' : 'requested';
};

export const getSelfTapeStatus = (
  application: Pick<Application, 'selfTapeStatus' | 'selfTapeSubmission'>,
  audition?: Pick<Audition, 'selfTapeEnabled' | 'selfTapeRequired'> | null
): SelfTapeStatus => {
  if (application.selfTapeStatus) return application.selfTapeStatus;
  if (application.selfTapeSubmission?.url || application.selfTapeSubmission?.storagePath) {
    return 'submitted';
  }
  return audition ? getInitialSelfTapeStatus(audition) : 'not_requested';
};

export const validateSelfTapeInstructions = (value?: string) => {
  const instructions = (value ?? '').trim();
  if (instructions.length > SELF_TAPE_MAX_INSTRUCTIONS_LENGTH) {
    throw new Error(
      `Self-tape instructions must be ${SELF_TAPE_MAX_INSTRUCTIONS_LENGTH} characters or less.`
    );
  }
  if (/<\/?[a-z][\s\S]*>/i.test(instructions)) {
    throw new Error('Self-tape instructions cannot contain HTML.');
  }
  return instructions;
};

export const normalizeSelfTapeSubmissionTypes = (
  enabled: boolean,
  values?: string[]
): SelfTapeSubmissionType[] => {
  if (!enabled) return [];
  const selected = Array.from(
    new Set((values ?? ['link']).filter((value): value is SelfTapeSubmissionType =>
      SELF_TAPE_SUBMISSION_TYPES.includes(value as SelfTapeSubmissionType)
    ))
  );
  return selected.length > 0 ? selected : ['link'];
};

export const validateSelfTapeLink = (value?: string) => {
  const url = (value ?? '').trim();
  if (!url) throw new Error('Add a self-tape video link.');
  if (url.length > SELF_TAPE_MAX_LINK_LENGTH) {
    throw new Error(
      `Self-tape links must be ${SELF_TAPE_MAX_LINK_LENGTH} characters or less.`
    );
  }
  if (/<\/?[a-z][\s\S]*>/i.test(url)) {
    throw new Error('Self-tape links cannot contain HTML.');
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Enter a valid self-tape URL.');
  }
  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error('Self-tape links must use http or https.');
  }
  return parsed.toString();
};

export const getSelfTapeBadgeTone = (status: SelfTapeStatus) =>
  status === 'submitted' || status === 'reviewed'
    ? 'success'
    : status === 'missing'
      ? 'danger'
      : status === 'requested'
        ? 'attention'
        : 'muted';
