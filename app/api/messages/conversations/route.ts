import { FieldValue } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
  writeAuditLog,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';
import {
  buildConversationNotification,
} from '@/app/lib/messaging-policy';
import {
  getMessagingContext,
  serializeMessagingDocument,
} from '@/app/lib/messaging-server';
import {
  createNotification,
  deliverNotifications,
} from '@/app/lib/notification-server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const actor = await requireUser(request);
    const snapshot = await getAdminDb()
      .collection('conversations')
      .where('participantIds', 'array-contains', actor.uid)
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .get();
    return Response.json({
      conversations: snapshot.docs.map((item) =>
        serializeMessagingDocument(item.id, item.data())
      ),
    });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request);
    const body = (await request.json()) as {
      applicationId?: string;
      auditionId?: string;
    };
    const auditionId = body.auditionId?.trim();
    const talentId = body.applicationId?.trim();
    if (!auditionId || !talentId) {
      throw new AdminRequestError('A valid application is required.');
    }
    const context = await getMessagingContext({ actor, auditionId, talentId });
    const conversationRef = context.db
      .collection('conversations')
      .doc(context.conversationId);
    const existing = await conversationRef.get();
    if (!existing.exists) {
      await conversationRef.create({
        applicationId: talentId,
        auditionId,
        recruiterId: context.recruiterId,
        talentId,
        participantIds: [context.recruiterId, talentId],
        participantRoles: {
          [context.recruiterId]: 'RECRUITER',
          [talentId]: 'TALENT',
        },
        titleSnapshot: context.auditionData.title,
        auditionTitleSnapshot: context.auditionData.title,
        talentNameSnapshot: context.talentName,
        recruiterNameSnapshot: context.recruiterName,
        applicationStatus: context.status,
        lastMessageText: '',
        lastMessageAt: null,
        lastMessageSenderId: null,
        unreadBy: [],
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: actor.uid,
      });
      const recipientId =
        actor.uid === context.recruiterId ? talentId : context.recruiterId;
      const recipientRole =
        recipientId === context.recruiterId ? 'RECRUITER' : 'TALENT';
      await deliverNotifications(() =>
        createNotification(
          buildConversationNotification({
            type: 'conversation_started',
            recipientId,
            recipientRole,
            senderId: actor.uid,
            conversationId: context.conversationId,
            auditionTitle: context.auditionData.title,
          })
        )
      );
      if (actor.uid === context.recruiterId) {
        await writeAuditLog({
          action: 'conversation_started',
          actor,
          targetId: context.conversationId,
          targetType: 'conversation',
          metadata: { auditionId, talentId },
        });
      }
    }
    return Response.json({
      ok: true,
      conversationId: context.conversationId,
      created: !existing.exists,
    });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
