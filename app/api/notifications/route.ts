import {
  FieldValue,
  type DocumentData,
} from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';

export const runtime = 'nodejs';

const serializeNotification = (
  id: string,
  data: DocumentData
): Record<string, unknown> & { id: string; read: boolean } => ({
  id,
  ...data,
  read: data.read === true,
  createdAt:
    typeof data.createdAt?.toDate === 'function'
      ? data.createdAt.toDate().toISOString()
      : null,
});

export async function GET(request: Request) {
  try {
    const actor = await requireUser(request);
    const snapshot = await getAdminDb()
      .collection('notifications')
      .where('recipientId', '==', actor.uid)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    const notifications = snapshot.docs.map((item) =>
      serializeNotification(item.id, item.data())
    );
    return Response.json({
      notifications,
      unreadCount: notifications.filter((item) => item.read !== true).length,
    });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request);
    const body = (await request.json()) as {
      action?: string;
      notificationId?: string;
    };
    const db = getAdminDb();

    if (body.action === 'mark_read') {
      if (!body.notificationId) {
        throw new AdminRequestError('A notification ID is required.');
      }
      const ref = db.collection('notifications').doc(body.notificationId);
      const snapshot = await ref.get();
      if (!snapshot.exists || snapshot.data()?.recipientId !== actor.uid) {
        throw new AdminRequestError('Notification not found.', 404);
      }
      await ref.update({ read: true, readAt: FieldValue.serverTimestamp() });
      return Response.json({ ok: true });
    }

    if (body.action === 'mark_all_read') {
      const snapshot = await db
        .collection('notifications')
        .where('recipientId', '==', actor.uid)
        .where('read', '==', false)
        .get();
      const batch = db.batch();
      snapshot.docs.forEach((item) => {
        batch.update(item.ref, {
          read: true,
          readAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
      return Response.json({ ok: true });
    }

    throw new AdminRequestError('A valid notification action is required.');
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
