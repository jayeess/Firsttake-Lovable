import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { AdminRequestError, writeAuditLog } from './admin-server';
import { getAdminAuth, getAdminDb } from './firebase-admin';
import {
  createNotification,
  createNotifications,
  deliverNotifications,
} from './notification-server';
import type { NotificationInput } from './notification-policy';
import { getReportResolution } from './report-policy';
import type {
  AbuseReport,
  NotificationRole,
} from './types';

export const REPORT_ADMIN_ACTIONS = [
  'review_report',
  'dismiss_report',
  'resolve_report',
  'hide_reported_media',
  'remove_reported_audition',
  'restore_reported_audition',
  'disable_reported_public_profile',
  'block_reported_conversation',
  'hide_reported_message',
  'suspend_reported_user',
  'restore_reported_user',
] as const;

const getRole = (value: unknown): NotificationRole =>
  value === 'RECRUITER' ? 'RECRUITER' : value === 'ADMIN' ? 'ADMIN' : 'TALENT';

export const handleAdminReportAction = async ({
  action,
  reportId,
  reason,
  actor,
}: {
  action: string;
  reportId: string;
  reason?: string;
  actor: DecodedIdToken;
}) => {
  const db = getAdminDb();
  const reportRef = db.collection('reports').doc(reportId);
  const reportSnapshot = await reportRef.get();
  if (!reportSnapshot.exists) {
    throw new AdminRequestError('Report was not found.', 404);
  }
  const report = {
    id: reportSnapshot.id,
    ...reportSnapshot.data(),
  } as AbuseReport;
  if (
    ['resolved', 'dismissed'].includes(report.status) &&
    action !== 'restore_reported_audition' &&
    action !== 'restore_reported_user'
  ) {
    throw new AdminRequestError('This report has already been closed.');
  }

  const now = FieldValue.serverTimestamp();
  if (action === 'review_report') {
    await reportRef.update({
      status: 'under_review',
      reviewedBy: actor.uid,
      reviewedAt: now,
      adminOnlyNotes: reason ?? '',
      updatedAt: now,
    });
  } else {
    const resolution = getReportResolution({ action, note: reason });
    let ownerNotification: NotificationInput | null = null;

    if (action === 'hide_reported_media') {
      if (report.targetType !== 'media' || !report.targetOwnerId) {
        throw new AdminRequestError('This report does not reference Talent media.');
      }
      const mediaId = report.targetId.split(':').at(-1);
      if (!mediaId) throw new AdminRequestError('Reported media ID is invalid.');
      const mediaRef = db
        .collection('users')
        .doc(report.targetOwnerId)
        .collection('talentProfiles')
        .doc(report.targetOwnerId)
        .collection('media')
        .doc(mediaId);
      const media = await mediaRef.get();
      if (!media.exists) throw new AdminRequestError('Reported media was not found.', 404);
      await mediaRef.update({
        moderationStatus: 'hidden',
        moderationReason: reason ?? '',
        moderatedBy: actor.uid,
        moderatedAt: now,
        updatedAt: now,
      });
      const publicSlug = report.targetId.split(':')[0];
      if (publicSlug) {
        const publicProfileRef = db
          .collection('publicTalentProfiles')
          .doc(publicSlug);
        const publicProfile = await publicProfileRef.get();
        if (
          publicProfile.exists &&
          publicProfile.data()?.uid === report.targetOwnerId
        ) {
          const publicMedia = Array.isArray(publicProfile.data()?.media)
            ? publicProfile
                .data()
                ?.media.filter(
                  (item: unknown) =>
                    typeof item !== 'object' ||
                    item === null ||
                    !('id' in item) ||
                    item.id !== mediaId
                )
            : [];
          await publicProfileRef.update({
            media: publicMedia,
            updatedAt: now,
          });
        }
      }
      ownerNotification = {
        recipientId: report.targetOwnerId,
        recipientRole: 'TALENT',
        type: 'content_removed',
        title: 'Portfolio content hidden',
        message: 'Content was removed from public view for violating platform rules.',
        relatedEntityType: 'media',
        relatedEntityId: mediaId,
        actionUrl: '/talent/profile',
        createdBy: actor.uid,
        priority: 'HIGH',
      };
    } else if (
      action === 'remove_reported_audition' ||
      action === 'restore_reported_audition'
    ) {
      if (report.targetType !== 'audition') {
        throw new AdminRequestError('This report does not reference an audition.');
      }
      const auditionRef = db.collection('auditions').doc(report.targetId);
      const audition = await auditionRef.get();
      if (!audition.exists) {
        throw new AdminRequestError('Reported audition was not found.', 404);
      }
      const removed = action === 'remove_reported_audition';
      await auditionRef.update({
        moderationStatus: removed ? 'REMOVED' : 'VISIBLE',
        moderationReason: removed ? reason ?? '' : '',
        moderatedBy: actor.uid,
        moderatedAt: now,
      });
      const recruiterId = audition.data()?.recruiterId;
      if (typeof recruiterId === 'string') {
        ownerNotification = {
          recipientId: recruiterId,
          recipientRole: 'RECRUITER',
          type: removed ? 'content_removed' : 'audition_restored',
          title: removed ? 'Audition removed' : 'Audition restored',
          message: removed
            ? 'Content was removed for violating platform rules.'
            : 'Your audition has been restored.',
          relatedEntityType: 'audition',
          relatedEntityId: report.targetId,
          actionUrl: `/auditions/${report.targetId}`,
          createdBy: actor.uid,
          priority: removed ? 'HIGH' : 'NORMAL',
        };
      }
    } else if (action === 'disable_reported_public_profile') {
      if (
        !['publicProfile', 'talentProfile', 'talent'].includes(report.targetType) ||
        !report.targetOwnerId
      ) {
        throw new AdminRequestError('This report does not reference a Talent profile.');
      }
      const profileRef = db
        .collection('users')
        .doc(report.targetOwnerId)
        .collection('talentProfiles')
        .doc(report.targetOwnerId);
      const profile = await profileRef.get();
      if (!profile.exists) {
        throw new AdminRequestError('Reported Talent profile was not found.', 404);
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
      ownerNotification = {
        recipientId: report.targetOwnerId,
        recipientRole: 'TALENT',
        type: 'content_removed',
        title: 'Public profile disabled',
        message: 'Content was removed from public view for violating platform rules.',
        relatedEntityType: 'public_profile',
        relatedEntityId: typeof slug === 'string' ? slug : report.targetOwnerId,
        actionUrl: '/talent/profile',
        createdBy: actor.uid,
        priority: 'HIGH',
      };
    } else if (action === 'block_reported_conversation') {
      const conversationId =
        report.targetType === 'message'
          ? report.targetId.split(':')[0]
          : report.targetId;
      if (!['conversation', 'message'].includes(report.targetType)) {
        throw new AdminRequestError('This report does not reference a conversation.');
      }
      const conversationRef = db.collection('conversations').doc(conversationId);
      const conversation = await conversationRef.get();
      if (!conversation.exists) {
        throw new AdminRequestError('Reported conversation was not found.', 404);
      }
      await conversationRef.update({
        status: 'blocked',
        moderationReason: reason ?? '',
        moderatedBy: actor.uid,
        moderatedAt: now,
        updatedAt: now,
      });
      await deliverNotifications(() =>
        createNotifications(
          (conversation.data()?.participantIds ?? []).map((participantId: string) => ({
            recipientId: participantId,
            recipientRole: getRole(
              conversation.data()?.participantRoles?.[participantId]
            ),
            type: 'conversation_blocked',
            title: 'Conversation blocked',
            message: 'This conversation was blocked by the Nata Connect trust team.',
            relatedEntityType: 'conversation',
            relatedEntityId: conversationId,
            actionUrl: `/messages/${conversationId}`,
            createdBy: actor.uid,
            priority: 'HIGH',
          }))
        )
      );
    } else if (action === 'hide_reported_message') {
      if (report.targetType !== 'message') {
        throw new AdminRequestError('This report does not reference a message.');
      }
      const [conversationId, messageId] = report.targetId.split(':');
      if (!conversationId || !messageId) {
        throw new AdminRequestError('Reported message ID is invalid.');
      }
      const messageRef = db
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .doc(messageId);
      const message = await messageRef.get();
      if (!message.exists) {
        throw new AdminRequestError('Reported message was not found.', 404);
      }
      await messageRef.update({
        moderationStatus: 'hidden',
        moderationReason: reason ?? '',
        moderatedBy: actor.uid,
        moderatedAt: now,
      });
      if (typeof message.data()?.senderId === 'string') {
        ownerNotification = {
          recipientId: message.data()?.senderId,
          recipientRole: getRole(message.data()?.senderRole),
          type: 'content_removed',
          title: 'Message hidden',
          message: 'Content was removed for violating platform rules.',
          relatedEntityType: 'conversation',
          relatedEntityId: conversationId,
          actionUrl: `/messages/${conversationId}`,
          createdBy: actor.uid,
          priority: 'HIGH',
        };
      }
    } else if (
      action === 'suspend_reported_user' ||
      action === 'restore_reported_user'
    ) {
      if (!report.targetOwnerId || report.targetOwnerId === actor.uid) {
        throw new AdminRequestError('A valid reported user is required.');
      }
      const suspended = action === 'suspend_reported_user';
      const userRef = db.collection('users').doc(report.targetOwnerId);
      const user = await userRef.get();
      if (!user.exists) throw new AdminRequestError('Reported user was not found.', 404);
      await userRef.set(
        {
          accountStatus: suspended ? 'SUSPENDED' : 'ACTIVE',
          updatedAt: now,
        },
        { merge: true }
      );
      await getAdminAuth().updateUser(report.targetOwnerId, { disabled: suspended });
      ownerNotification = {
        recipientId: report.targetOwnerId,
        recipientRole: getRole(user.data()?.userType),
        type: suspended ? 'account_suspended' : 'user_restored',
        title: suspended ? 'Account suspended' : 'Account restored',
        message: suspended
          ? 'Your account was suspended after a trust and safety review.'
          : 'Your account access has been restored.',
        relatedEntityType: 'user',
        relatedEntityId: report.targetOwnerId,
        actionUrl: '/dashboard',
        createdBy: actor.uid,
        priority: 'HIGH',
      };
    } else if (!['dismiss_report', 'resolve_report'].includes(action)) {
      throw new AdminRequestError('This report action is not supported.');
    }

    await reportRef.update({
      ...resolution,
      reviewedBy: actor.uid,
      reviewedAt: now,
      adminOnlyNotes: reason ?? '',
      updatedAt: now,
    });
    if (ownerNotification) {
      await deliverNotifications(() => createNotification(ownerNotification));
    }
    await deliverNotifications(() =>
      createNotification({
        recipientId: report.reporterId,
        recipientRole: report.reporterRole,
        type: 'report_resolved',
        title: 'Report reviewed',
        message: 'Your report has been reviewed.',
        relatedEntityType: 'report',
        relatedEntityId: report.id,
        actionUrl: '/notifications',
        createdBy: actor.uid,
        dedupeKey: `report-resolved:${report.id}`,
      })
    );
  }

  await reportRef.collection('events').add({
    actorId: actor.uid,
    actorRole: 'ADMIN',
    action,
    note: reason ?? '',
    createdAt: now,
  });
  await writeAuditLog({
    action,
    actor,
    targetId: report.id,
    targetType: 'report',
    reason,
    metadata: {
      reportTargetType: report.targetType,
      reportTargetId: report.targetId,
      targetOwnerId: report.targetOwnerId,
    },
  });
};
