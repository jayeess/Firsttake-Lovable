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
    const body = (await request.json()) as {
      event?: 'profile_photo_uploaded' | 'portfolio_media_added';
      mediaId?: string;
    };
    const db = getAdminDb();
    const account = await db.collection('users').doc(actor.uid).get();
    if (
      account.data()?.userType !== 'TALENT' ||
      account.data()?.accountStatus === 'SUSPENDED'
    ) {
      throw new AdminRequestError('An active Talent account is required.', 403);
    }

    if (body.event === 'profile_photo_uploaded') {
      const profile = await db
        .collection('users')
        .doc(actor.uid)
        .collection('talentProfiles')
        .doc(actor.uid)
        .get();
      if (!profile.data()?.profilePhotoPath) {
        throw new AdminRequestError('Profile photo could not be confirmed.', 409);
      }
      await createNotification({
        recipientId: actor.uid,
        recipientRole: 'TALENT',
        type: 'talent_profile_photo_uploaded',
        title: 'Profile photo updated',
        message: 'Your new profile photo is ready for recruiter review.',
        relatedEntityType: 'media',
        relatedEntityId: 'profile-photo',
        actionUrl: '/talent/profile',
        createdBy: actor.uid,
      });
      return Response.json({ ok: true });
    }

    if (body.event === 'portfolio_media_added' && body.mediaId) {
      const media = await db
        .collection('users')
        .doc(actor.uid)
        .collection('talentProfiles')
        .doc(actor.uid)
        .collection('media')
        .doc(body.mediaId)
        .get();
      if (!media.exists || media.data()?.ownerId !== actor.uid) {
        throw new AdminRequestError('Portfolio media could not be confirmed.', 409);
      }
      await createNotification({
        recipientId: actor.uid,
        recipientRole: 'TALENT',
        type: 'talent_portfolio_media_added',
        title: 'Portfolio media added',
        message: `${media.data()?.title || 'Your portfolio item'} is now part of your Talent profile.`,
        relatedEntityType: 'media',
        relatedEntityId: body.mediaId,
        actionUrl: '/talent/profile',
        createdBy: actor.uid,
      });
      return Response.json({ ok: true });
    }

    throw new AdminRequestError('A valid media event is required.');
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
