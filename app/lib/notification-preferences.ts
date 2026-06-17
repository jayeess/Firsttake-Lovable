import type { NotificationPreferences, NotificationType } from './types';

export type EmailNotificationCategory =
  | 'message'
  | 'application'
  | 'verification'
  | 'selfTape'
  | 'safety'
  | 'marketing';

export const DEFAULT_NOTIFICATION_PREFERENCES: Required<NotificationPreferences> = {
  emailEnabled: true,
  messageEmails: true,
  applicationUpdateEmails: true,
  verificationEmails: true,
  selfTapeEmails: true,
  safetyEmails: true,
  marketingEmails: false,
};

export const normalizeNotificationPreferences = (
  value?: NotificationPreferences | null
): Required<NotificationPreferences> => ({
  ...DEFAULT_NOTIFICATION_PREFERENCES,
  ...(value ?? {}),
  marketingEmails: value?.marketingEmails ?? false,
  safetyEmails: true,
});

export const getEmailCategoryForNotification = (
  type: NotificationType
): EmailNotificationCategory | null => {
  if (type === 'new_message') return 'message';
  if (
    [
      'application_shortlisted',
      'application_rejected',
      'application_selected',
    ].includes(type)
  ) {
    return 'application';
  }
  if (
    [
      'recruiter_verification_approved',
      'recruiter_verification_rejected',
      'talent_verified',
      'talent_rejected',
    ].includes(type)
  ) {
    return 'verification';
  }
  if (type === 'self_tape_submitted' || type === 'self_tape_reviewed') {
    return 'selfTape';
  }
  if (
    [
      'report_resolved',
      'content_removed',
      'account_suspended',
      'conversation_blocked',
      'public_profile_admin_disabled',
    ].includes(type)
  ) {
    return 'safety';
  }
  return null;
};

export const canSendEmailForCategory = (
  preferences: NotificationPreferences | null | undefined,
  category: EmailNotificationCategory
) => {
  const normalized = normalizeNotificationPreferences(preferences);
  if (category === 'marketing') return normalized.marketingEmails === true;
  if (category === 'safety') return normalized.safetyEmails !== false;
  if (!normalized.emailEnabled) return false;
  if (category === 'message') return normalized.messageEmails !== false;
  if (category === 'application') {
    return normalized.applicationUpdateEmails !== false;
  }
  if (category === 'verification') {
    return normalized.verificationEmails !== false;
  }
  if (category === 'selfTape') return normalized.selfTapeEmails !== false;
  return false;
};
