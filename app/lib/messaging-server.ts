import type { DecodedIdToken } from 'firebase-admin/auth';
import type { DocumentData } from 'firebase-admin/firestore';
import { AdminRequestError } from './admin-server';
import { getAdminDb } from './firebase-admin';
import {
  canUseApplicationConversation,
  getConversationId,
} from './messaging-policy';
import type { ApplicationStatus } from './types';

export const getMessagingContext = async ({
  actor,
  auditionId,
  talentId,
}: {
  actor: DecodedIdToken;
  auditionId: string;
  talentId: string;
}) => {
  const db = getAdminDb();
  const auditionRef = db.collection('auditions').doc(auditionId);
  const applicationRef = auditionRef.collection('applications').doc(talentId);
  const [audition, application, actorAccount, talentAccount] = await Promise.all([
    auditionRef.get(),
    applicationRef.get(),
    db.collection('users').doc(actor.uid).get(),
    db.collection('users').doc(talentId).get(),
  ]);
  if (!audition.exists || !application.exists) {
    throw new AdminRequestError('Application conversation was not found.', 404);
  }
  const auditionData = audition.data()!;
  const applicationData = application.data()!;
  const recruiterId = auditionData.recruiterId as string;
  if (
    applicationData.talentId !== talentId ||
    (actor.uid !== recruiterId && actor.uid !== talentId)
  ) {
    throw new AdminRequestError('You cannot access this application conversation.', 403);
  }
  const [recruiterAccount, verification, talentProfile, recruiterProfile] =
    await Promise.all([
      db.collection('users').doc(recruiterId).get(),
      db.collection('recruiterVerifications').doc(recruiterId).get(),
      db
        .collection('users')
        .doc(talentId)
        .collection('talentProfiles')
        .doc(talentId)
        .get(),
      db
        .collection('users')
        .doc(recruiterId)
        .collection('recruiterProfiles')
        .doc(recruiterId)
        .get(),
    ]);
  const status = (applicationData.recruiterStatus ??
    applicationData.status ??
    'APPLIED') as ApplicationStatus;
  if (
    !canUseApplicationConversation({
      applicationStatus: status,
      recruiterApproved: verification.data()?.status === 'approved',
      recruiterActive: recruiterAccount.data()?.accountStatus !== 'SUSPENDED',
      talentActive: talentAccount.data()?.accountStatus !== 'SUSPENDED',
    })
  ) {
    throw new AdminRequestError(
      status === 'WITHDRAWN'
        ? 'Withdrawn applications have read-only conversations.'
        : 'Messaging is unavailable for this application.',
      409
    );
  }
  if (
    actorAccount.data()?.accountStatus === 'SUSPENDED' ||
    !['TALENT', 'RECRUITER'].includes(actorAccount.data()?.userType)
  ) {
    throw new AdminRequestError('An active Talent or Recruiter account is required.', 403);
  }
  const talentData = talentProfile.data() ?? {};
  const recruiterData = recruiterProfile.data() ?? {};
  return {
    db,
    conversationId: getConversationId(auditionId, talentId),
    auditionId,
    talentId,
    recruiterId,
    auditionData,
    applicationData,
    status,
    talentName:
      `${talentData.firstName ?? ''} ${talentData.lastName ?? ''}`.trim() ||
      'Talent',
    recruiterName:
      recruiterData.companyName || auditionData.recruiterName || 'Recruiter',
  };
};

export const serializeMessagingDocument = (id: string, data: DocumentData) => ({
  id,
  ...data,
  createdAt:
    typeof data.createdAt?.toDate === 'function'
      ? data.createdAt.toDate().toISOString()
      : data.createdAt ?? null,
  updatedAt:
    typeof data.updatedAt?.toDate === 'function'
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt ?? null,
  lastMessageAt:
    typeof data.lastMessageAt?.toDate === 'function'
      ? data.lastMessageAt.toDate().toISOString()
      : data.lastMessageAt ?? null,
});
