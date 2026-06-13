import { FieldValue } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
  writeAuditLog,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';
import {
  buildPublicTalentProfile,
  canPublishTalentProfile,
  normalizePublicTalentSlug,
  validatePublicTalentSlug,
} from '@/app/lib/public-talent-profile-policy';
import {
  createNotification,
  deliverNotifications,
} from '@/app/lib/notification-server';
import type { TalentMedia, TalentProfile } from '@/app/lib/types';

export const runtime = 'nodejs';

type PublicProfileAction = 'enable' | 'disable' | 'updateSlug' | 'refresh';

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request);
    const body = (await request.json()) as {
      action?: PublicProfileAction;
      slug?: string;
      showLocation?: boolean;
      showSocialLinks?: boolean;
    };
    if (!body.action || !['enable', 'disable', 'updateSlug', 'refresh'].includes(body.action)) {
      throw new AdminRequestError('A valid public profile action is required.');
    }

    const db = getAdminDb();
    const accountRef = db.collection('users').doc(actor.uid);
    const profileRef = accountRef.collection('talentProfiles').doc(actor.uid);
    const [account, profileSnapshot] = await Promise.all([
      accountRef.get(),
      profileRef.get(),
    ]);
    if (
      account.data()?.userType !== 'TALENT' ||
      account.data()?.accountStatus === 'SUSPENDED'
    ) {
      throw new AdminRequestError('An active Talent account is required.', 403);
    }
    if (!profileSnapshot.exists) {
      throw new AdminRequestError('Save your Talent profile before publishing it.', 409);
    }

    const currentProfile = profileSnapshot.data() as TalentProfile;
    const oldSlug = currentProfile.publicSlug ?? '';
    const requestedSlug = normalizePublicTalentSlug(body.slug ?? oldSlug);

    if (body.action === 'disable') {
      await db.runTransaction(async (transaction) => {
        transaction.set(
          profileRef,
          {
            publicProfileEnabled: false,
            publicProfileUpdatedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        if (oldSlug) {
          transaction.delete(db.collection('publicTalentProfiles').doc(oldSlug));
        }
      });
      await writeAuditLog({
        action: 'public_profile_disabled',
        actor,
        targetId: actor.uid,
        targetType: 'talent',
        metadata: { slug: oldSlug },
      });
      await deliverNotifications(() =>
        createNotification({
          recipientId: actor.uid,
          recipientRole: 'TALENT',
          type: 'public_profile_disabled',
          title: 'Public profile disabled',
          message: 'Your shareable Talent profile is no longer publicly available.',
          relatedEntityType: 'public_profile',
          relatedEntityId: oldSlug,
          actionUrl: '/talent/profile',
          createdBy: actor.uid,
        })
      );
      return Response.json({ ok: true, enabled: false, slug: oldSlug });
    }

    const slugError = validatePublicTalentSlug(requestedSlug);
    if (slugError) throw new AdminRequestError(slugError);
    if (!canPublishTalentProfile(currentProfile)) {
      throw new AdminRequestError(
        'Add your name, location, and professional bio before publishing.',
        409
      );
    }

    const mediaSnapshot = await profileRef.collection('media').get();
    const media = mediaSnapshot.docs.map(
      (item) => ({ id: item.id, ...item.data() }) as TalentMedia
    );
    const profile: TalentProfile = {
      ...currentProfile,
      publicShowLocation:
        body.showLocation ?? currentProfile.publicShowLocation ?? true,
      publicShowSocialLinks:
        body.showSocialLinks ?? currentProfile.publicShowSocialLinks ?? true,
    };
    const publicRecord = buildPublicTalentProfile({
      uid: actor.uid,
      slug: requestedSlug,
      profile,
      media,
    });
    const publicRef = db.collection('publicTalentProfiles').doc(requestedSlug);

    await db.runTransaction(async (transaction) => {
      const existingPublic = await transaction.get(publicRef);
      if (existingPublic.exists && existingPublic.data()?.uid !== actor.uid) {
        throw new AdminRequestError('That public profile address is already in use.', 409);
      }

      transaction.set(
        publicRef,
        {
          ...publicRecord,
          createdAt: existingPublic.exists
            ? existingPublic.data()?.createdAt ?? FieldValue.serverTimestamp()
            : FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: false }
      );
      if (oldSlug && oldSlug !== requestedSlug) {
        transaction.delete(db.collection('publicTalentProfiles').doc(oldSlug));
      }
      transaction.set(
        profileRef,
        {
          publicProfileEnabled: true,
          publicSlug: requestedSlug,
          publicShowLocation: profile.publicShowLocation,
          publicShowSocialLinks: profile.publicShowSocialLinks,
          publicProfileCreatedAt:
            currentProfile.publicProfileCreatedAt ?? FieldValue.serverTimestamp(),
          publicProfileUpdatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    const slugChanged = Boolean(oldSlug && oldSlug !== requestedSlug);
    const newlyEnabled = !currentProfile.publicProfileEnabled;
    const event = slugChanged
      ? 'public_slug_changed'
      : newlyEnabled
        ? 'public_profile_enabled'
        : 'public_profile_refreshed';
    await writeAuditLog({
      action: event,
      actor,
      targetId: actor.uid,
      targetType: 'talent',
      metadata: { slug: requestedSlug, previousSlug: oldSlug || null },
    });
    if (slugChanged || newlyEnabled) {
      await deliverNotifications(() =>
        createNotification({
          recipientId: actor.uid,
          recipientRole: 'TALENT',
          type: slugChanged ? 'public_slug_changed' : 'public_profile_enabled',
          title: slugChanged
            ? 'Public profile address changed'
            : 'Public profile enabled',
          message: slugChanged
            ? `Your public profile now uses /t/${requestedSlug}.`
            : `Your Talent profile is now available at /t/${requestedSlug}.`,
          relatedEntityType: 'public_profile',
          relatedEntityId: requestedSlug,
          actionUrl: `/t/${requestedSlug}`,
          createdBy: actor.uid,
        })
      );
    }

    return Response.json({
      ok: true,
      enabled: true,
      slug: requestedSlug,
      publicMediaCount: publicRecord.media.length,
    });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
