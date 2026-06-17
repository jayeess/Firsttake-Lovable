export const BETA_FEEDBACK_TYPES = [
  'bug',
  'confusion',
  'feature_request',
  'general',
  'safety',
] as const;

export type BetaFeedbackType = (typeof BETA_FEEDBACK_TYPES)[number];

export type BetaFeedbackInput = {
  type?: string;
  rating?: number | string | null;
  message?: string;
  route?: string;
  contactEmail?: string;
};

export type ValidatedBetaFeedback = {
  type: BetaFeedbackType;
  rating: number | null;
  message: string;
  route: string;
  contactEmail: string;
};

const isFeedbackType = (value: string): value is BetaFeedbackType =>
  BETA_FEEDBACK_TYPES.includes(value as BetaFeedbackType);

export const validateBetaFeedback = (
  input: BetaFeedbackInput
): ValidatedBetaFeedback => {
  const type = input.type?.trim() ?? 'general';
  if (!isFeedbackType(type)) {
    throw new Error('Choose a valid feedback type.');
  }

  const message = input.message?.trim() ?? '';
  if (message.length < 10) {
    throw new Error('Feedback must be at least 10 characters.');
  }
  if (message.length > 2000) {
    throw new Error('Feedback must be 2000 characters or less.');
  }

  const ratingValue =
    input.rating === '' || input.rating === null || input.rating === undefined
      ? null
      : Number(input.rating);
  if (
    ratingValue !== null &&
    (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5)
  ) {
    throw new Error('Rating must be between 1 and 5.');
  }

  const route = (input.route ?? '').trim().slice(0, 180);
  const contactEmail = (input.contactEmail ?? '').trim().slice(0, 180);
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error('Enter a valid contact email or leave it blank.');
  }

  return {
    type,
    rating: ratingValue,
    message,
    route,
    contactEmail,
  };
};
