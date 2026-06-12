import { FieldValue } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';

export const runtime = 'nodejs';

const requireTalent = async (request: Request) => {
  const actor = await requireUser(request);
  const account = await getAdminDb().collection('users').doc(actor.uid).get();
  if (
    account.data()?.userType !== 'TALENT' ||
    account.data()?.accountStatus === 'SUSPENDED'
  ) {
    throw new AdminRequestError(
      'Only active Talent accounts can save auditions.',
      403
    );
  }
  return actor;
};

export async function POST(request: Request) {
  try {
    const actor = await requireTalent(request);
    const body = (await request.json()) as { auditionId?: string };
    const auditionId = body.auditionId?.trim();
    if (!auditionId) throw new AdminRequestError('An audition ID is required.');

    const db = getAdminDb();
    const audition = await db.collection('auditions').doc(auditionId).get();
    const data = audition.data();
    if (
      !audition.exists ||
      data?.status !== 'ACTIVE' ||
      data?.moderationStatus === 'REMOVED'
    ) {
      throw new AdminRequestError('This audition is not available to save.', 404);
    }

    await db
      .collection('users')
      .doc(actor.uid)
      .collection('savedAuditions')
      .doc(auditionId)
      .set({
        auditionId,
        savedAt: FieldValue.serverTimestamp(),
        titleSnapshot: data.title ?? 'Audition',
        recruiterId: data.recruiterId,
        deadlineSnapshot: data.deadline,
      });
    return Response.json({ ok: true });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireTalent(request);
    const body = (await request.json()) as { auditionId?: string };
    const auditionId = body.auditionId?.trim();
    if (!auditionId) throw new AdminRequestError('An audition ID is required.');

    await getAdminDb()
      .collection('users')
      .doc(actor.uid)
      .collection('savedAuditions')
      .doc(auditionId)
      .delete();
    return Response.json({ ok: true });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
