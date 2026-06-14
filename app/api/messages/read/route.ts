import { FieldValue } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';
import { isConversationParticipant } from '@/app/lib/messaging-policy';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request);
    const body = (await request.json()) as { conversationId?: string };
    const conversationId = body.conversationId?.trim();
    if (!conversationId) {
      throw new AdminRequestError('A conversation ID is required.');
    }
    const db = getAdminDb();
    const ref = db.collection('conversations').doc(conversationId);
    const conversation = await ref.get();
    if (
      !conversation.exists ||
      !isConversationParticipant(
        conversation.data() as { participantIds: string[] },
        actor.uid
      )
    ) {
      throw new AdminRequestError('Conversation not found.', 404);
    }
    const batch = db.batch();
    batch.update(ref, {
      unreadBy: FieldValue.arrayRemove(actor.uid),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const allMessages = await ref.collection('messages').limit(300).get();
    allMessages.docs.forEach((message) => {
      if (!(message.data().readBy ?? []).includes(actor.uid)) {
        batch.update(message.ref, { readBy: FieldValue.arrayUnion(actor.uid) });
      }
    });
    await batch.commit();
    return Response.json({ ok: true });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
