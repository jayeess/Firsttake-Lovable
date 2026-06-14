import { FieldValue } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireAdmin,
  writeAuditLog,
} from '@/app/lib/admin-server';
import { getAdminAuth, getAdminDb } from '@/app/lib/firebase-admin';
import {
  createNotification,
  createNotifications,
  deliverNotifications,
} from '@/app/lib/notification-server';
import type { NotificationInput } from '@/app/lib/notification-policy';

export const runtime = 'nodejs';

const allowedActions = new Set([
  'approve_recruiter',
  'reject_recruiter',
  'suspend_recruiter',
  'restore_recruiter',
  'verify_talent',
  'reject_talent',
  'suspend_talent',
  'restore_talent',
  'suspend_user',
  'restore_user',
  'remove_audition',
  'restore_audition',
  'hide_media',
  'remove_media',
  'restore_media',
  'disable_public_profile',
  'block_conversation',
]);

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const body = (await request.json()) as {
      action?: string;
      targetId?: string;
      reason?: string;
    };
    const action = body.action?.trim();
    const targetId = body.targetId?.trim();
    const reason = body.reason?.trim().slice(0, 1000);

    if (!action || !allowedActions.has(action) || !targetId) {
      throw new AdminRequestError('A valid action and target are required.');
    }
    if (
      [
        'reject_recruiter',
        'suspend_recruiter',
        'reject_talent',
        'suspend_talent',
        'suspend_user',
        'remove_audition',
        'hide_media',
        'remove_media',
        'disable_public_profile',
        'block_conversation',
      ].includes(action) &&
      !reason
    ) {
      throw new AdminRequestError('A reason is required for this action.');
    }

    const db = getAdminDb();
    const now = FieldValue.serverTimestamp();
    let notification: NotificationInput | null = null;

    if (
      ['approve_recruiter', 'reject_recruiter', 'suspend_recruiter', 'restore_recruiter'].includes(action)
    ) {
      const status =
        action === 'approve_recruiter'
          ? 'approved'
          : action === 'reject_recruiter'
            ? 'rejected'
            : action === 'suspend_recruiter'
              ? 'suspended'
              : 'approved';
      const verificationRef = db.collection('recruiterVerifications').doc(targetId);
      const verification = await verificationRef.get();
      if (!verification.exists) {
        throw new AdminRequestError('Verification request was not found.', 404);
      }
      await db.runTransaction(async (transaction) => {
        transaction.update(verificationRef, {
          status,
          adminNote: reason ?? '',
          reviewedBy: actor.uid,
          reviewedAt: now,
          updatedAt: now,
        });
        transaction.set(
          db.collection('users').doc(targetId),
          {
            verificationStatus: status,
            accountStatus: status === 'suspended' ? 'SUSPENDED' : 'ACTIVE',
            updatedAt: now,
          },
          { merge: true }
        );
        transaction.set(
          db
            .collection('users')
            .doc(targetId)
            .collection('recruiterProfiles')
            .doc(targetId),
          {
            isVerified: status === 'approved',
            verificationStatus: status,
            updatedAt: now,
          },
          { merge: true }
        );
      });
      await writeAuditLog({
        action:
          action === 'restore_recruiter'
            ? 'recruiter_restored'
            : `recruiter_${status}`,
        actor,
        targetId,
        targetType: 'recruiter',
        reason,
      });
      notification = {
        recipientId: targetId,
        recipientRole: 'RECRUITER',
        type:
          action === 'restore_recruiter'
            ? 'user_restored'
            : status === 'approved'
            ? 'recruiter_verification_approved'
            : status === 'rejected'
              ? 'recruiter_verification_rejected'
              : status === 'suspended'
                ? 'user_suspended'
                : 'user_restored',
        title:
          action === 'restore_recruiter'
            ? 'Recruiter account restored'
            : status === 'approved'
            ? 'Recruiter verification approved'
            : status === 'rejected'
              ? 'Recruiter verification needs changes'
              : status === 'suspended'
                ? 'Recruiter account suspended'
                : 'Recruiter account restored',
        message:
          reason ||
          (action === 'restore_recruiter'
            ? 'Your recruiter account access has been restored.'
            : status === 'approved'
            ? 'Your company is verified and can publish casting calls.'
              : 'Your recruiter account status has been updated.'),
        relatedEntityType: 'verification',
        relatedEntityId: targetId,
        actionUrl: '/recruiter/verification',
        createdBy: actor.uid,
        priority:
          status === 'approved' && action !== 'restore_recruiter'
            ? 'HIGH'
            : 'NORMAL',
      };
    } else if (
      ['verify_talent', 'reject_talent', 'suspend_talent', 'restore_talent'].includes(
        action
      )
    ) {
      const status =
        action === 'verify_talent' || action === 'restore_talent'
          ? 'verified'
          : action === 'reject_talent'
            ? 'rejected'
            : 'suspended';
      const verificationRef = db.collection('talentVerifications').doc(targetId);
      const verification = await verificationRef.get();
      if (!verification.exists) {
        throw new AdminRequestError(
          'Talent verification request was not found.',
          404
        );
      }
      const currentStatus = verification.data()?.talentVerificationStatus;
      if (
        (action === 'verify_talent' || action === 'reject_talent') &&
        currentStatus !== 'pending'
      ) {
        throw new AdminRequestError(
          'Only pending Talent requests can be reviewed.'
        );
      }
      if (action === 'restore_talent' && currentStatus !== 'suspended') {
        throw new AdminRequestError(
          'Only suspended Talent verification can be restored.'
        );
      }

      const profileRef = db
        .collection('users')
        .doc(targetId)
        .collection('talentProfiles')
        .doc(targetId);
      await db.runTransaction(async (transaction) => {
        transaction.update(verificationRef, {
          talentVerificationStatus: status,
          identityVerificationNote:
            action === 'verify_talent' ? reason ?? '' : '',
          rejectedReason:
            action === 'reject_talent' || action === 'suspend_talent'
              ? reason
              : '',
          reviewedBy: actor.uid,
          reviewedAt: now,
          verifiedAt: status === 'verified' ? now : null,
          updatedAt: now,
        });
        transaction.set(
          profileRef,
          {
            talentVerificationStatus: status,
            verifiedAt: status === 'verified' ? now : null,
            updatedAt: now,
          },
          { merge: true }
        );
        transaction.set(
          db.collection('users').doc(targetId),
          {
            talentVerificationStatus: status,
            accountStatus: status === 'suspended' ? 'SUSPENDED' : 'ACTIVE',
            updatedAt: now,
          },
          { merge: true }
        );
      });
      await getAdminAuth().updateUser(targetId, {
        disabled: status === 'suspended',
      });
      await writeAuditLog({
        action:
          action === 'verify_talent'
            ? 'talent_verified'
            : action === 'reject_talent'
              ? 'talent_rejected'
              : action === 'suspend_talent'
                ? 'talent_suspended'
                : 'talent_restored',
        actor,
        targetId,
        targetType: 'talent',
        reason,
      });
      notification = {
        recipientId: targetId,
        recipientRole: 'TALENT',
        type:
          action === 'restore_talent'
            ? 'user_restored'
            : status === 'verified'
            ? 'talent_verified'
            : status === 'rejected'
              ? 'talent_rejected'
              : status === 'suspended'
                ? 'user_suspended'
                : 'user_restored',
        title:
          action === 'restore_talent'
            ? 'Talent account restored'
            : status === 'verified'
            ? 'Talent profile verified'
            : status === 'rejected'
              ? 'Talent verification needs changes'
              : status === 'suspended'
                ? 'Talent account suspended'
                : 'Talent account restored',
        message:
          reason ||
          (action === 'restore_talent'
            ? 'Your Talent account access has been restored.'
            : status === 'verified'
            ? 'Your verified Talent badge is now active.'
              : 'Your Talent verification status has been updated.'),
        relatedEntityType: 'verification',
        relatedEntityId: targetId,
        actionUrl: '/talent/profile',
        createdBy: actor.uid,
        priority:
          status === 'verified' && action !== 'restore_talent'
            ? 'HIGH'
            : 'NORMAL',
      };
    } else if (action === 'block_conversation') {
      const conversationRef = db.collection('conversations').doc(targetId);
      const conversation = await conversationRef.get();
      if (!conversation.exists) {
        throw new AdminRequestError('Conversation was not found.', 404);
      }
      await conversationRef.update({
        status: 'blocked',
        moderationReason: reason,
        moderatedBy: actor.uid,
        moderatedAt: now,
        updatedAt: now,
      });
      await writeAuditLog({
        action: 'conversation_blocked',
        actor,
        targetId,
        targetType: 'conversation',
        reason,
        metadata: {
          auditionId: conversation.data()?.auditionId,
          applicationId: conversation.data()?.applicationId,
        },
      });
      await deliverNotifications(() =>
        createNotifications(
          (conversation.data()?.participantIds ?? []).map((participantId: string) => ({
            recipientId: participantId,
            recipientRole:
              conversation.data()?.participantRoles?.[participantId] ===
              'RECRUITER'
                ? 'RECRUITER'
                : 'TALENT',
            type: 'conversation_closed',
            title: 'Conversation closed',
            message:
              reason ||
              'This conversation was closed by the Nata Connect trust team.',
            relatedEntityType: 'conversation',
            relatedEntityId: targetId,
            actionUrl: `/messages/${targetId}`,
            createdBy: actor.uid,
            priority: 'HIGH',
          }))
        )
      );
    } else if (action === 'disable_public_profile') {
      const profileRef = db
        .collection('users')
        .doc(targetId)
        .collection('talentProfiles')
        .doc(targetId);
      const profile = await profileRef.get();
      if (!profile.exists || profile.data()?.publicProfileEnabled !== true) {
        throw new AdminRequestError('An enabled public Talent profile was not found.', 404);
      }
      const slug = profile.data()?.publicSlug;
      await db.runTransaction(async (transaction) => {
        transaction.set(
          profileRef,
          {
            publicProfileEnabled: false,
            publicProfileUpdatedAt: now,
            updatedAt: now,
          },
          { merge: true }
        );
        if (typeof slug === 'string' && slug) {
          transaction.delete(db.collection('publicTalentProfiles').doc(slug));
        }
      });
      await writeAuditLog({
        action: 'public_profile_admin_disabled',
        actor,
        targetId,
        targetType: 'talent',
        reason,
        metadata: { slug: typeof slug === 'string' ? slug : null },
      });
      notification = {
        recipientId: targetId,
        recipientRole: 'TALENT',
        type: 'public_profile_admin_disabled',
        title: 'Public profile disabled by moderation',
        message:
          reason ||
          'Your public Talent profile was disabled by the Nata Connect trust team.',
        relatedEntityType: 'public_profile',
        relatedEntityId: typeof slug === 'string' ? slug : targetId,
        actionUrl: '/talent/profile',
        createdBy: actor.uid,
        priority: 'HIGH',
      };
    } else if (action === 'suspend_user' || action === 'restore_user') {
      if (targetId === actor.uid) {
        throw new AdminRequestError('Administrators cannot suspend themselves.');
      }
      const suspended = action === 'suspend_user';
      const targetAccount = await db.collection('users').doc(targetId).get();
      const recipientRole =
        targetAccount.data()?.userType === 'ADMIN'
          ? 'ADMIN'
          : targetAccount.data()?.userType === 'RECRUITER'
            ? 'RECRUITER'
            : 'TALENT';
      await getAdminDb().collection('users').doc(targetId).set(
        {
          accountStatus: suspended ? 'SUSPENDED' : 'ACTIVE',
          updatedAt: now,
        },
        { merge: true }
      );
      await getAdminAuth().updateUser(targetId, { disabled: suspended });
      await writeAuditLog({
        action,
        actor,
        targetId,
        targetType: 'user',
        reason,
      });
      notification = {
        recipientId: targetId,
        recipientRole,
        type: suspended ? 'user_suspended' : 'user_restored',
        title: suspended ? 'Account suspended' : 'Account restored',
        message:
          reason ||
          (suspended
            ? 'Your account has been suspended by trust and safety.'
            : 'Your account access has been restored.'),
        relatedEntityType: 'user',
        relatedEntityId: targetId,
        actionUrl: '/dashboard',
        createdBy: actor.uid,
        priority: 'HIGH',
      };
    } else if (
      action === 'hide_media' ||
      action === 'remove_media' ||
      action === 'restore_media'
    ) {
      const [talentId, mediaId] = targetId.split(':');
      if (!talentId || !mediaId) {
        throw new AdminRequestError('A valid Talent media target is required.');
      }
      const mediaRef = db
        .collection('users')
        .doc(talentId)
        .collection('talentProfiles')
        .doc(talentId)
        .collection('media')
        .doc(mediaId);
      const media = await mediaRef.get();
      if (!media.exists || media.data()?.ownerId !== talentId) {
        throw new AdminRequestError('Talent media was not found.', 404);
      }
      const moderationStatus =
        action === 'hide_media'
          ? 'hidden'
          : action === 'remove_media'
            ? 'removed'
            : 'active';
      await mediaRef.update({
        moderationStatus,
        moderationReason: reason ?? '',
        moderatedBy: actor.uid,
        moderatedAt: now,
        updatedAt: now,
      });
      await writeAuditLog({
        action:
          action === 'hide_media'
            ? 'talent_media_hidden'
            : action === 'remove_media'
              ? 'talent_media_removed'
              : 'talent_media_restored',
        actor,
        targetId: mediaId,
        targetType: 'media',
        reason,
        metadata: { talentId, mediaTitle: media.data()?.title ?? '' },
      });
      if (action !== 'restore_media') {
        notification = {
          recipientId: talentId,
          recipientRole: 'TALENT',
          type:
            action === 'hide_media'
              ? 'talent_media_hidden'
              : 'talent_media_removed',
          title:
            action === 'hide_media'
              ? 'Portfolio media hidden'
              : 'Portfolio media removed',
          message:
            reason ||
            `${media.data()?.title ?? 'A portfolio item'} was updated by moderation.`,
          relatedEntityType: 'media',
          relatedEntityId: mediaId,
          actionUrl: '/talent/profile',
          createdBy: actor.uid,
          priority: 'HIGH',
        };
      }
    } else {
      const removed = action === 'remove_audition';
      const auditionRef = db.collection('auditions').doc(targetId);
      const audition = await auditionRef.get();
      if (!audition.exists) {
        throw new AdminRequestError('Audition was not found.', 404);
      }
      const auditionRecruiterId = audition.data()?.recruiterId;
      if (typeof auditionRecruiterId !== 'string') {
        throw new AdminRequestError('Audition owner could not be found.', 409);
      }
      await auditionRef.update({
        moderationStatus: removed ? 'REMOVED' : 'VISIBLE',
        moderationReason: reason ?? '',
        moderatedBy: actor.uid,
        moderatedAt: now,
      });
      await writeAuditLog({
        action,
        actor,
        targetId,
        targetType: 'audition',
        reason,
      });
      notification = {
        recipientId: auditionRecruiterId,
        recipientRole: 'RECRUITER',
        type: removed ? 'audition_removed' : 'audition_restored',
        title: removed ? 'Audition removed' : 'Audition restored',
        message:
          reason ||
          `${audition.data()?.title ?? 'Your audition'} has been ${
            removed ? 'removed from public listings' : 'restored'
          }.`,
        relatedEntityType: 'audition',
        relatedEntityId: targetId,
        actionUrl: `/auditions/${targetId}`,
        createdBy: actor.uid,
        priority: removed ? 'HIGH' : 'NORMAL',
      };
    }

    if (notification) {
      const pendingNotification = notification;
      await deliverNotifications(() => createNotification(pendingNotification));
    }
    return Response.json({ ok: true });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
