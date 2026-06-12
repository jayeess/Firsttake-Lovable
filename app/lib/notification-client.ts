import type { AppNotification } from './types';
import { getFirebaseAuth } from './firebase';

const request = async <T>(
  init?: RequestInit
): Promise<T> => {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  const response = await fetch('/api/notifications', {
    ...init,
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? 'Notifications could not be loaded.');
  }
  return payload as T;
};

export const getNotifications = async () =>
  request<{ notifications: AppNotification[]; unreadCount: number }>();

export const markNotificationRead = async (notificationId: string) =>
  request<{ ok: true }>({
    method: 'POST',
    body: JSON.stringify({ action: 'mark_read', notificationId }),
  });

export const markAllNotificationsRead = async () =>
  request<{ ok: true }>({
    method: 'POST',
    body: JSON.stringify({ action: 'mark_all_read' }),
  });
