import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';
import { isConversationParticipant } from '@/app/lib/messaging-policy';
import { serializeMessagingDocument } from '@/app/lib/messaging-server';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireUser(request);
    const { id } = await params;
    const db = getAdminDb();
    const conversation = await db.collection('conversations').doc(id).get();
    if (
      !conversation.exists ||
      !isConversationParticipant(
        conversation.data() as { participantIds: string[] },
        actor.uid
      )
    ) {
      throw new AdminRequestError('Conversation not found.', 404);
    }
    const messages = await conversation.ref
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .limit(300)
      .get();
    return Response.json({
      conversation: serializeMessagingDocument(id, conversation.data()!),
      messages: messages.docs.map((item) =>
        serializeMessagingDocument(item.id, item.data())
      ),
    });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
