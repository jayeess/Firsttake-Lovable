import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';
import { createNotification } from '@/app/lib/notification-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request);
    const body = (await request.json()) as { auditionId?: string };
    const auditionId = body.auditionId?.trim();
    if (!auditionId) throw new AdminRequestError('An audition ID is required.');

    const db = getAdminDb();
    const [account, audition] = await Promise.all([
      db.collection('users').doc(actor.uid).get(),
      db.collection('auditions').doc(auditionId).get(),
    ]);
    if (
      account.data()?.userType !== 'RECRUITER' ||
      account.data()?.accountStatus === 'SUSPENDED'
    ) {
      throw new AdminRequestError(
        'Only active Recruiter accounts can publish auditions.',
        403
      );
    }
    if (
      !audition.exists ||
      audition.data()?.recruiterId !== actor.uid ||
      audition.data()?.status !== 'ACTIVE'
    ) {
      throw new AdminRequestError('Published audition not found.', 404);
    }

    await createNotification({
      recipientId: actor.uid,
      recipientRole: 'RECRUITER',
      type: 'audition_published',
      title: 'Audition published',
      message: `${audition.data()?.title ?? 'Your audition'} is now visible to Talent.`,
      relatedEntityType: 'audition',
      relatedEntityId: auditionId,
      actionUrl: `/auditions/${auditionId}`,
      createdBy: actor.uid,
      dedupeKey: `audition-published:${auditionId}`,
    });
    return Response.json({ ok: true });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
