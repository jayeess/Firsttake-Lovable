import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from './firebase-admin';
import {
  buildNotificationRecord,
  getNotificationDocumentId,
  type NotificationInput,
} from './notification-policy';

export const createNotification = async (input: NotificationInput) => {
  const db = getAdminDb();
  const id = getNotificationDocumentId(input.dedupeKey);
  const ref = id
    ? db.collection('notifications').doc(id)
    : db.collection('notifications').doc();
  const data = {
    ...buildNotificationRecord(input),
    createdAt: FieldValue.serverTimestamp(),
  };

  if (id) {
    try {
      await ref.create(data);
      return ref.id;
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String(error.code)
          : '';
      if (code === '6' || code.includes('already-exists')) return ref.id;
      throw error;
    }
  }

  await ref.set(data);
  return ref.id;
};

export const createNotifications = async (inputs: NotificationInput[]) => {
  await Promise.all(inputs.map(createNotification));
};

export const notifyAdmins = async (
  input: Omit<NotificationInput, 'recipientId' | 'recipientRole'>
) => {
  const snapshot = await getAdminDb()
    .collection('users')
    .where('isAdmin', '==', true)
    .get();
  await createNotifications(
    snapshot.docs.map((admin) => ({
      ...input,
      recipientId: admin.id,
      recipientRole: 'ADMIN',
      dedupeKey: input.dedupeKey
        ? `${input.dedupeKey}:admin:${admin.id}`
        : undefined,
    }))
  );
};

export const deliverNotifications = async (work: () => Promise<unknown>) => {
  try {
    await work();
  } catch (error: unknown) {
    console.error('Notification delivery failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
  }
};
