import { FieldValue } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';
import {
  buildConversationNotification,
  getUnreadByAfterSend,
  isConversationParticipant,
  sanitizeMessageBody,
  validateMessageBody,
} from '@/app/lib/messaging-policy';
import {
  createNotification,
  deliverNotifications,
} from '@/app/lib/notification-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request);
    const body = (await request.json()) as {
      conversationId?: string;
      body?: string;
    };
    const conversationId = body.conversationId?.trim();
    const messageBody = sanitizeMessageBody(body.body ?? '');
    if (!conversationId) {
      throw new AdminRequestError('A conversation ID is required.');
    }
    const validationError = validateMessageBody(messageBody);
    if (validationError) throw new AdminRequestError(validationError);

    const db = getAdminDb();
    const conversationRef = db.collection('conversations').doc(conversationId);
    const accountRef = db.collection('users').doc(actor.uid);
    const [conversation, account] = await Promise.all([
      conversationRef.get(),
      accountRef.get(),
    ]);
    const data = conversation.data();
    if (
      !conversation.exists ||
      !data ||
      !isConversationParticipant(data as { participantIds: string[] }, actor.uid)
    ) {
      throw new AdminRequestError('Conversation not found.', 404);
    }
    if (account.data()?.accountStatus === 'SUSPENDED') {
      throw new AdminRequestError('Messaging is unavailable for this account.', 403);
    }
    if (data.status !== 'active') {
      throw new AdminRequestError('This conversation is read-only.', 409);
    }
    const [application, audition, recruiterVerification] = await Promise.all([
      db
        .collection('auditions')
        .doc(data.auditionId)
        .collection('applications')
        .doc(data.talentId)
        .get(),
      db.collection('auditions').doc(data.auditionId).get(),
      db.collection('recruiterVerifications').doc(data.recruiterId).get(),
    ]);
    if (
      !application.exists ||
      !audition.exists ||
      audition.data()?.recruiterId !== data.recruiterId ||
      application.data()?.talentId !== data.talentId ||
      (application.data()?.recruiterStatus ?? application.data()?.status) ===
        'WITHDRAWN' ||
      recruiterVerification.data()?.status !== 'approved'
    ) {
      throw new AdminRequestError('Messaging is no longer available for this application.', 409);
    }
    const senderRole = data.participantRoles?.[actor.uid];
    if (senderRole !== 'TALENT' && senderRole !== 'RECRUITER') {
      throw new AdminRequestError('Conversation participant role is invalid.', 403);
    }
    const recipientId = (data.participantIds as string[]).find(
      (participantId) => participantId !== actor.uid
    );
    if (!recipientId) {
      throw new AdminRequestError('Conversation recipient was not found.', 409);
    }
    const recipientAccount = await db.collection('users').doc(recipientId).get();
    if (recipientAccount.data()?.accountStatus === 'SUSPENDED') {
      throw new AdminRequestError('The other participant is unavailable.', 409);
    }

    const messageRef = conversationRef.collection('messages').doc();
    const unreadBy = getUnreadByAfterSend(data.participantIds, actor.uid);
    await db.runTransaction(async (transaction) => {
      transaction.create(messageRef, {
        conversationId,
        senderId: actor.uid,
        senderRole,
        body: messageBody,
        createdAt: FieldValue.serverTimestamp(),
        editedAt: null,
        deletedAt: null,
        moderationStatus: 'active',
        readBy: [actor.uid],
        system: false,
        metadata: {},
      });
      transaction.update(conversationRef, {
        lastMessageText: messageBody.slice(0, 180),
        lastMessageAt: FieldValue.serverTimestamp(),
        lastMessageSenderId: actor.uid,
        unreadBy,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await deliverNotifications(() =>
      createNotification(
        buildConversationNotification({
          type: 'new_message',
          recipientId,
          recipientRole:
            data.participantRoles?.[recipientId] === 'RECRUITER'
              ? 'RECRUITER'
              : 'TALENT',
          senderId: actor.uid,
          conversationId,
          auditionTitle: data.auditionTitleSnapshot,
          preview: messageBody,
        })
      )
    );
    return Response.json({ ok: true, messageId: messageRef.id });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
