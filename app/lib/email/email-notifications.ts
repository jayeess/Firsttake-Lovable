import 'server-only';

import type { NotificationInput } from '../notification-policy';
import { getAppBaseUrl } from '../app-url';
import { getAdminDb } from '../firebase-admin';
import {
  canSendEmailForCategory,
  getEmailCategoryForNotification,
  normalizeNotificationPreferences,
} from '../notification-preferences';
import { logServerEvent } from '../server-logger';
import type { NotificationPreferences } from '../types';
import { buildNotificationEmail } from './email-templates';
import { sendEmail } from './email-provider';

type UserEmailSettings = {
  email: string;
  preferences: NotificationPreferences;
};

const getUserEmailSettings = async (
  uid: string
): Promise<UserEmailSettings | null> => {
  const snapshot = await getAdminDb().collection('users').doc(uid).get();
  const data = snapshot.data();
  if (!snapshot.exists || typeof data?.email !== 'string' || !data.email.trim()) {
    return null;
  }
  return {
    email: data.email.trim(),
    preferences: normalizeNotificationPreferences(
      data.notificationPreferences as NotificationPreferences | undefined
    ),
  };
};

export const deliverEmailForNotification = async (
  notification: NotificationInput
) => {
  const category = getEmailCategoryForNotification(notification.type);
  if (!category) return;

  try {
    const settings = await getUserEmailSettings(notification.recipientId);
    if (!settings) {
      logServerEvent('info', 'email_notification_skipped', {
        reason: 'missing_email',
        type: notification.type,
        category,
      });
      return;
    }
    if (!canSendEmailForCategory(settings.preferences, category)) {
      logServerEvent('info', 'email_notification_skipped', {
        reason: 'preference_disabled',
        type: notification.type,
        category,
      });
      return;
    }
    const email = buildNotificationEmail({
      notification,
      appBaseUrl: getAppBaseUrl(),
    });
    await sendEmail({
      to: settings.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
  } catch (error: unknown) {
    logServerEvent('warn', 'email_notification_failed_safely', {
      type: notification.type,
      category,
      name: error instanceof Error ? error.name : 'UnknownError',
    });
  }
};
